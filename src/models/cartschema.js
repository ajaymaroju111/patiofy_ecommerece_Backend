const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    cartImages: [{ type: String, required: true }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
    },
    size: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    selling_price: {
      type: Number,
    },
    final_price: {
      type: Number,
    },
  },
  { timestamps: true }
);

cartSchema.pre("save", function (next) {
  this.final_price = this.quantity * this.selling_price;
  next();
});

module.exports = mongoose.model("carts", cartSchema);
