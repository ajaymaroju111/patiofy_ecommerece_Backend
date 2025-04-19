const { default: mongoose } = require("mongoose");
const users = require("../models/userschema");
const products = require('../models/productschema')


///****************** User Management:  ***********************/

//set a user account inactive:
exports.setUserInactive = async() => {
  try {
    const { id } = req.params;
    if(mongoose.Types.ObjectId.isValid(id)){
      return res.status(401).json({
        success: false,
        message: "Invalid Id",
      })
    }
    const user = await users.findById( id );
    if(!user){
      return res.status(404).json({
        success: false,
        message: "user not found"
      })
    }
    user.status = 'inactive',
    await user.save();
    return res.status(200).json({
      success: true,
      message: "user account set inactive successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//view all users: 
exports.viewAllUsers = async(req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const allusers = await users.find().skip(skip).limit(limit).exec();
    if(!allusers || allusers.length === 0){
      return res.status(404).json({
        success: false,
        message: "products not found"
      });
    }
    return res.status(200).json({
      success: false,
      message: "users retrieved successfully",
      data: allusers
    })
  } catch (error) {
    return res.status(500).json({
      success: fase,
      message: "Intenal Server Error",
      error: error,
    })
  }
}

// view a single user
exports.viewUser = async(req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(401).json({
        success: false,
        message: "invalid ID"
      })
    }
    const user = await users.findById(id);
    if(!user){
      return res.status(404).json({
        succecss: false,
        message: " user not found"
      })
    }
    return res.status(200).json({
      success: false,
      message: "user retrieved successfully",
      data: user
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    })
  }
}

//******************** Products Management:  ******************/

//upatate a password for a product:
exports.setDiscountOnProduct = async(req, res) => {
  try {
    const { id } = req.params;
    const { setdiscount } = req.body;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(401).json({
        success: false,
        message: "Invalid ID"
      })
    }
    const product = await products.findById(id);
    if(!product){
      return res.status(404).json({
        succcess: false,
        message: "product not found"
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
      error: error,
    })
  }
};






