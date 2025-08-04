import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';


export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    gender: '',
    dob: '',
    avatar: '' // base64 string
  });
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, avatar: reader.result }));
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful! Redirecting to login...');
        navigate('/login');
      } else setMessage(data.message || 'Registration failed');
    } catch {
      setMessage('Server error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: '2rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0002', padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 8 }}>Create Account</h2>
      <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }} />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required autoComplete="username" style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }} />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required autoComplete="new-password" style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 500 }}>Gender:</label>
          <select name="gender" value={form.gender} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 15, marginTop: 4 }}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 500 }}>Date of Birth:</label>
          <input name="dob" type="date" value={form.dob} onChange={handleChange} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 15, marginTop: 4 }} />
        </div>
      </div>
      <div>
        <label style={{ fontWeight: 500 }}>Profile Picture:</label>
        <input name="avatar" type="file" accept="image/*" onChange={handleFile} style={{ marginTop: 4 }} />
        {preview && <img src={preview} alt="Preview" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: '50%', marginTop: 10, border: '2px solid #1976d2' }} />}
      </div>
      <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 600, fontSize: 18, marginTop: 8, cursor: 'pointer' }}>Register</button>
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <Link to="/login">Login if you have account</Link>
      </div>
      {message && <div style={{ marginTop: 14, textAlign: 'center', color: message.includes('success') ? '#388e3c' : '#d32f2f', fontWeight: 500 }}>{message}</div>}
    </form>
  );
}
