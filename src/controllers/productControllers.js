const carts = require("../models/cartschema.js");
const ProductMatrix = require("../models/productmatrixschema.js");
const fabrics = require("../models/fabricschema.js");
const { default: mongoose } = require("mongoose");
const reviews = require("../models/reviewschema.js");
const products = require("../models/productschema.js");
const categories = require("../models/categoriesschema.js");
const { deleteOldImages } = require("../middlewares/S3_bucket.js");

//✅✅✅✅✅✅✅✅✅✅✅  Products  ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

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

    if (
      !name ||
      !description ||
      !viewIn ||
      !ProductStatus ||
      !tags ||
      !stock ||
      !fabric ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "all fields are required",
        error: "Bad Request",
      });
    }
    //validate fabric from the DB :
    const isValidFabric_response = await fabrics.findOne({
      fabric_name: fabric,
    });
    if (!isValidFabric_response) {
      return res.status(401).json({
        success: false,
        statuscode: 2,
        message: `${fabric} is not a valid value`,
        error: "Bad Request",
      });
    }
    //validate category from the DB :
    const isValidCategory_response = await categories.findOne({
      categery_name: category,
    });
    if (!isValidCategory_response) {
      return res.status(401).json({
        success: false,
        statuscode: 3,
        message: `${category} is not a valid value`,
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
          statuscode: 4,
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
        statuscode: 5,
        message: "Invalid viewIn value(s)",
        error: "Allowed values: " + Array.from(allowedViews).join(", "),
      });
    }
    //splitting tags and storing in an array :
    const tagArray = tags.split(",").map((tag) => tag.trim().toLowerCase());

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 6,
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
      statuscode: 7,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//update product Product :
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
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

    if (
      req.body.viewIn &&
      typeof req.body.viewIn === "string" &&
      !allowedViews.includes(req.body.viewIn.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: `Invalid view type. Allowed values are: ${allowedViews.join(
          ", "
        )}`,
        error: "Bad Request",
      });
    }

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

    const updatedproduct_response = await products.findByIdAndUpdate(
      id,
      newData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedproduct_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "Product not found",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "Product updated successfully",
      data: updatedproduct_response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//updating the product Images :
exports.replaceAllImages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(401).json({
        success: false,
        statuscode: 2,
        message: "files should not be empty",
        error: "Bad Request",
      });
    }
    const product_response = await products.findById(id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "product not found",
        error: "Not Found",
      });
    }
    const oldImageKeys = product_response.imagesUrl.map((url) => {
      return decodeURIComponent(new URL(url).pathname).substring(1); // remove leading '/'
    });

    // const oldImageKeys = product.imagesUrl.map((url) => {
    //   const urlParts = url.split("/");
    //   return urlParts.slice(3).join("/");
    // });
    await deleteOldImages(oldImageKeys);
    // const newImageUrls = await uploadNewImages(req.files);
    const newImageUrls = req.files.map((file) => file.location);
    product_response.imagesUrl = newImageUrls;
    await product_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "product images updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server",
      error: error.message,
    });
  }
};

//replace images based on the provided index values
exports.replaceImages = async (req, res) => {
  try {
    const { Id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid ID",
        error: "Bad Request",
      });
    }

    const { indexes } = req.body;

    if (!indexes || !Array.isArray(indexes)) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "Indexes array is required in body",
        error: "Bad Request",
      });
    }

    if (!req.files || req.files.length !== indexes.length) {
      return res.status(400).json({
        success: false,
        statuscode: 3,
        message: `Number of images (${req.files?.length || 0}) must match number of indexes (${indexes.length})`,
        error: "Bad Request",
      });
    }

    const product_response = await products.findById(Id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found",
      });
    }

    const oldImageKeys = [];

    // Step 1: Collect keys of old images to delete
    for (let i = 0; i < indexes.length; i++) {
      const index = parseInt(indexes[i]);

      if (index >= product_response.imagesUrl.length) continue;

      const oldUrl = product_response.imagesUrl[index];
      if (oldUrl) {
        const key = decodeURIComponent(new URL(oldUrl).pathname).substring(1);
        oldImageKeys.push(key);
      }
    }

    // Step 2: Delete old images from S3
    await deleteOldImages(oldImageKeys);

    // Step 3: Replace with new images directly in product_response.imagesUrl
    for (let i = 0; i < indexes.length; i++) {
      const index = parseInt(indexes[i]);
      if (index >= product_response.imagesUrl.length) continue;

      product_response.imagesUrl[index] = req.files[i].location; // assuming Multer-S3
    }

    await product_response.save();

    return res.status(200).json({
      success: true,
      message: "Images replaced successfully",
      updatedImages: product_response.imagesUrl,
    });
  } catch (error) {
    console.error("Error replacing images:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//adding new images to the exsiting images :
exports.addImagesToProduct = async (req, res) => {
  try {
    const { Id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(Id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid product ID",
        error: "Bad Request",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "No images uploaded",
        error: "Bad Request",
      });
    }

    const product_response = await products.findById(Id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found",
      });
    }

    // Extract new image URLs
    const newImageUrls = req.files.map(file => file.location); // for multer-s3
    product_response.imagesUrl.push(...newImageUrls);

    // Save updated product
    await product_response.save();

    return res.status(200).json({
      success: true,
      message: "Images added successfully",
      updatedImages: product_response.imagesUrl,
    });
  } catch (error) {
    console.error("Error adding images:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//delete a single image : 
exports.deleteSingleImage = async (req, res) => {
  try {
    const { Id } = req.params;
    const { index } = req.body;

    if (!mongoose.Types.ObjectId.isValid(Id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
        statuscode: 1,
        error: "Bad Request",
      });
    }
 
    if (index === undefined || isNaN(parseInt(index))) {
      return res.status(400).json({
        success: false,
        message: "Valid image index is required",
        statuscode: 2,
        error: "Bad Request",
      });
    }

    const product = await products.findById(Id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        statuscode: 3,
        error: "Not Found",
      });
    }

    const imgIndex = parseInt(index);

    if (imgIndex < 0 || imgIndex >= product.imagesUrl.length) {
      return res.status(400).json({
        success: false,
        message: "Index out of bounds",
        statuscode: 4,
        error: "Bad Request",
      });
    }

    const imageToDelete = product.imagesUrl[imgIndex];
    const imageKey = decodeURIComponent(new URL(imageToDelete).pathname).substring(1);

    // Delete from S3
    try {
      await deleteOldImages([imageKey]);
    } catch (s3Error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete image from S3",
        error: s3Error.message,
        statuscode: 5,
      });
    }

    // Remove the image directly from the array
    product.imagesUrl.splice(imgIndex, 1);

    // Save updated product
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Image at index ${imgIndex} deleted successfully`,
      updatedImages: product.imagesUrl,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
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
      .populate("product_Matrix")
      .exec();
    // .populate("rating", "finfinalRating");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found",
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
      .populate({
        path: "product_Matrix",
      })
      .skip(skip)
      .limit(limit)
      .exec();
    if (allproducts.length === 0 || !allproducts) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        messsage: "products not found",
      });
    }
    const total = await products.countDocuments({ ProductStatus: "published" });
    if (!total) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "Count not Found",
        error: "Database error",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 3,
      page,
      data: allproducts,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
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
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    const isproduct_response = await products.findById(id);
    if (!isproduct_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "product not available",
        errror: "Not Found",
      });
    }
    const oldImageKeys = (isproduct_response.imagesUrl || []).map((url) => {
      const urlParts = url.split("/");
      return urlParts.slice(3).join("/");
    });
    await deleteOldImages(oldImageKeys);
    //delete the meta data of that product :
    await ProductMatrix.deleteMany({ productId: id });
    const isSingleCategory = await products.find({
      categery_name: isproduct_response.category,
    });
    const isSingleFabric = await products.find({
      categery_name: isproduct_response.fabric,
    });
    if (isSingleCategory.length === 1) {
      await categories.deleteOne({
        categery_name: isproduct_response.category,
      });
    }
    if (isSingleFabric.length === 1) {
      await fabrics.deleteOne({ fabric_name: isproduct_response.fabric });
    }
    await reviews.deleteOne({ productId: id });
    const product_response = await products.findByIdAndDelete(id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "product not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//❌❌❌❌❌❌❌❌❌❌  ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌

//get catogeries, size and fabric :
exports.getFilterNames = async (req, res) => {
  try {
    const uniquecategories_response = await categories.find();
    if (!uniquecategories_response) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "categories are empty",
        error: "Not Found",
      });
    }
    const uniquesizes_response = await ProductMatrix.distinct("size");
    if (!uniquesizes_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "sizes are empty",
        error: "Not Found",
      });
    }

    if (!uniquesizes_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "sizes are empty",
        error: "Not Found",
      });
    }
    const uniquefabrics = await products.distinct("fabric");
    if (!uniquefabrics) {
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "fabrics are empty",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 5,
      catogeries: uniquecategories,
      size: uniquesizes,
      fabric: uniquefabrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.filterProducts = async (req, res) => {
  try {
    const { category, stock, fabric, price, size, discount } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const matchProduct = {};
    const matchMatrix = {};

    if (category) matchProduct.category = category;
    if (stock) matchProduct.stock = stock;
    if (fabric) matchProduct.fabric = fabric;

    // Price range (e.g., price=100_500)
    if (price) {
      const [min, max] = price.split("_").map(Number);
      matchMatrix.selling_price = {};
      if (!isNaN(min)) matchMatrix.selling_price.$gte = min;
      if (!isNaN(max)) matchMatrix.selling_price.$lte = max;
    }

    // Size
    if (size) {
      matchMatrix.size = size;
    }

    // Discount range (e.g., discount=10_50)
    if (discount) {
      const [min, max] = discount.split("_").map(Number);
      matchMatrix.discount = {};
      if (!isNaN(min)) matchMatrix.discount.$gte = min;
      if (!isNaN(max)) matchMatrix.discount.$lte = max;
    }

    // First get the count of all matching products
    const countAggregate = await products.aggregate([
      { $match: matchProduct },
      {
        $lookup: {
          from: "productmatrixes",
          localField: "product_Matrix",
          foreignField: "_id",
          as: "matrixDetails",
        },
      },
      {
        $addFields: {
          filteredMatrix: {
            $filter: {
              input: "$matrixDetails",
              as: "matrix",
              cond: {
                $and: [
                  ...(matchMatrix.size
                    ? [{ $eq: ["$$matrix.size", matchMatrix.size] }]
                    : []),
                  ...(matchMatrix.selling_price?.$gte
                    ? [
                        {
                          $gte: [
                            "$$matrix.selling_price",
                            matchMatrix.selling_price.$gte,
                          ],
                        },
                      ]
                    : []),
                  ...(matchMatrix.selling_price?.$lte
                    ? [
                        {
                          $lte: [
                            "$$matrix.selling_price",
                            matchMatrix.selling_price.$lte,
                          ],
                        },
                      ]
                    : []),
                  ...(matchMatrix.discount
                    ? [
                        {
                          $gte: [
                            "$$matrix.discount",
                            matchMatrix.discount.$gte || 0,
                          ],
                        },
                        {
                          $lte: [
                            "$$matrix.discount",
                            matchMatrix.discount.$lte || 100,
                          ],
                        },
                      ]
                    : []),
                ].filter(Boolean), // Remove any undefined conditions
              },
            },
          },
        },
      },
      {
        $match: {
          "filteredMatrix.0": { $exists: true },
        },
      },
      { $count: "total" },
    ]);

    const total = countAggregate[0]?.total || 0;

    // Then get the paginated results
    const filterProducts_response = await products.aggregate([
      { $match: matchProduct },
      {
        $lookup: {
          from: "productmatrixes",
          localField: "product_Matrix",
          foreignField: "_id",
          as: "matrixDetails",
        },
      },
      {
        $addFields: {
          product_Matrix: {
            $filter: {
              input: "$matrixDetails",
              as: "matrix",
              cond: {
                $and: [
                  ...(matchMatrix.size
                    ? [{ $eq: ["$$matrix.size", matchMatrix.size] }]
                    : []),
                  ...(matchMatrix.selling_price?.$gte
                    ? [
                        {
                          $gte: [
                            "$$matrix.selling_price",
                            matchMatrix.selling_price.$gte,
                          ],
                        },
                      ]
                    : []),
                  ...(matchMatrix.selling_price?.$lte
                    ? [
                        {
                          $lte: [
                            "$$matrix.selling_price",
                            matchMatrix.selling_price.$lte,
                          ],
                        },
                      ]
                    : []),
                  ...(matchMatrix.discount
                    ? [
                        {
                          $gte: [
                            "$$matrix.discount",
                            matchMatrix.discount.$gte || 0,
                          ],
                        },
                        {
                          $lte: [
                            "$$matrix.discount",
                            matchMatrix.discount.$lte || 100,
                          ],
                        },
                      ]
                    : []),
                ].filter(Boolean),
              },
            },
          },
        },
      },
      {
        $match: {
          "product_Matrix.0": { $exists: true },
        },
      },
      {
        $project: {
          matrixDetails: 0,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      statuscode: 2,
      products: filterProducts_response,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// exports.filterProducts = async (req, res) => {
//   try {
//     const { categories, price, size, fabric, stock } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Build filters for base product fields
//     const productMatch = {};
//     if (categories) {
//       productMatch.category = { $regex: categories, $options: "i" };
//     }
//     if (fabric) {
//       productMatch.fabric = fabric;
//     }
//     if (stock) {
//       productMatch.stock = stock;
//     }

//     // Build filters for matrix (variants like price and size)
//     const matrixFilter = [];
//     if (price) {
//       const [min, max] = price.split("_").map(Number);
//       if (!isNaN(min)) {
//         matrixFilter.push({ $gte: ["$$matrix.selling_price", min] });
//       }
//       if (!isNaN(max)) {
//         matrixFilter.push({ $lte: ["$$matrix.selling_price", max] });
//       }
//     }
//     if (size) {
//       matrixFilter.push({ $eq: ["$$matrix.size", size] });
//     }

//     // Aggregation pipeline
//     const productsData = await products.aggregate([
//       { $match: productMatch },
//       {
//         $lookup: {
//           from: "productmatrices",
//           localField: "product_Matrix",
//           foreignField: "_id",
//           as: "matrixDetails",
//         },
//       },
//       {
//         $addFields: {
//           matchingMatrix: {
//             $filter: {
//               input: "$matrixDetails",
//               as: "matrix",
//               cond: {
//                 $and:
//                   matrixFilter.length > 0
//                     ? matrixFilter
//                     : [{ $ne: ["$$matrix._id", null] }],
//               },
//             },
//           },
//         },
//       },
//       {
//         $match: {
//           "matchingMatrix.0": { $exists: true },
//         },
//       },
//       {
//         $facet: {
//           paginatedResults: [
//             { $skip: skip },
//             { $limit: limit },
//             {
//               $project: {
//                 name: 1,
//                 imagesUrl: 1,
//                 category: 1,
//                 fabric: 1,
//                 stock: 1,
//                 matchingMatrix: 1,
//               },
//             },
//           ],
//           totalCount: [{ $count: "total" }],
//         },
//       },
//     ]);

//     const result = productsData[0];
//     const productsList = result.paginatedResults;
//     const total = result.totalCount.length > 0 ? result.totalCount[0].total : 0;

//     if (!productsList || productsList.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No matching products found.",
//         totalProducts: 0,
//         products: [],
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Filtered products fetched successfully",
//       page,
//       totalProducts: total,
//       totalPages: Math.ceil(total / limit),
//       products: productsList,
//     });
//   } catch (error) {
//     console.error("Filter error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

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
      .populate({
        path: "product_Matrix",
      })
      .skip(skip)
      .limit(limit)
      .exec();
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
    const newCollections = await products
      .find({
        viewIn: { $in: ["new_collection", "all"] },
      })
      .populate({
        path: "product_Matrix",
      })
      .exec();
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
    const trendingCollections = await products
      .find({
        viewIn: { $in: ["trending", "all"] },
      })
      .populate({
        path: "product_Matrix",
      })
      .exec();
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
    const bestsellers = await products
      .find({
        viewIn: { $in: ["best_seller", "all"] },
      })
      .populate({
        path: "product_Matrix",
      })
      .exec();
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

//search products - name
// search products - name (case-sensitive)
exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q || "";
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex chars

    const output_response = await products
      .find({
        $or: [
          { name: { $regex: escapedQuery, $options: "i" } }, // removed $options: "i" for case-sensitive match
        ],
      })
      .populate({
        path: "product_Matrix",
      })
      .exec();

    if (!output_response || output_response.length === 0) {
      return res.status(404).json({
        success: false,
        message: "products not found",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "search products received successfully",
      data: output_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//*****************        PRODUCT CART ROUTES               ***********************/

// ✅✅✅✅✅✅✅✅✅✅  carts  ✅✅✅✅✅✅✅✅✅✅✅✅

//view all carts :
exports.viewAllCarts = async (req, res) => {
  try {
    const allCarts = await carts
      .find({ userId: req.user._id })
      .populate("userId")
      .populate("productId")
      .exec();

    const uniqueCartIds = await carts.find({ userId: req.user._id });
    const totalUniqueCarts = uniqueCartIds.length;

    return res.status(200).json({
      succcess: true,
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

    const productMatrix = await ProductMatrix.findOne({
      $and: [{ productId: id }, { size: size }],
    });
    if (!productMatrix) {
      return res.status(404).json({
        success: false,
        message: "product matrix not found",
        error: "Not Found",
      });
    }

    const isCartExist = await carts.findOne({
      $and: [{ productId: id }, { userId: req.user._id }, { size: size }],
    });
    if (!isCartExist) {
      if (quantity > productMatrix.stock || !productMatrix.stock) {
        return res.status(401).json({
          success: false,
          message: `only ${productMatrix.stock} items left in ${size} size`,
          error: "Bad Request",
        });
      }
      const cart_response = await carts.create({
        cartImages: product.imagesUrl,
        quantity: quantity,
        size: size,
        userId: req.user._id,
        productId: product._id,
        selling_price: productMatrix.selling_price,
      });
      if (!cart_response) {
        return res.status(400).json({
          success: false,
          statuscode: 1,
          message: "unable to create the product",
          error: "DataBase Error",
        });
      }
      return res.status(200).json({
        success: true,
        message: "product added to cart successfully",
      });
    }
    const final_quantity = (isCartExist.quantity += quantity);
    if (final_quantity > productMatrix.stock || !productMatrix.stock) {
      return res.status(401).json({
        success: false,
        message: `only ${productMatrix.stock} items left in ${size} size`,
        error: "Bad Request",
      });
    }
    const cartUpdate = await carts.findByIdAndUpdate(isCartExist._id);
    cartUpdate.quantity = final_quantity;
    await cartUpdate.save();
    return res.status(200).json({
      success: true,
      message: " cart quantity updated successfully",
      data: cartUpdate,
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
      .populate("productId")
      .populate("userId")
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
    const { quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid cart ID",
        error: "Bad Request",
      });
    }
    const isCart = await carts
      .findOne({
        $and: [{ _id: id }, { userId: req.user._id }],
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
    const Matrix = await ProductMatrix.findOne({
      $and: [{ productId: product._id }, { size: isCart.size }],
    });
    if (!Matrix) {
      return res.status(404).json({
        success: false,
        message: "Pricing not available",
        error: "Not Found",
      });
    }
    if (quantity > Matrix.stock || !Matrix.stock) {
      return res.status(402).json({
        success: false,
        message: `only ${Matrix.stock} items left in ${size} size`,
        error: "Stock limit exceeded",
      });
    }

    isCart.quantity = quantity;
    await isCart.save();
    const data = await isCart.populate("productId");

    return res.status(200).json({
      success: true,
      message: "cart updated successfully",
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

// exports.createProductMatrix = async (req, res) => {
//   try {
//     const {id} = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(401).json({
//         success: false,
//         message: "invalid id",
//         error: "UnAuthorized",
//       });
//     }
//     const { original_price, selling_price, size, stock } = req.body;

//     if (!original_price || !selling_price || !size || !stock) {
//       return res.status(401).json({
//         success: false,
//         message: "All fields are required",
//         error: "Bad Request",
//       });
//     }

//     const product = await products.findById(id);
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//         error: "Not Found",
//       });
//     }

//     if (original_price < selling_price || original_price === undefined || selling_price === undefined) {
//       return res.status(401).json({
//         success: false,
//         message: "selling price can not be grater than original price",
//         error: "UnAuthorized",
//       });
//     }

//     const isAlreadyMatrix = await ProductMatrix.findOne({
//     $and: [{ productId: id },{ size: size }]
//   });
//     if (isAlreadyMatrix) {
//       return res.status(401).json({
//         success: false,
//         message: "product matrix already exist",
//         error: "Already exist",
//       });
//     }

//     const matrix = await ProductMatrix.create({
//       productId: id,
//       original_price,
//       selling_price,
//       size,
//       stock,
//     });
//     product.product_Matrix = matrix._id;
//     await product.save();
//     return res.status(200).json({
//       success: true,
//       message: "product matrix created successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

exports.createProductMatrix = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID",
        error: "Unauthorized",
      });
    }

    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found",
      });
    }

    const matrices = req.body;

    if (!Array.isArray(matrices) || matrices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array",
        error: "Bad Request",
      });
    }

    // const createdMatrices = [];

    for (const matrix of matrices) {
      const { original_price, selling_price, size, stock } = matrix;

      if (
        original_price === undefined ||
        selling_price === undefined ||
        !size ||
        stock === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required in each matrix",
          error: "Bad Request",
        });
      }
      if (original_price < selling_price) {
        return res.status(400).json({
          success: false,
          message: "Selling price cannot be greater than original price",
          error: "Bad Request",
        });
      }

      const isAlreadyMatrix = await ProductMatrix.findOne({
        productId: id,
        size: size,
      });

      if (isAlreadyMatrix) {
        return res.status(409).json({
          success: false,
          message: `Product matrix already exists for size "${size}"`,
          error: "Already exist",
        });
        // continue;
      }

      const newMatrix = await ProductMatrix.create({
        productId: id,
        original_price: Number(original_price),
        selling_price: Number(selling_price),
        size,
        stock: Number(stock),
      });

      // createdMatrices.push(newMatrix._id);
      product.product_Matrix.push(newMatrix._id);
    }
    await product.save();

    // product.product_Matrix = createdMatrices;
    // product.product_Matrix.push(...createdMatrices);
    // await product.save();

    const data = await product.populate("product_Matrix");
    return res.status(200).json({
      success: true,
      message: "Product matrices created successfully",
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

//update product matrix :
exports.updateProductMatrix = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Id",
        error: "Invalid",
      });
    }
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not Found",
        error: "Not Found",
      });
    }

    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty updates array",
      });
    }

    const allowedFields = ["original_price", "selling_price", "stock"];
    const results = [];

    for (const updateItem of updates) {
      const { id, ...data } = updateItem;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        results.push({ id, success: false, message: "Invalid ID" });
        continue;
      }

      const matrix = await ProductMatrix.findById(id);
      if (!matrix) {
        results.push({
          id,
          success: false,
          message: "Product matrix not found",
        });
        continue;
      }

      const product = await products.findById(matrix.productId);
      if (!product) {
        results.push({ id, success: false, message: "Product not found" });
        continue;
      }

      const updateData = {};
      let valid = true;

      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      if (
        updateData.original_price !== undefined &&
        updateData.selling_price !== undefined &&
        updateData.selling_price > updateData.original_price
      ) {
        results.push({
          id,
          success: false,
          message: "Selling price cannot be greater than original price",
        });
        continue;
      }

      const updatedMatrix = await ProductMatrix.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      results.push({
        id,
        success: true,
        message: "Product matrix updated",
        updated: updatedMatrix,
      });

      // Update all carts with this productId to reflect new prices
      const updatedCarts = await carts.updateMany(
        {
          productId: id,
          size: matrix.size,
        },
        {
          $set: {
            selling_price: matrix.selling_price,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "pricing updated successfully",
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//read product_matrix :
exports.getProductMatrixById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invaid ID",
        error: "Bad Request",
      });
    }
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: true,
        message: "Product not found",
        error: "Not Found",
      });
    }
    const matrix = await ProductMatrix.find({ productId: id });
    if (!matrix || matrix.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product matrix not found",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "product matrix retrieved successfully",
      matrix,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//delete product_matrix :
exports.deleteProductMatrix = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: true,
        message: "Invalid ID",
        error: "Not Found",
      });
    }

    const matrix_response = await ProductMatrix.findById(id);
    if (!matrix_response) {
      return res.status(404).json({
        success: true,
        message: "product matrix not found",
        error: "Bad Request",
      });
    }

    const product_response = await products.findById(matrix_response.productId);
    if (!product_response) {
      return res.status(404).json({
        success: true,
        statuscode: 3,
        message: "product not found",
        error: "Not Found",
      });
    }

    const deleted_response = await ProductMatrix.findByIdAndDelete(id);
    if (!deleted_response) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "pricing not deleted",
        error: "Database Error",
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 2,
      message: "product matrix deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ❌❌❌❌❌❌❌❌❌❌ Rating  ❌❌❌❌❌❌❌❌❌❌

//get rating of a product id :
// exports.getRatingById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid product ID format",
//       });
//     }
//     const product = await products.findById(id);
//     if (!product) {
//       return res.status(401).json({
//         success: false,
//         message: "product is no longer available",
//       });
//     }
//     const rate = await reviews.findOne({ productId: id });
//     return res.status(200).json({
//       success: true,
//       message: "review retrieved successfully",
//       rate,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Intenal Server Error",
//       error: error.message,
//     });
//   }
// };

//get all ratings of a product :
exports.getallReviewsByProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid Product ID",
        message: "Bad Request",
      });
    }
    const allreviews_response = await reviews
      .find({ productId: id })
      .sort({ createdAt: -1 })
      .populate("userId", "firstname lastname")
      .limit(limit)
      .skip(skip)
      .exec();

    if (!allreviews_response.length) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "No reviews found for this product",
      });
    }

    const total = allreviews_response.length;

    return res.status(200).json({
      success: true,
      statuscode: 3,
      page,
      totalPages: Math.ceil(total / limit),
      count: reviews.length,
      allreviews_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Error while fetching reviews",
      error: error.message,
    });
  }
};

//rating a product :
exports.createReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    const { message, rating } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "productId, userId and rating are required",
      });
    }

    if (!req.user._id) {
      return res.status(401).json({
        success: false,
        statuscode: 2,
        message: "please Login",
        error: "Not Authorized",
      });
    }

    const product_response = await products.findById(id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "Product not found",
        error: "Not Found",
      });
    }

    const review_response = await reviews.create({
      productId: id,
      userId: req.user._id,
      message,
      rating,
    });
    if (!review_response) {
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "unable to create the review",
        error: "Database error",
      });
    }

    return res.status(201).json({
      success: true,
      statuscode: 5,
      message: "Review posted successfully",
      data: review_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Error while posting review",
      error: error.message,
    });
  }
};

//get a single rating of a product :
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid product ID",
        error: "Bad Request",
      });
    }

    const product_response = await products.findById(id);
    if (!product_response) {
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "product not found",
        error: "Not Found",
      });
    }

    // Fetch reviews
    const allreview_response = await reviews
      .find({ productId: id })
      .sort({ createdAt: -1 })
      .lean();

    if (!allreview_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "reviews are empty",
        error: "Not Found",
      });
    }
    // Calculate average rating
    const aggregation = await reviews.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (!aggregation || aggregation.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "Cannot get product review",
        error: "No reviews found",
      });
    }

    const avgRating = aggregation[0]?.averageRating || 0;
    const totalRatings = aggregation[0]?.totalRatings || 0;
    product_response.rating = Number(avgRating.toFixed(1));
    await product_response.save();

    return res.status(200).json({
      success: true,
      statuscode: 5,
      count: reviews.length,
      averageRating: Number(avgRating.toFixed(1)),
      totalRatings,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Error while fetching reviews",
      error: error.message,
    });
  }
};
