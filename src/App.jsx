import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Register from './Register';
import Login from './Login';
import Profile from './Profile';
import Chat from './Chat';
import UserSearch from './UserSearch';
import PasswordReset from './PasswordReset';

function App() {
  const [user, setUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show nav except on /register, /login, or /reset
  const hideNav = location.pathname === '/register' || location.pathname === '/login' || location.pathname === '/reset';

  return (
    <div>
      {!hideNav && (
        <nav style={{
          display: 'flex',
          gap: 18,
          marginBottom: 28,
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
          borderRadius: 32,
          padding: '10px 28px',
          boxShadow: '0 2px 12px #1976d233',
        }}>
          {/* Register link removed from nav */}
          {user ? (
            <>
              <button
                onClick={() => {
                  setUser(null);
                  setChatUser(null);
                  navigate('/login');
                }}
                style={{
                  background: 'linear-gradient(90deg, #d32f2f 60%, #ff5252 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 28px',
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #d32f2f33',
                  marginRight: 8
                }}
              >
                Logout
              </button>
              <Link to="/profile" style={{
                background: '#fff',
                color: '#1976d2',
                borderRadius: 20,
                padding: '8px 24px',
                fontWeight: 600,
                fontSize: 17,
                textDecoration: 'none',
                boxShadow: '0 2px 8px #1976d233',
                marginRight: 8
              }}>Profile</Link>
              <Link to="/search" style={{
                background: '#fff',
                color: '#1976d2',
                borderRadius: 20,
                padding: '8px 24px',
                fontWeight: 600,
                fontSize: 17,
                textDecoration: 'none',
                boxShadow: '0 2px 8px #1976d233',
              }}>Contacts</Link>
              {location.pathname !== '/search' && <Link to="/chat" style={{
                background: '#fff',
                color: '#1976d2',
                borderRadius: 20,
                padding: '8px 24px',
                fontWeight: 600,
                fontSize: 17,
                textDecoration: 'none',
                boxShadow: '0 2px 8px #1976d233',
                marginLeft: 8
              }}>Chat</Link>}
            </>
          ) : null}
        </nav>
      )}
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login
          onLogin={u => { setUser(u); navigate('/search'); }}
          forgotPasswordLink={<div style={{ marginTop: 10, textAlign: 'center' }}><Link to="/reset">Forgot Password?</Link></div>}
          signupLink={<div style={{ marginTop: 10, textAlign: 'center' }}>Don't have an account? <Link to="/register">Sign Up</Link></div>}
        />} />
        <Route path="/reset" element={<PasswordReset />} />
        <Route path="/profile" element={user ? <Profile user={user} /> : <Login onLogin={setUser} />} />
        <Route path="/search" element={user ? <UserSearch currentUser={user} onSelect={u => { setChatUser(u); navigate('/chat'); }} /> : <Login onLogin={setUser} />} />
        <Route path="/chat" element={user ? <Chat user={user} receiverUser={chatUser} key={chatUser ? chatUser._id : 'general'} /> : <Login onLogin={setUser} />} />
        <Route path="*" element={<Login
          onLogin={u => { setUser(u); navigate('/search'); }}
          forgotPasswordLink={<div style={{ marginTop: 10, textAlign: 'center' }}><Link to="/reset">Forgot Password?</Link></div>}
          signupLink={<div style={{ marginTop: 10, textAlign: 'center' }}>Don't have an account? <Link to="/register">Sign Up</Link></div>}
        />} />
      </Routes>
    </div>
  );
}

export default App;
