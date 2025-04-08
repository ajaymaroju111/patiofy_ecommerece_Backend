const users = require("../models/userschema.js");
const posts = require("../models/productschema.js");
const toAddress = require("../models/addressschema.js");
const queries = require("../models/contactschema.js");
const CatchAsync = require("../middlewares/CatchAsync.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const { sendEmail } = require("../utils/sendEmail.js");
const { generateCookie } = require("../middlewares/authUser.js");
const {
  conformSignup,
  forgetPassword,
  forgetUsername,
} = require("../utils/emailTemplates.js");
const { default: mongoose } = require("mongoose");

//set password after google oauth signup : 
exports.setNewPassword = CatchAsync(async(req, res, next) => {
  try {
    const { password } = req.body;
    if(!password){
      return next(new ErrorHandler('password is required' , 401));
    }
    await users.findByIdAndUpdate(req.user._id, {password: password}, (err, user) =>{
      if(err){
        return next(new ErrorHandler('error in password updation', 402))
      }
      res.status(200).json({message : 'password updated successfully'});
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
})

//account signup for user :
exports.signUp = CatchAsync(async(req, res, next) => {
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
    return res.status(200).json({
      success : true,
      message: "verification has been send to the email, please verify",
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
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
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
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
    return res.status(200).json({ 
      success : true,
      message: "Account verified successfully", 
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//user sign in
exports.signIn = CatchAsync(async (req, res, next) => {
  try {
    const { userOrEmail, password } = req.body;
    if (!userOrEmail || !password) {
      return next(new ErrorHandler('All fileds are requiured', 401))
    }
    const user = await users
      .findOne({
        $or: [{ username: userOrEmail }, { email: userOrEmail }],
      })
      .select("+password");
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return next(new ErrorHandler('password doesnot match', 401))
    }
    await generateCookie(user, res, () => {
      return res.status(200).json({
        success: true,
        message: "Login successful",
      });
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//get user by ID :
exports.getById = CatchAsync(async (req, res, next) => {
    const user = await users.findById(req.user._id);
    return res.status(200).json({
      success: true,
      user,
    });
});

//forget username :
exports.forgetUsername = CatchAsync(async (req, res, next) => {
  try {
    const  {email}  = req.body;
    if (!email) {
      return next( new ErrorHandler('email is required', 401));
    }
    const user = await users.findOne({ email });
    if (!user) {
      return next(new ErrorHandler('user does not exist', 404))
    }
    const fullname = `${user.firstname}  ${user.lastname}`;
    await sendEmail({
      to: email,
      subject: "forget Username request",
      text: forgetUsername(fullname, user.username),
    });
    return res.status(200).json({
      success: true,
      message: "reset password link sent to the email",
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//forget password :
exports.forgetPassword = CatchAsync(async (req, res, next) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return next(new ErrorHandler('All fields are required'))
    }
    const user = await users.findOne({
      $and: [{ username }, { email }],
    });
    if (!user) {
      if (user !== username) {
        return next(new ErrorHandler('incorrect username', 401))
      }
      return next(new ErrorHandler('incorrect password',401));
    }
    await sendEmail({
      to: email,
      subject: "forget password link",
      text: forgetPassword(username),
    });
    return res.status(200).json({
      success: true,
      message: "reset password link sent to the email",
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

// reset the password using old password :
exports.resetPassword = CatchAsync(async (req, res, next) => {
  try {
    const { oldpassword, newpassword } = req.body;
    if (!oldpassword || !newpassword){
      return next(new ErrorHandler('All fields are required'));
    }
    const user = await users.findById(req.user._id).select("+password");
    const isPassword = user.comparePassword(oldpassword);
    if (!isPassword) {
      return next(new ErrorHandler('incorrect password', 401))
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
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//update user profile using ID :
exports.update = CatchAsync(async (req, res, next) => {
  try {
    const { firstname, lastname, username, phone } = req.body;

    const updatedData = {
      firstname,
      lastname,
      username,
      phone,
    };
    // Check if username or email is taken by another user
    const existingUser = await users.findOne({
      $or: [{ username }],
      _id: { $ne: req.user._id }, // Exclude current user
    });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email is already taken" });
      }
    }
    if (req.file) {
      updatedData.avatar = {
        name: req.file.originalname,
        img: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      };
    }
    const updatedUser = await users.findByIdAndUpdate(req.user._id, updatedData, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//list all posts of a user :
exports.myProducts = CatchAsync(async (req, res, next) => {
  try {
    const id = req.user._id;
    const products = await posts
      .find({ id })
      .populate("userId", "username firstname lastname email")
      .exec();
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

// user sign out :
exports.signOut = CatchAsync(async(req, res, next) => {
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
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//deleting user account :
exports.deleteUser = CatchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start transaction
  try {
    const { password } = req.body;
    if (!password) {
      return next(new ErrorHandler('Password is required', 401));
    }
    const user = await users.findById(req.user._id).select('+password');
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new ErrorHandler('incorrect password', 401));
    }

    const deleted = await users.deleteOne({_id: req.user._id}).session('session');
    if(deleted.deletedCount === 0){
      next(new ErrorHandler('User not Found', 404));
    }
    await queries.deleteMany({_id: req.user._id}).session('session');
    await posts.deleteMany({_id: req.user._id}).session('session');
    await toAddress.deleteMany({_id: req.user._id}).session('session');

    await session.commitTransaction();
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: true,
    });
  } catch (error) {
    session.abortTransaction();
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }finally{
    session.endSession();
  }
});

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
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
};

//*********************     DELIVERY ADDRESS:       ****************** */

exports.addAddress = CatchAsync(async (req, res, next) => {
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
      success : false,
      message : 'Internal Server Error',
      error : error
    });
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
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

exports.getAddress = CatchAsync(async (req, res, next) =>{
  try {
    const   {id}  = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID format",
      });
    }
    const address = await toAddress.findById(id);
    return res.status(200).json({
      success : true,
      address,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
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
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

exports.viewAllAddresses = CatchAsync(async(req , res , next) =>{
  try {
    const alladdresses = await toAddress.find({ userId: req.user._id});
    return res.status(200).json({
      success: true,
      alladdresses,
    })
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//*********************   Submitting Contact Form :  ********************** */

exports.contactUs = CatchAsync(async(req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return next(new ErrorHandler('message cannot be empty'));
    }
    const userContactForm = await queries.create({
      userId: req.user._id,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      phone: req.user.phone,
      message,
    });
    await userContactForm.save();
    return res.status(200).json({
      success: true,
      message: "query submitted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});
