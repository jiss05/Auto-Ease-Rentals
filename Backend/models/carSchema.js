const mongoose = require('mongoose');

const carschema = new mongoose.Schema({

    //eg city,crysta
  carName: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId,
             ref: 'category', required: true },
  rentPerDay: { type: Number, required: true },

  totalUnits:{

    type:Number,
    required:true
  },

  availableUnits: { type: Number, default: true },
  location: {
    type: String,
    enum: ['Kottayam'], // since you have only one branch now
    default: 'Kottayam'
  },

  image: [{ type: String }],
  description: { type: String },


  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: { type: Date, default: null }
},

 { timestamps: true });

const carmodel = mongoose.model('car', carschema);
module.exports = { carmodel };
