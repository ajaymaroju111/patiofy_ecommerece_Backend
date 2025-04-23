const mongoose = require('mongoose');
const users = require('./userschema.js');

const addressSchaema = new mongoose.Schema({
  userId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'users',
  },
  email : {
    type : String,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  phone : {
    type : String,
    required : [true , "phone number is required"],
    ref : 'users',
  },
  Shipping_Adderss : {
    country : {
      type : String,
      required : [true, "country name is required"],
      default: "India",
    },
    firstname : {
      type : String,
      required : [true , "firstname is required"],
    },
    lastname : {
      type : String,
      required : [true , "lastname is required"],
    },
    Street_Address : {
      type : String,
      required : [true , "address is required"],
    },
    village:{
      type: String,
      required : [true, "village name is required"]
    },
    zipcode:{
      type: String,
      required: [true, "zipcode is required"],
    },
    Mandal : {
      type : String,
      required : [true , "city is required"]
    },
    state : {
      type : String,
      required : [true , "state is required"],
    }
  }
},{ timestamps: true });

module.exports = mongoose.model('userAddresses', addressSchaema);