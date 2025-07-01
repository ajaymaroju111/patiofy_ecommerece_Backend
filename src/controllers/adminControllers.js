const { default: mongoose } = require("mongoose");
const users = require("../models/userschema");
const products = require("../models/productschema");
const orders = require("../models/ordersschema.js");
const admins = require("../models/adminSchema.js");
const queryForm = require("../models/contactschema.js");
const { generateUserToken } = require("../middlewares/authUser.js");
const { deleteOldImages } = require("../middlewares/S3_bucket.js");

//✅✅✅✅✅✅✅✅✅ Admin Calls ✅✅✅✅✅✅✅✅✅✅✅

exports.adminSignup = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname || !lastname || !email || !password) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "All fields are required",
        error: "Bad Request",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "Invalid or missing email address",
      });
    }
    const existed_response = await admins.findOne({ email: email });
    if (existed_response) {
      return res.status(401).json({
        success: false,
        statuscode: 3,
        message: "email already exist, try another",
        error: "Bad Request",
      });
    }

    const User_response = await admins.create({
      firstname,
      lastname,
      email,
      password,
      status: "active",
    });
    if (!User_response) {
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "unable to create account, please contact Patiofy Team",
        error: "Database error",
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 5,
      message: "Admin account created successfully",
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

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "All fileds are required",
        error: "Bad Request",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "Invalid or missing email address",
      });
    }

    const user_response = await admins
      .findOne({
        email: email,
      })
      .select("password firstname lastname accountType");
    if (!user_response) {
      return res.status(401).json({
        success: false,
        statuscode: 3,
        message: "Incorrect Email",
        error: "Bad Request",
      });
    }
    if (user_response.accountType !== "admin") {
      return res.status(401).json({
        success: false,
        statuscode: 4,
        message: "You are not Authorized",
        error: "Not Authorized",
      });
    }
    if (user_response.password === undefined || !user_response.password) {
      return res.status(401).json({
        success: false,
        statuscode: 5,
        message: "password not set",
        error: "Bad Request",
      });
    }
    const isValidPassword = await user_response.comparePassword(password);
    if (!isValidPassword) {
      return res.status(402).json({
        success: false,
        statuscode: 6,
        message: "password doesn't match",
        error: "UnAuthorized",
      });
    }

    if (user_response.status === "inactive") {
      return res.status(402).json({
        success: false,
        statuscode: 7,
        message: "Account is Inactive please verify",
        error: "Bad Request",
      });
    }

    const token = generateUserToken(user_response);
    user_response.verify_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 8,
      message: "login successfully",
      JWTtoken: token,
      username: user_response.firstname + " " + user_response.lastname,
      userID: user_response._id,
      role: user_response.accountType,
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

exports.changePassword = async (req, res) => {
  try {
    const { oldpassword, newpassword } = req.body;
    if (!oldpassword || !newpassword) {
      return res.status(400).json({
        error: "all fields are required",
      });
    }
    const user_response = await admins
      .findById(req.user._id)
      .select("password");
    if (!user_response) {
      return res.status(404).json({
        success: false,
        message: "user does not exist",
      });
    }
    const isPassword_response = await user_response.comparePassword(
      oldpassword
    );
    if (!isPassword_response) {
      return res.status(401).json({
        success: false,
        message: "old password doesnot match",
        error: "Bad Request",
      });
    }
    user_response.password = newpassword;
    await user_response.save();
    return res.status(200).json({
      success: true,
      message: "password updated successfully, Please Login",
    });
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
    const allowed = ["firstname", "lastname", "phone"];
    const updatedData = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    });

    const updatedUser_response = await admins.findByIdAndUpdate(
      req.user._id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser_response) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "account not found or updated",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 2,
      message: "Profile updated successfully",
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

exports.uploadadminProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "profile image is required",
        error: "Bad Request",
      });
    }
    const profilePic = req.file.location;
    const user_response = await admins.findById(req.user._id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "User not Found",
        error: "Not Found",
      });
    }
    if (user_response.profileUrl) {
      const key = decodeURIComponent(
        new URL(user_response.profileUrl).pathname
      ).substring(1);
      await deleteOldImages(key);
    }
    user_response.profileUrl = profilePic;
    await user_response.save();
    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.adminGetById = async (req, res) => {
  try {
    const id = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid user ID format",
        error: "Bad Request",
      });
    }
    const user_response = await admins.findById(req.user._id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "user does not exist",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 3,
      message: "user retrieved successfully",
      user_response,
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

// ✅✅✅✅✅✅✅✅✅✅ Action on  User ✅✅✅✅✅✅✅✅✅✅✅

//set a user account inactive :
exports.setUserInactive = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        statuscode: 1,
        message: "Invalid Id",
        error: "Bad Request",
      });
    }
    const { blocked } = req.body;
    if (req.user._id === id) {
      return res.status(401).json({
        success: false,
        statuscode: 2,
        message: "you are not permitted",
        error: "Unauthorized",
      });
    }
    const user_response = await users.findById(id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "user not found",
        error: "Not Found",
      });
    }
    if (blocked === true) {
      if (user_response.status === "Blocked") {
        res.status(204).json({
          success: false,
          statuscode: 4,
          message: "account already in Blocked state",
          error: "No Content",
        });
      }
      (user_response.status = "Blocked"), await user_response.save();
      return res.status(200).json({
        success: true,
        statuscode: 5,
        message: "user account Blocked successfully",
      });
    }
    if (user_response.status !== "Blocked") {
      res.status(204).json({
        success: false,
        statuscode: 4,
        message: "account already in unblocked",
        error: "No Content",
      });
    }
    (user_response.status = "active"), await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 5,
      message: "user account unblocked successfully",
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

//view all users :
exports.viewAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
    const total = await users.countDocuments();
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

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        succcess: false,
        statuscode: 1,
        message: "invalid ID",
      });
    }
    const allowedFields = ["firstname", "lastname", "phone"];
    const updatedData = {};

    allowedFields.forEach((field) => {
      const value = req.body[field];
      if (value !== undefined) {
        if (
          field === "firstname" &&
          (typeof value !== "string" || value.trim() === "")
        ) {
          return res.status(400).json({
            succcess: false,
            statuscode: 2,
            message: "firstname is cannot be empty",
            error: "Bad Request",
          });
        }
        updatedData[field] = value;
      }
    });

    const user_response = await users.findById(id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "Account not found",
        error: "Not Found",
      });
    }
    const update_response = await users.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!update_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "error in user updation",
        error: "Database error",
      });
    }

    return res.status(200).json({
      success: true,
      message: "user updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Intenal Server Error",
      error: error.message,
    });
  }
};

exports.filterUsers = async (req, res) => {
  try {
    const { value } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!value || value.trim() === "") {
      return res.status(400).json({
        success: false,
        statuscode: 0,
        message: "Search value is required",
        error: "Bad Request",
      });
    }

    const searchValue = value.trim();
    const orConditions = [
      { firstname: { $regex: searchValue, $options: "i" } },
      { lastname: { $regex: searchValue, $options: "i" } },
      { email: { $regex: searchValue, $options: "i" } },
    ];

    // If value is a valid 10-digit number, check phone
    if (/^\d{10}$/.test(searchValue)) {
      orConditions.push({ phone: Number(searchValue) });
    }

    // Check if value matches one of the status enums
    const allowedStatuses = ["active", "inactive", "Blocked"];
    if (allowedStatuses.includes(searchValue.toLowerCase())) {
      orConditions.push({ status: searchValue.toLowerCase() });
    }

    const userList = await users
      .find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    if (!userList || userList.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "No users found matching the input",
        error: "Not Found",
      });
    }
    const total = await users.countDocuments();
    return res.status(200).json({
      success: true,
      page: page,
      totalPages: Math.ceil(total/limit),
      message: "Users fetched successfully",
      count: userList.length,
      data: userList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅✅✅✅✅✅✅✅✅✅ Products : ✅✅✅✅✅✅✅✅✅✅✅✅✅

//get all products fro the admin :
exports.getAllProductsForAdmim = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allproducts = await products
      .find()
      .populate({
        path: "product_Matrix",
      })
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
        statuscode: 1,
        message: "Invalid product ID format",
      });
    }

    const product_response = await products
      .findById(id)
      .populate("product_Matrix")
      .exec();
    if (!product_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "product not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 3,
      data: product_response,
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

//❌❌❌❌❌❌❌❌ Discount calls ❌❌❌❌❌❌❌❌

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

//✅✅✅✅✅✅✅✅✅ Action on Orders ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

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
    if (allorders.length === 0 || !allorders) {
      return res.status(404).json({
        success: true,
        message: "No current active orders",
      });
    }
    const total = await orders.countDocuments();
    res.status(200).json({
      success: true,
      page: page,
      totalPages: Math.ceil(total / limit),
      totalitems: total,
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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allorders = await orders
      .find()
      .populate("userId")
      .populate("productId")
      .limit(limit)
      .skip(skip)
      .sort({ _id: -1 })
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No Active orders found",
      });
    }
    const total = await orders.countDocuments();
    res.status(200).json({
      success: true,
      page: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
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
      .populate("userId")
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

exports.confirmCancelOrder = async (req, res) => {
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

    const { accept } = req.body;

    const order_response = await orders.findById(id);
    if (!order_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "order not found",
        error: "Not Found",
      });
    }

    if (order_response.status !== "requested_for_cancel") {
      return res.status(402).json({
        succcess: false,
        statuscode: 3,
        message: "user doesnot requested for cancel",
        error: "Not Authorized",
      });
    }

    if (accept === true) {
      order_response.status = "cancelled";
      await order_response.save();
      return res.status(200).json({
        success: false,
        statuscode: 4,
        message: "request accepted successfully",
      });
    }

    order_response.status = "confirmed";
    await order_response.save();

    return res.status(200).json({
      success: false,
      statuscode: 4,
      message: "request rejected successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Intenal Server Error",
      error: error.message,
    });
  }
};

exports.CancelOrder = async (req, res) => {
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

    const order_response = await orders.findById(id);
    if (!order_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "order not found",
        error: "Not Found",
      });
    }

    order_response.status = "cancelled";
    await order_response.save();

    return res.status(200).json({
      success: false,
      statuscode: 4,
      message: "order cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Intenal Server Error",
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

exports.searchOrders = async (req, res) => {
  try {
    const { value } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!value || value.trim() === "") {
      return res.status(400).json({
        success: false,
        statuscode: 0,
        message: "Search value is required",
        error: "Bad Request",
      });
    }

    const searchValue = value.trim();

    const orConditions = [
      { email: { $regex: searchValue, $options: "i" } },
      { orderId: { $regex: searchValue, $options: "i" } },
    ];

    // Check if numeric
    if (/^\d+$/.test(searchValue)) {
      orConditions.push({ phone: Number(searchValue) });
    }

    // Add enums only if input matches allowed values
    const allowedPaymentModes = ["online", "COD"];
    const allowedStatuses = [
      "in_progress",
      "confirmed",
      "shipped",
      "requested_for_cancel",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "pending",
    ];

    if (allowedPaymentModes.includes(searchValue.toLowerCase())) {
      orConditions.push({ payment_mode: searchValue.toLowerCase() });
    }

    if (allowedStatuses.includes(searchValue.toLowerCase())) {
      orConditions.push({ status: searchValue.toLowerCase() });
    }

    const ordersList_response = await orders
      .find({
        $or: orConditions,
      })
      .populate("productId")
      .populate("userId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    if (!ordersList_response || ordersList_response.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "No orders found matching the input",
        error: "Not Found",
      });
    }
    const total = await orders.countDocuments();
    return res.status(200).json({
      success: true,
      page: page,
      totalPages: Math.ceil(total/limit),
      message: "Orders fetched successfully",
      data: ordersList_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅✅✅✅✅✅✅✅✅ Action on User-Orders ✅✅✅✅✅✅✅✅✅✅

//getting user order by id :
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
    const { id } = req.params;
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

exports.searchUsingInvoiceNumber = async (req, res) => {
  try {
    const OrderInvoice = req.body;
    if (!OrderInvoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice is Required",
        error: "Bad Request",
      });
    }
    const allOrders = await orders.find({
      invoice: OrderInvoice,
    });

    if (!allOrders || allOrders.length === 0) {
      return res.status(400).json({
        succecss: false,
        message: "No Orders Found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Orders found successfully",
      allOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intenal Server Error",
      error: error.message,
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

// ✅✅✅✅✅✅✅✅✅ Contact Us ✅✅✅✅✅✅✅✅✅✅✅✅✅

exports.viewallContactUsRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const contactUsRequests_response = await queryForm
      .find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    if (
      !contactUsRequests_response ||
      contactUsRequests_response.length === 0
    ) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "Requests are empty",
        error: "Not Found",
      });
    }
    const total = contactUsRequests_response.length;
    return res.status(200).json({
      succcess: true,
      statuscode: 2,
      page,
      data: contactUsRequests_response,
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
