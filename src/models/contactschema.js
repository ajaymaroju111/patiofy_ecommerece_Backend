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
    required : [true , 'lastname is required'],
  },
  phone : {
    type : String,
    maxlength : 10,
    minlength : 10,
    required : [true , 'phone number is required'],
  },
  message : {
    type : String,
    required : [true , 'message is required']
  }
});

module.exports = mongoose.model('Contacts', contactSchema);