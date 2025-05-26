const multer = require("multer");
const express = require("express");
const multers3 = require('multer-s3');
const {S3Client , PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
// const path = require("path");
// const fs = require("fs");

// const PicUpload =
//   process.env.NODE_ENV === "production"
//     ? "/Patiofy/uploads/productPics" // For production on VPS
//     : path.join(__dirname, "../uploads/productPics"); // For local development

// //intialize the disk storage which stores in ouc upload ( external storage )
// const productPicsUpload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, PicUpload); // Set the destination folder
//     },
//     filename: (req, file, cb) => {
//       // Function to sanitize the filename ( it filters the file name)
//       const sanitizeFileName = (filename) => {
//         return filename
//           .toLowerCase() // Convert to lowercase
//           .replace(/\s+/g, "-") // Replace spaces with hyphens
//           .replace(/[^a-z0-9.\-_]/g, ""); // Remove invalid characters
//       };

//       //this is the actual  name for the file and this is further proccessed :
//       const sanitizedOriginalName = sanitizeFileName(file.originalname);
//       const uniqueSuffix = `${Date.now()}-${sanitizedOriginalName}`; // Create a unique filename

//       if (!req.savedFileNames) {
//         req.savedFileNames = []; // Initialize array to store filenames
//       }
//       req.savedFileNames.push(uniqueSuffix); // Push sanitized filename to the array

//       cb(null, uniqueSuffix); // Save file with sanitized filename
//     },
//   }),
//   limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
//   fileFilter(req, file, cb) {
//     if (!file) {
//       cb(new Error("No file passed"), false);
//     } else if (file.mimetype.startsWith("image/")) {
//       cb(null, true); // Accept the file
//     } else {
//       cb(new Error("Only image files are allowed"), false);
//     }
//   },
// });

// if (!fs.existsSync(PicUpload)) {
//   fs.mkdirSync(PicUpload, { recursive: true });
// }

// module.exports = productPicsUpload;

////////////////*****   FOR BASE64  ******************/

// Memory storage to store files in buffer


// 2nd

// const PicUpload =
//   process.env.NODE_ENV === "production"
//     ? path.join(__dirname, '../uploads/productPics') // Local path for production (inside the server)
//     : path.join(__dirname, "../uploads/productPics"); // Local development path

// // Define the base URL to be used in the HTTP response
// const getFileBaseUrl = () => {
//   if (process.env.NODE_ENV === "production") {
//     // Production URL (VPS or live server)
//     return 'http://147.93.97.20:3000/Patiofy/uploads/productPics';
//   } else {
//     // Local development URL (localhost)
//     return 'http://localhost:3000/uploads/productPics';
//   }
// };

// // Initialize multer disk storage for handling file uploads
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, PicUpload); // Set the destination folder for file storage
//     },
//     filename: (req, file, cb) => {
//       // Function to sanitize the filename (to filter out invalid characters)
//       const sanitizeFileName = (filename) => {
//         return filename
//           .toLowerCase() // Convert to lowercase
//           .replace(/\s+/g, "-") // Replace spaces with hyphens
//           .replace(/[^a-z0-9.\-_]/g, ""); // Remove invalid characters
//       };

//       const sanitizedOriginalName = sanitizeFileName(file.originalname);
//       const uniqueSuffix = `${Date.now()}-${sanitizedOriginalName}`; // Create a unique filename

//       if (!req.savedFileNames) {
//         req.savedFileNames = []; // Initialize an array to store filenames
//       }
//       req.savedFileNames.push(uniqueSuffix); // Push sanitized filename to the array

//       cb(null, uniqueSuffix); // Save file with sanitized filename
//     },
//   }),
//   limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
//   fileFilter(req, file, cb) {
//     if (!file) {
//       cb(new Error("No file passed"), false);
//     } else if (file.mimetype.startsWith("image/")) {
//       cb(null, true); // Accept image files
//     } else {
//       cb(new Error("Only image files are allowed"), false); // Reject non-image files
//     }
//   },
// });

// // Check if the productPics folder exists, if not, create it
// if (!fs.existsSync(PicUpload)) {
//   fs.mkdirSync(PicUpload, { recursive: true });
// }

// // Export the upload configuration
// module.exports = {upload, getFileBaseUrl};


// const storage = multer.memoryStorage();

// // File filter to allow only images
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and GIF files are allowed.'));
//   }
// };

// // Multer configuration with error handling
// const upload = multer({
//   storage : storage,
//   fileFilter : fileFilter,
//   limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
// });



// module.exports = upload;
const s3Client = new S3Client({
  region: process.env.cloud_aws_region_static,
  credentials :{
    accessKeyId: process.env.cloud_aws_credentials_access_key,
    secretAccessKey: process.env.cloud_aws_credentials_secret_key,
  }
});

const upload = multer({
  storage: multers3({
    s3: s3Client,
    bucket: process.env.application_bucket_name,
    contentType:  multers3.AUTO_CONTENT_TYPE,
    cacheControl: 'public, max-age=31536000',
  //   contentType: (req, file, cb) => {
  //     cb(null, file.mimetype || 'image/jpeg'); 
  //  },
  
    contentDisposition: 'inline',
    key: function (req, file, cb) {
      const filename = Date.now().toString() + '-' + file.originalname;
      cb(null, `productImages/${filename}`);
    },
    // acl: 'public-read',
  }),
  limits:{
    fileSize: 10 * 1024 * 1024, // 10MB
  },
   fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."), false);
    }
    cb(null, true);
  },

});

console.log("S3 Bucket is on Live 🚀");


module.exports = upload;

