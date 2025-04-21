const { default: mongoose } = require('mongoose');
const orders = require('../models/ordersSchema.js');
const products = require('../models/productschema.js')
const userAddresses = require('../models/addressschema.js')

//create an order: 
exports.makeOrder = async(req, res) => {
  try {
    const { id , addressId } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(401).json({
        success: false,
        message: "invalid  product ID"
      });
    }
    if(!mongoose.Types.ObjectId.isValid(addressId)){
      return res.status(401).json({
        success: false,
        message: "invalid address ID"
      });
    }
    const product = await products.findById(id);
    if(!product){
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }
    const address = await userAddresses.findById(addressId);
    if(!address){
      return res.status(404).json({
        success: false,
        message: "Address not found"
      })
    }
    const order = await orders.create({
      userId: req.user._id,
      productId: id,
      address: addressId,
    });
    await order.save();
    return res.status(200).json({
      success: false,
      message: "order placed successfully",
      orderId: `your order id is : ${order.orderId}`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message : "Internal Server Error",
      error: error,
    })
  }
}

//cancel order : 
exports.cancelOrder = async(req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(401).json({
        success: false,
        message: "invalid ID"
      })
    }
    const order = await orders.findById(id);
    if(!order){
      return res.status(404).json({
        success: false,
        message: "order not found"
      });
    }
    order.status = 'cancelled';
    await order.save();
    return res.status(200).json({
      success: true,
      message: "order cancelled successfullly"
    });
  } catch (error) { 
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
}