const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.generateCookie = async(req , res, user, next) =>{
  try {
    const data = { 
      id : user._id,
      status : user.status,
    }
    const key = process.env.JWT_SECRET;
    const expiry = {expiresIn: '1d'};
    const token = jwt.sign(data, key, expiry);
    //cookie is generated : 
    await res.cookie("token", token, {
      httpOnly : true,
      secure : true,
      samesite : true,
    })
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({error : 'Internal Server Error'});
  }
}