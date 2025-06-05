const carts = require("../models/cartschema.js");
const bcrypt = require("bcrypt");
const users = require("../models/userschema.js");
const { default: mongoose } = require("mongoose");
const reviews = require("../models/reviewschema.js");
const products = require("../models/productschema.js");
const {
  deleteOldImages,
  uploadNewImages,
} = require("../middlewares/S3_bucket.js");

//create a product Product :
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      size,
      fabric,
      category,
      tags,
      discountPrice,
      viewIn,
      stock,
      ProductStatus,
      stock_quantity
    } = req.body;

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

    // const postFiles = req.files; // Assuming an array of files
    const imageUrls = req.files.map((file) => file.location);


    await products.create({
      userId: req.user._id,
      imagesUrl: imageUrls,
      name,
      description,
      price,
      size,
      fabric,
      category,
      tags: tagArray,
      discountPrice,
      stock,
      viewIn: parsedViewIn,
      ProductStatus,
      stock_quantity
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
      "price",
      "size",
      "fabric",
      "category",
      "rating",
      "tags",
      "discountPrice",
      "viewIn",
      "ProductStatus",
      "stock",
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
    // product.imagesUrl = newImageUrls;
    // await product.save();
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
        "-userId, -ProductStatus, -createdAt, -updatedAt -number_of_sales"
      )
      .populate("rating", "finfinalRating");
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
      .find({ ProductStatus: "published" })
      .select(
        "-createdAt, -updatedAt, -ProductStatus, -userId -number_of_sales"
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
    const total = await products.countDocuments({ ProductStatus: "published" });
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
    const product = await products.findById(id);
    if (!product) {
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
    const deleted = await products.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
      });
    }
    // const review = await reviews.deleteOne({ productId: id });
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
      error: error,
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
    // try {
    //   await redis.set(cacheKey, JSON.stringify(filterproduct), 'EX', 1800);
    // } catch (redisError) {
    //   console.error(redisError);
    // }
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
      error: error,
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
      error: error,
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
      error: error,
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
      error: error,
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
      error: error,
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
    const allCarts = await carts
      .find({ userId: req.user._id })
      .populate("productId", "name stock_qunatity")
      .populate("userId", "firstname lastname")
      .exec();

    const uniqueCartIds = await carts.find({userId: req.user._id});
    const totalUniqueCarts = uniqueCartIds.length;

    // const totalItems = await carts
    // .find({ userId: req.user._id }).countDocuments();
    // if (!allCarts || allCarts.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "cats are empty",
    //     error: "Not Found",
    //   });
    // }
    // try {
    //   await redis.set(cacheKey, JSON.stringify(allCarts), 'EX', 43200);
    // } catch (redisError) {
    //   console.error(redisError);
    // }
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
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
      });
    }

    const isCartExist = await carts
      .findOne({ $and: [{ productId: id }, { userId: req.user._id }] })
      .populate("productId", "name")
      .exec();
    if (!isCartExist) {
      if (!req.user._id) {
        return res.status(401).json({
          success: false,
          message: "session expired , please login",
          error: "Bad Request",
        });
      }
      if(product.stock_qunatity === 0 || !product.stock_qunatity ){
        return res.status(404).json({
          success: false,
          messsage: "Product out of stock",
          error: "Not Found"
        })
      }

      if(quantity > product.stock_qunatity || !product.stock_qunatity){
        return res.status(404).json({
          success: false,
          message: `product limit exceeded!! only ${product.stock_qunatity} items left`,
          error: "product stock exceeded"
        })
      }
      await carts.create({
        cartImages: product.imagesUrl,
        quantity: quantity,
        userId: req.user._id,
        productId: product._id,
        discountedPrice: product.discountPrice,
        final_price: product.discountPrice * quantity,
      });
      return res.status(200).json({
        success: true,
        message: "product added to cart successfully",
      });
    }
    if (req.user._id.toString() !== isCartExist.userId.toString()) {
      return res.status(401).json({
        success: false,
        message: "you are not authorized",
        error: "Bad Request",
      });
    }
    const final_quantity = (isCartExist.quantity += quantity);
    if(final_quantity > product.stock_qunatity || !product.stock_qunatity){
      return res.status(404).json({
        successs: false,
        message: `product stock limit exceeded!!  only ${product.stock_qunatity} items left `
      })
    }
    const price = isCartExist.quantity * product.discountPrice;
    // isCartExist.final_price = isCartExist.quantity * product.discountPrice;
    const cartUpdate = await carts.findByIdAndUpdate(
      isCartExist._id,
      {
        $set: {
          quantity: final_quantity,
          final_price: price,
        },
      },
      {
        new: true,
      }
    );
    if (!cartUpdate) {
      return res.status(401).json({
        success: false,
        message: "Error in Cart updation",
        error: "Not Found",
      });
    }
    // await isCartExist.save();
    // await isCartExist.save();
    const data = (await cartUpdate.populate("userId", "firstname")).populate('productId', "stock_quantity", "name");
    return res.status(200).json({
      success: true,
      message: " cart quantity updated successfully",
      data: data,
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
    const cart = await carts.findById(id).populate("productId", "name").exec();
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
    const update = await carts
      .findOne({ $and : [{ _id: id },{ userId: req.user._id }] })
      .populate("productId", "name", "stock_qunatity")
      .exec();
    if (!update) {
      return res.status(404).json({
        success: false,
        message: "cart not found",
        error: "Not Found",
      });
    }
    const product = await products.findById(update.productId);
    if(!product){
      return res.status(404).json({
        success: false,
        message: "product not Found",
        error: "Not Found"
      })
    }

    if(quantity > product.stock_qunatity || !product.stock_qunatity){
      return res.status(402).json({
        success: false,
        message: `product limit exceeded!! only ${product.stock_qunatity} items left`,
        error: "Stock limit exceeded"
      })
    }
    // update.quantity = quantity;
    const price = quantity * update.discountedPrice;
    // update.final_price = quantity * update.discountedPrice;
    const updateCart = await carts.findByIdAndUpdate(
      id,
      {
        $set : {
          quantity: quantity,
          final_price: price
        },
      },
      {
        new: true
      }
    ).populate('productId', 'name')
    if(!updateCart){
      return res.status(404).json({
        success: false,
        message: "Cart not updated",
        error: "update action failed"
      })
    }
    return res.status(200).json({
      success: true,
      message: "cart updated successfully",
      data: updateCart,
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
    const isUser = await carts.findOne({
      $and: [{ _id: id }, { userId: req.user._id }],
    });
    if (isUser.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
        error: "UnAuthorized",
      });
    }
    if (!isUser) {
      return res.status(404).json({
        success: false,
        message: "cart not found",
        error: "Not Found",
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
