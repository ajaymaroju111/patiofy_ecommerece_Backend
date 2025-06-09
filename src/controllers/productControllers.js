const carts = require("../models/cartschema.js");
const ProductMatrix = require("../models/productmatrixschema.js");
const fabrics = require("../models/fabricschema.js");
const { default: mongoose } = require("mongoose");
const reviews = require("../models/reviewschema.js");
const products = require("../models/productschema.js");
const categories = require("../models/catogeriesschema.js");
const { deleteOldImages } = require("../middlewares/S3_bucket.js");


// ✅✅✅✅✅✅✅✅✅✅✅  Products  ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

//create a product Product :
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      fabric,
      category,
      tags,
      viewIn,
      stock,
      ProductStatus,
    } = req.body;

    //checking for the body data :
    if (!name || !description || !viewIn || !ProductStatus || !tags || !stock) {
      return res.status(400).json({
        success: false,
        message: "all fields are required",
        error: "Bad Request",
      });
    }
    const allowedViews = new Set([
      "new_collection",
      "best_seller",
      "trending",
      "all",
      "none",
    ]);

    let parsedViewIn = viewIn;

    // If it's a string (e.g., passed as a JSON string from client), parse it
    if (typeof viewIn === "string") {
      try {
        parsedViewIn = JSON.parse(viewIn);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format in viewIn",
          error: err.message,
        });
      }
    }

    // Ensure it's an array of valid values
    if (
      !Array.isArray(parsedViewIn) ||
      parsedViewIn.some((v) => typeof v !== "string" || !allowedViews.has(v))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid viewIn value(s)",
        error: "Allowed values: " + Array.from(allowedViews).join(", "),
      });
    }
    //splitting tags and storing in an array :
    const tagArray = tags.split(",").map((tag) => tag.trim().toLowerCase());

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product images are required",
        error: "Bad Request",
      });
    }

    //product images :
    const imageUrls = req.files.map((file) => file.location);

    const product = await products.create({
      userId: req.user._id,
      imagesUrl: imageUrls,
      name,
      description,
      tags: tagArray,
      fabric,
      category,
      stock,
      viewIn: parsedViewIn,
      ProductStatus,
    });
    return res.status(200).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//update product Product  :
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
        error: "Bad Request",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "tags",
      "viewIn",
      "fabric",
      "category",
      "stock",
      "ProductStatus",
    ];
    const allowedViews = [
      "new_collection",
      "best_seller",
      "trending",
      "all",
      "none",
    ];

    const newData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "tags" && typeof req.body.tags === "string") {
          newData.tags = req.body.tags
            .split(",")
            .map((tag) => tag.trim().toLowerCase());
        } else {
          newData[field] = req.body[field];
        }
      }
    });

    const updatedproduct = await products.findByIdAndUpdate(id, newData, {
      new: true,
      runValidators: true,
    });
    if (!updatedproduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedproduct,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateImages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid ID",
        error: "Bad Request",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(401).json({
        success: false,
        message: "files should not be empty",
        error: "Bad Request",
      });
    }
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
      });
    }
    const oldImageKeys = product.imagesUrl.map((url) => {
      return decodeURIComponent(new URL(url).pathname).substring(1); // remove leading '/'
    });

    // const oldImageKeys = product.imagesUrl.map((url) => {
    //   const urlParts = url.split("/");
    //   return urlParts.slice(3).join("/");
    // });
    await deleteOldImages(oldImageKeys);
    // const newImageUrls = await uploadNewImages(req.files);
    const newImageUrls = req.files.map((file) => file.location);
    product.imagesUrl = newImageUrls;
    await product.save();
    console.log(product.imagesUrl);
    return res.status(200).json({
      success: true,
      message: "product images updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server",
      error: error.message,
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
    const product = await products
      .findById(id)
      .select("-userId, -ProductStatus, -createdAt, -updatedAt")
      .populate("rating", "finfinalRating");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      cached: false,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
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
      .find({ ProductStatus: "published" })
      .select("-createdAt, -updatedAt, -ProductStatus, -userId ")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allproducts.length === 0 || !allproducts) {
      return res.status(404).json({
        success: false,
        messsage: "products not found",
      });
    }
    const total = await products.countDocuments({ ProductStatus: "published" });
    return res.status(200).json({
      success: true,
      page,
      cached: false,
      data: allproducts,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
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
    const isproduct = await products.findById(id);
    if (!isproduct) {
      return res.status(404).json({
        success: false,
        message: "product not available",
        errror: "Not Found",
      });
    }
    const oldImageKeys = (product.imagesUrl || []).map((url) => {
      const urlParts = url.split("/");
      return urlParts.slice(3).join("/");
    });
    await deleteOldImages(oldImageKeys);
    const product = await products.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
      });
    }

    //delete the meta data of that product :
    await ProductMatrix.deleteMany({ productId: id });

    const isSingleCategory = await categories.find({
      categery_name: product.category,
    });
    const isSingleFabric = await fabrics.find({
      categery_name: product.fabric,
    });
    if (isSingleCategory.length === 1) {
      await categories.deleteOne({ categery_name: product.category });
    }
    if (isSingleFabric.length === 1) {
      await fabrics.deleteOne({ fabric_name: product.fabric });
    }
    await reviews.deleteOne({ productId: id });
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌ 

//get catogeries, size and fabric :
exports.getFilterNames = async (req, res) => {
  try {
    const uniquecategories = await products.distinct("category");
    if (!uniquecategories) {
      return res.status(404).json({
        success: false,
        message: "categories are empty",
        error: "Not Found",
      });
    }
    const uniquesizes = await products.distinct("size");
    if (!uniquesizes) {
      return res.status(404).json({
        success: false,
        message: "sizes are empty",
        error: "Not Found",
      });
    }
    const uniquefabrics = await products.distinct("fabric");
    if (!uniquefabrics) {
      return res.status(404).json({
        success: false,
        message: "fabrics are empty",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      catogeries: uniquecategories,
      size: uniquesizes,
      fabric: uniquefabrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//search for products : ( NAN )
exports.filterProducts = async (req, res) => {
  try {
    const { categories, price, size, fabric, Discount, stock } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    //initializing the filter condition :
    if (categories) {
      filter.category = { $regex: categories, $options: "i" };
    }
    if (stock) {
      const allstockProducts = await products
        .find({ stock: stock })
        .skip(skip)
        .limit(limit)
        .exec();
      if (!allstockProducts) {
        return res.status(404).json({
          success: false,
          message: "Products not found",
          error: "Not Found",
        });
      }

      return res.status(200).json({
        succcess: true,
        message: `${stock} products are retrieved successfully!`,
        count: allstockProducts.length,
        totalPages: Math.ceil(allstockProducts.length / 10),
        products: allstockProducts,
      });
    }

    if (Discount) {
      const [min, max] = Discount.split("_").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        filter.discount = { $gte: min, $lte: max };
      } else if (!isNaN(min)) {
        filter.discount = { $gte: min };
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
                  imagesUrl: 1,
                  category: 1,
                  price: 1,
                  size: 1,
                  fabric: 1,
                  inStock: 1,
                  discount: 1,
                  discountPrice: 1,
                  savedPrice: 1,
                  rating: 1,
                },
              },
              { $skip: skip },
              { $limit: limit },
            ],
            instockProducts: [
              { $match: { stock: "instock" } },
              {
                $project: {
                  name: 1,
                  imagesUrl: 1,
                  category: 1,
                  price: 1,
                  size: 1,
                  fabric: 1,
                  discount: 1,
                  discountPrice: 1,
                  savedPrice: 1,
                  rating: 1,
                },
              },
            ],
            outstockProducts: [
              { $match: { stock: "outstock" } },
              {
                $project: {
                  name: 1,
                  imagesUrl: 1,
                  category: 1,
                  price: 1,
                  size: 1,
                  fabric: 1,
                  discount: 1,
                  discountPrice: 1,
                  savedPrice: 1,
                  rating: 1,
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
      cached: false,
      totalProducts: filterproduct[0].products.length,
      totalpages: Math.ceil((filterproduct[0].products.length || 0) / limit),
      filterproduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//check the insock and out stock products :
exports.viewProductsStock = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { stock } = req.query;
    console.log(stock);
    if (!stock) {
      return res.status(400).json({
        success: false,
        message: "stock keyword is required",
        error: "Bad Request",
      });
    }
    const stockProducts = await products
      .find({ stock: stock })
      .skip(skip)
      .limit(limit);
    if (!stockProducts) {
      return res.status(404).json({
        success: false,
        message: "Products are empty",
        error: "Not Found",
      });
    }
    const total = await products.countDocuments({ stock: stock });
    return res.status(200).json({
      page: page,
      totalPages: Math.ceil(total / 10),
      success: true,
      message: `the ${stock} products retrieved successfully`,
      data: stockProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.newCollections = async (req, res) => {
  try {
    const newCollections = await products.find({
      viewIn: { $in: ["new_collection", "all"] },
    });
    if (!newCollections || newCollections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collections are empty",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "collection retrieved successfully",
      data: newCollections,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.trendingCollections = async (req, res) => {
  try {
    const trendingCollections = await products.find({
      viewIn: { $in: ["trending", "all"] },
    });
    if (!trendingCollections || trendingCollections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Collections are empty",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "collection retrieved successfully",
      data: trendingCollections,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//finding the best seller :
exports.findBestSellerProducts = async (req, res) => {
  try {
    const bestsellers = await products.find({
      viewIn: { $in: ["best_seller", "all"] },
    });
    if (!bestsellers || bestsellers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "best sellers are empty",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "best sellers found successfully",
      data: bestsellers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q;
    const output = await products.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        // {description : {$regex : query, $options : 'i'}},
        // {category : {$regex : query, $options : 'i'}},
        // {tags : {$regex : query, $options : 'i'}}
      ],
    });
    if (!output || (await output).length === 0) {
      return res.status(404).json({
        success: false,
        message: "products not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "search products recieved successfully",
      data: output,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
//*****************         PRODUCT CART ROUTES               ***********************/

// ✅✅✅✅✅✅✅✅✅✅  carts  ✅✅✅✅✅✅✅✅✅✅✅✅

//view all carts :
exports.viewAllCarts = async (req, res) => {
  try {
    const allCarts = await carts
      .find({ userId: req.user._id })
      .populate({
        path: "items.productId", // 1st level: cart -> product
        populate: {
          path: "product_Matrix", // 2nd level: product -> matrix
          model: "ProductMatrix", // MUST match what you used in mongoose.model()
        },
      })
      .populate("userId")
      .exec();

    const uniqueCartIds = await carts.find({ userId: req.user._id });
    const totalUniqueCarts = uniqueCartIds.length;

    return res.status(200).json({
      succcess: true,
      cached: false,
      data: allCarts,
      count: totalUniqueCarts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intenal Server Error",
      error: error.message,
    });
  }
};

//adding to the cart :
exports.addToCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, size } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
      });
    }

    const productMatrix = await ProductMatrix.findOne(
      { productId: id },
      { size: size }
    );
    if (!productMatrix) {
      return res.status(404).json({
        success: false,
        message: "product matrix not found",
        error: "Not Found",
      });
    }

    const isCartExist = await carts
      .findOne({
        $and: [{ productId: id }, { userId: req.user._id }, { size: size }],
      })
      .populate({
        path: "items.productId", // 1st level: cart -> product
        populate: {
          path: "product_Matrix", // 2nd level: product -> matrix
          model: "ProductMatrix", // MUST match what you used in mongoose.model()
        },
      })
      .exec();
    if (!isCartExist) {
      if (quantity > productMatrix.stock || !productMatrix.stock) {
        return res.status(401).json({
          success: false,
          message: `product out of stock!! only ${productMatrix.stock} items left in ${size} size`,
          error: "Bad Request",
        });
      }
      await carts.create({
        cartImages: product.imagesUrl,
        quantity: quantity,
        size: size,
        userId: req.user._id,
        productId: product._id,
      });
      return res.status(200).json({
        success: true,
        message: "product added to cart successfully",
      });
    }
    const final_quantity = (isCartExist.quantity += quantity);
    if (final_quantity > productMatrix.stock || !productMatrix.stock) {
      return res.status(401).json({
        success: false,
        message: `product out of stock !! only ${productMatrix.stock} items left in ${size} size`,
        error: "Bad Request",
      });
    }
    const cartUpdate = await carts.findByIdAndUpdate(
      isCartExist._id,
      {
        $set: {
          quantity: final_quantity,
        },
      },
      {
        new: true,
      }
    );
    if (!cartUpdate) {
      return res.status(400).json({
        success: false,
        message: "Product update failed due to a bad request.",
        error: "Invalid input or missing data.",
      });
    }

    const data = await (
      await cartUpdate.populate("userId", "firstname")
    ).populate({
      path: "items.productId", // 1st level: cart -> product
      populate: {
        path: "product_Matrix", // 2nd level: product -> matrix
        model: "ProductMatrix", // MUST match what you used in mongoose.model()
      },
    });

    return res.status(200).json({
      success: true,
      message: " cart quantity updated successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
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

    const cart = await carts
      .findById(id)
      .populate({
        path: "items.productId", // 1st level: cart -> product
        populate: {
          path: "product_Matrix", // 2nd level: product -> matrix
          model: "ProductMatrix", // MUST match what you used in mongoose.model()
        },
      })
      .exec();
    if (cart.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
        error: "UnAuthorized",
      });
    }
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    return res.status(200).json({
      success: true,
      cached: false,
      data: cart,
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
    const { quantity, size } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid cart ID",
        error: "Bad Request",
      });
    }
    const isCart = await carts
      .findOne({
        $and: [{ _id: id }, { userId: req.user._id }, { size: size }],
      })
      .populate({
        path: "items.productId", // 1st level: cart -> product
        populate: {
          path: "product_Matrix", // 2nd level: product -> matrix
          model: "ProductMatrix", // MUST match what you used in mongoose.model()
        },
      })
      .exec();
    if (!isCart) {
      return res.status(404).json({
        success: false,
        message: "cart not fount",
        error: "Not Found",
      });
    }
    const product = await products.findOne({ _id: isCart.productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not Found",
        error: "Not Found",
      });
    }
    const productMatrix = await ProductMatrix.findOne({productId: product._id}, {size: size})
    if (quantity > productMatrix.stock || !productMatrix.stock) {
      return res.status(402).json({
        success: false, 
        message: `product limit exceeded!! only ${productMatrix.stock} items left in ${size} size`,
        error: "Stock limit exceeded",
      });
    }
    const updateCart = await carts
      .findByIdAndUpdate(
        id,
        {
          $set: {
            quantity: quantity,
          },
        },
        {
          new: true,
        }
      )
      .populate({
        path: "items.productId", // 1st level: cart -> product
        populate: {
          path: "product_Matrix", // 2nd level: product -> matrix
          model: "ProductMatrix", // MUST match what you used in mongoose.model()
        },
      }).exec();

    if (!updateCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not updated",
        error: "update action failed",
      });
    }
    return res.status(200).json({
      success: true,
      message: "cart updated successfully",
      data: updateCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
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
    const isUser = await carts.findOne({
      $and: [{ _id: id }, { userId: req.user._id }],
    });

    if (!isUser) {
      return res.status(404).json({
        success: false,
        message: "cart not found",
        error: "Not Found",
      });
    }

    if (isUser.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({
        success: false,
        message: "You are not Authorized",
        error: "UnAuthorized",
      });
    }
    
    const deleted = await carts.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "cart not deleted",
        error: "Bad Request",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: " Internal Server Error ",
      error: error.message,
    });
  }
};

// ✅✅✅✅✅✅✅✅✅✅✅  Product matrix  ✅✅✅✅✅✅✅✅✅✅✅

//create a product matrix : 
exports.createProductMatrix = async(req, res) => {
  try {
    const id = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid id",
        error: "UnAuthorized"
      })
    }
    const { original_price, selling_price, size, stock} = req.body;

    if(!original_price || !selling_price || !size || !stock){
      return res.status(401).json({
        success: false,
        message: "All fields are required",
        error: "Bad Request"
      })
    }
    const product = await products.findById(id);
    if(!product){
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found"
      })
    }
    if(original_price < selling_price){
      return res.status(401).json({
        success: false,
        message: "selling price can not be grater than original price",
        error: "UnAuthorized",
      })
    }
    const isAlreadyMatrix = await ProductMatrix.find({productId: id}, {size: size});
    if(isAlreadyMatrix){
      return res.status(401).json({
        success: false,
        message: "product matrix already exist",
        error: "Already exist"
      })
    }
    const matrix = await ProductMatrix.create({
      productId: id,
      original_price,
      selling_price,
      size,
      stock,
    })
    product.product_Matrix = matrix._id;
    await product.save();
    return res.status(200).json({
      success: true,
      message: "product matrix created successfully",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message : "Internal Server Error",
      error: error.message,
    })
  }
}

//update product_matrix : 
exports.updateProductMatrix = async(req, res) => {
  try {
    const id = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid id",
        error: "UnAuthorized"
      })
    }
    const Matrix = await ProductMatrix.findById(id);
    if(!Matrix){
      return res.status(404).json({
        success: false,
        message: "product matrix not found",
      })
    }

    const product = await products.findById(Matrix.productId);
    if(!product){
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found"
      })
    }

    const allowedFields = [
      "original_price",
      "selling_price",
      "stock"
    ]
    const updateData = {};
    allowedFields.forEach((field) => {
      if(req.body[field] !== undefined){
        if(req.body[original_price] < req.body[selling_price] ){
          return res.status(400).json({
            success: false,
            messsage: "selling price can not be greater than original price",
            error: "unauthorized"
          })
        }
        updateData[field] = req.body[field];
      }
    })

    const updateMatrix = await ProductMatrix.findByIdAndUpdate(
      id,
      updateData,
      {
        new : true,
        runValidators: true
      }
    )
    if(!updateMatrix){
      return res.status(400).json({
        success: false,
        message: "some thing went wrong , not updated",
        error: "unAuthorized"
      })
    }
    return res.status(200).json({
      success: false,
      message: "product matrix updated successfully"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    })
  }
}

//read product_matrix : 
exports.getProductMatrixById = async(req, res) => {
  try {
    const id = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success: false,
        message: "Invaid ID",
        error: "Bad Request"
      })
    }
    const matrix = await ProductMatrix.findById(id);
    if(!matrix){
      return res.status(404).json({
        success: false,
        message: "Product matrix not found",
        error: "Not Found"
      })
    }
    const product = await products.findById(matrix._id);
    if(!product){
      return res.status(404).json({
        success: true,
        message: "Product not found",
        error: "Not Found"
      })
    }
    return res.status(200).json({
      success: true,
      message: "product matrix retrieved successfully",
    })
  } catch (error) {
    return res.status(500).json({
      success: trwu,
      message: "Interna; Server Error",
      error: error.message
    })
  }
}

//delete pproduct_matrix :
exports.deleteProductMatrix = async(req, res) => {
  try {
    const id  = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(401).json({
        success: true,
        message: "Invalid ID",
        error: "Not Found"
      })
    }
    const matrix = await ProductMatrix.findById(id);
    if(!matrix){
      return res.status(404).json({
        success : true,
        message: "product matrix not found",
        error: "Bad Request",
      })
    }
    const product = await products.findById(matrix.productId);
    if(!product){
      return res.status(404).json({
        success: true,
        message: 'product not found',
        error: "Not Found"
      })
    }

    await ProductMatrix.findByIdAndDelete(id);
    return res.status(400).json({
      success: true,
      message: "product matrix deleted successfully"
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    })
  }
}

// ❌❌❌❌❌❌❌❌❌❌  ❌❌❌❌❌❌❌❌❌❌


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
      error: error.message,
    });
  }
};

//rating a product :
exports.ratingProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid product ID",
        error: "Bad Request",
      });
    }
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid rating (1 - 5)",
      });
    }
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
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
    product.rating = rate.finalRating;
    await product.save();
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
