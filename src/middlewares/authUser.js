const jwt = require("jsonwebtoken");
require("dotenv").config();
const users = require("../models/userschema.js");
const CatchAsync = require("./CatchAsync.js");

//genenrate a cookie when a user is aurhtenticated :
exports.generateCookie = CatchAsync( async(user, res, next) => {
  try {
    const data = {
      id: user._id,
      email: user.email,
      status: user.status,
    };
  
    const key = process.env.JWT_SECRET;
    const expiryOptions = { expiresIn: "1d" };
  
    const token = jwt.sign(data, key, expiryOptions);
  
    // Set the cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true only on HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    
    // Optionally store JWT expiry in DB
    user.jwtExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
  
    if (next) next();
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
  
});

//authenticate user before every route :
exports.authenticate = CatchAsync( async(req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ error: "Login is required" });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
      });
      return res.status(401).json({ error: " Invalid or expired token, please login "});
    }
    // Check account status : 
    if (decoded.status !== "active") {
      return res.status(403).json({ error: "Account is inactive. Please verify." });
    }

    // Fetch user from DB
    const user = await users.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
    });
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.emails[0].value },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

exports.verifyGoogleUser = CatchAsync(async(req, res, next) =>{
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: "Login is required" });
  }
  //veri
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
    });
    return res.status(401).json({ error: " Invalid or expired token, please login "});
  }
  const user = await users.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;
    next();
})

