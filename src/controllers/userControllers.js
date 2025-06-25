const users = require("../models/userschema.js");
const products = require("../models/productschema.js");
const userAddresses = require("../models/addressschema.js");
const queryForm = require("../models/contactschema.js");
const { sendEmail } = require("../utils/sendEmail.js");
const {
  generateUserToken,
  doubleEncrypt,
} = require("../middlewares/authUser.js");
const {
  conformSignup,
  forgetPassword,
  getSuccessMark,
  sessionExpired,
  userNotFound,
} = require("../utils/emailTemplates.js");
const { default: mongoose, mongo } = require("mongoose");
const carts = require("../models/cartschema.js");
const orders = require("../models/ordersschema.js");
const { deleteOldImages } = require("../middlewares/S3_bucket.js");
const categories = require("../models/categoriesschema.js");
const fabrics = require("../models/fabricschema.js");
const ProductMatrix = require("../models/productmatrixschema.js");

//set password after google oauth signup :
exports.setNewPassword = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(401).json({
      success: false,
      statuscode: 1,
      message: "Invalid ID",
      error: "Bad Request",
    });
  }
  const { newpassword } = req.body;
  if (!newpassword) {
    return res.status(400).json({
      success: false,
      statuscode: 2,
      message: "password is required",
      error: "Bad Request",
    });
  }
  try {
    const user_response = await users.findById(id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "User not found",
        error: "Not Found",
      });
    }
    user_response.password = newpassword;
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "password updated successfully",
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

//account signup for user :
exports.signUp = async (req, res) => {
  const { firstname, lastname, email, password, istermsandConditions } =
    req.body;

  if (!firstname || !lastname || !email || !password || !istermsandConditions) {
    return res.status(400).json({
      success: false,
      statuscode: 1,
      message: "All fields are required",
      error: "Bad Request",
    });
  }

  if (istermsandConditions === false) {
    return res.status(401).json({
      success: false,
      statuscode: 2,
      message: "terms and conditions should be accepted",
      error: "Bad Request",
    });
  }
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!regex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      statuscode: 3,
      message: "Invalid or missing email address",
      error: "Bad request",
    });
  }

  try {
    const existed_response = await users.findOne({ email: email });
    if (existed_response) {
      if (existed_response.status === "inactive") {
        return res.status(401).json({
          success: false,
          statuscode: 4,
          message:
            "Account already exist and user is not verified, please verify",
          error: "Bad Request",
        });
      }

      return res.status(401).json({
        success: false,
        statuscode: 5,
        message: "Account already exist and verified, please login",
        error: "Bad Request",
      });
    }
    const User_response = await users.create({
      firstname,
      lastname,
      email,
      password,
      isTermsAndConditions: istermsandConditions,
    });
    if (!User_response) {
      return res.status(402).json({
        success: false,
        statuscode: 6,
        message: "unable to create the user",
      });
    }
    return res.status(200).json({
      success: true,
      message:
        "A verification email has been sent. Please check your inbox to verify your email address.",
      statuscode: 7,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      statuscode: 500,
      error: error.message,
    });
  }
};

//ressnd verification link to the user :
exports.resend = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      statuscode: 1,
      message: "Email is required",
      error: "Bad Request",
    });
  }
  try {
    const user_response = await users.findOne({ email: email });
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "user not found",
        error: "Not Found",
      });
    }
    const encodedId = Buffer.from(user_response._id, "utf-8").toString(
      "base64"
    );
    const fullname = user_response.firstname + " " + user_response.lastname;
    await sendEmail({
      to: user_response.email,
      subject: "Account verification",
      text: conformSignup(fullname, encodedId),
    });
    user_response.verify_expiry = Date.now() + 24 * 60 * 60 * 1000;
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 3,
      message: "link send to the email successfully",
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

//user account verification :
exports.verify = async (req, res) => {
  const { verificationKey } = req.query;
  if (!verificationKey) {
    return res.status(401).json({
      success: false,
      statuscode: 5,
      message: "verification key is required",
      error: "Bad Request",
    });
  }
  try {
    const decodedId = Buffer.from(verificationKey, "base64").toString("utf-8");
    if (!decodedId) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "Authentication code not found",
        error: "Not Found",
      });
    }
    const User_respose = await users.findById(decodedId);
    if (!User_respose) {
      return res.status(404).json({
        suceess: false,
        statuscode: 2,
        message: "User not Found",
        error: "Not Found",
      });
    }
    //timer for the account activation
    if (
      Date.now() > User_respose.verify_expiry ||
      User_respose.verify_expiry === undefined
    ) {
      return res.status(401).json({
        success: false,
        statuscode: 3,
        message: "Time expired, Try again",
        error: "Bad Request",
      });
    }
    User_respose.status = "active";
    User_respose.verify_expiry = undefined;
    await User_respose.save();
    res.status(200).json({
      success: true,
      message: "Mail verified successfully",
      statuscode: 4,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      statuscode: 500,
      error: error.message,
    });
  }
};

//user sign in
exports.signIn = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      statuscode: 1,
      message: "all fileds are required",
      error: "Bad Request",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      statuscode: 2,
      message: "Invalid or missing email address",
    });
  }
  try {
    const user_respose = await users
      .findOne({
        email: email,
      })
      .select("password firstname lastname accountType phone email");
    if (!user_respose) {
      return res.status(401).json({
        success: false,
        statuscode: 3,
        message: "Incorrect Email",
        error: "Bad Request",
      });
    }

    if (user_respose.accountType !== "user") {
      return res.status(401).json({
        success: false,
        statuscode: 4,
        message: "You are not Authorized",
        error: "Not Authorized",
      });
    }

    if (user_respose.password === undefined || !user_respose.password) {
      return res.status(401).json({
        success: false,
        statuscode: 5,
        message: "password not set",
        error: "Bad Request",
      });
    }
    const isValidPassword = await user_respose.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        statuscode: 6,
        message: "password doesn't match",
        error: "Bad Request",
      });
    }

    if (user_respose.status === "inactive") {
      return res.status(402).json({
        success: false,
        statuscode: 7,
        message: "Account is Inactive please verify",
        error: "Bad Request",
      });
    }
    const token = generateUserToken(user_respose);
    user_respose.verify_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    await user_respose.save();
    return res.status(200).json({
      success: true,
      statuscode: 8,
      message: "login successfully",
      JWTtoken: token,
      username: user_respose.firstname + " " + user_respose.lastname,
      userID: user_respose._id,
      role: user_respose.accountType,
      user_email: user_respose.email,
      user_phone: user_respose.phone,
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

//get user by ID :
exports.getById = async (req, res) => {
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
    const user_response = await users.findById(id);
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

//forget password :
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is reqiured",
        statuscode: 1,
        error: "Bad Request",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing email address",
        statuscode: 2,
      });
    }
    const user_response = await users.findOne({ email });
    if (!user_response) {
      return res.status(404).json({
        success: false,
        message: "user doesn't found",
        statuscode: 3,
        error: "Bad Request",
      });
    }
    const fullname = user_response.firstname + " " + user_response.lastname;
    // const securedEmail = await doubleEncrypt(user.email);
    await sendEmail({
      to: email,
      subject: "forget password link",
      text: forgetPassword(fullname, user_response.email),
    });
    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "A password reset link has been sent to your email.",
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

//set a new password after forget password link :
exports.setPassword = async (req, res) => {
  try {
    const { email, newpassword } = req.body;
    if (!email || !newpassword) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "All fields are required",
        error: "Bad Request",
      });
    }
    const user_response = await users
      .findOne({ email })
      .select("password, _id");
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "user not found",
        error: "Not Found",
      });
    }
    user_response.password = newpassword;
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 3,
      message: "Your password has been updated. Please log in.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal server Error",
      error: error.message,
    });
  }
};

// reset the password using old password :
exports.changePassword = async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  if (!oldpassword || !newpassword) {
    return res.status(400).json({
      success: false,
      statuscode: 1,
      error: "all fields are required",
    });
  }
  try {
    const user_response = await users.findById(req.user._id).select("password");
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "user does not exist",
      });
    }
    const isPassword = await user_response.comparePassword(oldpassword);
    if (!isPassword) {
      return res.status(401).json({
        success: false,
        statuscode: 3,
        message: "incorrect password",
        error: "Bad Request",
      });
    }
    user_response.password = newpassword;
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "Password updated successfully. Please log in.",
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

//update user profile using ID :
exports.update = async (req, res) => {
  try {
    const allowed = ["firstname", "lastname", "phone"];
    const updatedData = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    });
    const updatedUser_response = await users.findByIdAndUpdate(
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
        message: "user not Found or not updated",
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 2,
      message: "Profile updated successfully",
      updatedUser_response,
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

//upload user profile :
exports.uploadUserProfilePic = async (req, res) => {
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
    const user_response = await users.findById(req.user._id);
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
      await deleteOldImages(key); // Ensure this is a valid async function
    }
    user_response.profileUrl = profilePic;
    await user_response.save();
    return res.status(200).json({
      success: true,
      statuscode: 3,
      message: "User profile updated successfully",
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

//list all products of a user :
exports.myProducts = async (req, res) => {
  try {
    const id = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const myproducts_respose = await products
      .find({ userId: id })
      .populate("product_Matrix")
      .skip(skip)
      .limit(limit)
      .exec();
    if (!myproducts_respose) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "No products found.",
        error: "Not Found",
      });
    }
    const total = await products.countDocuments();
    return res.status(200).json({
      success: true,
      statuscode: 2,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      data: myproducts_respose,
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

// user sign out :
exports.signOut = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "user logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//deleting user account :
exports.deleteUser = async (req, res) => {
  try {
    const id = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid ID",
        error: "Bad Request",
      });
    }
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        statuscode: 2,
        error: "password is required",
      });
    }

    const user_response = await users.findById(id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "user not found",
      });
    }

    const isPasswordMatch = await user_response.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        statuscode: 3,
        error: "incorrect password",
      });
    }

    const deleted_response = await users.deleteOne({ _id: id });
    if (deleted_response.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "user not found",
        error: "Not Found",
      });
    }

    await queryForm.deleteMany({ userId: id });
    await products.deleteMany({ userId: id });
    await userAddresses.deleteMany({ userId: id });
    await orders.deleteMany({ userId: id });
    await carts.deleteMany({ userId: id });

    res.status(200).json({
      success: true,
      statuscode: 5,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error,
    });
  }
};

//✅✅✅✅✅✅✅✅✅✅   DELIVERY ADDRESS: ✅✅✅✅✅✅✅✅✅✅✅✅✅

exports.addAddress = async (req, res) => {
  const {
    firstname,
    lastname,
    address,
    city,
    state,
    country,
    house_number,
    landmark,
    isDefault,
    isBilling,
    pincode,
  } = req.body;
  if (
    !firstname ||
    !lastname ||
    !address ||
    !city ||
    !state ||
    !country ||
    !house_number ||
    !landmark ||
    !pincode
  ) {
    return res.status(401).json({
      success: false,
      statuscode: 1,
      message: "all fields are required",
      error: "Bad Request",
    });
  }

  const total_addresses = await userAddresses.find({ userId: req.user._id });
  if (total_addresses.length >= 3) {
    return res.status(401).json({
      success: false,
      message: "Only three addresses are allowed for a user, limit exceeded",
      statuscode: 2,
      error: "Bad Request",
    });
  }
  try {
    const isExisted_response = await userAddresses.findOne({
      firstname: firstname,
      lastname: lastname,
      address: address,
      house_number: house_number,
      landmark: landmark,
      city: city,
      state: state,
      country: country,
      pincode: pincode,
    });

    if (isExisted_response) {
      return res.status(400).json({
        success: true,
        statuscode: 3,
        message: "Address already exist",
        error: "Bad Request",
      });
    }

    const address_response = await userAddresses.create({
      userId: req.user._id,
      firstname,
      lastname,
      address,
      house_number,
      landmark,
      city,
      state,
      country,
      pincode,
    });

    if (!address_response) {
      return res.status(401).json({
        success: false,
        statuscode: 4,
        message: "Unable to create the table",
        error: "Bad Request",
      });
    }

    if (isDefault === true) {
      const updateResult = await userAddresses.updateMany(
        { userId: req.user._id, isDefault: true },
        { $set: { isDefault: false } },
        { runValidators: true }
      );

      address_response.isDefault = true;
      await address_response.save();
    }

    // isBilling logic
    if (isBilling === true) {
      const updateResult = await userAddresses.updateMany(
        { userId: req.user._id, isBilling: true },
        { $set: { isBilling: false } }
      );

      address_response.isBilling = true;
      await address_response.save();
    }

    return res.status(200).json({
      success: true,
      statuscode: 7,
      message: "address added successfully",
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

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate address ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid Address ID",
        error: "Bad Request",
      });
    }

    // Check if address exists and belongs to the user
    const address_response = await userAddresses.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!address_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "Address not found or doesn't belong to user",
      });
    }

    const updateData = {};
    const shippingFields = [
      "firstname",
      "lastname",
      "address",
      "house_number",
      "landmark",
      "city",
      "state",
      "country",
      "isDefault", // Fixed typo here
      "isBilling",
      "pincode",
    ];

    // Build update object
    shippingFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle shipping address uniqueness
    if (updateData.isBilling === true) {
      await userAddresses.updateMany(
        { userId: req.user._id, isBilling: true, _id: { $ne: id } },
        { $set: { isBilling: false } }
      );
    }

    // Handle default address uniqueness
    if (updateData.isDefault === true) {
      // Fixed typo here
      await userAddresses.updateMany(
        { userId: req.user._id, isDefault: true, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    // Perform the update
    const updated = await userAddresses.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        statuscode: 5,
        message: "Address not found after update attempt",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      statuscode: 6,
      data: updated,
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "Invalid address ID format",
        error: "Bad Request",
      });
    }
    const address_response = await userAddresses.findOne({
      $and: [{ userId: req.user._id }, { _id: id }],
    });
    if (!address_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "Address not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "address retrieved successfully",
      address_response,
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

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const User_response = await userAddresses.findOne({
      $and: [{ userId: req.user._id }, { _id: id }],
    });
    if (!User_response) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "address not Found",
        error: "Not Found",
      });
    }

    const deleted_response = await userAddresses.findByIdAndDelete(id);
    if (!deleted_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "unable to delete the address",
      });
    }

    return res.status(200).json({
      success: true,
      statuscode: 4,
      message: "Address Deleted successfully",
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

exports.viewAllAddresses = async (req, res) => {
  try {
    const alladdresses_response = await userAddresses.find({
      userId: req.user._id,
    });
    if (!alladdresses_response || alladdresses_response.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "user not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      statuscode: 2,
      data: alladdresses_response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//*********************   Submitting Contact Form :  ***********************/

exports.contactUs = async (req, res) => {
  try {
    const { firstname, lastname, email, number, message } = req.body;
    if (!message || message === null) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        error: "message is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        statuscode: 3,
        message: "Invalid or missing email address",
        error: "Bad request",
      });
    }

    if (!req.user) {
      if (!firstname || !lastname || !email || !number || !message) {
        return res.status(400).json({
          success: false,
          statuscode: 2,
          message: "all fields are required",
          error: "Bad Request",
        });
      }
      const userContactForm_response = await queryForm.create({
        firstname: firstname,
        lastname: lastname,
        email: email,
        phone: number,
        message,
      });
      if (!userContactForm_response) {
        return res.status(401).json({
          success: false,
          statuscode: 3,
          message: "unable to send message, please try after sometime",
        });
      }
    } else if (req.user) {
      const userContactForm_response = await queryForm.create({
        userId: req.user._id,
        firstname: firstname || req.user.firstname,
        lastname: lastname || req.user.lastname,
        email: email || req.user.email,
        phone: number,
        message,
      });
      if (!userContactForm_response) {
        return res.status(401).json({
          success: false,
          statuscode: 4,
          message: "Unable send message, please try after sometime",
        });
      }
    }
    return res.status(200).json({
      success: true,
      statuscode: 2,
      message: "query submitted successfully",
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

// ✅✅✅✅✅✅✅✅ Displaying all names in the filter like catogeries :  ✅✅✅✅✅✅✅✅✅

exports.getallfilternames = async (req, res) => {
  try {
    const allcatogeries = await categories.find();
    if (!allcatogeries || allcatogeries.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 1,
        message: "categories not found",
        error: "Not Found",
      });
    }
    const allfabrics = await fabrics.find();
    if (!allfabrics || allfabrics.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "fabrics not found",
        error: "Not Found",
      });
    }

    const allSizes = await ProductMatrix.distinct("size");
    if (!allSizes || allSizes.length === 0) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "sizes not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "values retrieved successfully",
      allcatogeries,
      allSizes,
      allfabrics,
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
