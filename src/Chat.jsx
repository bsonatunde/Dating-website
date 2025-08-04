
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function isValidObjectId(id) {
  // 24 hex chars
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}
export default function Chat({ user, receiverUser }) {
  const [receiver, setReceiver] = useState(receiverUser ? receiverUser._id : '');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Fetch all users for dropdown if no receiverUser
  useEffect(() => {
    if (!receiverUser && user) {
      fetch('http://localhost:5001/api/users')
        .then(res => res.json())
        .then(data => setAllUsers(data.filter(u => u._id !== user.user.id)))
        .catch(() => setAllUsers([]));
    }
  }, [receiverUser, user]);

  useEffect(() => {
    if (!user) return;
    setError('');
    if (!isValidObjectId(user.user.id)) {
      setError('Your user ID is invalid. Cannot join chat.');
      return;
    }
    socketRef.current = io('http://localhost:5001');
    socketRef.current.emit('join', user.user.id);
    socketRef.current.on('receive_message', msg => {
      // Only add message if it's for the current chat
      if (
        (msg.sender === user.user.id && msg.receiver === receiver) ||
        (msg.sender === receiver && msg.receiver === user.user.id)
      ) {
        setMessages(m => {
          // Prevent duplicate messages
          if (m.length && m[m.length - 1]._id && msg._id && m[m.length - 1]._id === msg._id) return m;
          return [...m, msg];
        });
      }
    });
    socketRef.current.on('online_users', setOnlineUsers);
    socketRef.current.on('error', (err) => {
      setError(err.message || 'Socket error');
    });
    return () => socketRef.current.disconnect();
  }, [user, receiver]);

  useEffect(() => {
    if (receiverUser) setReceiver(receiverUser._id);
  }, [receiverUser]);

  const fetchMessages = async () => {
    setError('');
    if (!receiver) {
      setError('No receiver selected.');
      return;
    }
    if (!isValidObjectId(user.user.id) || !isValidObjectId(receiver)) {
      setError('Invalid user or receiver ID.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/messages/${user.user.id}/${receiver}`);
      if (!res.ok) {
        setError('Failed to load messages.');
        return;
      }
      const data = await res.json();
      setMessages(data);
    } catch {
      setError('Network error loading messages.');
    }
  };

  const sendMessage = async e => {
    e.preventDefault();
    setError('');
    if (!message) {
      setError('Message cannot be empty.');
      return;
    }
    if (!receiver) {
      setError('No receiver selected.');
      return;
    }
    if (!isValidObjectId(user.user.id) || !isValidObjectId(receiver)) {
      setError('Invalid user or receiver ID.');
      return;
    }
    socketRef.current.emit('send_message', {
      sender: user.user.id,
      receiver,
      content: message
    });
    setMessage('');
    // Do NOT optimistically add the message, rely on server for consistency
    setTimeout(fetchMessages, 300);
  };

  useEffect(() => {
    if (!user || !receiver) return;
    fetchMessages();
    // eslint-disable-next-line
  }, [receiver]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  if (!user) return <div>Please log in to chat.</div>;

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#1976d2', color: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 22, flex: 1 }}>Chat</span>
        {receiverUser ? (
          <span style={{ fontSize: 16 }}>Chatting with <b>{receiverUser.username}</b></span>
        ) : (
          <span style={{ fontSize: 16 }}>
            <label htmlFor="receiver">To: </label>
            <select
              id="receiver"
              value={receiver}
              onChange={e => setReceiver(e.target.value)}
              style={{ minWidth: 160, borderRadius: 6, padding: 4, border: 'none' }}
            >
              <option value="">-- Select a user --</option>
              {allUsers.map(u => (
                <option key={u._id} value={u._id}>{u.username} ({u.email})</option>
              ))}
            </select>
          </span>
        )}
      </div>
      {/* Online users */}
      <div style={{ background: '#f5f7fa', padding: '8px 24px', fontSize: 14, color: '#1976d2', borderBottom: '1px solid #e3e3e3' }}>
        <b>Online:</b> {onlineUsers.length ? onlineUsers.join(', ') : 'No one online'}
      </div>
      {/* Error */}
      {error && <div style={{ color: '#d32f2f', background: '#fff3f3', padding: '8px 24px' }}>{error}</div>}
      {/* Chat box */}
      <div
        ref={chatBoxRef}
        style={{ background: '#f9f9fb', minHeight: 220, maxHeight: 340, overflowY: 'auto', padding: '18px 18px 8px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {messages.length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No messages yet.</div>}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.sender === user.user.id ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                background: msg.sender === user.user.id ? '#1976d2' : '#e3e3e3',
                color: msg.sender === user.user.id ? '#fff' : '#222',
                borderRadius: 18,
                padding: '10px 18px',
                maxWidth: 320,
                fontSize: 16,
                boxShadow: msg.sender === user.user.id ? '0 2px 8px #1976d233' : '0 2px 8px #0001',
                marginLeft: msg.sender === user.user.id ? 40 : 0,
                marginRight: msg.sender === user.user.id ? 0 : 40,
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      {/* Message input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: '16px 18px', borderTop: '1px solid #e3e3e3', background: '#fafbfc' }}>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          autoComplete="message"
          name="message"
          id="message"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
        />
        <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '0 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Send</button>
      </form>
    </div>
  );
}
