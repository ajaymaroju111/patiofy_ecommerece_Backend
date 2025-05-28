const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const users = require("../models/userschema.js");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_KEY,
      callbackURL:process.env.CALLBACK_URL,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await users.findOne({$or: [{googleId: profile.id}, {email: profile.emails[0].value}] }); // Use let to reassign if needed

        if (!user) {
          const nameParts = profile.displayName.split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ");

          user = await users.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstname: firstName,
            lastname: lastName,
            status: "active",
          });
        }

        // Generate a JWT token
        const token = jwt.sign(
          { id: user._id, email: user.email, status: user.status },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return done(null, { user, token });
      } catch (error) {
        console.log("OAuth Error", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});


module.exports = passport;
