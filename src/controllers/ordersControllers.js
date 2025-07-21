const { default: mongoose } = require("mongoose");
const orders = require("../models/ordersschema.js");
const products = require("../models/productschema.js");
const userAddresses = require("../models/addressschema.js");
const ProductMatrix = require("../models/productmatrixschema.js");
const carts = require("../models/cartschema.js");
const crypto = require("crypto");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const rawUUID = uuidv4();
const Razorpay = require("razorpay");
const users = require("../models/userschema.js");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

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
      error: error.message,
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
//       error: error.message,
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
      error: error.message,
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
      Bfirstname,
      Bcountry,
      Blastname,
      Baddress,
      Bpincode,
      Bhouse_number,
      Bcity,
      Bstate,
      Blandmark,
      Sfirstname,
      Scountry,
      Slastname,
      Saddress,
      Spincode,
      Shouse_number,
      Scity,
      Sstate,
      Slandmark,
      quantity,
      total_pay,
      size,
      payment_mode,
    } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
        error: "Bad Request",
      });
    }

    const user_response = await users.findById(req.user._id);
    if (!user_response) {
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "session expired, please login",
        error: "UnAuthorized",
      });
    }

    if (!user_response.phone || user_response.phone === undefined) {
      user_response.phone = phone;
      await user_response.save();
    }

    if (!total_pay) {
      return res.status(400).json({
        success: false,
        message: "total pay is required",
        error: "Bad Request",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing email address",
      });
    }

    const totalPay = Number(total_pay);

    if (isNaN(totalPay)) {
      return res.status(401).json({
        success: false,
        message: "total pay must be a number",
        error: "Bad Request",
      });
    }

    if (
      !Bfirstname ||
      !Bcountry ||
      !Blastname ||
      !Baddress ||
      !Bpincode ||
      !Bhouse_number ||
      !Bcity ||
      !Bstate ||
      !Blandmark
    ) {
      return res.status(403).json({
        success: false,
        statuscode: 2,
        message: "all fields are required in the Billing Address",
      });
    }
    if (
      !Sfirstname ||
      !Scountry ||
      !Slastname ||
      !Saddress ||
      !Spincode ||
      !Shouse_number ||
      !Scity ||
      !Sstate ||
      !Slandmark
    ) {
      return res.status(403).json({
        success: false,
        statuscode: 3,
        message: "all fields are required in the shipping Address",
      });
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

      const matrix = await ProductMatrix.findOne({
        productId: product._id,
        size: size,
      });
      if (!matrix) {
        return res.status(404).json({
          success: false,
          message: "product matrix details not found",
          error: "Not Found",
        });
      }
      const isAlreadyCart_response = await carts.findOne({
        $and: [
          { productId: product._id },
          { size: size },
          { userId: req.user._id },
        ],
      });

      if (payment_mode === "online" && !isAlreadyCart_response) {
        const cart_response = await carts.create({
          cartImages: product.imagesUrl,
          quantity: quantity,
          size: size,
          userId: req.user._id,
          productId: product._id,
          selling_price: matrix.selling_price,
        });

        if (!cart_response) {
          return res.status(400).json({
            success: false,
            statuscode: 1,
            message: "unable to create the cart",
            error: "Database Error",
          });
        }
      }

      if (quantity > matrix.stock || !matrix.stock) {
        return res.status(404).json({
          success: false,
          message: `Product out of stock only ${matrix.stock} left in ${size} size`,
          error: "insuffiecient stock quantity",
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
      const finalCost = Number(matrix.selling_price * quantity);
      if (isNaN(finalCost)) {
        return res.status(401).json({
          message: "final cost should be a number",
        });
      }
      const newOrder_response = await orders.create({
        userId: req.user._id,
        productId: product._id,
        shipping_address: {
          country: Scountry,
          firstname: Sfirstname,
          lastname: Slastname,
          address: Saddress,
          pincode: Spincode,
          house_number: Shouse_number,
          city: Scity,
          state: Sstate,
          landmark: Slandmark,
        },
        billing_address: {
          country: Bcountry,
          firstname: Bfirstname,
          lastname: Blastname,
          address: Baddress,
          pincode: Bpincode,
          house_number: Bhouse_number,
          city: Bcity,
          state: Bstate,
          landmark: Blandmark,
        },
        email,
        phone: phone,
        status: payment_mode !== "online" ? "confirmed" : "pending",
        quantity: quantity,
        payment_mode: payment_mode,
        final_cost: finalCost,
        size: matrix.size,
        selling_cost: matrix.selling_price,
        original_cost: matrix.original_price,
        paymentInfo: {
          razorpay_order_id:
            payment_mode === "online" ? razorpayOrder.id : undefined,
        },
      });
      if (!newOrder_response) {
        return res.status(403).json({
          success: false,
          statuscode: 2,
          message: "unable to place the order",
          error: "Database error",
        });
      }



      return res.status(200).json({
        success: true,
        message: `Your product order was placed successfully`,
        order_id: newOrder_response._id,
        razorpay_orderId: razorpayOrder.id,
        data: newOrder_response,
      });
    } else {
      const allOrders = [];
      const failedItems = [];

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
          failedItems.push({ cartId, reason: "Cart not found" });
          continue;
        }

        const product = await products.findById(cart.productId);
        if (!product) {
          failedItems.push({ cartId, reason: "Product not found" });
          continue;
        }

        const matrix = await ProductMatrix.findOne({
          $and: [{ productId: cart.productId }, { size: cart.size }],
        });

        if (!matrix || !matrix.size || !matrix.stock) {
          failedItems.push({
            cartId,
            reason: `Size ${cart.size} not found or no stock data`,
          });
          continue;
        }

        const stock = matrix.stock;

        if (stock < cart.quantity) {
          failedItems.push({
            cartId,
            reason: `Only ${stock} in stock for size ${cart.size}`,
          });
          continue;
        }

        const quantity = Number(cart.quantity);
        const finalCost = Number(cart.selling_price * quantity);
        if (isNaN(finalCost)) {
          failedItems.push({ cartId, reason: "Final cost invalid" });
          continue;
        }

        const newOrder_response = await orders.create({
          userId: req.user._id,
          productId: cart.productId,
          shipping_address: {
            country: Scountry,
            firstname: Sfirstname,
            lastname: Slastname,
            address: Saddress,
            pincode: Spincode,
            house_number: Shouse_number,
            city: Scity,
            state: Sstate,
            landmark: Slandmark,
          },
          billing_address: {
            country: Bcountry,
            firstname: Bfirstname,
            lastname: Blastname,
            address: Baddress,
            pincode: Bpincode,
            house_number: Bhouse_number,
            city: Bcity,
            state: Bstate,
            landmark: Blandmark,
          },
          email,
          status: payment_mode !== "online" ? "confirmed" : "pending",
          phone: phone,
          quantity,
          size: matrix.size,
          selling_cost: matrix.selling_price,
          payment_mode,
          final_cost: finalCost,
          original_cost: matrix.original_price,
          paymentInfo: {
            razorpay_order_id:
              payment_mode === "online" ? razorpayOrder.id : undefined,
          },
        });
        if (!newOrder_response) {
          failedItems.push({
            cartId,
            reason: "unable to create database error",
          });
          continue;
        }


        matrix.stock -= quantity;
        await matrix.save();

        allOrders.push(newOrder_response);
        if (payment_mode !== "online") {
          await carts.findByIdAndDelete(cartId);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Order process completed",
        razorpay_orderId: razorpayOrder.id,
        successfulOrders: allOrders,
        failedItems,
      });
    }
  } catch (error) {
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
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "you are not authorized",
        error: "UnAuthorized",
      });
    }
    if (order.status === "requested_for_cancel") {
      return res.status(401).json({
        success: false,
        message: "Already requested for order cancellation",
      });
    }
    order.status = "requested_for_cancel";
    await order.save();
    return res.status(200).json({
      success: true,
      message:
        "Your order cancellation request has been submitted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
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
//       error: error.message,
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
      error: error.message,
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
      error: error.message,
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
    const order = await orders
      .findOne({
        $and: [{ userId: req.user._id }, { _id: id }],
      })
      .exec();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//get all orders:
exports.viewAllOrders = async (req, res) => {
  try {
    const allorders = await orders
      .find({ userId: req.user._id })
      .populate("productId")
      .sort({ _id: -1 })
      .exec();

    if (!allorders || allorders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
        error: "Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      data: allorders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//get a single order by id:
exports.getOrderById = async (req, res) => {
  try {
    const id = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid order ID",
        error: "UnAuthorized",
      });
    }
    const myOrder = await orders.findById(id).populate("productId").exec();
    if (!myOrder) {
      return res.status(404).json({
        success: true,
        message: "Order not Found",
        error: "Not Found",
      });
    }

    if (myOrder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "you are not authorized",
        error: "UnAuthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: myOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//////////////**********************   Payment Gateways      *************************************/

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
    const allOrders_response = await orders.find({
      "paymentInfo.razorpay_order_id": razorpay_order_id,
    });
    const invoiceNumber = `PATINV-${rawUUID
      .split("-")
      .slice(0, 3)
      .join("")
      .toUpperCase()}`;
    const updatedResult = await orders.updateMany(
      { "paymentInfo.razorpay_order_id": razorpay_order_id },
      {
        $set: {
          status: "conformed",
          payment_status: "paid",
          "paymentInfo.razorpay_payment_id": razorpay_payment_id,
          "paymentInfo.razorpay_signature": razorpay_signature,
          invoice: invoiceNumber,
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

    const deletedCarts = [];
    const undeletedCarts = [];
    for (const order of allOrders_response) {
      if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this order.",
          error: "Unauthorized",
        });
      }

      //delete the cart  :
      const isCart_response = await carts.findOne({
        userId: req.user._id,
        productId: order.productId,
      });
      if (!isCart_response) {
        undeletedCarts.push({ order, reason: "cart not found" });
      }
      const deletecart_response = await carts.deleteOne({
        userId: req.user._id,
        productId: order.productId,
      });
      if (!deletecart_response) {
        undeletedCarts.push({
          order,
          reason: "cart not found or numable to delete the cart",
        });
      }
      deletedCarts.push({ order, reason: "cart deleted successfully" });
    }
    return res.status(200).json({
      success: true,
      message: "Payment verified and orders updated successfully",
      modifiedCount: updatedResult.modifiedCount,
    });
  } catch (error) {
    const allorders = await orders.find({
      "paymentInfo.razorpay_order_id": razorpay_order_id,
    });
    for (const order of allorders) {
      order.status = "cancelled";
      order.payment_status = "cancelled";
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
