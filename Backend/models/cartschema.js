const mongoose = require('mongoose');

const cartschema = new mongoose.Schema({

    user:{

        type:mongoose.Schema.Types.ObjectId,
        ref:'login',
        required: true,
        unique:true

    },

    items:[
        {
            car:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'car',
                required:true
            },
            quantity:{
                type:Number,
                require:true,
                min:[1,'Quantity cannot be less than 1' ]
            }

        }
    ],
    createdAt:{

        type:Date,
        default:Date.now

    }

});

const cartmodel = mongoose.model('cart',cartschema);
module.exports={cartmodel};





