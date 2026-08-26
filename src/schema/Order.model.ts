import mongoose, { Schema } from "mongoose";
import {
  LeaseTerm,
  OrderDeliveryLocation,
  OrderStatus,
} from "../libs/enums/order.enum";

const orderSchema = new Schema(
  {
    orderLeaseTerm: {
      type: Number,
      enum: LeaseTerm,
      required: true,
    },

    orderDeliveryLocation: {
      type: String,
      enum: OrderDeliveryLocation,
      required: true,
    },

    orderStartDate: {
      type: Date,
      required: true,
    },

    orderTotal: {
      type: Number,
      required: true,
    },

    orderStatus: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.CREATED,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Member",
    },

    vehicleId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Vehicle",
    },
  },
  { timestamps: true, collection: "orders" },
);

export default mongoose.model("Order", orderSchema);
