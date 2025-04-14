const users = require("../models/userschema.js");
const posts = require("../models/productschema.js");
const toAddress = require("../models/addressschema.js");
const queries = require("../models/contactschema.js");
const { sendEmail } = require("../utils/sendEmail.js");
const { generateUserToken } = require("../middlewares/authUser.js");
const reviews = require('../models/reviews.js');
const {
  conformSignup,
  forgetPassword,
} = require("../utils/emailTemplates.js");
const { default: mongoose } = require("mongoose");

//set password after google oauth signup :
exports.setNewPassword = async(req, res) => {
  try {
    const { id } = req.params;
    const { newpassword } = req.body;
    if (!newpassword) {
      return res.status(400).json({
        error: 'password is required'
      })
    }
    const update = await users.findById(id);
     // ✅ Check if user exists
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
exports.signUp = async(req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    const existed = await users.findOne({
      $or: [{ email: email }],
    });

    if (existed) {
      return res.status(401).json({
        error : "email already exist, try another"
      })
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
exports.resend = async(req, res) => {
  try {
    const { userId } = req.body;
    const user = await users.findByIdAndUpdate(userId, {
      expirytime: Date.now() + 30 * 60 * 1000,
    });
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
exports.verify = async(req, res) => {
  try {
    const { verificationKey } = req.query;
    //decode the encoded email
    const decodedId = Buffer.from(verificationKey, "base64").toString("utf-8");
    const User = await users.findById(decodedId);
    //timer for the account activation
    if (Date.now() > User.jwtExpiry || User.jwtExpiry === undefined){
      return res.status(401).json({
        error: "session expired"
      })
    }
    User.status = "active";
    User.jwtExpiry = undefined;
    await User.save();
    return res.status(200).json({
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
exports.signIn = async(req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: "all fileds are required"
      })
    }
    const user = await users
      .findOne({
        email: email,
      })
      .select("+password");
    if (!user) {
      return res.status(401).json({
        error: "Incorrect Email"
      })
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error : "password doesn't match"
      })
    }
    const token  = generateUserToken(user);
    user.jwtExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    await user.save();
    return res.status(200).json({
      success : true,
      message : 'login successfully',
      JWTtoken : token,
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
exports.getById = async(req, res) => {
  const user = await users.findById(req.user._id);
  return res.status(200).json({
    success: true,
    user,
  });
};

//forget password :
exports.forgetPassword = async(req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: "email is reqiured"
      })
    }
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "user doesn't exist",
      })
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
exports.setPassword = async(req, res) => {
  try {
    const {email, newpassword} = req.body;
    if(!email || !newpassword){
      return res.status(400).json({
        error: "All fields are required",
      });
    }
    const user = await users.findOne({ email });
    user.password = newpassword;
    await user.save();
    return res.status(200).json({
      success: true,
      message : "new password updated , please login",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server Error",
      error: error, 
    })
  }
}

// reset the password using old password :
exports.changePassword = async(req, res) => {
  try {
    const { oldpassword, newpassword } = req.body;
    if (!oldpassword || !newpassword) {
      return res.status(400).json({
        error: "all fields are required"
      });
    }
    const user = await users.findById(req.user._id).select("+password");
    const isPassword = user.comparePassword(oldpassword);
    if (!isPassword) {
      return res.status(401).json({
        error: "incorrect password"
      });
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
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//update user profile using ID :
exports.update = async(req, res) => {
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

//list all posts of a user :
exports.myProducts = async(req, res) => {
  try {
    const id = req.user._id;
    const products = await posts
      .find({ id })
      .populate("userId", "username firstname lastname email")
      .exec();
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

// user sign out :
exports.signOut = async(req, res) => {
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
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//deleting user account :
exports.deleteUser = async(req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start transaction
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        error: "password is required"
      })
    }
    const user = await users.findById(req.user._id).select("+password");
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        error: "incorrect password",
      })
    }

    const deleted = await users
      .deleteOne({ _id: req.user._id })
      .session("session");
    if (deleted.deletedCount === 0) {
      return res.status(404).json({
        error: "user not found",
      })
    }
    await queries.deleteMany({ _id: req.user._id }).session("session");
    await posts.deleteMany({ _id: req.user._id }).session("session");
    await toAddress.deleteMany({ _id: req.user._id }).session("session");
    await session.commitTransaction();
  } catch (error) {
    session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  } finally {
    session.endSession();
  }
};

//get all products : 
exports.getAllProducts = async(req, res) =>{
  try {
    const products = await posts.find({});
    return res.status(200).json({
      success : true,
      products
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message : 'Internal Server Error',
      error : error,
    })
  }
}

//search for products : ( NAN )
exports.filterProducts = async(req, res) => {
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
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//rating a product : 
exports.ratingProduct = async (req, res) => {
  try {
    const { id } = req.params; // product ID, not review document _id
    const { rating, reviewMessage } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid rating (1-5)",
      });
    }

    // Search by productId, not _id of review doc
    let rate = await reviews.findOne({ productId: id });

    if (!rate) {
      // Create new review doc for product
      rate = await reviews.create({
        productId: id,
        userId: [req.user._id],
        [`r${rating}`]: {
          data: {
            messages: reviewMessage ? [reviewMessage] : [],
            count: 1,
          }
        },
        finalRating: rating,
      });
    } else {
      // Check if user has already rated
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
      rate[ratingKey].data.messages.push(reviewMessage || "");
      rate[ratingKey].data.count += 1;

      // Recalculate average rating
      const totalScore = [1, 2, 3, 4, 5].reduce((sum, r) => {
        const count = rate[`r${r}`]?.data?.count || 0;
        return sum + (r * count);
      }, 0);

      const totalCount = [1, 2, 3, 4, 5].reduce((sum, r) => {
        return sum + (rate[`r${r}`]?.data?.count || 0);
      }, 0);

      rate.finalRating = totalCount > 0
        ? Math.round((totalScore / totalCount) * 10) / 10
        : 0;
    }

    await rate.save();

    return res.status(200).json({
      success: true,
      message: "Review added successfully",
      rate,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};

   
//*********************     DELIVERY ADDRESS:      *******************/

exports.addAddress = async(req, res) => {
  try {
    const productId = req.params.id;
    const { country, firstname, lastname, phone, address, city, state } =
      req.body;
    const addressList = await toAddress.create({
      userId: req.user._id,
      productId: productId,
      email: req.user.email,
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
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

exports.updateAddress = async(req, res) => {
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
      success: true,
      message: "updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

exports.getAddress = async(req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID format",
      });
    }
    const address = await toAddress.findById(id);
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

exports.deleteAddress = async(req, res) => {
  try {
    const { addressId } = req.params;
    await toAddress.findByIdAndDelete(addressId);
    return res.status(200).json({
      success: true,
      message: "address Deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

exports.viewAllAddresses = async(req, res) => {
  try {
    const alladdresses = await toAddress.find({ userId: req.user._id });
    return res.status(200).json({
      success: true,
      alladdresses,
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

exports.contactUs = async(req, res) => {
  try {
    const { firstname, lastname, email, phone, message } = req.body;
    if (!message || message === null) {
      return res.status(400).json({
        error: "message is required"
      });
    }
    if(!req.user){
      const userContactForm = await queries.create({
        firstname: firstname, 
        lastname: lastname, 
        email: email, 
        phone: phone,
        message,
      });
      await userContactForm.save();
    }else if(req.user){
      const userContactForm = await queries.create({
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
