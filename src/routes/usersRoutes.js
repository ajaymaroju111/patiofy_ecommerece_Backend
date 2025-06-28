const express = require("express");
const router = express.Router();
const users = require("../models/userschema.js");
const jwt = require('jsonwebtoken');
const upload = require("../middlewares/multer.js");
const userImage = upload.single('image');

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
  // myProducts,
  signOut,
  deleteUser,
  addAddress,
  updateAddress,
  getAddress,
  deleteAddress,
  viewAllAddresses,
  contactUs,
  resend,
  uploadUserProfilePic,
  passwordsetresend,
} = require("../controllers/userControllers.js");
// const { ratingProduct } = require("../controllers/productsAuth.js");
const {
  authenticate,
  authenticateifNeeded,
} = require("../middlewares/authUser.js");
const passport = require("passport");
const { getBlogById, getallBlogs } = require("../controllers/blogscontrollers.js");

//  Step 1: Google OAuth Login Route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//  Step 2: Google OAuth Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/patiofy/auth/user/failed",
  }),
  async (req, res) => {
    if (!req.user) {
      return res.redirect("/patiofy/auth/user/google");
    }
    //extract token and user from the req.user
    const { user, token } = req.user;
    // If password is not set (new user via Google), redirect to set password
    const newUser = await users.findById(user._id);
    if (!newUser) {
      return res.status(404).json({
        success: false,
        message: "User not Found",
        error: "Not Found",
      });
    }

    // const token = jwt.sign(
    //   { id: user._id, email: user.email, status: user.status },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1d" }
    // );
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

    res.redirect(
      `https://patiofy.comfortbikes.in/?token=${token}&firstname=${newUser.firstname}&lastname=${newUser.lastname}&role=${newUser.accountType}&userId=${newUser._id}`
    );
  }
);

//  Step 4: Failure Route
router.get("/failed", (req, res) => {
  return res.status(401).json({ error: "Authentication Failed" });
});

// exports.getUserCredentials = async(req, res) => {
// try {
//   const {token, firstname, lastname, role, userId} = req.query;
//   if(!token || !firstname || !lastname || !role || !userId){
//     return res.status(401).json({
//       success: false,
//       message: "Data not found",
//       error: "Bad Request"
//     })
//   }

//   return res.status(200).json({
//     success: true
//   })
// } catch (error) {
  
// }
// }

router.put("/google/:id", setNewPassword);
router.post("/signup", signUp);
router.get("/verify", verify);
router.get("/resendset", passwordsetresend);
router.post("/resend", resend);
router.post("/signin", signIn);
router.put("/update", authenticate, update);
router.post("/profilepic", authenticate, userImage, uploadUserProfilePic);
router.get("/me/:id", authenticate, getById);
router.post("/password/forget", forgetPassword);
router.put("/password/setforget", setNewPassword);
router.post("/password/change", authenticate, changePassword);
router.put("/password/setnew", setPassword);
router.delete("/delete", authenticate, deleteUser);
router.put("/logout", authenticate, signOut);

//address form :
router.post("/address", authenticate, addAddress);
router.get("/address/list", authenticate, viewAllAddresses);
router.put("/address/:id", authenticate, updateAddress);
router.get("/address/:id", authenticate, getAddress);
router.delete("/address/:id", authenticate, deleteAddress);

//Contact_Us :
router.post("/query", authenticateifNeeded, contactUs);

// ✅✅✅✅✅✅✅✅ Blogs  ✅✅✅✅✅✅✅✅✅
router.get('/blog/:id',  getBlogById);
router.get('/blog/all', getallBlogs);

module.exports = router;
