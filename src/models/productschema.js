const mongoose = require("mongoose");
const crypto = require('crypto');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    postImages: [
      {
        name: String,
        img: {
          data: Buffer,
          contentType: String,
          hash : String,
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
      type : String,
      required: true,
    }
  },
  { timestamps: true }
);

postSchema.pre("save", function (next) {
  if (this.isModified("postImages")) {
    this.postImages = this.postImages.map((image) => {
      const hash = crypto.createHash("sha256").update(image.img.data).digest("hex");
      return {
        ...image,
        img: {
          ...image.img,
          hash,
        },
      };
    });
  }
  next();
});

module.exports = mongoose.model("posts", postSchema);
