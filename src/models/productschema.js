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
    fabric: {
      type: String,
      required: [true, "product fabric is required"],
    },
    category: {
      type: String,
      required: [true, "category is required"],
    },
    tags: {
      type: [String],
      required: true,
      set: tags => tags.map(tag => tag.toLowerCase()),
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
    ProductStatus: {
      type: String,
      enum: ["unpublished", "published"],
      default: "unpublished",
    },
    product_Matrix : 
       [{
        type: mongoose.Schema.Types.ObjectId,
         ref: "ProductMatrix"
       }],
    rating_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reviews"
    },
    rating: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);


module.exports = mongoose.model("products", productschema);
