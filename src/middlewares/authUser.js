const jwt = require('jsonwebtoken');
require('dotenv').config();
const users = require('../models/userschema.js');


//genenrate a cookie when a user is aurhtenticated : 
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

//authenticate user before every route : 
exports.authenticate = async(req , res , next) =>{
  try {
    const { token } = req.cookies;
    if(!token){
      return res.status(401).json({error : 'login is required'});
    }
    //Verify the token : 
    const decode = jwt.verify(token , process.env.JWT_SECRET);
    //check the status of the user : 
    if(!(decode.status === 'active')){
      console.log('Account is inactive please verify');
      return res.status(401).json({error : 'account is inactive please verify'});
    }
    const user = await users.findById(decode.id);
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return resizeBy.status(500).json({error : "Internal Server Error"});
  }
}

exports.generateToken = (user) =>{
  return jwt.sign(
    {id : user.id, email: user.emails[0].value },
    process.env.JWT_SECRET,
    {expiresIn : '1d'}
  );
};