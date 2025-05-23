const { S3Client, DeleteObjectsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const { Upload } = require('@aws-sdk/lib-storage');
const { Readable  } = require('stream')
const fs = require('fs')


const s3 = new S3Client({
  region: process.env.cloud_aws_region_static,
  credentials: {
    accessKeyId: process.env.cloud_aws_credentials_access_key,
    secretAccessKey: process.env.cloud_aws_credentials_secret_key,
  },
});

// Function to delete old images
exports.deleteOldImages = async (keys) => {
  if (!keys || keys.length === 0) return;

  const deleteParams = {
    Bucket: process.env.application_bucket_name,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
      Quiet: false,
    },
  };

  try {
    const command = new DeleteObjectsCommand(deleteParams);
    const response = await s3.send(command);
    console.log('Delete response:', response);
  } catch (error) {
    console.error('Error deleting objects:', error);
    throw error;
  }
};


exports.uploadNewImages = async (files) => {
  const uploadedImageUrls = [];

  for (const file of files) {
    const uploadParams = {
      Bucket: process.env.application_bucket_name,
      Key: Date.now().toString() + '-' + file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);
      const imageUrl = `https://${process.env.application_bucket_name}.s3.${process.env.cloud_aws_region_static}.amazonaws.com/${uploadParams.Key}`;
      uploadedImageUrls.push(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  return uploadedImageUrls;
};




// exports.uploadNewImages = async (files) => {
//   const uploadedImageUrls = [];

//   for (const file of files) {
//     const fileKey = `${Date.now()}-${file.originalname}`;
//     let stream;
//     if (file.buffer) {
//       stream = Readable.from(file.buffer); // memoryStorage
//     } else if (file.path) {
//       stream = fs.createReadStream(file.path); // diskStorage
//     } else {
//       throw new Error("File input is not valid — missing buffer or path.");
//     }

//     const uploadParams = {
//       Bucket: process.env.application_bucket_name,
//       Key: fileKey,
//       Body: stream,
//       ContentType: file.mimetype,
//     };

//     try {
//       const parallelUploader = new Upload({
//         client: s3,
//         params: uploadParams,
//         queueSize: 4, // optional concurrency
//         partSize: 20 * 1024 * 1024, // optional: 5MB per part
//         leavePartsOnError: false,
//       });

//       // optional: track progress
//       parallelUploader.on('httpUploadProgress', (progress) => {
//         console.log(`Uploading ${file.originalname}...`, progress);
//       });

//       await parallelUploader.done();

//       const imageUrl = `https://${process.env.application_bucket_name}.s3.${process.env.cloud_aws_region_static}.amazonaws.com/${fileKey}`;
//       uploadedImageUrls.push(imageUrl);
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   }

//   return uploadedImageUrls;
// };
