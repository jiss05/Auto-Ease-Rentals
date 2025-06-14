const mongoose = require('mongoose');

const bookingschema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'login', required: true },
  cars: [
    {
      carId: { type: mongoose.Schema.Types.ObjectId, ref: 'car', required: true },
      quantity: { type: Number, required: true }
    }
  ],
  pickupDate: { type: Date, required: true },
  dropDate: { type: Date, required: true },
  pickupTime: { type: String, required: true },
  dropTime: { type: String, required: true },
  deliveryMethod: { type: String, enum: ['Home Delivery', 'Pick from AutoEase'], required: true },
  deliveryAddress: { type: String },
  deliveryCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  advancePaid: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Online', 'Offline'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  bookingStatus: { type: String, enum: ['Booked', 'Completed', 'Cancelled'], default: 'Booked' }
}, { timestamps: true });

const bookingmodel = mongoose.model('booking', bookingschema);
module.exports = { bookingmodel };