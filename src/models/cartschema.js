const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  cartImages :[
    {
      name : String,
      img : {
        data : Buffer,
        contentType : String,
        hash : String,
      }
    }
  ],
  userId:{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'users'
  },
  productId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'products'
  },
  userId : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'users'
  },
  quantity : {
    type : Number,
    default : 1,
  },
  price : {
    type : Number,
    required : [true, "price is required"],
  },
  discountedPrice:{
    type: Number,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {timestamps : true});

module.exports = mongoose.model('carts' , cartSchema);