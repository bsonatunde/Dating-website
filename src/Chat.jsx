
// ...existing code...
// ...existing code only inside the Chat component...

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
  const [accepted, setAccepted] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);

  const handleUnblock = async () => {
    if (!user || !receiver) return;
    setBlockLoading(true);
    await fetch(`http://localhost:5001/api/unblock/${receiver}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.user.id })
    });
    setBlocked(false);
    setBlockLoading(false);
  };

  // Only one handleUnblock function, placed here with other handlers
  // Only one handleUnblock function, placed here with other handlers

  // Check if blocked on mount or when receiver changes
  useEffect(() => {
    async function checkBlocked() {
      if (!user || !receiver) return;
      try {
        const res = await fetch(`http://localhost:5001/api/profile/${user.user.id}`);
        const data = await res.json();
        if (data && data.blockedUsers && Array.isArray(data.blockedUsers)) {
          setBlocked(data.blockedUsers.includes(receiver));
        } else {
          setBlocked(false);
        }
      } catch {
        setBlocked(false);
      }
    }
    checkBlocked();
  }, [user, receiver]);

  const handleBlock = async () => {
    if (!user || !receiver) return;
    setBlockLoading(true);
    await fetch(`http://localhost:5001/api/block/${receiver}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.user.id })
    });
    setBlocked(true);
    setBlockLoading(false);
  };

  // Check if accepted on mount or when receiver changes
  useEffect(() => {
    async function checkAccepted() {
      if (!user || !receiver) return;
      try {
        const res = await fetch(`http://localhost:5001/api/profile/${user.user.id}`);
        const data = await res.json();
        if (data && data.acceptedUsers && Array.isArray(data.acceptedUsers)) {
          setAccepted(data.acceptedUsers.includes(receiver));
        } else {
          setAccepted(false);
        }
      } catch {
        setAccepted(false);
      }
    }
    checkAccepted();
  }, [user, receiver]);

  const handleAccept = async () => {
    if (!user || !receiver) return;
    setAcceptLoading(true);
    await fetch(`http://localhost:5001/api/accept/${receiver}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.user.id })
    });
    setAccepted(true);
    setAcceptLoading(false);
  };

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

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-menu') && !event.target.closest('button')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  if (!user) return <div>Please log in to chat.</div>;

  return (
    <>
      <style>{`
        .message-bubble:hover .delete-button {
          opacity: 1 !important;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 160px;
          z-index: 1000;
        }
        .dropdown-item {
          padding: 12px 16px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: #333;
          transition: background-color 0.2s;
        }
        .dropdown-item:hover {
          background-color: #f5f5f5;
        }
        .dropdown-item.delete {
          color: #d32f2f;
        }
        .dropdown-item.block {
          color: #ff5722;
        }
        .dropdown-item.unblock {
          color: #4caf50;
        }
        .dropdown-item:first-child {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .dropdown-item:last-child {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
      `}</style>
      <div style={{ maxWidth: 520, margin: '2rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#1976d2', color: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16, position: 'relative' }}>
        <span style={{ fontWeight: 700, fontSize: 22, flex: 1 }}>Chat</span>
        {receiverUser ? (
          <span style={{ fontSize: 16, marginRight: '16px' }}>Chatting with <b>{receiverUser.username}</b></span>
        ) : (
          <span style={{ fontSize: 16, marginRight: '16px' }}>
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
        {/* Three-dot menu */}
        {receiver && user && receiver !== user.user.id && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ⋮
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                {!blocked && (
                  <button
                    className="dropdown-item delete"
                    onClick={async () => {
                      setShowDropdown(false);
                      if (!window.confirm('Are you sure you want to delete this chat? This cannot be undone.')) return;
                      try {
                        const res = await fetch(`http://localhost:5001/api/messages/${user.user.id}/${receiver}`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                        });
                        if (res.ok) {
                          setMessages([]);
                        } else {
                          setError('Failed to delete chat.');
                        }
                      } catch {
                        setError('Network error deleting chat.');
                      }
                    }}
                  >
                    🗑️ Delete Chat
                  </button>
                )}
                <button
                  className={`dropdown-item ${blocked ? 'unblock' : 'block'}`}
                  onClick={() => {
                    setShowDropdown(false);
                    blocked ? handleUnblock() : handleBlock();
                  }}
                  disabled={blockLoading}
                >
                  {blockLoading ? (blocked ? '⏳ Unblocking...' : '⏳ Blocking...') : (blocked ? '✅ Unblock User' : '🚫 Block User')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Accept button for chat */}
      {!accepted && receiver && user && receiver !== user.user.id && !blocked && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 24px' }}>
          <div style={{ background: '#e8f5e9', padding: '10px 24px', textAlign: 'center', borderRadius: 8 }}>
            <button
              onClick={handleAccept}
              disabled={acceptLoading}
              style={{ padding: '7px 18px', borderRadius: 8, background: 'linear-gradient(90deg, #388e3c 60%, #66bb6a 100%)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #388e3c33', marginBottom: 4 }}
            >
              {acceptLoading ? 'Accepting...' : 'Accept User'}
            </button>
          </div>
        </div>
      )}
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
        {blocked ? (
          <div style={{ color: '#d32f2f', textAlign: 'center', marginTop: 40, fontWeight: 600, fontSize: 18 }}>
            You have blocked this user or have been blocked. Unblock to chat again.
          </div>
        ) : (
          <>
            {messages.length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No messages yet.</div>}
            {messages.map((msg, i) => (
              <div
                key={msg._id || i}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === user.user.id ? 'flex-end' : 'flex-start',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div
                  className="message-bubble"
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
                    position: 'relative'
                  }}
                >
                  {msg.content}
                  {/* Show delete button only for your own messages */}
                  {msg.sender === user.user.id && (
                    <button
                      className="delete-button"
                      onClick={async () => {
                        if (!window.confirm('Delete this message?')) return;
                        try {
                          const res = await fetch(`http://localhost:5001/api/message/${msg._id}`, {
                            method: 'DELETE',
                          });
                          if (res.ok) {
                            setMessages(messages => messages.filter(m => m._id !== msg._id));
                          } else {
                            setError('Failed to delete message.');
                          }
                        } catch {
                          setError('Network error deleting message.');
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: 'transparent',
                        border: 'none',
                        color: msg.sender === user.user.id ? '#fff' : '#d32f2f',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                      }}
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
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
          disabled={blocked}
        />
        <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '0 22px', fontWeight: 600, fontSize: 16, cursor: blocked ? 'not-allowed' : 'pointer' }} disabled={blocked}>Send</button>
      </form>
    </div>
    </>
  );
}
