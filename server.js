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
// const cron = require('node-cron');
// const users = require('./src/models/userschema.js');
require('./src/config/passport.js');
//functions :
const authroutes = require("./src/routes/userPath.js");
const postroutes = require("./src/routes/productPaths.js");
const { dbConnnection } = require("./src/config/dbConnection.js");
dbConnnection();

app.use(
  session({
    secret: process.env.JWT_SECRET, 
    resave: false, 
    saveUninitialized: false,
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

// enable CORS :
app.use(
  cors({
    // origin: ['http://147.93.97.20:3000' , 'https://yourfrontend.com'],
    origin: '*',
    credentials : true,
  })
);

app.set('trust proxy', 1);

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
  if(process.env.NODE_ENV === 'production'){
    console.log(
      `Swagger - Docs are running on Production server: http://147.93.97.20:${port}/api-docs 🚀 `
    );
  }else{
    console.log(
      `Swagger - Docs are running on Local server: http://localhost:${port}/api-docs ✅`
    );
  }
});
