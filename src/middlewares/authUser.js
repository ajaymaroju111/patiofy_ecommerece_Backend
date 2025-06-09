const jwt = require("jsonwebtoken");
require("dotenv").config();
const users = require("../models/userschema.js");
const crypto = require('crypto')


//generate a JsonWebToken for the user for the authentiction : 
exports.generateUserToken = (user) => {
  const data = {
    id: user._id,
    email: user.email,
    status: user.status,
  };
  const key = process.env.JWT_SECRET;
  const expiryOptions = { expiresIn: "1d" };
  // const expiryOptions = { expiresIn: "5m" };
  const token = jwt.sign(data, key, expiryOptions);
  return token;
};

//authenticate user before every route  :
exports.authenticate = async (req, res, next) => {
  try {
    const bearerKey = req.headers["authorization"];

    if (!bearerKey) {
      return res.status(401).json({ error: "please login" });
    }
    // Verify the token
    const token = bearerKey.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
      return res.status(401).json({ error: "Invalid token" });
    }
    // Fetch user from DB
    const user = await users.findById(decode.id);
     // Check account status :
    if (user.status !== "active") {
      return res
        .status(403)
        .json({ error: "Account is inactive. Please verify." });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired. Please login again.',
      expiredAt: error.expiredAt,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid token.',
    error: error.message,
  });
  }
};

//optional authentication if neede in the for the contact US : 
exports.authenticateifNeeded = async (req, res, next) => {
  try {
    const bearerKey = req.headers["authorization"];
    if (!bearerKey || !bearerKey.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }
    const token = bearerKey.split(" ")[1];
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

//generate token for the user for the google authentication :
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.emails[0].value },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

//verification for the google authenticated users :
exports.verifyGoogleUser = async (req, res, next) => {
  const bearerKey = req.headers["authorization"];
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

exports.isAdmin = async (req, res, next) => {
  try {
    if (!(req.user.accountType === "admin")) {
      return res.status(401).json({
        success: false,
        message: "you are not Authorized",
        error: "Unauthorized"
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    })
  }
};


const key1 = Buffer.from(process.env.KEY1, 'utf8');
const iv1 = Buffer.from(process.env.IV1, 'utf8');
const key2 = Buffer.from(process.env.KEY2, 'utf8');
const iv2 = Buffer.from(process.env.IV2, 'utf8');

function encryptLayer(text, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

exports.doubleEncrypt = async (plainText) => {
  const firstLayer = encryptLayer(plainText, key1, iv1);
  const secondLayer = encryptLayer(firstLayer, key2, iv2);
  return secondLayer;
};