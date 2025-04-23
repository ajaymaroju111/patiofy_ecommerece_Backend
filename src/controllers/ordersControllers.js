const { default: mongoose } = require('mongoose');
const orders = require('../models/ordersschema.js');
const products = require('../models/productschema.js')
const userAddresses = require('../models/addressschema.js');
const carts = require('../models/cartschema.js');

//create an order: 
exports.makeOrder = async(req, res) => {
  try {
    const { id } = req.params;
    const { addressId } = req.body;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(401).json({
        success: false,
        message: "invalid  cart ID"
      });
    }
    if(!mongoose.Types.ObjectId.isValid(addressId)){
      return res.status(401).json({
        success: false,
        message: "invalid address ID"
      });
    }
    const cart = await carts.findById(id);
    if(!cart){
      return res.status(404).json({
        success: false,
        message: "cart not found",
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
      productId: cart.productId,
      final_price : cart.final_price,
      addressId: addressId,
    });
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

exports.makeOrderWithoutCart = async(req, res) => {
  try {
    const { id } = req.params;
    const {quantity, AddressId} = req.body;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success: false,
        message: "invalid product ID",
        error: "Bad Request"
      })
    }
    const address = await userAddresses.findById(AddressId);
    if(!address){
      return res.status(404).json({
        success: false,
        message: "address not found",
        error: "Not Found"
      });
    }
    const item = await products.findById(id);
    if(!item){
      return res.status(404).json({
        success: false,
        message: "product not found",
        error: "Not Found"
      })
    }
    const totalPrice = quantity*item.discountPrice;
    const order = await orders.create({
      userId: req.user._id,
      productId: id,
      final_price : totalPrice,
      Delivery_address: address,
    })

    return res.status(200).json({
      success: true,
      message: "order added successfully",
      data: (await (await (await order.populate('productId', 'name size discount discountPrice,')).populate('addressId', 'Shipping_Adderss phone')).populate('userId', 'firstname lastname')),
      final_price : item.discountPrice*quantity,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    })
  }
};