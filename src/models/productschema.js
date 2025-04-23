const mongoose = require("mongoose");
const crypto = require("crypto");

const productschema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    postImages: [
      {
      name: String,
      img: {
        data: Buffer, // Binary image data
        contentType: String, // Image type (jpeg/png)
      },
      },
    ],
    name: {
      type: String,
      required: [true, "product name is required"],
    },
    description: {
      type: String,
      required: [true, "DProduct Description is required "],
    },
    price: {
      type: Number,
      require: [true, "price shouls not be empty for the post"],
    },
    size: {
      type: String,
      required: [true, "size is required"],
    },
    fabric: {
      type: String,
      required: [true, "Fabric type is Required"],
    },
    category: {
      type: String,
      required: true,
    },
    tags: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountPrice:{
      type: Number,
      default: 0,
    },
    inStock: {
      type: String,
      enum: ['instock', 'outstock'],
      default: 'instock'
    },
    savedPrice: {
      type: Number,
      default: 0
    },
    ProductStatus: {
      type : String,
      enum: ['unpublished', 'published'],
      default: 'unpublished',
    }
  },
  { timestamps: true }
);

productschema.pre('save', function (next) {
  if (this.discountPrice === 0 || this.discountPrice == null) {
    this.discountPrice = this.price;
  }
  next();
});

productschema.pre("save", async function (next) {
  if (this.isModified("discount")) {
    this.discountPrice = Math.round(((100 - this.discount)/100)*this.price)*100/100;
    this.savedPrice = this.price - this.discountPrice; 
  }
  next();
});

module.exports = mongoose.model("products", productschema);
