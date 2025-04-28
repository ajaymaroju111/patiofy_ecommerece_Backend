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
  },
  email : {
    type : String,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  phone : {
    type : String,
    required : [true , "phone number is required"],
    ref : 'users',
  },
  status: {
    type: String,
    enum: ['pending', 'conformed', 'out_of_delivery', 'delivered', 'completed', 'cancelled', 'returned', 'failed', 'refunded' ],
    default: 'pending',
  },
  shipping_cost:{
    type: Number,
    default:0
  },
  final_cost: {
    type: Number,
  },
  shipping_addressId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userAddresses'
  },
  billing_addressId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userAddresses'
  },
  payment_mode: {
    type: String,
    enum: ['online, COD'],
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
  const prefix = 'ORDPATIOFY'; 
  const timestamp = Date.now(); 
  const random = Math.floor(Math.random() * 10000); // 4-digit random number
  return `${prefix}${timestamp}${random}`;
}

orderSchema.pre('save', async function(next){
  if(this.isModified('productId')){
    this.orderId =  generateOrderId();
  }
  next();
});

orderSchema.pre('save', async function(next){
  if(this.isModified('shipping_cost')){
    this.final_cost += this.shipping_cost;
  }
  next();
})

orderSchema.pre('save', function (next) {
  if (this.billing_addressId === 0 || this.billing_addressId == null) {
    this.billing_addressId = this.shipping_addressId;
  }
  next();
});

module.exports = mongoose.model('orders', orderSchema);