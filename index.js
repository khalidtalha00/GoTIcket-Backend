const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const uploadRoute = require('./routes/upload');
const metroRoutes = require('./routes/metro');
const placesRoutes = require('./routes/places');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "go-t-icket-backend.vercel.app"
  ],
  credentials: true
}));

// Ensure uploads directory exists
const uploadDir = path.join(process.env.VERCEL ? '/tmp' : __dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create uploads directory:', err.message);
}

// Middleware
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

let connected = false;

async function connectToMongoDB() {
  if (connected) return;
  await mongoose.connect(process.env.MONGO_URI);
  connected = true;
  console.log('Connected to MongoDB');
}

// Check DB connection before handling requests
app.use(async (req, res, next) => {
  if (connected) return next();

  try {
    await connectToMongoDB();
    return next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return res.status(503).json({ message: 'Database unavailable, try again shortly.' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/upload', uploadRoute);
app.use('/api/metro', metroRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/location', placesRoutes);

app.get('/', (req, res) => {
  res.send('Go Tickets API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
