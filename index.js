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
  origin: ["https://goticket-delta.vercel.app/"], // add deployed frontend URL too
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.options("*", cors());
app.use(express.json());

// example mount
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// JSON fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
