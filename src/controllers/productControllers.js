const products = require("../models/productschema.js");
const carts = require("../models/cartschema.js");
const { default: mongoose } = require("mongoose");
const reviews = require("../models/reviews.js");

//create a product post :
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, size, fabric, category, tags } = req.body;
    // Check for uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Post images are required",
      });
    }
    const postImages = req.files.map((file) => {
      return `/uploads/productPics/${file.filename}`; // or full URL if hosted
    });

    const Post = await products.create({
      userId: req.user._id,
      postImages,
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
    console.log(error);
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart ID format",
      });
    }
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//get all products :
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allproducts = await products.find().skip(skip).limit(limit).exec();
    if (allproducts.length === 0 || !allproducts) {
      return res.status(404).json({
        success: false,
        messsage: "products not found",
      });
    }
    const total = await products.countDocuments();
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: allproducts,
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

//search for products : ( NAN )
exports.filterProducts = async (req, res) => {
  try {
    const { categories, price, size, fabric, Discount } = req.query;
    let filter = {};
    //initializing the filter condition :
    if (categories) {
      filter.category = { $regex: categories, $options: "i" };
    }

    if (Discount) {
      const [min, max] = Discount.split("_").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        filter.price = { $gte: min, $lte: max };
      } else if (isNaN(min)) {
        filter.Discount = { $gte: min };
      }
    }
    if (price) {
      const [min, max] = price.split("_").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        filter.price = { $gte: min, $lte: max };
      } else if (isNaN(min)) {
        filter.price = { $gte: min };
      }
    }

    if (size) {
      filter.size = size;
    }
    if (fabric) {
      filter.fabric = fabric;
    }

    //usage of aggregations pipelines :
    const filterproduct = await products.aggregate([
      { $match: filter }, // your dynamic filters
      { $sort: { price: 1 } },
      {
        $facet: {
          products: [
            {
              $project: {
                category: 1,
                price: 1,
                size: 1,
                fabric: 1,
                inStock: 1,
                discount: 1,
                discountPrice: 1,
                savedPrice: 1,
              }
            }
          ],
          stockCounts: [
            {
              $group: {
                _id: "$inStock",
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);    
    return res.status(200).json({
      success: true,
      filterproduct,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
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
    if (!update) {
      return res.status(404).json({
        success: false,
        message: "error occured in updation",
      });
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

//get rating of a product id :
exports.getRatingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart ID format",
      });
    }
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

//rating a product :
exports.ratingProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid rating (1 - 5)",
      });
    }
    const rate = await reviews.findOne({ productId: id });
    if (!rate) {
      rate = await reviews.create({
        productId: id,
        userId: [req.user._id],
        [`r${rating}`]: {
          data: {
            count: 1,
          },
        },
        finalRating: rating,
      });
    } else {
      if (rate.userId.includes(req.user._id)) {
        return res.status(400).json({
          success: false,
          error: "You have already rated this product",
        });
      }

      // Add user to userId list
      rate.userId.push(req.user._id);

      const ratingKey = `r${rating}`;

      // Initialize rating block if it doesn't exist
      if (!rate[ratingKey]) {
        rate[ratingKey] = {
          data: {
            messages: [],
            count: 0,
          },
        };
      }

      // Add message and increment count
      rate[ratingKey].data.count += 1;

      // Recalculate average rating
      const totalScore = [1, 2, 3, 4, 5].reduce((sum, r) => {
        const count = rate[`r${r}`]?.data?.count || 0;
        return sum + r * count;
      }, 0);

      const totalCount = [1, 2, 3, 4, 5].reduce((sum, r) => {
        return sum + (rate[`r${r}`]?.data?.count || 0);
      }, 0);

      rate.finalRating =
        totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : 0;
    }

    await rate.save();

    return res.status(200).json({
      success: true,
      message: "Review added successfully",
      rate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};
