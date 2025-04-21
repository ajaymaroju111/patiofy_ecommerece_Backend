const mongoose = require('mongoose');


const contactSchema = new mongoose.Schema({
  userId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'users',
  },
  firstname : {
    type : String,
    required : [true , 'firstname is required'],
  },
  lastname : {
    type : String,
    ref : 'users',
  },
  email :{
    type : String,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    trim: true,
    ref : 'users'
  },
  phone: {
    type : Number,
  },
  message : {
    type : String,
    required : [true , 'message is required']
  }
},
{ timestamps: true }
);

module.exports = mongoose.model('queryForm', contactSchema);