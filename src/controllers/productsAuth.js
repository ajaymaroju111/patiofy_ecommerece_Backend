const products = require("../models/productschema.js");
const carts = require("../models/cartschema.js");
const { default: mongoose } = require("mongoose");
const reviews = require("../models/reviews.js");

//create a product post :
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, size, fabric, category, tags } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "post images are required",
      });
    }
    const postImages = req.files.map((file) => ({
      name: file.originalname,
      img: {
        data: file.buffer, // Store buffer data
        contentType: file.mimetype,
      },
    }));
    const Post = await products.create({
      userId: req.user._id,
      postImages: postImages,
      name,
      description,
      price,
      size,
      fabric,
      category,
      tags,
    });
    await Post.save();
    return res.status(200).json({
      success: true,
      message: "product added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//update product post  :
exports.updateProduct = async (req, res) => {
  try {
    const { id, name, description, price } = req.body;
    const newData = {
      name,
      description,
      price,
    };
    await products.findByIdAndUpdate(id, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });
    return res.status(200).json({
      success: true,
      message: "post updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//get product by Id :
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await products
      .findById(id)
      .populate("userId", "firstname lastname username email")
      .exec();
    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//delete a post :
exports.deleteProduct = async (req, res) => {
  const { id } = req.params.id;
  await products.findByIdAndDelete(id);
  await reviews.deleteOne({ productId: id });
  return res.status(200).json({
    success: true,
    message: "post deleted successfully",
  });
};

//*****************         PRODUCT CART ROUTES               ***********************/

//adding to the cart :
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const post = await products.findById(productId);
    if (!post) {
      return res.status(404).json({
        message: "product not found",
      });
    }
    const cart = await carts.create({
      cartImages: post.postImages,
      userId: req.user._id,
      productId: post._id,
      price: post.price,
    });
    await cart.save();
    return res.status(200).json({
      success: true,
      message: "product added to cart successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//get cart details by id :
exports.getCartById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart ID format",
      });
    }
    const cart = await carts.findById(id);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message || error,
    });
  }
};

//update cart by id :
exports.updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const update = await carts.findByIdAndUpdate(
      id,
      { quantity: quantity },
      {
        new: true,
        runValidators: true,
      }
    );
    if(!update){
      return res.status(404).json({
        success: false,
        message: "error occured in updation"
      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//delete cart :
exports.deleteCart = async (req, res) => {
  try {
    const { id } = req.params;
    await carts.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: " Internal Server Error ",
      error: error,
    });
  }
};

///////////////////// review //////////////////
exports.getRatingById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await products.findById(id);
    if (!product) {
      return res.status(401).json({
        success: false,
        message: "product is no longer available",
      });
    }
    const rate = await reviews.findOne({ productId: id });
    return res.status(200).json({
      success: true,
      message: "review retrieved successfully",
      rate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intenal Server Error",
      error: error,
    });
  }
};
