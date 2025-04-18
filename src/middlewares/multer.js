const multer = require('multer');
const express = require('express');
const path = require('path');
const fs = require('fs');



const PicUpload = process.env.NODE_ENV === 'production'
    ? '/Patiofy/uploads/productPics' // For production on VPS
    : path.join(__dirname, '../uploads/productPics'); // For local development

    const productPicsUpload = multer({
      storage: multer.diskStorage({
          destination: (req, file, cb) => {
              cb(null, PicUpload); // Set the destination folder
          },
          filename: (req, file, cb) => {
              // Function to sanitize the filename
              const sanitizeFileName = (filename) => {
                  return filename
                      .toLowerCase() // Convert to lowercase
                      .replace(/\s+/g, '-') // Replace spaces with hyphens
                      .replace(/[^a-z0-9.\-_]/g, ''); // Remove invalid characters
              };
  
              const sanitizedOriginalName = sanitizeFileName(file.originalname);
              const uniqueSuffix = `${Date.now()}-${sanitizedOriginalName}`; // Create a unique filename
  
              if (!req.savedFileNames) {
                  req.savedFileNames = []; // Initialize array to store filenames
              }
              req.savedFileNames.push(uniqueSuffix); // Push sanitized filename to the array
  
              cb(null, uniqueSuffix); // Save file with sanitized filename
          },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
      fileFilter(req, file, cb) {
        if (!file) {
            cb(new Error('No file passed'), false);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }    
  });
  if (!fs.existsSync(PicUpload)) {
    fs.mkdirSync(PicUpload, { recursive: true });
}
  
  
  module.exports = productPicsUpload;