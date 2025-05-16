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
const path = require('path');
// const cron = require('node-cron');
require('./src/config/passport.js');
//functions :
const authroutes = require("./src/routes/usersRoutes.js");
const postroutes = require("./src/routes/productsRoutes.js");
const adminroutes = require("./src/routes/adminRoutes.js");
const { dbConnnection } = require("./src/config/dbConnection.js");
const orderroutes = require('./src/routes/orderRoutes.js');
const MongoStore = require("connect-mongo");
dbConnnection();
const dbString = process.env.NODE_ENV === 'production'? process.env.MONGODB_PRODUCTION : process.env.MONGODB_LOCAL;
 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: dbString,
      collectionName: 'sessions',
    }),
  })
);

app.use(cookieParser());
//usage od limiter :
const limiter = Limiter({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, 
  legacyHeaders: false,
});
app.use(limiter);
app.use(bodyParser.json());
app.use(express.static('src/public'));


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
app.use("/patiofy/auth/admin", adminroutes);
app.use('/patiofy/auth/user/order', orderroutes)


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
