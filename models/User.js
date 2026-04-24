const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['passenger', 'driver'], default: 'passenger' },
  vehicleType: { type: String },
  vehicleName: { type: String },
  vehicleNumber: { type: String },
  profilePicture: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
