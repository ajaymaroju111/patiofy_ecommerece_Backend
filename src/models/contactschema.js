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
  message : {
    type : String,
    required : [true , 'message is required']
  }
});

module.exports = mongoose.model('queries', contactSchema);