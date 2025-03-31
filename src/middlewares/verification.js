const jwt  = require('jsonwebtoken');
require('dotenv').config();
const users = require('../models/userschema.js');



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