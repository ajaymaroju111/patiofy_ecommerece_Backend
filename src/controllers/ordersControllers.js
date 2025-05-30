const { default: mongoose } = require("mongoose");
const orders = require("../models/ordersschema.js");
const products = require("../models/productschema.js");
const userAddresses = require("../models/addressschema.js");
const carts = require("../models/cartschema.js");
const crypto = require("crypto");
require("dotenv").config();
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// const redis = require("../utils/redisConfig.js");

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

exports.getLatestSavedAddress = async (req, res) => {
  try {
    const latestAddress = await userAddresses
      .find({ userId: req.user._id })
      .sort({ _id: -1 })
      .limit(1);
    if (!latestAddress) {
      return req.status(404).json({
        success: false,
        message: "address not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      id: latestAddress._id,
      data: latestAddress,
    });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: "Internal Server Error",
      error: error,
    });
  }
};

// exports.makeOrder = async (req, res) => {
//   try {
//     const { id } = req.params; //product id :
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid ID",
//         error: "Bad Request",
//       });
//     }
//     const {
//       email,
//       phone,
//       // shipping :{
//       country,
//       firstname,
//       lastname,
//       address,
//       city,
//       state,
//       // },
//       // billing: {
//       Bcountry,
//       Bfirstname,
//       Blastname,
//       Baddress,
//       Bcity,
//       Bstate,
//       Bphone,
//       // },
//       // addressId,
//       quantity,
//     } = req.body;

//     if (!phone) {
//       return res.status(400).json({
//         success: false,
//         message: "phone number is required",
//         error: "Bad Request",
//       });
//     }
//     const lastAddress = await userAddresses
//       .findOne({ userId: req.user._id })
//       .sort({ _id: -1 });
//     var newAddress;
//     if (country && firstname && lastname && address && city && state) {
//       newAddress = await userAddresses.create({
//         userId: req.user._id,
//         country,
//         firstname,
//         lastname,
//         address,
//         city,
//         state,
//       });
//       await newAddress.save();
//     }
//     var billAddress;
//     if (
//       Bcountry &&
//       Bfirstname &&
//       Blastname &&
//       Baddress &&
//       Bcity &&
//       Bstate &&
//       Bphone
//     ) {
//       billAddress = await userAddresses.create({
//         userId: req.user._id,
//         country: Bcountry,
//         firstname: Bfirstname,
//         lastname: Blastname,
//         address: Baddress,
//         city: Bcity,
//         state: Bstate,
//         phone: Bphone,
//       });
//     }

//     const product = await products.findById(id);
//     if (!product) {
//       const isaCart = await carts.findById(id);
//       if (!isaCart) {
//         return res.status(404).json({
//           success: false,
//           message: "cart not found",
//           error: "Not Found",
//         });
//       }
//       const razorpayOrder = await razorpay.orders.create({
//         amount: (isaCart.discountedPrice * isaCart.quantity + isaCart.shipping_cost) *
//           100,
//         currency: "INR",
//         receipt: `receipt#${Date.now()}`,
//         payment_capture: 1,
//       });
//       const newOrder = await orders.create({
//         userId: req.user._id,
//         productId: isaCart.productId,
//         shipping_addressId: newAddress?._id || lastAddress?._id,
//         billing_addressId: billAddress?._id || lastAddress?._id,
//         phone: phone,
//         email: email || undefined,
//         shipping_cost: isaCart.shipping_cost,
//         final_cost:
//           (isaCart.discountedPrice * isaCart.quantity + isaCart.shipping_cost),
//         paymentInfo:{
//           razorpay_order_id: razorpayOrder.id,
//         },
//         payment_mode: "online"
//       });

//       return res.status(200).json({
//         success: true,
//         message: `your order placed successfully : ${newOrder.orderId}`,
//         order_id: newOrder._id,
//         userId: newOrder.userId,
//         data: await ( await (
//           await newOrder.populate(
//             "shipping_addressId",
//             "country firstname lastname Address city state"
//           )
//         ).populate(
//           "billing_addressId",
//           "country firstname lastname Address city state phone"
//         )).populate('cartId', "quantity discountedPrice"),
//       });
//     }
//     // if (addressId) {
//     //   const shippingAddress = await userAddresses.findById(addressId);
//     //   if (!shippingAddress) {
//     //     return res.status(404).json({
//     //       success: false,
//     //       message: "Address not found",
//     //       error: "Not Found",
//     //     });
//     //   }
//     // }

//     const razorpayOrder = await razorpay.orders.create({
//         amount: (product.discountPrice * quantity + product.shipping_cost) * 100,
//         currency: "INR",
//         receipt: `receipt#${Date.now()}`,
//         payment_capture: 1,
//       });

//      const newOrder = await orders.create({
//       userId: req.user._id,
//       productId: id,
//       shipping_addressId: newAddress?._id || lastAddress?._id,
//       billing_addressId: billAddress?._id || lastAddress?._id,
//       phone: phone,
//       email: email || undefined,
//       shipping_cost: product.shipping_cost,
//       final_cost:
//         (product.discountPrice * quantity + product.shipping_cost),
//       payment_mode: "online",
//       paymentInfo:{
//         razorpay_order_id: razorpayOrder.id,
//       },
//     });
//     // const receipt = await newOrder.populate('shipping_addressId', 'country, firstname, lastname, Address, city, state').populate('billing_addressId',  'country, firstname, lastname, Address, city, state');
//     return res.status(200).json({
//       success: true,
//       message: `your order placed successfully : ${newOrder.orderId}`,
//       order_id: newOrder._id,
//       data: await (
//         await newOrder.populate(
//           "shipping_addressId",
//           "country firstname lastname Address city state"
//         )
//       ).populate(
//         "billing_addressId",
//         "country firstname lastname Address city state phone"
//       ),
//       // data : receipt
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

//get the latest Address of the user :
exports.getLastAddress = async (req, res) => {
  try {
    const lastAddress = await userAddresses
      .findOne({ userId: req.user._id })
      .sort({ _id: -1 });
    if (!lastAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Address found Successfully",
      data: lastAddress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Interna Server Error",
      error: error,
    });
  }
};

//place an order with array of cart products and mono product
exports.makeOrder = async (req, res) => {
  try {
    const { id } = req.params; // can be single product id or comma-separated cart ids
    const ids = id.includes(",") ? id.split(",") : [id];

    const {
      email,
      phone,
      country,
      firstname,
      lastname,
      address,
      city,
      state,
      Bcountry,
      Bfirstname,
      Blastname,
      Baddress,
      Bcity,
      Bstate,
      Bphone,
      quantity,
      total_pay,
      payment_mode,
      saveNextTime,
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
        error: "Bad Request",
      });
    }

    // if (!/^\+?\d{10,15}$/.test(phone) || !/^\+?\d{10,15}$/.test(Bphone) ) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid phone number format",
    //     error: "Phone must be 10–15 digits, optionally starting with +",
    //   });
    // }
    const  Shphone = Number(phone.slice(-10));
    const  Biphone = Number(Bphone.slice(-10));

    // if (!/^\d{10}$/.test(Shphone) || !/^\d{10}$/.test(Biphone)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid phone number format",
    //     error: "Phone number must be exactly 10 digits and numeric only",
    //   });
    // }

    if (!total_pay) {
      return res.status(400).json({
        success: false,
        message: "total pay is required",
        error: "Bad Request",
      });
    }

    const totalPay = Number(total_pay);
    // let total_cost = Math.ceil(total_pay * 100) / 100;

    if (isNaN(totalPay)) {
      return res.status(401).json({
        success: false,
        message: "total pay must be a number",
        error: "Bad Request",
      });
    }

    let newAddress;
    if (country && firstname && lastname && address && city && state) {
      newAddress = await userAddresses.create({
        userId: req.user._id,
        country,
        firstname,
        lastname,
        address,
        city,
        state,
      });
      await newAddress.save();
    }

    const isSingleProduct =
      ids.length === 1 &&
      mongoose.Types.ObjectId.isValid(ids[0]) &&
      (await products.findById(ids[0]));

    if (isSingleProduct) {
      const product = await products.findById(ids[0]);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
          error: "Not Found",
        });
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: totalPay,
        currency: "INR",
        receipt: `receipt#${Date.now()}`,
        payment_capture: 1,
      });
      if (isNaN(Number(quantity))) {
        return res.status(401).json({
          message: "not a number quntity",
        });
      }
      const finalCost = Number(product.discountPrice * quantity);
      if (isNaN(finalCost)) {
        return res.status(401).json({
          message: "not a ",
        });
      }
      const newOrder = await orders.create({
        userId: req.user._id,
        productId: product._id,
        shipping_address: {
          firstname: firstname,
          lastname: lastname,
          country: country,
          address: address,
          city: city,
          state: state,
          phone: Shphone,
        },
        billing_address: {
          firstname: Bfirstname,
          lastname: Blastname,
          country: Bcountry,
          address: Baddress,
          city: Bcity,
          state: Bstate,
          phone: Biphone,
        },
        actual_price: product.discountPrice,
        email,
        quantity: quantity,
        payment_mode: payment_mode,
        final_cost: finalCost,
        paymentInfo: {
          razorpay_order_id:
            payment_mode === "online" ? razorpayOrder.id : undefined,
        },
      });

      if (!saveNextTime) {
        await userAddresses.deleteMany({ userId: req.user._id });
      }
      await userAddresses.deleteMany({
        userId: req.user._id, // assuming you store user reference
        _id: { $ne: newAddress._id },
      });

      return res.status(200).json({
        success: true,
        message: `Your product order was placed successfully`,
        order_id: newOrder._id,
        razorpay_orderId: razorpayOrder.id,
        data: newOrder,
      });
    } else {
      // Multiple cart IDs
      const allOrders = [];

      const razorpayOrder = await razorpay.orders.create({
        amount: totalPay,
        currency: "INR",
        receipt: `receipt#${Date.now()}`,
        payment_capture: 1,
      });

      for (let cartId of ids) {
        if (!mongoose.Types.ObjectId.isValid(cartId)) continue;

        const cart = await carts.findById(cartId);
        if (!cart) {
          return res.status(404).json({
            success: false,
            message: "cart does not exst ",
            error: "Not Found",
          });
        }
        const quantity = Number(cart.quantity);
        const finalCost = Number(cart.discountedPrice * quantity);
        if (isNaN(finalCost)) {
          return res.status(401).json({
            message: "not a number",
          });
        }
        const newOrder = await orders.create({
          userId: req.user._id,
          productId: cart.productId,
          shipping_address: {
            firstname: firstname,
            lastname: lastname,
            country: country,
            address: address,
            city: city,
            state: state,
            phone: Shphone,
          },
          billing_address: {
            firstname: Bfirstname,
            lastname: Blastname,
            country: Bcountry,
            address: Baddress,
            city: Bcity,
            state: Bstate,
            phone: Biphone,
          },
          email,
          actual_price: cart.discountedPrice,
          quantity: cart.quantity,
          payment_mode: payment_mode,
          final_cost: finalCost,
          paymentInfo: {
            razorpay_order_id:
              payment_mode === "online" ? razorpayOrder.id : undefined,
          },
        });
        await carts.deleteOne({ _id: cart._id });

        allOrders.push(newOrder);
      }
      if (!saveNextTime) {
        await userAddresses.deleteMany({ userId: req.user._id });
      }
      await userAddresses.deleteMany({
        userId: req.user._id, // assuming you store user reference
        _id: { $ne: newAddress._id },
      });

      return res.status(200).json({
        success: true,
        message: "Your cart orders were placed successfully",
        razorpay_orderId: razorpayOrder.id,
        orders: allOrders,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
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
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "you are not authorized",
        error: "UnAuthorized",
      });
    }
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

//get an order by id :
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order Id",
        error: "Bad Request",
      });
    }
    // const cacheKey = `order:${id}`;
    // try {
    //   const cacheOrder = await redis.get(cacheKey);
    //   if (cacheOrder) {
    //     return res.status(500).json({
    //       success: false,
    //       cached: true,
    //       data: cacheOrder,
    //     });
    //   }
    // } catch (cacheError) {
    //   console.error(cacheError);
    // }
    const order = await orders.findById(id);
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "you are not authorized",
        error: "UnAuthorized",
      });
    }
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
        error: "Not Found",
      });
    }
    // try {
    //   await redis.set(cacheKey, JSON.stringify(order), 'Ex', 3600)
    // } catch (cacheError) {
    //   console.error(cacheError);
    // }
    return res.status(200).json({
      success: true,
      cached: false,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//get all orders:
exports.viewAllOrders = async (req, res) => {
  try {
    // const cacheKey = `orders:all`;
    // try {
    //   const cacheOrders = await redis.get(cacheKey);
    //   if (cacheOrders) {
    //     return res.status(200).json({
    //       success: true,
    //       cached: true,
    //       data: cacheOrders,
    //     });
    //   }
    // } catch (cacheError) {
    //   console.error(cacheError);
    // }
    const allorders = await orders
      .find({ userId: req.user._id })
      .sort({_id: -1})
      .populate("productId", "discountPrice");
    // const allorders = await orders
    //   .find({ userId: req.user._id })
    //   .select("-userId, -productId");
    for (const order of allorders) {
      if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this order.",
          error: "Unauthorized",
        });
      }
    }
    if (!allorders || allorders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "order are empty",
        error: "Not Found",
      });
    }
    // try {
    //   await redis.set(cacheKey, JSON.stringify(allorders), "EX", 3600);
    // } catch (redisError) {
    //   console.error(redisError);
    // }
    return res.status(200).json({
      success: true,
      cached: false,
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//////////////**********************   Payment Gateways      *************************************/

// exports.verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       order_id, // your own database order ID
//     } = req.body;
//     if (!mongoose.Types.ObjectId.isValid(order_id)) {
//       return res.status(400).json({
//         success: false,
//         messsage: "Invalid ID",
//         error: "Bad Request",
//       });
//     }

//     // 1. Generate the signature using Razorpay secret
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     // 2. Verify that signatures match
//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment signature verification failed",
//         error: "Bad Request",
//       });
//     }

//     // 3. Mark order as paid
//     const updatedOrder = await orders.findByIdAndUpdate(
//       order_id,
//       {
//         payment_status: "paid",
//         payment_mode: "online",
//         paymentInfo: {
//           razorpay_payment_id,
//           razorpay_order_id,
//           razorpay_signature,
//         },
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Payment verified successfully",
//       data: updatedOrder,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
        error: "Bad Request",
      });
    }

    // 1. Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // 2. Compare with received signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
        error: "Invalid Signature",
      });
    }
    const isUser = await orders.find({
      "paymentInfo.razorpay_order_id": razorpay_order_id,
    });
    for (const order of isUser) {
      if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this order.",
          error: "Unauthorized",
        });
      }
    }
    const updatedResult = await orders.updateMany(
      { "paymentInfo.razorpay_order_id": razorpay_order_id },
      {
        $set: {
          payment_status: "paid",
          "paymentInfo.razorpay_payment_id": razorpay_payment_id,
          "paymentInfo.razorpay_signature": razorpay_signature,
        },
      }
    );

    if (updatedResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found with the given Razorpay Order ID",
        error: "Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and orders updated successfully",
      modifiedCount: updatedResult.modifiedCount,
    });
  } catch (error) {
    clg(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
