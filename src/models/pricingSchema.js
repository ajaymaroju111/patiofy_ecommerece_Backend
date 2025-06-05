const mongoose = require('mongoose');

const PriceDetailSchema = new mongoose.Schema({
  Cost_price: {
    type: Number,
    default: 0
  },
  selling_price: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  }
}, { _id: false }); // to avoid _id for sub-documents

const PricingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'products'
  },
  S: PriceDetailSchema,
  M: PriceDetailSchema,
  L: PriceDetailSchema,
  XL: PriceDetailSchema
});

// Pre-save hook to calculate discount
PricingSchema.pre('save', function (next) {
  const sizes = ['S', 'M', 'L', 'XL'];
  sizes.forEach(size => {
    const pricing = this[size];
    if (pricing && pricing.Cost_price > 0) {
      pricing.discount = Math.round(
        ((pricing.Cost_price - pricing.selling_price) / pricing.Cost_price) * 100
      );
    } else {
      pricing.discount = 0;
    }
  });
  next();
});

module.exports = mongoose.model('pricings', PricingSchema);
