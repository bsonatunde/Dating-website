import { useState } from 'react';

export default function Login({ onLogin, forgotPasswordLink, signupLink }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Login successful!');
        if (onLogin) onLogin(data);
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch {
      setMessage('Server error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 8 }}>Login</h2>
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required autoComplete="username" style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }} />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required autoComplete="current-password" style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }} />
      <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 18, marginTop: 8, cursor: 'pointer' }}>Login</button>
      {forgotPasswordLink}
      {signupLink}
      {message && <div style={{ marginTop: 14, textAlign: 'center', color: message.includes('success') ? '#388e3c' : '#d32f2f', fontWeight: 500 }}>{message}</div>}
    </form>
  );
}
