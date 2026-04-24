const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
});

module.exports = mongoose.model('Ticket', TicketSchema);
