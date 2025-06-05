const mongoose = require("mongoose");

const productschema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    imagesUrl: [{ type: String, required: true }],
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
      type: [String],
      required: true,
      lowercase: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: String,
      enum: ["instock", "outstock"],
      default: "instock",
    },
    viewIn: {
      type: [{ type: String }],
      enum: ["new_collection", "best_seller", "trending", "all", "none"],
      default: "none",
    },
    savedPrice: {
      type: Number,
      default: 0,
    },
    ProductStatus: {
      type: String,
      enum: ["unpublished", "published"],
      default: "unpublished",
    },
    stock_quantity: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value >= 0;
        },
        message: function (props) {
          return `Stock limit exceeded: tried to set ${props.value}, but it must be 0 or more.`;
        },
      },
    },
    rating: {
      type: String,
    },
  },
  { timestamps: true }
);

productschema.pre("save", function (next) {
  if (this.discountPrice === 0 || this.discountPrice == null) {
    this.discountPrice = this.price;
  }
  next();
});

// productschema.pre("save", async function (next) {
//   if (this.isModified("discount")) {
//     if(this.discount > 0){
//       this.discountPrice = Math.round(((100 - this.discount)/100)*this.price)*1000/1000;
//       this.savedPrice = Math.round((this.price - this.discountPrice)*100)/100;
//     }else{
//       this.discountPrice = this.price;
//       this.savedPrice = 0;
//     }
//   }
//   next();
// });
productschema.pre("save", async function (next) {
  if (this.isModified("discountPrice")) {
    if (
      this.discountPrice > 0 &&
      this.price > 0 &&
      this.discountPrice <= this.price
    ) {
      this.discount = 100 * (1 - this.discountPrice / this.price);
      this.savedPrice = this.price - this.discountPrice;
    } else {
      this.discount = undefined;
      this.savedPrice = undefined;
    }
  }
  next();
});

// productschema.pre('save', async function(next){
//   if(this.isModified('_id')){
//     this.rating = this._id;
//   }
//   next();
// })

module.exports = mongoose.model("products", productschema);
