const users = require('../models/userschema.js');
const posts = require('../models/productschema.js');
const carts = require('../models/cartschema.js');




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
    console.log(error);
    return res.status(500).json({error : 'Internal Server Error'});
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
    console.log(error);
    return res.status(500).json({error : ' Internal Server Error '});
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