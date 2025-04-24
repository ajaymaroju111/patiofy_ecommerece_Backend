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
  quantity : {
    type : Number,
    default : 1,
  },
  discountedPrice:{
    type: Number,
  },
  shipping_cost:{
    type: Number,
    
  }
}, {timestamps : true});

module.exports = mongoose.model('carts' , cartSchema);