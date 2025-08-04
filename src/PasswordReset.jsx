import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const requestReset = async e => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('http://localhost:5001/api/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      setResetToken(data.resetToken);
      setStep(2);
      setMessage('Reset link sent! (token: ' + data.resetToken + ')');
    } else {
      setMessage(data.message || 'Error');
    }
  };

  const resetPassword = async e => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('http://localhost:5001/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, resetToken })
    });
    const data = await res.json();
    if (res.ok) setMessage('Password updated!');
    else setMessage(data.message || 'Error');
  };

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px #0002', padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <h2 style={{ color: '#1976d2', marginBottom: 8, fontWeight: 700, fontSize: 28 }}>Password Reset</h2>
      {step === 1 ? (
        <form onSubmit={requestReset} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ fontWeight: 500, color: '#1976d2', marginBottom: 4 }}>Email:</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1.5px solid #1976d2',
              fontSize: 16,
              background: '#f7faff',
              color: '#222',
              marginBottom: 6
            }}
          />
          <button type="submit" style={{
            background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 0',
            fontWeight: 600,
            fontSize: 18,
            marginTop: 4,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #1976d233'
          }}>Request Reset</button>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link to="/login">Back to Login</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={resetPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ fontWeight: 500, color: '#1976d2', marginBottom: 4 }}>Token:</label>
          <input
            type="text"
            placeholder="Enter reset token"
            value={resetToken}
            onChange={e => setResetToken(e.target.value)}
            required
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1.5px solid #1976d2',
              fontSize: 16,
              background: '#f7faff',
              color: '#222',
              marginBottom: 6
            }}
          />
          <label style={{ fontWeight: 500, color: '#1976d2', marginBottom: 4 }}>New Password:</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1.5px solid #1976d2',
              fontSize: 16,
              background: '#f7faff',
              color: '#222',
              marginBottom: 6
            }}
          />
          <button type="submit" style={{
            background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 0',
            fontWeight: 600,
            fontSize: 18,
            marginTop: 4,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #1976d233'
          }}>Reset Password</button>
        </form>
      )}
      {message && <div style={{ marginTop: 14, textAlign: 'center', color: message.includes('updated') ? '#388e3c' : '#1976d2', fontWeight: 500 }}>{message}</div>}
    </div>
  );
}
