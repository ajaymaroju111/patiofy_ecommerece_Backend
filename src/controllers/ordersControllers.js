const { default: mongoose } = require("mongoose");
const orders = require("../models/ordersschema.js");
const products = require("../models/productschema.js");
const userAddresses = require("../models/addressschema.js");
const carts = require("../models/cartschema.js");

//create an order:
// exports.makeOrder = async (req, res) => {
//   try {
//     const { id } = req.params;
//     let { quantity } = req.body;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(401).json({
//         success: false,
//         message: "invalid  cart ID",
//       });
//     }

//     const cart = await carts.findById(id);
//     if (!cart) {
//       const item = await products.findById(id);
//       if (!item) {
//         return res.status(404).json({
//           success: false,
//           message: "product not found",
//           error: "Not Found",
//         });
//       }
//       const isAlreadyExist = await orders.findOne({
//         productId: id,
//       });
//       let aorder;
//       if (!isAlreadyExist) {
//         aorder = await orders.create({
//           userId: req.user._id,
//           productId: id,
//           final_price: quantity*product.discountPrice,
//         });
//       } else if (isAlreadyExist) {
//         quantity += 1;
//         isAlreadyExist.bill = quantity * item.discountPrice;
//         await isAlreadyExist.save();
//         return res.status(200).json({
//           success: true,
//           quantity: quantity,
//           message: "order updated successfully",
//           final_price: isAlreadyExist.bill,
//         });
//       }
//       return res.status(200).json({
//         success: true,
//         quantity: quantity,
//         message: "order added successfully",
//         final_price: aorder.bill,
//       });
//     }
//     const product = await products.findById(cart.productId);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: "product not found",
//           error: "Not Found",
//         });
//       }
//     const isAlreadyExist = await orders.findOne({ productId: cart.productId });
//     let order;
//     if (!isAlreadyExist) {
//       order = await orders.create({
//         userId: req.user._id,
//         productId: cart.productId,
//         final_price: cart.final_price,
//       });
//     } else if (isAlreadyExist) {
//       cart.quantity += 1;
//       isAlreadyExist.bill = cart.price;
//       await isAlreadyExist.save();
//       return res.status(200).json({
//         success: true,
//         quantity: cart.quantity,
//         message: "order updated successfully",
//         final_price: isAlreadyExist.bill,
//       });
//     }
//     return res.status(200).json({
//       success: false,
//       message: "order placed successfully",
//       orderId: `your order id is : ${order.orderId}`,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error,
//     });
//   }
// };

exports.makeOrder = async (req, res) => {
  try {
    const { id } = req.params; //product id :
    const {
      email,
      phone,
      country,
      firstname,
      lastname,
      address,
      city,
      state,
      addressId,
      quantity,
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "phone number is required",
        error: "Bad Request",
      });
    }

    let newAddress;
    if (country && firstname && lastname && address && city && state) {
      newAddress = await userAddresses.create({
        userId: req.user._id || undefined,
        country,
        firstname,
        lastname,
        address,
        city,
        state,
      });
    }

    const product = await products.findById(id);
    if (!product) {
      const isaCart = await carts.findById(id);
      if (!isaCart) {
        return res.status(404).json({
          success: false,
          message: "cart not found",
          error: "Not Found",
        });
      }
      const newOrder = await orders.create({
        userId: req.user_id || undefined,
        productId: isaCart.productId,
        shipping_addressId: newAddress._id || addressId,
        phone: phone,
        email: email || undefined,
        shipping_cost: isaCart.shipping_cost,
        final_cost: isaCart.discountedPrice*isaCart.quantity + isaCart.shipping_cost,
      });
      return res.status(200).json({
        success: true,
        message: `your order placed successfully : ${newOrder.orderId}`,
        order_id : newOrder._id,
      })
    }
    if(addressId){
      const shippingAddress = await userAddresses.findById(addressId);
      if (!shippingAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
          error: "Not Found",
        });
      }
    }

    const newOrder = await orders.create({
      userId: req.user_id || undefined,
      productId: id,
      shipping_addressId: newAddress._id || addressId,
      phone: phone,
      email: email || undefined,
      shipping_cost: product.shipping_cost,
      final_cost: product.discountPrice*quantity + product.shipping_cost,
    });
    return res.status(200).json({
      success: true,
      message: `your order placed successfully : ${newOrder.orderId}`,
      order_id : newOrder._id,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};
//cancel order :
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid ID",
      });
    }
    const order = await orders.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }
    order.status = "cancelled";
    await order.save();
    return res.status(200).json({
      success: true,
      message: "order cancelled successfullly",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

// exports.makeOrderWithoutCart = async(req, res) => {
//   try {
//     const { id } = req.params;
//     const { quantity } = req.body;
//     if(!mongoose.Types.ObjectId.isValid(id)){
//       return res.status(400).json({
//         success: false,
//         message: "invalid product ID",
//         error: "Bad Request"
//       })
//     }
//     const item = await products.findById(id);
//     if(!item){
//       return res.status(404).json({
//         success: false,
//         message: "product not found",
//         error: "Not Found"
//       })
//     }
//     const totalPrice = quantity*item.discountPrice;
//     const order = await orders.create({
//       userId: req.user._id,
//       productId: id,
//       final_price : totalPrice,
//     })

//     return res.status(200).json({
//       success: true,
//       quantity: quantity,
//       message: "order added successfully",
//       data: (await (await (await order.populate('productId', 'name size discount discountPrice,')).populate('addressId', 'Shipping_Adderss phone')).populate('userId', 'firstname lastname')),
//       final_price : item.discountPrice*quantity,
//     })
//   } catch (error) {
//     console.log(error)
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error,
//     })
//   }
// };

// adding shipping address :

//add shipping address :
exports.addShippingAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { addressId } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "order ID is required",
        error: "Bad Request",
      });
    }
    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "shipping address ID is required",
        error: "Bad Request",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    const shippingAddress = await userAddresses.findById(addressId);
    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
        error: "Not Found",
      });
    }
    const order = await orders.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
        error: "Not Found",
      });
    }
    order.shipping_addressId = addressId;
    await order.save();
    return res.status(200).json({
      success: true,
      message: "shipping address added successfully",
      orderID: order._id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//adding billing address :
exports.addbillingAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { addressId } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "shipping address ID is required",
        error: "Bad Request",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid ID",
        error: "Bad Request",
      });
    }
    const shippingAddress = await userAddresses.findById(addressId);
    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
        error: "Not Found",
      });
    }
    const order = await orders.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
        error: "Not Found",
      });
    }
    order.billing_addressId = addressId;
    await order.save();
    return res.status(200).json({
      success: true,
      message: "billing address added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};
