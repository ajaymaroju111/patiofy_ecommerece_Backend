const posts = require('../models/productschema');
const errorFunction = require('../middlewares/CatchAsync.js');



//create a product post : 
exports.createPost = async(req , res) =>{
  try {
    const { name , description, price, size, fabric} = req.body;
    if(!req.files || req.files.length === 0){
      return res.status(401).json({message : "product pics are required"})
    }
    const postImages = req.files.map((file) => ({
      name: file.originalname,
      img: {
        data: file.buffer, // Store buffer data
        contentType: file.mimetype,
      },
    }));
    const Post = await posts.create({
      userId : req.User._id,
      postImages : postImages,
      name,
      description,
      price,
      size,
      fabric,
    })
    await Post.save();
    return res.status(200).json({
      success : true,
      message : "product added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({error : 'Internal Server Error'});
  }
}

//update product post  : 
exports.updatePost = async(req , res) => {
  try {
    const { id , name, description, price} = req.body;
    const newData = {
      name,
      description,
      price,
    }
    await posts.findByIdAndUpdate(id , newData , {
      new : true,
      runValidators : true,
      useFindAndModify: true,
    })
    return res.status(200).json({
      success : true,
      message : 'post updated successfully',
  })

  } catch (error) {
    console.log(error);
    return res.status(500).json({error : ' Internal Server Error '});
  }
}

//get product by Id : 
exports.getById = async(req , res) =>{
  try {
    const {id} = req.params.id;
    if(!id){
      return res.status(401).json({message : 'id is required'})
    }
    const post = await posts.findById(id).populate('userId' , 'firstname lastname username email').exec();
    return res.status(200).json({
      success : true,
      post,
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({error : 'Internal Server Error'});
  }
}

//delete a post : 
exports.deletePost = async(req, res, next) =>{
    const { id } = req.params.id;
    if(!id){
      return next(new errorFunction('Id not received ', 401))
    }
    await posts.findByIdAndDelete( id );
    return res.status(200).json({
      success : true,
      message : 'post deleted successfully'
    });
}

