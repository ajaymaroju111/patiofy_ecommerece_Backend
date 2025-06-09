const mongoose = require('mongoose');

const ProductMatrixSchema = new mongoose.Schema({
  productId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
  },
  original_price: {
    type: Number,
    required: true
  },
  selling_price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
  },
  size : {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true
  }
} ,{ timestamps : true });


// Calculate discount before save
ProductMatrixSchema.pre('save', function (next) {
  if (this.original_price && this.selling_price) {
    this.discount = Math.round(
      ((this.original_price - this.selling_price) / this.original_price) * 100
    );
  }
  next();
});

module.exports = mongoose.model('ProductMatrix', ProductMatrixSchema);
