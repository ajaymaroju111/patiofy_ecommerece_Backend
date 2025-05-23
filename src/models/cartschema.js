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
  final_price:{
    type: Number,
  },
}, {timestamps : true});
cartSchema.pre('save', async function(next){
  if(this.final_price === 0 || this.final_price === 0 ){
    this.final_price = this.discountedPrice
  }
}) 


module.exports = mongoose.model('carts' , cartSchema);