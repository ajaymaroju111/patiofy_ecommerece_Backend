const express = require("express");
const router = express.Router();
const users = require('../models/userschema.js');
const productPicsUpload = require("../middlewares/multer.js");
const {
  setNewPassword,
  signUp,
  verify,
  signIn,
  getById,
  forgetPassword,
  setPassword,
  changePassword,
  update,
  myProducts,
  signOut,
  deleteUser,
  addAddress,
  updateAddress,
  getAddress,
  deleteAddress,
  viewAllAddresses,
  contactUs,
  resend,
} = require("../controllers/userControllers.js");
// const { ratingProduct } = require("../controllers/productsAuth.js");
const { authenticate,authenticateifNeeded } = require("../middlewares/authUser.js");
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
    if(!newUser){
      return res.status(404).json({
        success: false,
        message: "User not Found",
        error: "Not Found"
      })
    }
    // if (!newUser.password) {     //this only works when select : true in schema which is by default value 
    //   // return res.redirect("/patiofy/auth/user/google/password");
    //   return
    // }
    // return res.redirect("/patiofy/auth/user/home");
    // return res.status(200).json({
    //   success: true,
    //   message: "User authenticated successfully",
    //   token: token,
    //   user: {
    //     id: user._id,
    //     email: user.email,
    //     firstname: user.firstname,
    //     lastname: user.lastname,
    //   },
    // });

    res.redirect(`https://patiofy.smartaihr.com/patiofy/auth/user/authentication?token=${token}&firstname=${newUser.firstname}&lastname=${newUser.lastname}&role=${newUser.accountType}&userId=${newUser._id}`);

  }
);


// 🔹 Step 4: Failure Route
router.get("/failed", (req, res) => {
  return res.status(401).json({ error: "Authentication Failed" });
});

router.put('/google/:id', setNewPassword);
router.post("/signup", signUp);
router.get("/verify", verify);
router.get("/verify", verify);
router.post("/resend", resend);
router.post("/signin", signIn);
router.put("/update", authenticate, update);
router.get("/me/:id", authenticate, getById);
router.post("/password/forget", forgetPassword);
router.post("/password/change", authenticate, changePassword);
router.put("/password/setNew", setPassword);
router.delete("/delete", authenticate, deleteUser);;
router.put("/logout", authenticate, signOut);

//address form :
router.post("/address", authenticate, addAddress);
router.get("/address/list", authenticate, viewAllAddresses);
router.put("/address/:id", authenticate, updateAddress);
router.get("/address/:id", authenticate, getAddress);
router.delete("/address/:id", authenticate, deleteAddress);

//Contact _ Us :
router.post("/query", authenticateifNeeded, contactUs);

module.exports = router;
