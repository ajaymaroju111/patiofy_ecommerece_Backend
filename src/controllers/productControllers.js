const carts = require("../models/cartschema.js");
const bcrypt = require("bcrypt");
const { default: mongoose } = require("mongoose");
const reviews = require("../models/reviewschema.js");
const products = require("../models/productschema.js");

//create a product Product :
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, size, fabric, category, tags } = req.body;

    if (
      !name ||
      !description ||
      !price ||
      !size ||
      !fabric ||
      !category ||
      !tags
    ) {
      return res.status(400).json({
        success: false,
        message: "all fields are required",
        error: "Bad Request",
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product images are required",
        error: "Bad Request",
      });
    }

    const postFiles = req.files; // Assuming an array of files

    const postImages = await Promise.all(
      postFiles.map(async (file) => {
        const base64Data = file.buffer.toString("base64");
        const hashedData = await bcrypt.hash(base64Data, 10); // 10 salt rounds
        return {
          name: file.originalname,
          img: {
            data: hashedData,
            contentType: file.mimetype,
          },
        };
      })
    );

    await products.create({
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

    return res.status(200).json({
      success: true,
      message: "Product created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//update product Product  :
exports.updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "price",
      "size",
      "fabric",
      "category",
      "tags",
    ];

    // Dynamically build update object
    const newData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        newData[field] = req.body[field];
      }
    });
    await products.findByIdAndUpdate(id, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
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
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
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
    const allproducts = await products
      .find({ ProductStatus: "unpublished" })
      .select("-createdAt, -updatedAt, -ProductStatus")
      .skip(skip)
      .limit(limit)
      .exec();
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

//delete a Product :
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid ID",
      });
    }
    const deleted = await products.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }
    const review = await reviews.deleteOne({ productId: id });
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//search for products : ( NAN )
exports.filterProducts = async (req, res) => {
  try {
    const { categories, price, size, fabric, Discount } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
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
    const filterproduct = await products
      .aggregate([
        { $match: filter }, // apply any dynamic filters
        { $sort: { price: 1 } },
        {
          $facet: {
            products: [
              {
                $project: {
                  name: 1,
                  category: 1,
                  price: 1,
                  size: 1,
                  fabric: 1,
                  inStock: 1,
                  discount: 1,
                  discountPrice: 1,
                  savedPrice: 1,
                },
              },
              { $skip: skip },
              { $limit: limit },
            ],
            instockProducts: [
              { $match: { inStock: "instock" } },
              {
                $project: {
                  name: 1,
                  category: 1,
                  price: 1,
                  size: 1,
                  fabric: 1,
                  discount: 1,
                  discountPrice: 1,
                  savedPrice: 1,
                },
              },
            ],
            outstockProducts: [
              { $match: { inStock: "outstock" } },
              {
                $project: {
                  name: 1,
                  category: 1,
                  price: 1,
                  size: 1,
                  fabric: 1,
                  discount: 1,
                  discountPrice: 1,
                  savedPrice: 1,
                },
              },
            ],
          },
        },
      ])
      .skip(skip)
      .limit(limit)
      .exec();
    if (!filterproduct || filterproduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Products not found",
      });
    }
    return res.status(200).json({
      success: true,
      page: page,
      totalItems: filterproduct.length,
      filterproduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

exports.newCollections = async(req, res) => {
  try {
    const newCollections = await products.find()
    .sort({ createdAt: -1 }) // sort by newest first
    .limit(6)
    if(!newCollections || newCollections.length === 0){
      return res.status(404).json({
        success: false,
        message: "Collections are empty",
        error: "Not Found"
      })
    }
    return res.status(200).json({
      success: true,
      message: "collection retrieved successfully",
      data: newCollections,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    })
  }
}

//finding the best seller : 
exports.findBestSellerProducts = async(req, res) =>{
  try {
    const bestsellers = await products.find().sort({ number_of_sales: -1 }).limit(6);
    if(!bestsellers || bestsellers.length === 0){
      return res.status(404).json({
        success: false,
        message : "best sellers are empty",
        error: "Not Found"
      })
    }
    return res.status(200).json({
      success:true,
      message: "best sellers found successfully",
      data: bestsellers
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    })
  }
}
//*****************         PRODUCT CART ROUTES               ***********************/

//view all carts :
exports.viewAllCarts = async (req, res) => {
  try {
    const allCarts = await carts.find({ userId: req.user._id });
    if (!allCarts || allCarts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "cats are empty",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      succcess: true,
      message: "cart retrieved successfully",
      data: allCarts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intenal Server Error",
      error: error,
    });
  }
};

//adding to the cart :
exports.addToCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    let product;
    const isCartExist = await carts.findOne({ productId: id });
    if (!isCartExist) {
      product = await products.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "product not found",
          error: "Not Found",
        });
      }
      await carts.create({
        cartImages: product.postImages,
        quantity: quantity,
        userId: req.user._id,
        productId: product._id,
        discountedPrice: product.discountPrice,
        final_price: product.discountPrice*quantity,
        shipping_cost: product.shipping_cost,
      });
      return res.status(200).json({
        success: true,
        message: "product added to cart successfully",
      });
    }
    isCartExist.quantity += quantity;
    isCartExist.final_price = isCartExist.quantity*isCartExist.discountedPrice;
    await isCartExist.save();
    return res.status(200).json({
      success: false,
      message: " cart quantity updated successfully",
      data: isCartExist,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid cart ID",
        error: "Bad Request",
      });
    }
    const { quantity } = req.body;
    const update = await carts.findById(id);
    if (!update) {
      return res.status(404).json({
        success: false,
        message: "cart not found",
        error: "Not Found"
      });
    }
    update.quantity = quantity;
    update.final_price = quantity * update.discountedPrice;
    await update.save();
    return res.status(200).json({
      success: true,
      message: "cart updated successfully",
      data: update,
    });
  } catch (error) {
    console.log(error)
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart ID",
        error: "Bad Request",
      });
    }
    const deleted = await carts.findByIdAndDelete(id);
    if(!deleted){
      return res.status(404).json({
        success: false,
        message: "cart not found",
        error: "Not Found"
      })
    }
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
        message: "Invalid product ID format",
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
      await reviews.create({
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
    // await rate.save();
    return res.status(200).json({
      success: true,
      message: "Review posted successfully",
      rating,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};
