const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  productId:{
    type: [mongoose.Schema.Types.ObjectId],
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
    enum: ['pending', 'conformed', 'delivered', 'completed', 'cancelled', 'returned', 'failed', 'refunded' ],
    default: 'pending',
  },
  final_cost: {
    type: Number,
  },
  quantity:{
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
    enum: ['online', 'COD'],
    default: 'COD'
  },
  payment_status: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paymentInfo: {
      razorpay_payment_id: String,
      razorpay_order_id: String,
      razorpay_signature: String,
    },
  Date:{
    type: Date,
    default: Date.now(),
  },
},
{ timestamps: true }
);

function generateOrderId() {
  const prefix = "ORDPATIOFY";
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

orderSchema.pre("save", function (next) {
  if (!this.orderId) {
    this.orderId = generateOrderId();
  }

  if (!this.billing_addressId) {
    this.billing_addressId = this.shipping_addressId;
  }

  // if (!this.final_cost && this.shipping_cost) {
  //   this.final_cost = this.shipping_cost; // fallback default if not calculated
  // }

  next();
});


module.exports = mongoose.model('orders', orderSchema);