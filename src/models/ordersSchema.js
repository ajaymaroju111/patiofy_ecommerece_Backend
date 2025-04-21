const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  productId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
  },
  orderId:{
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'conformed', 'out_of_delivery', 'delivered', 'completed', 'cancelled', 'returned', 'failed', 'refunded' ],
    default: 'pending',
  },
  address:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'userAddresses'
  },
  payment_status: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
},
{ timestamps: true }
);

function generateOrderId() {
  const prefix = 'ORD'; // Optional prefix
  const timestamp = Date.now(); // Millisecond timestamp
  const random = Math.floor(Math.random() * 10000); // 4-digit random number
  return `${prefix}${timestamp}${random}`;
}

orderSchema.pre('save', async function(next){
  if(this.isModified(this.productId)){
    this.orderId = await generateOrderId();
  }
  next();
})

module.exports = mongoose.model('orders', orderSchema);