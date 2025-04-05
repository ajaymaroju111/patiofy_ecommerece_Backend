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
  (req, res) => {
    if (!req.user) {
      return res.redirect("/patiofy/auth/user/failed");
    }

    // 🔹 Extract user & token from req.user
    const { user, token } = req.user;

    // ✅ Set JWT token in cookies for authentication
    res.cookie("token", token, {
      httpOnly: true, // Prevents XSS attacks
      // secure: process.env.NODE_ENV === "production", // Secure only in production
      secure: 'secure', // Secure only in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // ✅ Redirect to success page
    res.redirect("/patiofy/auth/success");
  }
);

// 🔹 Step 3: Success Route (After Authentication)
router.get("/success", (req, res) => {
  return res.status(200).json({ message: "Welcome!", user: req.user });
});

// 🔹 Step 4: Failure Route
router.get("/failed", (req, res) => {
  return res.status(401).json({ error: "Authentication Failed" });
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
