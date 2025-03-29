const users = require('../models/userschema.js');
const { sendEmail } = require('../utils/sendEmail.js');






 
 exports.signUp = async(req , res) =>{
  try {
    const { firstname, lastname, username , email, password} = req.body;
    if(!firstname || !lastname || !username || !email || !password){
      return res.status(400).json({
        error : "All fields are required",
      });
    }
    const existed = await users.find({
      $or : [{username}, {email}]
    })
    if(existed){
      if(existed === username){
        return res.status(401).json({error : "username already taken, try another"});
      }
      return res.status(401).json({error : "email is alreadt taken , try another"})
    }

    const User = await users.create({
      avatar : {
        name : req.file.originalname,
        img : {
          data : req.file.buffer,
          contentType : req.file.mimetype,
        }
      },
      firstname,
      lastname,
      username,
      email,
      password,
    });
    await User.save();
    const encodedId = Buffer.from(User._id , "utf-8").toString("base64");
    User.expirytime = (Date.now() + 10*60*1000);
    await User.save();
  } catch (error) {
    console.log(error);
    return res.status(500).json({error : "Internal Server Error"});
  }
}

exports.verify = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.oAuthsignup = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.signIn = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.getById = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.forgetPassword = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.resetPassword  = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.update = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.myProducts = async( req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.signOut = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}

exports.deleteUser = async(req , res) =>{
  try {
    
  } catch (error) {
    
  }
}





