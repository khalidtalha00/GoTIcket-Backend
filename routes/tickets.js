const router = require('express').Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');

const mapTicketWithDriver = (ticketDoc) => {
  const plain = ticketDoc.toObject ? ticketDoc.toObject() : ticketDoc;
  const driver = plain.driverId;

  return {
    ...plain,
    driverId: driver?._id || plain.driverId,
    driver: driver
      ? {
          id: driver._id,
          name: driver.name,
          vehicleName: driver.vehicleName || '',
          vehicleNumber: driver.vehicleNumber || '',
          profilePicture: driver.profilePicture || '',
        }
      : null,
  };
};

const pickDriverForTicket = async (ticketType = '') => {
  const normalized = ticketType.toLowerCase();
  if (normalized.includes('metro')) return null;

  let vehicleTypeRegex = null;
  if (normalized.includes('bus')) vehicleTypeRegex = /bus/i;
  if (normalized.includes('cab')) vehicleTypeRegex = /cab/i;
  if (normalized.includes('bike')) vehicleTypeRegex = /bike/i;

  const query = { role: 'driver' };
  if (vehicleTypeRegex) query.vehicleType = { $regex: vehicleTypeRegex };

  const drivers = await User.find(query).select('_id').lean();
  if (!drivers.length) return null;

  const randomIndex = Math.floor(Math.random() * drivers.length);
  return drivers[randomIndex]._id;
};

// Create Ticket
router.post('/', async (req, res) => {
  try {
    const driverId = await pickDriverForTicket(req.body.type);
    const newTicket = new Ticket({ ...req.body, driverId });
    const savedTicket = await newTicket.save();
    const populatedTicket = await Ticket.findById(savedTicket._id).populate(
      'driverId',
      'name vehicleName vehicleNumber profilePicture'
    );
    res.status(200).json(mapTicketWithDriver(populatedTicket));
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get User Tickets
router.get('/:userId', async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.params.userId })
      .sort({ date: -1 })
      .populate('driverId', 'name vehicleName vehicleNumber profilePicture');
    res.status(200).json(tickets.map(mapTicketWithDriver));
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete Ticket
router.delete('/:id', async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json("Ticket has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
