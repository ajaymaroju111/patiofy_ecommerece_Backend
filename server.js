const express = require('express');

//imporing : 
const authroutes = require('./src/routes/authroutes.js')
const {dbConnnection} = require('./src/config/dbConnection.js');
dbConnnection();



//initializing app : 
const app = express();
app.use('/patiofy/user/', authroutes);



const port = process.env.PORT;
app.listen(port , () =>{
  console.log(`Server is Running on the port : ${port}`);
})