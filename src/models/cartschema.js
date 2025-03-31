const mongoose = require('mongoose');
const posts = require('./productschema.js');
const Users = require('./userschema.js');

const cartSchema = new mongoose.Schema({
  productId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'posts'
  },
  userId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'Users'
  },
  quantity : {
    type : Number,
    default : 1,
  },
  price : {
    type : Number,
    required : [true, "price is required"],
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {timestamps : true});

module.exports = mongoose.model('carts' , cartSchema);