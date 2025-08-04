import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';


export default function UserSearch({ onSelect, currentUser }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [newChats, setNewChats] = useState({}); // { userId: true }
  const socketRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/users')
      .then(res => res.json())
      .then(data => {
        if (currentUser && currentUser.user && currentUser.user.id) {
          setUsers(data.filter(u => u._id !== currentUser.user.id));
        } else {
          setUsers(data);
        }
      });
  }, [currentUser]);

  // Listen for new messages via socket.io
  useEffect(() => {
    if (!currentUser || !currentUser.user || !currentUser.user.id) return;
    const socket = io('http://localhost:5001');
    socket.emit('join', currentUser.user.id);
    socket.on('receive_message', msg => {
      if (msg.receiver === currentUser.user.id) {
        setNewChats(prev => ({ ...prev, [msg.sender]: true }));
      }
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  const handleChat = u => {
    setNewChats(prev => ({ ...prev, [u._id]: false }));
    onSelect(u);
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px #0002', padding: 32 }}>
      <h2 style={{ color: '#1976d2', fontWeight: 700, fontSize: 28, marginBottom: 18, textAlign: 'center', letterSpacing: 1 }}>Contacts</h2>
      <input
        placeholder="Search by username"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 24, padding: 12, borderRadius: 10, border: '1.5px solid #1976d2', fontSize: 16, background: '#f7faff', color: '#222' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {filtered.map(u => (
          <div key={u._id} style={{ display: 'flex', alignItems: 'center', background: '#f5f7fa', border: '1.5px solid #e3e3e3', borderRadius: 14, padding: 18, boxShadow: '0 2px 8px #1976d211', position: 'relative', gap: 28 }}>
            <div style={{ marginRight: 0, position: 'relative', flexShrink: 0 }}>
              {u.avatar ? (
                <img src={u.avatar} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #1976d2', background: '#fff' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e3e3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 28, fontWeight: 700 }}>
                  ?
                </div>
              )}
              {newChats[u._id] && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: 'linear-gradient(90deg, #d32f2f 60%, #ff5252 100%)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  border: '2.5px solid #fff',
                  boxShadow: '0 2px 8px #d32f2f44',
                  zIndex: 2
                }}>New</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', marginBottom: 2, wordBreak: 'break-word' }}>{u.username}</div>
              <div style={{ color: '#888', fontSize: 15, marginBottom: 6, wordBreak: 'break-all' }}>{u.email}</div>
              {u.bio && <div style={{ marginTop: 4, fontSize: 15, color: '#444', background: '#f7faff', borderRadius: 8, padding: 8 }}>{u.bio}</div>}
            </div>
            <div style={{ marginLeft: 18 }}>
              <button
                onClick={() => handleChat(u)}
                style={{ padding: '10px 26px', borderRadius: 8, background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #1976d233' }}
              >
                Chat
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No users found.</div>}
      </div>
    </div>
  );
}
