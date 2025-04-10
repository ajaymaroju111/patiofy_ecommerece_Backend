const express = require("express");
const router = express.Router();
const users = require('../models/userschema.js');
const upload = require("../middlewares/multer.js");
const {
  setNewPassword,
  signUp,
  verify,
  signIn,
  getById,
  forgetPassword,
  resetPassword,
  update,
  myProducts,
  signOut,
  deleteUser,
  filterProducts,
  addAddress,
  updateAddress,
  getAddress,
  deleteAddress,
  viewAllAddresses,
  contactUs,
  resend,
  
} = require("../controllers/authroutes.js");
const { authenticate, verifyGoogleUser } = require("../middlewares/authUser.js");
const passport = require("passport");


// 🔹 Step 1: Google OAuth Login Route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔹 Step 2: Google OAuth Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/patiofy/auth/user/failed" }),
  async(req, res) => {
    if (!req.user) {
      return res.redirect("/patiofy/auth/user/google");
    }
    //extract token and user from the req.user
    const { user, token } = req.user;
    // If password is not set (new user via Google), redirect to set password
    const newUser = await users.findById(user._id);
    console.log(newUser.password);
    if (!newUser.password) {     //this only works when select : true in schema
      return res.redirect("/patiofy/auth/user/google/password");
    }
    // return res.redirect("/patiofy/auth/user/home");
    return res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      token: token, // Include the token in the response
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    });

  }
);


// 🔹 Step 4: Failure Route
router.get("/failed", (req, res) => {
  return res.status(401).json({ error: "Authentication Failed" });
});

router.put('/google/password', verifyGoogleUser, setNewPassword);
router.post("/signup", upload.single("profilePhoto"), signUp);
router.get("/veriy", verify);
router.post("/resend", resend);
router.post("/signin", signIn);
router.put("/update", authenticate, upload.single("avatar"), update);
router.get("/me/:id", authenticate, getById);
router.post("/password/forget", forgetPassword);
router.post("/password/reset", authenticate, resetPassword);
router.get("/products/:id", authenticate, myProducts);
router.delete("/delete", authenticate, deleteUser);
router.get("/filter", filterProducts);
router.put("/logout", authenticate, signOut);

//address form :
router.post("/address", authenticate, addAddress);
router.put("/address/:id", authenticate, updateAddress);
router.get("/address/:id", authenticate, getAddress);
router.delete("/address/:id", authenticate, deleteAddress);
router.get("/adress/list", authenticate, viewAllAddresses);

//Contact _ Us :
router.post("/query", authenticate, contactUs);

module.exports = router;
