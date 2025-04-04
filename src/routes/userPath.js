const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const upload = require("../middlewares/multer.js");
const {
  signUp,
  verify,
  signIn,
  getById,
  forgetUsername,
  forgetPassword,
  resetPassword,
  update,
  myProducts,
  contactForm,
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
const { authenticate } = require("../middlewares/authUser.js");

//OAuth2 authentication  :
const passport = require("passport");


//user Routes :
router.get(
  "/google",
  passport.authenticate("google", { scope: ["Profile", "email"] })
);

// Google OAuth Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/patiofy/auth/signIn" }),
  (req, res) => {
    // Generate a token after authentication
    const token = req.user.token; // ✅ Fix: Use req.user.token instead of req.User

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict", 
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.redirect("/success");
  }
);
router.get("/success", (req, res) => {
  const { token } = req.cookies;
  return res.status(200).send(" Welcome :", token);
});


router.post("/signup", upload.single("profilePhoto"), signUp);
router.get("/veriy", verify);
router.post("/resend", resend);
router.post("/signin", signIn);
router.put("/update", authenticate, upload.single("avatar"), update);
router.post("/username/forget", forgetUsername);
router.get("/me/:id", authenticate, getById);
router.post("/password/forget", forgetPassword);
router.post("/password/reset", resetPassword);
router.get("/products/:id", authenticate, myProducts);
router.post("/submitform", authenticate, contactForm);
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
router.post("/feedback", authenticate, contactUs);

module.exports = router;
