const mongoose = require('mongoose');

const bookingschema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'login',
    required: true
  },

  cars: [
    {
      carId: { type: mongoose.Schema.Types.ObjectId, ref: 'car', required: true },
      carName: { type: String, required: true },
      category: { type: String, required: true },
      rentPerDay: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }
  ],

  pickupDate: { type: Date, required: true },
  dropDate: { type: Date, required: true },
  pickupTime: { type: String, required: true },
  dropTime: { type: String, required: true },

  rentalDays: { type: Number, required: true },

  deliveryMethod: {
    type: String,
    enum: ['Home Delivery', 'Pick from AutoEase'],
    required: true
  },

  isDeliveryRequired: { type: Boolean, default: false },

  distanceInKm: { type: Number }, // only required if Home Delivery

  deliveryAddress: { type: String },
  deliveryCharge: { type: Number, default: 0 },

  totalAmount: { type: Number, required: true },
  advanceAmount: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ['Online', 'Offline'],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },

  bookingStatus: {
    type: String,
    enum: ['Booked', 'Completed', 'Cancelled'],
    default: 'Booked'
  },

  isCancelledByUser: { type: Boolean, default: false },

  refundAmount: { type: Number, default: 0 }, // used when cancelling

  bookingTimestamps: {
    bookedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    completedAt: { type: Date }
  }

}, { timestamps: true });

const bookingmodel = mongoose.model('booking', bookingschema);
module.exports = { bookingmodel };
