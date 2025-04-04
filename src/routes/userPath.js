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
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const users = require("../models/userschema.js");
const { route } = require("./userPath.js");

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_KEY,
      callbackURL: process.env.CALLBACK_URL, // Redirect URL set in Google Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let User = await users.findOne({ googleId: profile.id }); // ✅ Fix Typo in googleId

        if (!User) {
          User = await users.create({
            googleId: profile.id, // ✅ Fix Typo
            username: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            status: "active",
            accessToken, // Optional: Storing tokens in DB is not recommended
            refreshToken,
          });
        }

        // Generate a JWT token
        const token = jwt.sign(
          { id: User._id, email: User.email },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return done(null, { User, token }); //  Ensure correct return format
      } catch (error) {
        console.log("OAuth Error", error);
        return done(error, null);
      }
    }
  )
);

//serialize and deserialize users :
passport.serializeUser((User, done) => {
  done(null, User.id);
});

passport.deserializeUser(async (id, done) => {
  const User = await users.findById(id);
  done(null, User);
});

//user Routes :
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "patiofy/auth/signIn" }),
  (req, res) => {
    //generate a token after authentication :
    const token = req.User;
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 24 * 60 * 60 * 1000,
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
