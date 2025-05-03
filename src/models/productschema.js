const mongoose = require("mongoose");
const crypto = require("crypto");
const {categoriesNames, sizeNames, fabricNames} = require('../utils/data.js');

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
      required: [true, "price shouls not be empty for the post"],
    },
    size: {
      type: String,
      required: [true, "size is required"],
      lowercase: true,
    },
    fabric: {
      type: String,
      required: [true, "Fabric type is Required"],
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
    },
    tags: {
      type: String,
      required: true,
      lowercase: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountPrice:{
      type: Number,
      default: 0,
    },
    stock: {
      type: String,
      enum: ['instock', 'outstock'],
      default: 'instock',
    },
    viewIn : {
      type: String,
      enum: ['new_collection', 'best_seller', 'both', 'none'],
      default: 'none',
    },
    savedPrice: {
      type: Number,
      default: 0
    },
    ProductStatus: {
      type : String,
      enum: ['unpublished', 'published'],
      default: 'unpublished',
    },
    number_of_sales :{
      type : Number,
    },
    shipping_cost:{
      type: Number,
      default: 0,
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
    if(this.discount > 0){
      this.discountPrice = Math.round(((100 - this.discount)/100)*this.price)*1000/1000;
      this.savedPrice = Math.round((this.price - this.discountPrice)*100)/100; 
    }else{
      this.discountPrice = this.price;
      this.savedPrice = 0;
    }
  }
  next();
});

// productschema.pre("save", async function (next) {
//   if(this.isModified("category")){
//     if(!categoriesNames.includes(this.category)){
//       categoriesNames.push(this.category);
//     }
//   }
//   next();
// })
// productschema.pre("save", async function (next) {
//   if(this.isModified("size")){
//     if(!sizeNames.includes(this.size)){
//       sizeNames.push(this.size);
//     }
//   }
//   next();
// })
// productschema.pre("save", async function (next) {
//   if(this.isModified("fabric")){
//     if(!fabricNames.includes(this.fabric)){
//       fabricNames.push(this.fabric);
//     }
//   }
//   next();
// })

module.exports = mongoose.model("products", productschema);
