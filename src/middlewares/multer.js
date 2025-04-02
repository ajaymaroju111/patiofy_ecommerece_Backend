const multer = require('multer');


//memory Storage : 
const storage = multer.memoryStorage();

//file filter to allow you only pages : 
const fileFilter = (req , file, cb) =>{
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if(allowedTypes.includes(file.mimetype)){
    cd(null, true);
  }else{
    cb(new Error('Invalid file type. only JPEG, JPG, PNG and GIF files are allowed'))
  }
} 

//multer configuration with error handling : 
const upload = multer({
  storage : storage,
  fileFilter : fileFilter,
  limits : {fileSize : 10 * 1024 * 1024},  //10MB limit
});

module.exports = upload;