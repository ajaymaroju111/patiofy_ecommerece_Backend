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

      if(existed_response.status === "inactive"){
        return res.status(401).json({
        success: false,
        statuscode: 4,
        message: "User already exist and user is not verified, please verify",
        error: "Bad Request",
      });
      }

      return res.status(401).json({
        success: false,
        statuscode: 5,
        message: "user already exist and verified, please login",
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
    user_response.verify_expiry = Date.now() + 30 * 60 * 1000;
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
      .select("password firstname lastname accountType");
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
    const user_response = await users
      .findById(id)
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
    const allowed = ["firstname", "lastname", "phone", "Address"];
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
      updatedUser,
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
      const key = decodeURIComponent(new URL(url).pathname).substring(1);
      await deleteOldImages(key);
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
    isDeafault,
    isShipping
  } = req.body;
  if (
    !firstname ||
    !lastname ||
    !address ||
    !city ||
    !state ||
    !country ||
    !house_number ||
    !landmark,
    !isShipping
  ) {
    return res.status(401).json({
      success: false,
      statuscode: 1,
      message: "all fields are required",
      error: "Bad Request",
    });
  }
  const total_addresses = await userAddresses.find({userId: req.user._id});
  if(total_addresses.length >= 3){
    return res.status(401).json({
      success: false,
      message: "Only three addresses are allowed for a user, limit exceeded",
      statuscode: 2,
      error: "Bad Request",
    })
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
    });

    if (!address_response) {
      return res.status(401).json({
        success: false,
        statuscode: 4,
        message: "Unable to create the table",
        error: "Bad Request",
      });
    }

    if (isDeafault === true) {
      const updateResult = await userAddresses.updateMany(
        { userId: req.user._id, isDeafault: true },
        { $set: { isDeafault: false } }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(404).json({
          success: false,
          statuscode: 5,
          message: "unable to change the default address",
          error: "Database error",
        });
      }

      // Now set the new address as default
      address_response.isDeafault = true;
      await address_response.save();
    }

    if (isShipping === true) {
      const updateResult = await userAddresses.updateMany(
        { userId: req.user._id, isShipping: true },
        { $set: { isShipping: false } }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(404).json({
          success: false,
          statuscode: 6,
          message: "unable to change the default address",
          error: "Database error",
        });
      }

      // Now set the new address as default
      address_response.isDeafault = true;
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid Address ID",
        error: "Bad Request",
      });
    }
    const address_response = await userAddresses.findOne(
      { _id: id },
      { userId: req.user._id }
    );

    if (!address_response) {
      return res.status(404).json({
        success: false,
        statuscode: 2,
        message: "Address not found",
      });
    }

    const updateData = {};
    // Merge nested Shipping_Adderss
    const shippingFields = [
      "firstname",
      "lastname",
      "address",
      "house_number",
      "landmark",
      "city",
      "state",
      "country",
      "isDeafault",
      "isShipping",
    ];

    shippingFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    //check for the shipping address should be unique : 
    if (updateData.isShipping !== undefined) {
      if (updateData.isShipping === true) {
        const updateResult = await userAddresses.updateMany(
          { userId: req.user._id, isShipping: true },
          { $set: { isShipping: false } }
        );

        if (updateResult.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            statuscode: 3,
            message: "unable to change the default address",
            error: "Database error",
          });
        }
      }
    }

    //check for the default address should be unique : 
    if (updateData.isDeafault !== undefined) {
      if (updateData.isDeafault === true) {
        const updateResult = await userAddresses.updateMany(
          { userId: req.user._id, isDeafault: true },
          { $set: { isDeafault: false } }
        );

        if (updateResult.modifiedCount === 0) {
          return res.status(404).json({
            success: false,
            statuscode: 4,
            message: "unable to change the default address",
            error: "Database error",
          });
        }
      }
    }

    const updated = await userAddresses.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        statuscode: 5,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      statuscode: 6,
      data: updated,
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
      $and: [{userId: req.user._id}, {_id: id}]
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
      $and: [{userId: req.user._id}, {_id: id}]
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
      currentpage: page,
      limit: limit,
      total: alladdresses_response.length,
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
    const { firstname, lastname, email, phone, message } = req.body;
    if (!message || message === null) {
      return res.status(400).json({
        success: false,
        statuscode: 1,
        error: "message is required",
      });
    }
    if (!req.user) {
      if (!firstname || !lastname || !email || !phone || !message) {
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
        phone: phone,
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
        phone: phone,
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
