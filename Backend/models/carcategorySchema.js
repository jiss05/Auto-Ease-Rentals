const mongoose = require('mongoose');

const categoryschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['SUV', 'Sedan', 'Hatchback', 'Luxury','MUV','Coupe'],
    },
    description: {
      type: String,
    },
    totalCars: {
      type: Number,
      default: 0,
    },
    availableCars: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const categorymodel = mongoose.model('category', categoryschema);
module.exports = { categorymodel };