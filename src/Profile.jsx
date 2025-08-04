import { useEffect, useState } from 'react';

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ bio: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5001/api/profile/${user.user.id}`)
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setForm({ bio: data.bio || '' });
        });
    }
  }, [user]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`http://localhost:5001/api/profile/${user.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: form.bio })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated!');
        setProfile(p => ({ ...p, bio: form.bio }));
      } else setMessage(data.message || 'Update failed');
    } catch {
      setMessage('Server error');
    }
  };

  if (!user) return <div>Please log in to view your profile.</div>;
  if (!profile) return <div>Loading profile...</div>;

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px #0002', padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
          boxShadow: '0 2px 12px #1976d233',
          border: '4px solid #fff',
        }}>
          {profile.avatar ? (
            <img src={profile.avatar} alt="avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1976d2' }} />
          ) : (
            <span style={{ color: '#fff', fontSize: 48, fontWeight: 700 }}>{profile.username[0].toUpperCase()}</span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 26, color: '#1976d2', marginBottom: 2 }}>{profile.username}</div>
        <div style={{ color: '#888', fontSize: 17, marginBottom: 10 }}>{profile.email}</div>
      </div>
      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ fontWeight: 500, color: '#1976d2', marginBottom: 4 }}>Bio:</label>
        <textarea
          name="bio"
          placeholder="Tell us about yourself..."
          value={form.bio}
          onChange={handleChange}
          style={{
            minHeight: 70,
            borderRadius: 10,
            border: '1.5px solid #1976d2',
            padding: 12,
            fontSize: 16,
            resize: 'vertical',
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
        }}>Save</button>
        {message && <div style={{ marginTop: 10, textAlign: 'center', color: message.includes('updated') ? '#388e3c' : '#d32f2f', fontWeight: 500 }}>{message}</div>}
      </form>
    </div>
  );
}
