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