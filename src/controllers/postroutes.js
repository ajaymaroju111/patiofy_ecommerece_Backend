const posts = require('../models/productschema');
const errorFunction = require('../middlewares/CatchAsync.js');
const carts = require('../models/cartschema.js');
const CatchAsync = require('../middlewares/CatchAsync.js');
const ErrorHandler = require('../utils/ErrorHandler.js');



//create a product post : 
exports.createPost = CatchAsync(async(req , res, next) =>{
  try {
    const { name , description, price, size, fabric} = req.body;
    if(!req.files || req.files.length === 0){
      return next(new ErrorHandler('post photos are required', 400))
    }
    const postImages = req.files.map((file) => ({
      name: file.originalname,
      img: {
        data: file.buffer, // Store buffer data
        contentType: file.mimetype,
      },
    }));
    const Post = await posts.create({
      userId : req.user._id,
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
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//update product post  : 
exports.updatePost = CatchAsync( async(req , res, next) => {
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
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
});

//get product by Id : 
exports.getById = CatchAsync( async(req , res, next) =>{
  try {
    const {id} = req.params.id;
    const post = await posts.findById(id).populate('userId' , 'firstname lastname username email').exec();
    return res.status(200).json({
      success : true,
      post,
    })
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
})

//delete a post : 
exports.deletePost = async(req, res, next) =>{
    const { id } = req.params.id;
    await posts.findByIdAndDelete( id );
    return res.status(200).json({
      success : true,
      message : 'post deleted successfully'
    });
}

//*****************         PRODUCT CART ROUTES               ***********************/

//adding to the cart : 
exports.addToCart = async(req , res) =>{
  try {
    const { productId } = req.params;
    const post = await posts.findById(productId);
    const cart = await carts.create({
      cartImages : [post.postImages],
      userId : req.user._id,
      productId : post._id,
      price : post.price,
      quantity,
    })
    await cart.save();
    return res.status(200).json({
      success : true,
      message : 'product added to cart successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
}

//get cart details by id : 
exports.getCartById = async(req , res) => {
    const { cartId } = req.params.id;
    const cart = await carts.findById(cartId);
    return res.status(200).json({
      success : true,
      cart,
    });
}

//update cart by id : 
exports.updateCart = async(req, res) =>{
  try {
    const {cartId} = req.params.id;
    const {quantity} = req.body;
    await carts.findByIdAndUpdate(cartId , {quantity : quantity} , {
      new : true,
      runValidators : true,
    });
  } catch (error) {
    return res.status(500).json({
      success : false,
      message : 'Internal Server Error',
      error : error
    });
  }
}

//delete cart : 
exports.deleteCart = async(req , res) => {
  try {
    const { cartId } = req.params.id;
    await carts.findByIdAndDelete(cartId);
  } catch (error) {
    console.log(error);
    return res.status(500).json({error : ' Internal Server Error '});
  }
}