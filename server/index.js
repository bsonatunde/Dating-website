import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './User.js';
import Message from './Message.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/lovefindme');

// Placeholder for routes
app.get('/', (req, res) => {
  res.send('LoveFindMe API is running');
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, gender, dob, avatar } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      gender,
      dob,
      avatar
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.put('/api/profile/:id', async (req, res) => {
  try {
    const updates = req.body;
    if (updates.password) delete updates.password; // Prevent password update here
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// REST API for chat history
app.get('/api/messages/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort('timestamp');
    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (for user search)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email bio avatar');
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Password reset (request)
app.post('/api/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    // In production, generate a token and send email. Here, just return a dummy token in the response.
    res.json({ message: 'Password reset link sent', resetToken: 'dummy-token' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Password reset (actual)
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    // In production, verify the token. Here, accept any token.
    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate({ email }, { password: hashed });
    if (!user) return res.status(400).json({ message: 'User not found' });
    res.json({ message: 'Password updated' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// User online status

// Avatar upload (base64, for demo)
app.post('/api/avatar/:id', async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { avatar }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ avatar: user.avatar });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unified Socket.IO for real-time chat and online users
const onlineUsers = new Set();
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  // User joins their room and is marked online
  socket.on('join', (userId) => {
    socket.join(userId.toString());
    onlineUsers.add(userId.toString());
    io.emit('online_users', Array.from(onlineUsers));
  });
  // Handle sending messages
  socket.on('send_message', async (data) => {
    const { sender, receiver, content } = data;
    // Validate sender and receiver as ObjectId
    if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
      console.error('Invalid sender or receiver ObjectId:', sender, receiver);
      socket.emit('error', { message: 'Invalid user ID for chat.' });
      return;
    }
    try {
      const message = new Message({ sender, receiver, content });
      await message.save();
      io.to(receiver.toString()).emit('receive_message', message);
      socket.emit('receive_message', message);
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });
  // Handle disconnect and update online users
  socket.on('disconnect', () => {
    // Remove user from onlineUsers if present in any room
    for (const room of socket.rooms) {
      if (onlineUsers.has(room)) {
        onlineUsers.delete(room);
      }
    }
    io.emit('online_users', Array.from(onlineUsers));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
