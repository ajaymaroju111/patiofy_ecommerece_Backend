const jwt = require("jsonwebtoken");
require("dotenv").config();
const users = require("../models/userschema.js");

//genenrate a cookie when a user is aurhtenticated :
exports.generateUserToken = (user) => {
    const data = {
      id: user._id,
      email: user.email,
      status: user.status,
    };
    const key = process.env.JWT_SECRET;
    const expiryOptions = { expiresIn: "1d" };
    const token = jwt.sign(data, key, expiryOptions);
    return  token;
};

//authenticate user before every route :
exports.authenticate = async(req, res, next) => {
  try {
    const bearerKey = req.headers['authorization'];

    if (!bearerKey) {
      return res.status(401).json({ error: "please login" });
    }
    // Verify the token
   const token = bearerKey.split(' ')[1];
   const decode = jwt.verify(token, process.env.JWT_SECRET)
    // Check account status : 
    if (decode.status !== "active") {
      return res.status(403).json({ error: "Account is inactive. Please verify." });
    }
    // Fetch user from DB
    const user = await users.findById(decode.id);
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : "Internal Server Error",
      error : error,
    })
  }
};

exports.authenticateifNeeded = async(req, res, next) => {
  try {
    const bearerKey = req.headers['authorization'];
    if (!bearerKey || !bearerKey.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = bearerKey.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await users.findById(decoded.id);

    if (!user) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

//get token middleware for the google authentication : 
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.emails[0].value },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

//verification for the google authenticated users : 
exports.verifyGoogleUser = async(req, res, next) =>{
  const bearerKey = req.headers['authorization'];
  if (!bearerKey) {
    return res.status(401).json({ error: "Login is required" });
  }
  //verify the bearer token
  const decode = jwt.verify(token, process.env.JWT_SECRET);
  const user = await users.findById(decode.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;
    next();
};

