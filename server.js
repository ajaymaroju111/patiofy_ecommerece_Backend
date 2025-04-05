const express = require("express");
const app = express();
const Limiter = require("express-rate-limit");
const cors = require("cors");
const corn = require("node-cron");
const passport = require('./src/config/passport.js');
const session = require("express-session");
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const SwaggerDocument = YAML.load("./api.yaml");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
require('./src/config/passport.js');
//functions :
const authroutes = require("./src/routes/userPath.js");
const postroutes = require("./src/routes/productPaths.js");
const { dbConnnection } = require("./src/config/dbConnection.js");
dbConnnection();


app.use(
  session({
    secret: process.env.JWT_SECRET, // Secret key for signing the session ID cookie
    resave: false, // Don't save session if it wasn't modified during the request
    saveUninitialized: false, // Don't save uninitialized sessions (good for login scenarios)
  })
);

app.use(cookieParser());
//usage od limiter :
const limiter = Limiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  headers: true,
});
app.use(limiter);
app.use(bodyParser.json());

// //initializing scheduler :
// corn.schedule("*/5 * * * * *", async () => {
//   try {
//     // console.log('this is running for every 5 second');
//     const expiredUsers = await users.find({ jwtExpiry: { $lt: Date.now() } });
//     if (expiredUsers.length > 0) {
//       for (const user of expiredUsers) {
//         user.cookie = null;
//         await user.save();
//       }
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });

//enable CORS :
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["content-type", "Authorization"],
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(
  express.urlencoded({
    extended: true,
  })
);

//initializing app :
app.use("/patiofy/auth/user", authroutes);
app.use("/patiofy/auth/products", postroutes);

//usage of swagger eith yaml code :
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(SwaggerDocument));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is Running on the port : ${port}`);
  console.log(
    `Swagger - Docs are running on http://localhost:${port}/api-docs`
  );
});
