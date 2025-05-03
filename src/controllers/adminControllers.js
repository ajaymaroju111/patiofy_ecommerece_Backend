const { default: mongoose } = require("mongoose");
const users = require("../models/userschema");
const products = require("../models/productschema");
const orders = require("../models/ordersschema.js");
// const { all } = require("../routes/orderRoutes.js");

///****************** User Management:  ***********************/

//set a user account inactive:
exports.setUserInactive = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Id",
      });
    }
    if (req.user._id === id) {
      return res.status(401).json({
        success: false,
        message: "toy are not permitted",
        error: "Unauthorized",
      });
    }
    const user = await users.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
    if (user.status === "inactive") {
      res.status(204).json({
        success: false,
        message: "account already in inactive state",
        error: "No Content",
      });
    }
    (user.status = "inactive"), await user.save();
    return res.status(200).json({
      success: true,
      message: "user account set inactive successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//view all users:
exports.viewAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const allusers = await users.find().skip(skip).limit(limit).exec();
    if (!allusers || allusers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "products not found",
      });
    }
    return res.status(200).json({
      success: false,
      message: "users retrieved successfully",
      data: allusers,
    });
  } catch (error) {
    return res.status(500).json({
      success: fase,
      message: "Intenal Server Error",
      error: error,
    });
  }
};

// view a single user
exports.viewUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "invalid ID",
      });
    }
    const user = await users
      .findById(id)
      .select("firstname lastname email -_id");
    if (!user) {
      return res.status(404).json({
        succecss: false,
        message: " user not found",
      });
    }
    return res.status(200).json({
      success: false,
      message: "user retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//********************* Products Management *******************/

//unpublish product :
exports.unPublishProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        error: "invalid object ID",
      });
    }
    const item = await products.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Not Found",
        error: "item not found",
      });
    }
    if ((item.ProductStatus = "unpublished")) {
      return res.status(204).json({
        success: true,
        message: "No Content",
        error: "product is already in unpublished mode",
      });
    }
    item.ProductStatus = "unpublished";
    await item.save();
    return res.status(200).json({
      success: false,
      message: "product set to unpublished successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//set product status to be publish :
exports.publishProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        error: "invalid object ID",
      });
    }
    const item = await products.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Not Found",
        error: "item not found",
      });
    }
    if ((item.ProductStatus = "published")) {
      return res.status(204).json({
        success: true,
        message: "No Content",
        error: "product is already in published mode",
      });
    }
    item.ProductStatus = "published";
    await item.save();
    return res.status(200).json({
      success: false,
      message: "product set to published successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

exports.setViewinProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { viewin } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
        error: "Bad Request",
      });
    }
    if (
      viewin !== "new_collection" ||
      viewin !== "best_seller" ||
      viewin !== "both"
    ) {
      return res.status(401).json({
        success: false,
        message: "invalid enum format",
        error: "Bad Request",
      });
    }
    const item = await products.findById(id).select('name, viewIn');
    if(!item){
      return res.status(404).json({
        success: false,
        message: "Product not found",
        error: "Not Found"
      })
    }
    item.viewIn = viewin;
    await item.save();
    return res.status(200).json({
      success: true,
      message : "product viewas field updated successfully",
      data : item
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error
    })
  }
};

//******************** Discount Management:  ******************/

//set a discount for a product:
exports.setDiscountOnProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { setdiscount } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID",
      });
    }
    const product = await products
      .findById(id)
      .select("name price size fabric discount discountPrice");
    if (!product) {
      return res.status(404).json({
        succcess: false,
        message: "product not found",
      });
    }
    product.discount = setdiscount;
    await product.save();
    return res.status(200).json({
      succcess: true,
      message: "Discount updated successfully",
      current_discount: product.discount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//remove discount for a product:
exports.removeDiscountOnProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid ID",
      });
    }
    const product = await products
      .findById(id)
      .select("name price size fabric discount discountPrice");
    if (!product) {
      return res.status(404).json({
        succcess: false,
        message: "product not found",
      });
    }
    product.discount = 0;
    await product.save();
    return res.status(200).json({
      succcess: true,
      message: "Discount updated successfully",
      data: product,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

//*********************  Orders Management:  ********************//

//view all inprogess orders :
exports.viewAllInProgressOrders = async (req, res) => {
  try {
    const allorders = await orders
      .find({
        status: { $in: ["conformed", "out_of_delivery"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No current active orders",
      });
    }
    res.status.json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "in progress orders are retrieved ",
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

//view all refunded orders:
exports.viewAllRefundedOrders = async (req, res) => {
  try {
    const allorders = await orders
      .find({
        status: { $in: ["refunded"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No refunded orders ",
      });
    }
    res.status.json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "refunded orders are retrieved ",
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

//view all cancelled orders:
exports.viewAllCancelledOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        status: { $in: ["cancelled"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No cancelled active orders",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "cancelled orders are retrieved ",
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

//view all completed orders:
exports.viewAllCompletedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        status: { $in: ["completed"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No completed  orders",
      });
    }
    res.status.json({
      success: true,
      page: page,
      totlal_pages: Math.ceil(allorders.length / 10),
      message: "completed orders are retrieved ",
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

//view all completed orders:
exports.viewAllPendingOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        status: { $in: ["pending"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No completed  orders",
      });
    }
    res.status.json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "completed orders are retrieved ",
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

//**********  Payment Status:   *******************/
//view all payment completed orders:
exports.viewAllSuccessPaymentOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        payment_status: { $in: ["paid"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No payment completed orders",
      });
    }
    res.status.json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: " payment completed orders are retrieved ",
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

//view all payment incompleted orders:
exports.viewAllUnSuccessPaymentOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const allorders = await orders
      .find({
        payment_status: { $in: ["unpaid"] },
      })
      .populate("userId", "firstname, lastname")
      .populate("productId", "name, price, size, discountPrice")
      .skip(skip)
      .limit(limit)
      .exec();
    if (allorders.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No unpaid payment orders",
      });
    }
    res.status(200).json({
      success: true,
      page: page,
      totla_items: allorders.length,
      message: "incompleted payment orders are retrieved ",
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
