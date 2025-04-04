const jwt = require("jsonwebtoken");
require("dotenv").config();
const users = require("../models/userschema.js");
const corn = require("node-cron");

//genenrate a cookie when a user is aurhtenticated :
exports.generateCookie = async (req, res, next, user) => {
  try {
    const data = {
      id: user._id,
      status: user.status,
    };

    const key = process.env.JWT_SECRET;
    const expiry = { expiresIn: "1d" };

    const token = jwt.sign(data, key, expiry);

    // Set the cookie
    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "Strict", // Use "Lax" if needed
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    user.jwtExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();
    if (next) next(); // Call next() only if it's defined
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//authenticate user before every route :
exports.authenticate = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "login is required" });
    }
    //Verify the token :
    const decode = jwt.verify(token, process.env.JWT_SECRET);
     //check if decode is not verified :

    if (!decode) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
    }
   
    //check the status of the user :
    if (!(decode.status === "active")) {
      console.log("Account is inactive please verify");
      return res
        .status(401)
        .json({ error: "account is inactive please verify" });
    }
    const User = await users.findById(decode.id);
    req.User = User;
    next();
  } catch (error) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.emails[0].value },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};
