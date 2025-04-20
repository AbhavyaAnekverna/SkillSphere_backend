const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // To load environment variables

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'IDK_WHAT_IM_DOING';

// ✅ Restrict CORS to frontend domain
app.use(cors({
  origin: 'https://skillsphere25.netlify.app/', // 
  credentials: true,
}));

app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/skill-sphere-db';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Mongoose Models
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
}));

const Course = mongoose.model('Course', new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  difficulty: { type: String },
}));

const Assessment = mongoose.model('Assessment', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
}));

// Routes

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = new User({ username, email, passwordHash });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: 'User registration failed', details: err.message || err });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, username: user.username });
});

// Get courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses', details: err });
  }
});

// Get assessments
app.get('/api/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find();
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessments', details: err });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// Root route
app.get('/', (req, res) => {
  res.send('Skill Sphere Backend is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
