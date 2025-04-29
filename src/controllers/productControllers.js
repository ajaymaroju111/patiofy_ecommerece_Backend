const carts = require("../models/cartschema.js");
const bcrypt = require("bcrypt");
const { default: mongoose } = require("mongoose");
const reviews = require("../models/reviewschema.js");
const products = require("../models/productschema.js");
// const {getFileBaseUrl} = require('../middlewares/multer.js')
// const redis = require('../utils/redisConfig.js');

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
        // const hashedData = base64Data;
        return {
          name: file.originalname,
          img: {
            data: hashedData || file.buffer,
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

// exports.createProduct = async (req, res) => {
//   try {
//     const { name, description, price, size, fabric, category, tags } = req.body;

//     // Validate all required fields
//     if (!name || !description || !price || !size || !fabric || !category || !tags) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//         error: "Bad Request",
//       });
//     }

//     // Ensure files are present
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Product images are required",
//         error: "Bad Request",
//       });
//     }

//     const postFiles = req.files; // Assuming files are in the 'files' field

//     // Get the base URL depending on the environment
//     const baseUrl = getFileBaseUrl();

//     // Map through the uploaded files and prepare image data with the full URL
//     const postImages = postFiles.map((file) => {
//       // Construct the full URL for the uploaded image
//       const fileUrl = `${baseUrl}/${file.filename}`; // Concatenate base URL and the file path

//       return {
//         name: file.originalname,  // Original file name
//         img: {
//           data: fileUrl, // Store the URL instead of the image buffer
//           contentType: file.mimetype, // MIME type (e.g., image/png)
//         },
//       };
//     });

//     // Create a new product in the database with the full image data
//     await products.create({
//       userId: req.user._id, // Assuming `req.user` contains user info from JWT or session
//       postImages,  // Store image URLs along with content type and name
//       name,
//       description,
//       price,
//       size,
//       fabric,
//       category,
//       tags,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Product created successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message, // Provide more specific error message
//     });
//   }
// };

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
    // const cacheKey = `product:${id}`;

    // try {
    //   const cacheProduct = await redis.get(cacheKey);
    // if(cacheProduct){
    //   return res.status(200).json({
    //     success: true,
    //     cached: true,
    //     data : cacheProduct
    //   })
    // }
    // } catch (redisError) {
    //   console.error(redisError);
    // }
    const product = await products
      .findById(id)
      .select(
        "-userId, -shipping_cost, -ProductStatus, -createdAt, -updatedAt -number_of_sales"
      );
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
      });
    }

    // try {
    // await redis.set(cacheKey, JSON.stringify(product), 'EX', 3600) //cache expiery time is 1 hour

    // } catch (redisError) {
    //   console.error(redisError);
    // }

    return res.status(200).json({
      success: true,
      cached: false,
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

    // const cacheKey = `products:all`
    // try {
    //   const cacheProducts = await redis.get(cacheKey);
    //   if(cacheProducts){
    //     const total = cacheProducts.length;
    //     return res.status(200).json({
    //       page,
    //       success:true,
    //       cached: true,
    //       data: cacheProducts,
    //     })
    //   }
    // } catch (redisError) {
    //   console.error(redisError);
    // }
    const allproducts = await products
      .find({ ProductStatus: "unpublished" })
      .select(
        "-createdAt, -updatedAt, -ProductStatus, -userId -number_of_sales -shipping_cost"
      )
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
    // try {
    //   await redis.set(cacheKey, JSON.stringify(allproducts), 'EX', 3600);
    // } catch (redisError) {
    //   console.error(redisError);
    // }
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
    // const cacheKey = `products:filtered:page=${page}&limit=${limit}&categories=${categories || ''}&price=${price || ''}&size=${size || ''}&fabric=${fabric || ''}&discount=${Discount || ''}`;
    // try {
    //   const cacheData = await redis.get(cacheKey);
    //   if(cacheData){
    //     return res.status(200).json({
    //       success: true,
    //       page: page,
    //       cached: true,
    //       data : JSON.parse(cacheData)
    //     })
    //   }
    // } catch (redisError) {
    //   console.error(redisError)
    // }
    let filter = {};
    //initializing the filter condition :
    if (categories) {
      filter.category = { $regex: categories, $options: "i" };
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
              { $match: { stock: 'instock' } },
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
              { $match: { stock: 'outstock' } },
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
    // try {
    //   await redis.set(cacheKey, JSON.stringify(filterproduct), 'EX', 1800);
    // } catch (redisError) {
    //   console.error(redisError);
    // }
    return res.status(200).json({
      success: true,
      page: page,
      cached: false,
      totalpages: Math.ceil((filterproduct[0].products.length || 0) / limit),
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

//check the insock and out stock products : 
exports.viewProductsStock = async(req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { stock }  = req.query;
    console.log(stock)
    if(!stock){
      return res.status(400).json({
        success: false,
        message : "stock keyword is required",
        error: 'Bad Request'
      });
    }
    const stockProducts = await products.find({stock : stock}).skip(skip).limit(limit);
    if(!stockProducts){
      return res.status(404).json({
        success: false,
        message: 'Products are empty',
        error: "Not Found"
      });
    }
    return res.status(200).json({
      page: page,
      totalPages: Math.ceil(stockProducts.length/10),
      success: true,
      message: `the ${stock} products retrieved successfully`,
      data : stockProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    })
  }
};

exports.newCollections = async (req, res) => {
  try {
    const newCollections = await products
      .find()
      .sort({ createdAt: -1 }) // sort by newest first
      .limit(6);
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
      error: error,
    });
  }
};

//finding the best seller :
exports.findBestSellerProducts = async (req, res) => {
  try {
    const bestsellers = await products
      .find()
      .sort({ number_of_sales: -1 })
      .limit(6);
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
      error: error,
    });
  }
};
//*****************         PRODUCT CART ROUTES               ***********************/

//view all carts :
exports.viewAllCarts = async (req, res) => {
  try {
    // const cacheKey = `carts:all`
    // try {
    //   const cacheCarts = await redis.get(cacheKey);
    //   if(cacheCarts){
    //     return res.status(200).json({
    //       success: false,
    //       cached: true,
    //       data: cacheCarts
    //     })
    //   }
    // } catch (redisError) {
    //   console.error(redisError)
    // }
    const allCarts = await carts.find({ userId: req.user._id });
    if (!allCarts || allCarts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "cats are empty",
        error: "Not Found",
      });
    }
    // try {
    //   await redis.set(cacheKey, JSON.stringify(allCarts), 'EX', 43200);
    // } catch (redisError) {
    //   console.error(redisError);
    // }
    return res.status(200).json({
      succcess: true,
      cached: false,
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
        final_price: product.discountPrice * quantity,
        shipping_cost: product.shipping_cost,
      });
      return res.status(200).json({
        success: true,
        message: "product added to cart successfully",
      });
    }
    isCartExist.quantity += quantity;
    isCartExist.final_price =
      isCartExist.quantity * isCartExist.discountedPrice;
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
    // const cacheKey = `cart:${id}`;
    // try {
    //   const cacheCart = await redis.get(cacheKey);
    //   if(cacheCart){
    //     return res.status(200).json({
    //       success: false,
    //       cached: true,
    //       data: cacheCart
    //     })
    //   }
    // } catch (redisError) {
    //   console.error(redisError)
    // }
    const cart = await carts.findById(id);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // try {
    //   await redis.set(cacheKey, JSON.stringify(cart), 'EX', 3600);
    // } catch (redisError) {
    //   console.error(redisError);
    // }
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
        error: "Not Found",
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
    console.log(error);
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
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "cart not found",
        error: "Not Found",
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
