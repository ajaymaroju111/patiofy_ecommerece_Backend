const users = require("../models/userschema.js");
const posts = require("../models/productschema.js");
const toAddress = require("../models/addressschema.js");
const Contacts = require("../models/contactschema.js");
const CatchAsync = require("../middlewares/CatchAsync.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const { sendEmail } = require("../utils/sendEmail.js");
const { generateCookie } = require("../middlewares/authUser.js");
const {
  conformSignup,
  forgetPassword,
  forgetUsername,
} = require("../utils/emailTemplates.js");

//account signup for user :
exports.signUp = CatchAsync(async (req, res, next) => {
  try {
    const { firstname, lastname, username, email, phone, password } = req.body;
    const existed = await users.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existed) {
      if (existed.username === username) {
        return next(
          new ErrorHandler("username already taken, try another", 401)
        );
      }
      return next(new ErrorHandler("email is already exist", 401));
    }
    if (!req.file) {
      return next(new ErrorHandler("profile photo is required", 401));
    }
    const User = await users.create({
      avatar: {
        name: req.file.originalname,
        img: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      },
      firstname,
      lastname,
      username,
      email,
      phone,
      password,
    });
    await User.save();
    const encodedId = Buffer.from(User._id, "utf-8").toString("base64");
    await sendEmail({
      to: User.email,
      subject: "Account verification",
      text: conformSignup(User.username, encodedId),
    });
    User.expirytime = Date.now() + 30*60*1000;
    await User.save();
    console.log(encodedId);
    return res.status(200).json({
      message: "verification has been send to the email , please verify",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//ressnd verification link to the user : 
exports.resend = CatchAsync( async(req, res, next) =>{
  try {
    const userId = req.body;
    const User = await users.findByIdAndUpdate(userId, {expirytime : Date.now()+30*60*1000});
    const encodedId = Buffer.from(User._id, "utf-8").toString("base64");
    await sendEmail({
      to: User.email,
      subject: "Account verification",
      text: conformSignup(User.username, encodedId),
    });
    User.expirytime = Date.now() + 30*60*1000;
    await User.save();
    console.log(encodedId);
    return res.status(200).json({
      success : true,
      message : "link send to the email successfully",
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error : 'Internal Server Error'
    })
  }
})

//user account verification :
exports.verify = CatchAsync(async (req, res, next) => {
  try {
    const { verificationKey } = req.query;
    //decode the encoded email
    const decodedId = Buffer.from(verificationKey, "base64").toString(
      "utf-8"
    );
    const User = await users.findById(decodedId);
    //timer for the account activation
    if (Date.now() > User.expirytime) {
      return next(new ErrorHandler("Time expired, please register", 401));
    }
    User.status = "active";
    User.expirytime = undefined;
    await User.save();
    return res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//user sign in
exports.signIn = CatchAsync(async (req, res, next) => {
  try {
    const { userOrEmail, password } = req.body;
    if (!userOrEmail || password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const User = await users
      .findOne({
        $or: [{ username: userOrEmail }, { email: userOrEmail }],
      })
      .select("+password");
    const isValidPassword = await User.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "password doesnot match" });
    }
    await generateCookie(User);
    User.jwtExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await User.save();
    return res.status(200).json({
      success: true,
      message: "login successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//get user by ID :
exports.getById = CatchAsync(async (req, res, next) => {
  const user = await users.findById(req.params.id);
  return res.status(200).json({
    sucess: true,
    user,
  });
});

//forget username :
exports.frogetUsername = CatchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(401).json({ errror: " Internal Server Error" });
    }
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: " Incorrect Email " });
    }
    const fullname = `${user.firstname} + ${user.lastname}`;
    await sendEmail({
      to: req.User.email,
      subject: "forget Username request",
      text: forgetUsername(fullname, user.username),
    });
    return res.status.json({
      success: true,
      message: "reset password link sent to the email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: " Internal Sever Error " });
  }
});

//forget password :
exports.forgetPassword = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: "all fields are required" });
    }
    const user = await users.findOne({
      $and: [{ username }, { email }],
    });
    if (!user) {
      if (user !== username) {
        return res.status(401).json({ error: " Incorrect Username" });
      }
      return res.status(401).json({ error: "incorrect email" });
    }
    await sendEmail({
      to: req.User.email,
      subject: "forget password link",
      text: forgetPassword(req.User.username),
    });
    return res.status.json({
      success: true,
      message: "reset password link sent to the email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: " Internal Server Error " });
  }
};

// reset the password using old password :
exports.resetPassword = async (req, res) => {
  try {
    const { oldpassword, newpassword } = req.body;
    if (!oldpassword || !newpassword) {
      return res.status(400).json({ error: "all fields are required" });
    }
    const user = await users.findById(req.User._id).select("+password");
    const isPassword = user.comparePassword(oldpassword);
    if (!isPassword) {
      return res.status(401).json({ message: "password doesnot match" });
    }
    user.password = newpassword;
    await user.save();
    res.clearCookie("token", {
      httpOnly: true,
      secure: true, // Use only in HTTPS
      sameSite: "Strict",
    });
    return res
      .status(200)
      .json({ message: "password updated successfully, Please Login" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//update user profile using ID :
exports.update = async (req, res) => {
  try {
    const { firstname, lastname, username, email } = req.body;
    const updatedData = {
      firstname,
      lastname,
      username,
      email,
    };
    const userExist = await users.findOne({
      $or: [{ username }, { password }],
    });
    if (userExist && userExist._id.toString() === req.User._id.toString()) {
      if (userExist.username === username) {
        return res.status(401).json({ error: "username not available" });
      }
      return res.status(401).json({ error: "email is already taken" });
    }
    if (req.body.avatar !== "") {
      const user = await users.findById(req.User._id);
      updatedData.avatar = req.files;
    }
    await users.findByIdAndUpdate(req.user._id, updatedData, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({
      Success: true,
      message: "profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//list all posts of a user :
exports.myProducts = async (req, res) => {
  try {
    const id = req.User._id;
    const products = await posts
      .find({ id })
      .populate("userId", "username firstname lastname email")
      .exec();
    return res.status(200).json({ products });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//submit contact form :
exports.contactForm = async (req, res) => {
  try {
    const { firstname, lastname, phone, message } = req.body;
    if (!firstname || !lastname || !phone || !message) {
      return res.status(401).json({ error: "All fields are required" });
    }
    const userContactForm = await Contacts.create({
      userId: req.user._id,
      firstname,
      lastname,
      phone,
      message,
    });
    await userContactForm.save();
    return res.status(200).json({
      success: true,
      message: "contact form submitted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// user sign out :
exports.signOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: true,
    });
    return res.status(200).json({
      success: true,
      message: "user logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//deleting user account :
exports.deleteUser = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(401).json({ message: "password is required" });
    }
    const isPasswordMatch = req.User.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    await users.findByIdAndDelete(req.User._id);
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: " Ineternal Server Error" });
  }
};

//search for products : ( NAN )
exports.filterProducts = async (req, res) => {
  try {
    const { name, price, size, fabric } = req.query;
    let filter = {};
    //initializing the filter condition :
    if (name) {
      filter.name = { $regex: name, $options: "i" };
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
    const products = await posts.aggregate([
      { $match: filter },
      { $sort: { price: 1 } },
      { $project: { name: 1, price: 1, size: 1, fabric: 1 } },
    ]);
    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//*********************   DELIVERY ADDRESS:    ************************ */

exports.addAddress = CatchAsync(async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { country, firstname, lastname, phone, address, city, state } =
      req.body;
    const addressList = await toAddress.create({
      userId: req.User._id,
      productId: productId,
      email: req.User.email,
      phone: phone,
      Shipping_Adderss: {
        country: country,
        firstname: firstname,
        lastname: lastname,
        address: address,
        city: city,
        state: state,
      },
    });
    await addressList.save();
    return res.status(200).json({
      success: true,
      message: "address added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ Server: "Internal Server Error" });
  }
});

exports.updateAddress = CatchAsync(async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { country, firstname, lastname, phone, address, city, state } =
      req.body;
    const newData = {
      country,
      firstname,
      lastname,
      phone,
      address,
      city,
      state,
    };
    const updateAdd = await toAddress.findOneAndUpdate({ productId }, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });
    await updateAdd.save();
    return res.status(200).json({
      success : true,
      message : "updated successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.getAddress = CatchAsync(async(req, res, next) =>{
  try {
    const {addressId} = req.params;
    const address = toAddress.findById(addressId);
    return res.status(200).json({
      success : true,
      address,
    })
  } catch (error) {
    console.log(error);
    return res.status.json({
      error : 'Internal Server Error'
    });
  }
});

exports.deleteAddress = CatchAsync(async(req, res, next) =>{
  try {
    const {addressId} = req.params;
    await toAddress.findByIdAndDelete(addressId);
    return res.status(200).json({
      success : true,
      message: 'address Deleted'
    })
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      error : 'Internal Server Error'
    })
  }
});

exports.viewAllAddresses = CatchAsync(async(req , res , next) =>{
  try {
    const all = await toAddress.find({ userId: req.User._id});
    return res.status(200).json({
      success: true,
      all
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error : "Internal Server Error",
    });
  }
});

//********************   Submitting Contact Form :  ********************** */

exports.contactUs = CatchAsync(async (req, res, next) => {
  try {
    const { message } = req.body;
    const contactUs = await Contacts.create({
      userId: req.User._id,
      firstname: req.User.firstname,
      lastname: req.User.lastname,
      phone: req.User.phone,
      message: message,
    });
    await contactUs.save();
    return res.status(200).json({
      success: true,
      message: "submitted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
