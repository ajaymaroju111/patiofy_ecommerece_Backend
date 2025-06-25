const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
    },
    orderId: {
      type: String,
    },
    size: {
      type: String,
    },
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "requested_for_cancel",
        "returned",
      ],
      default: "pending",
    },
    shipping_address: {
      country: {
        type: String,
        required: [true, "country name is required"],
        default: "India",
      },
      firstname: {
        type: String,
        required: [true, "firstname is required"],
      },
      lastname: {
        type: String,
        required: [true, "lastname is required"],
      },
      address: {
        type: String,
        required: [true, "address is required"],
      },
      pincode: {
        type: Number,
        required: [true, "pincode is required"],
      },
      house_number: {
        type: String,
        required: [true, "House number details are required"],
      },
      city: {
        type: String,
        required: [true, "city name is required"],
      },
      state: {
        type: String,
        required: [true, "state is required"],
      },
      landmark: {
        type: String,
        required: [true, "landmark is required"],
      },
    },

    billing_address: {
      country: {
        type: String,
        required: [true, "country name is required"],
        default: "India",
      },
      firstname: {
        type: String,
        required: [true, "firstname is required"],
      },
      lastname: {
        type: String,
        required: [true, "lastname is required"],
      },
      address: {
        type: String,
        required: [true, "address is required"],
      },
      pincode: {
        type: Number,
        required: [true, "pincode is required"],
      },
      house_number: {
        type: String,
        required: [true, "House number details are required"],
      },
      city: {
        type: String,
        required: [true, "city name is required"],
      },
      state: {
        type: String,
        required: [true, "state is required"],
      },
      landmark: {
        type: String,
        required: [true, "landmark is required"],
      },
    },
    original_cost: {
      type: Number,
    },
    selling_cost: {
      type: Number,
    },
    final_cost: {
      type: Number,
    },
    quantity: {
      type: Number,
    },
    payment_mode: {
      type: String,
      enum: ["online", "COD"],
      default: "COD",
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "cancelled"],
      default: "unpaid",
    },
    paymentInfo: {
      razorpay_payment_id: String,
      razorpay_order_id: String,
      razorpay_signature: String,
    },
    Date: {
      type: Date,
      default: Date.now(),
    },
    invoice: {
      type: String,
    },
  },
  { timestamps: true }
);

function generateOrderId() {
  const prefix = "ORDPATIOFY";
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
}

orderSchema.pre("save", function (next) {
  if (!this.orderId) {
    this.orderId = generateOrderId();
  }

  if (!this.billing_addressId) {
    this.billing_addressId = this.shipping_addressId;
  }

  next();
});

module.exports = mongoose.model("orders", orderSchema);
