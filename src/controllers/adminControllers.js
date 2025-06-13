const { default: mongoose } = require("mongoose");
const users = require("../models/userschema");
const products = require("../models/productschema");
const orders = require("../models/ordersschema.js");
const admins = require("../models/adminSchema.js");

//✅✅✅✅✅✅✅✅✅ Admin Calls ✅✅✅✅✅✅✅✅✅✅✅

exports.adminSignup = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if(!firstname || !lastname || !email || !password){
      return res.status(401).json({
        success: false,
        message: 'All fields are required',
        error: "Bad Request",
      })
    }
    const existed = await admins.findOne({ email: email });
    if (existed) {
      return res.status(401).json({
        success: false,
        message: "email already exist, try another",
        error: "Bad Request",
      });
    }

    const User = await admins.create({
      firstname,
      lastname,
      email,
      password,
      status: "active"
    });

    return res.status(200).json({
      success: true,
      message: "Admin account created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fileds are required",
        error: "Bad Request",
      });
    }
    const user = await admins
      .findOne({
        email: email,
      })
      .select("password firstname lastname accountType");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect Email",
        error: "Bad Request",
      });
    }
    if (user.accountType !== "admin") {
      return res.status(401).json({
        success: false,
        message: "You are not Authorized",
        error: "Not Authorized",
      });
    }
    if (user.password === undefined || !user.password) {
      return res.status(401).json({
        success: false,
        message: "password not set",
        error: "Bad Request",
      });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(402).json({
        success: false,
        message: "password doesn't match",
        error: "UnAuthorized",
      });
    }

    if (user.status === "inactive") {
      return res.status(402).json({
        success: false,
        message: "Account is Inactive please verify",
        error: "Bad Request",
      });
    }
    const token = generateUserToken(user);
    user.jwtExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    await user.save();
    return res.status(200).json({
      success: true,
      message: "login successfully",
      JWTtoken: token,
      username: user.firstname + " " + user.lastname,
      userID: user._id,
      role: user.accountType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldpassword, newpassword } = req.body;
    if (!oldpassword || !newpassword) {
      return res.status(400).json({
        error: "all fields are required",
      });
    }
    const user = await admins.findById(req.user._id).select("password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user does not exist",
      });
    }
    const isPassword = await user.comparePassword(oldpassword);
    if (!isPassword) {
      return res.status(401).json({
        success: false,
        message: "incorrect password",
        error: "Bad Request",
      });
    }
    user.password = newpassword;
    await user.save();
    return res
      .status(204)
      .json({ message: "password updated successfully, Please Login" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.adminProfileUpdate = async (req, res) => {
  try {
    const allowed = ["firstname", "lastname", "phone", "Address"];
    const updatedData = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    });
    const updatedUser = await admins.findByIdAndUpdate(
      req.user._id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.uploadadminProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(401).json({
        success: false,
        message: "profile image is required",
        error: "Bad Request",
      });
    }
    const profilePic = req.file.location;
    const user = await admins.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not Found",
        error: "Not Found",
      });
    }
    if (user.profileUrl) {
      const key = decodeURIComponent(new URL(url).pathname).substring(1);
      await deleteOldImages(key);
    }
    user.profileUrl = profilePic;
    await user.save();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ✅✅✅✅✅✅✅✅✅✅ Action on  User ✅✅✅✅✅✅✅✅✅✅✅

//set a user account inactive:
exports.setUserInactive = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Id",
      });
    }
    if (req.user._id === id) {
      return res.status(401).json({
        success: false,
        message: "toy are not permitted",
        error: "Unauthorized",
      });
    }
    const user = await users.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
    if (user.status === "Blocked") {
      res.status(204).json({
        success: false,
        message: "account already in Blocked state",
        error: "No Content",
      });
    }
    (user.status = "Blocked"), await user.save();
    return res.status(200).json({
      success: true,
      message: "user account set terminate successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all users:
exports.viewAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;
    const allusers = await users
      .find({ accountType: { $ne: "admin" } })
      .skip(skip)
      .limit(limit)
      .exec();
    if (!allusers || allusers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "products not found",
      });
    }
    const total = allusers.length;
    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      success: true,
      message: "users retrieved successfully",
      data: allusers,
    });
  } catch (error) {
    return res.status(500).json({
      success: fase,
      message: "Intenal Server Error",
      error: error.message,
    });
  }
};

// view a single user
exports.viewUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid ID",
      });
    }
    const user = await users
      .findById(id)
      .select("firstname lastname email -_id");
    if (!user) {
      return res.status(404).json({
        succecss: false,
        message: "user not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "user retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ✅✅✅✅✅✅✅✅✅✅ Products  ✅✅✅✅✅✅✅✅✅✅✅✅✅

//get all products fro the admin :
exports.getAllProductsForAdmim = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allproducts = await products.find().populate({
        path: "product_Matrix",
      }).skip(skip).limit(limit).exec();
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

//get the product by the id :
exports.getProductByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await products.findById(id).populate({
        path: "product_Matrix",
      });
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

//unpublish product :
exports.unPublishProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        error: "invalid object ID",
      });
    }
    const item = await products.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Not Found",
        error: "item not found",
      });
    }
    if ((item.ProductStatus = "unpublished")) {
      return res.status(204).json({
        success: true,
        message: "No Content",
        error: "product is already in unpublished mode",
      });
    }
    item.ProductStatus = "unpublished";
    await item.save();
    return res.status(200).json({
      success: true,
      message: "product set to unpublished successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//set product status to be publish :
exports.publishProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        error: "invalid object ID",
      });
    }
    const item = await products.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Not Found",
        error: "item not found",
      });
    }
    if ((item.ProductStatus = "published")) {
      return res.status(204).json({
        success: true,
        message: "No Content",
        error: "product is already in published mode",
      });
    }
    item.ProductStatus = "published";
    await item.save();
    return res.status(200).json({
      success: true,
      message: "product set to published successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.setViewinProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { viewin } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
        error: "Bad Request",
      });
    }
    if (
      viewin !== "new_collection" ||
      viewin !== "best_seller" ||
      viewin !== "both"
    ) {
      return res.status(401).json({
        success: false,
        message: "invalid enum format",
        error: "Bad Request",
      });
    }
    const item = await products.findById(id).select("name, viewIn");
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found",
      });
    }
    item.viewIn = viewin;
    await item.save();
    return res.status(200).json({
      success: true,
      message: "product viewas field updated successfully",
      data: item,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ❌❌❌❌❌❌❌❌ Discount calls ❌❌❌❌❌❌❌❌

//set a discount for a product:
exports.setDiscountOnProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { setdiscount } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID",
      });
    }
    const product = await products
      .findById(id)
      .select("name price size fabric discount discountPrice");
    if (!product) {
      return res.status(404).json({
        succcess: false,
        message: "product not found",
      });
    }
    product.discount = setdiscount;
    await product.save();
    return res.status(200).json({
      succcess: true,
      message: "Discount updated successfully",
      current_discount: product.discount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//remove discount for a product:
exports.removeDiscountOnProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID",
      });
    }
    const product = await products
      .findById(id)
      .select("name price size fabric discount discountPrice");
    if (!product) {
      return res.status(404).json({
        succcess: false,
        message: "product not found",
      });
    }
    product.discount = 0;
    await product.save();
    return res.status(200).json({
      succcess: true,
      message: "Discount updated successfully",
      data: product,
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

// ✅✅✅✅✅✅✅✅✅ Action on Orders ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

//view all inprogess orders :
exports.viewAllRecentOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allorders = await orders
      .find({ createdAt: { $gte: thirtyDaysAgo } })
      .populate("userId")
      .populate("productId")
      .limit(limit)
      .skip(skip)
      .sort({ _id: -1 })
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No current active orders",
      });
    }
    res.status(200).json({
      success: true,
      totla_items: allorders.length,
      message: "recent orders are retrieved ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all refunded orders:
exports.viewAllRefundedOrders = async (req, res) => {
  try {
    const allorders = await orders
      .find({
        status: { $in: ["refunded"] },
      })
      .populate("userId")
      .populate("productId")
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No refunded orders ",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "refunded orders are retrieved successfully ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all users orders :
exports.viewAllUsersOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;

    const allorders = await orders
      .find()
      .populate("userId")
      .populate("productId")
      .limit(limit)
      .skip(skip)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No Active orders found",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totalPages: Math.ceil(allorders.length / limit),
      message: "all users orders retrieved successfully",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all cancel request :
exports.viewAllCancelRequestedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        status: { $in: ["requested_for_cancel"] },
      })
      .populate("userId",)
      .populate("productId")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "cancel requests Not found",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totlal_pages: Math.ceil(allorders.length / 10),
      message: "cancel request orders are retrieved ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all completed orders:
exports.viewAllPendingOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        status: { $in: ["pending"] },
      })
      .populate("userId")
      .populate("productId")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No completed  orders",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "completed orders are retrieved ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ✅✅✅✅✅✅✅✅✅ Action on User-Orders ✅✅✅✅✅✅✅✅✅✅

exports.getUserOrderById = async (req, res) => {
  try {
    const id = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Object ID",
        error: "Not Found",
      });
    }
    const userOrder = await orders
      .findById(id)
      .populate("userId")
      .populate("productId");
    if (!userOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not Found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "order retrieved successfully",
      data: userOrder,
    });
  } catch (error) {
    return res.status(500).json({
      succcess: false,
      message: "Internal Server",
      error: "error",
    });
  }
};

exports.updateUserOrderById = async (req, res) => {
  try {
    const id = req.params;
    const { quantity, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Object ID",
        error: "Not Found",
      });
    }
    const userOrder = await orders
      .findById(id)
      .populate("userId")
      .populate("productId");
    if (!userOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not Found",
        error: "Not Found",
      });
    }
    if (quantity) {
      const beforePrice = userOrder.final_cost;
      userOrder.quantity = quantity;
      userOrder.final_cost = quantity * userOrder.actual_price;
    }

    return res.status(200).json({
      success: true,
      message: "order retrieved successfully",
      data: userOrder,
    });
  } catch (error) {
    return res.status(500).json({
      succcess: false,
      message: "Internal Server",
      error: "error",
    });
  }
};

// ✅✅✅✅✅✅✅✅ Payments ✅✅✅✅✅✅✅✅✅✅

//view all payment completed orders:
exports.viewAllSuccessPaymentOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        payment_status: { $in: ["paid"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No payment completed orders",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: " payment completed orders are retrieved ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//view all payment incompleted orders:
exports.viewAllUnSuccessPaymentOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        payment_status: { $in: ["unpaid"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No unpaid payment orders",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "incompleted payment orders are retrieved ",
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
