const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const users = require("../models/userschema.js");

//genenrate password :

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_KEY,
      callbackURL: process.env.CALLBACK_URL, // Redirect URL set in Google Console and should be same as callback route with same port
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await users.findOne({ googleId: profile.id }); // Find user by Google ID

        if (!user) {
          //genenrate a random password :
          const randomPassword = "User@110125";
          // Split full name into first name and last name
          const nameParts = profile.displayName.split(" ");
          const firstName = nameParts[0]; // First name
          const lastName = nameParts.slice(1).join(" ");
          //convert image in to buffer :
          const imgUrl = profile.photos[0].value;
          const response = await fetch(imgUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = response.headers.get("content-type");
          const name = profile.displayName;
          user = await users.create({
            googleId: profile.id, // Save Google ID
            username: profile.displayName,
            email: profile.emails[0].value,
            avatar: {
              name: name,
              img: {
                data: buffer,
                contentType: contentType,
              },
            },
            password: randomPassword,
            firstname: firstName,
            lastname: lastName,
            phone: null,
          });
          //set status to be active :
          user.status = "active";
          await user.save();
        }

        // Generate a JWT token
        const token = jwt.sign(
          { id: user._id, email: user.email }, // Corrected variable name
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return done(null, { user, token }); // Correct return format
      } catch (error) {
        console.log("OAuth Error", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

module.exports = passport;
