const users = require("../models/userschema.js");
const products = require("../models/productschema.js");
const userAddresses = require("../models/addressschema.js");
const queryForm = require("../models/contactschema.js");
const { sendEmail } = require("../utils/sendEmail.js");
const { generateUserToken } = require("../middlewares/authUser.js");
const { conformSignup, forgetPassword } = require("../utils/emailTemplates.js");
const { default: mongoose } = require("mongoose");
const carts = require("../models/cartschema.js");
const orders = require("../models/ordersschema.js");

//set password after google oauth signup :
exports.setNewPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newpassword } = req.body;
    if (!newpassword) {
      return res.status(400).json({
        error: "password is required",
      });
    }
    const update = await users.findById(id);
    if (!update) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    update.password = newpassword;
    await update.save();
    return res.status(200).json({
      success: true,
      message: "password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//account signup for user :
exports.signUp = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    const existed = await users.findOne({
      $or: [{ email: email }],
    });

    if (existed) {
      return res.status(401).json({
        error: "email already exist, try another",
      });
    }
    const User = await users.create({
      firstname,
      lastname,
      email,
      password,
    });
    await User.save();
    return res.status(200).json({
      success: true,
      message: "verification has been send to the email, please verify",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//ressnd verification link to the user :
exports.resend = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
        error: "Bad Request",
      });
    }
    const user = await users.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
        error: "Not Found",
      });
    }
    const encodedId = Buffer.from(user._id, "utf-8").toString("base64");
    const fullname = user.firstname + " " + user.lastname;
    await sendEmail({
      to: user.email,
      subject: "Account verification",
      text: conformSignup(fullname, encodedId),
    });
    user.jwtExpiry = Date.now() + 30 * 60 * 1000;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "link send to the email successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//user account verification :
exports.verify = async (req, res) => {
  try {
    const { verificationKey } = req.query;
    //decode the encoded email
    const decodedId = Buffer.from(verificationKey, "base64").toString("utf-8");
    const User = await users.findById(decodedId);
    if (!User) {
      return res.status(404).json({
        success: false,
        message: "user does not exist",
      });
    }
    //timer for the account activation
    if (Date.now() > User.jwtExpiry || User.jwtExpiry === undefined) {
      return res.status(401).json({
        error: "session expired",
      });
    }
    User.status = "active";
    User.jwtExpiry = undefined;
    await User.save();
    return res.status(200).json({
      redirect: "http://147.97.93.20:3000/patiofy/auth/user/signin",
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//user sign in
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: "all fileds are required",
      });
    }
    const user = await users.findOne({
      email: email,
    });
    if (!user) {
      return res.status(401).json({
        error: "Incorrect Email",
      });
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "password doesn't match",
      });
    }
    const token = generateUserToken(user);
    user.jwtExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    await user.save();
    return res.status(200).json({
      success: true,
      message: "login successfully",
      username: user.firstname + " " + user.lastname,
      userID: user._id,
      JWTtoken: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
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
        message: "Invalid user ID format",
      });
    }
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Authentication Error",
      });
    }
    const user = await users
      .findById(req.user._id)
      .select("firstname lastname email -_id");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user does not exist",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//forget password :
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: "email is reqiured",
      });
    }
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "user doesn't exist",
      });
    }
    const fullname = user.firstname + " " + user.lastname;
    await sendEmail({
      to: email,
      subject: "forget password link",
      text: forgetPassword(fullname),
    });
    return res.status(200).json({
      success: true,
      message: "reset password link sent to the email",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//set a new password after forget password link :
exports.setPassword = async (req, res) => {
  try {
    const { email, newpassword } = req.body;
    if (!email || !newpassword) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: " incorrect email",
      });
    }
    user.password = newpassword;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "new password updated , please login",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server Error",
      error: error,
    });
  }
};

// reset the password using old password :
exports.changePassword = async (req, res) => {
  try {
    const { oldpassword, newpassword } = req.body;
    if (!oldpassword || !newpassword) {
      return res.status(400).json({
        error: "all fields are required",
      });
    }
    const user = await users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user does not exist",
      });
    }
    const isPassword = await user.comparePassword(oldpassword);
    if (!isPassword) {
      return res.status(401).json({
        error: "incorrect password",
      });
    }
    user.password = newpassword;
    await user.save();
    return res
      .status(200)
      .json({ message: "password updated successfully, Please Login" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//update user profile using ID :
exports.update = async (req, res) => {
  try {
    const { firstname, lastname } = req.body;

    const updatedData = {
      firstname,
      lastname,
    };
    const updatedUser = await users.findByIdAndUpdate(
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
      error: error,
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
    const myproducts = await products
      .find({ userId: id })
      .select("-_id -userId -createdAt -updatedAt -__v")
      .skip(skip)
      .limit(limit)
      .exec();
    if (!products) {
      return res.status(404).json({
        success: false,
        message: "products not found",
      });
    }
    const total = await products.countDocuments();
    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      data: myproducts,
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
      error: error,
    });
  }
};

//deleting user account :
exports.deleteUser = async (req, res) => {
  try {
    const id = req.user._id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "password is required" });
    }

    const user = await users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "incorrect password" });
    }

    const deleted = await users.deleteOne({ _id: id });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ error: "user not found" });
    }

    await queryForm.deleteMany({ userId: id });
    await products.deleteMany({ userId: id });
    await userAddresses.deleteMany({ userId: id });
    await orders.deleteMany({ userId: id });
    await carts.deleteMany({ userId: id });

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error", error });
  }
};

//*********************     DELIVERY ADDRESS:      *******************/

exports.addAddress = async (req, res) => {
  try {
    const { firstname, lastname, address, city, state, country } = req.body;
    await userAddresses.create({
      userId: req.user._id,
      firstname,
      lastname,
      address,
      city,
      state,
      country,
    });
    return res.status(200).json({
      success: true,
      message: "address added successfully",
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

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid Address ID",
        error: "Bad Request",
      });
    }
    const current = await userAddresses.findById(id);

    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    const updateData = {};
    // Merge nested Shipping_Adderss
    const shippingFields = [
      "firstname",
      "lastname",
      "address",
      "city",
      "state",
      "country",
    ];
    const shippingUpdate = { ...current._doc }; // existing values

    shippingFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        shippingUpdate[field] = req.body[field];
      }
    });

     updateData = shippingUpdate;

    const updated = await userAddresses.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updated,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID format",
      });
    }
    const address = await userAddresses.findById(id);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }
    return res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await userAddresses.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Address Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

exports.viewAllAddresses = async (req, res) => {
  try {
    const alladdresses = await userAddresses
      .find({ userId: req.user._id })
    if (!alladdresses) {
      return res.status(404).json({
        success: false,
        message: "user not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      currentpage: page,
      limit: limit,
      total: alladdresses.length,
      data: alladdresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//*********************   Submitting Contact Form :  ***********************/

exports.contactUs = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, message } = req.body;
    if (!message || message === null) {
      return res.status(400).json({
        error: "message is required",
      });
    }
    if (!req.user) {
      const userContactForm = await queryForm.create({
        firstname: firstname,
        lastname: lastname,
        email: email,
        phone: phone,
        message,
      });
      await userContactForm.save();
    } else if (req.user) {
      const userContactForm = await queryForm.create({
        userId: req.user._id,
        firstname: firstname || req.user.firstname,
        lastname: lastname || req.user.lastname,
        email: email || req.user.email,
        phone: phone,
        message,
      });
      await userContactForm.save();
    }
    return res.status(200).json({
      success: true,
      message: "query submitted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};
