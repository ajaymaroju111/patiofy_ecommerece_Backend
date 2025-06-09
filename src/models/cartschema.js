const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  cartImages :[{ type: String, required: true}],
  userId:{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'users'
  },
  productId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'products'
  },
  size: {
    type: String,
    required: true
  },
  quantity : {
    type : Number,
    default : 1,
  }
}, {timestamps : true});


module.exports = mongoose.model('carts' , cartSchema);