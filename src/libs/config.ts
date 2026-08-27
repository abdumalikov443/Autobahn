import mongoose from "mongoose";
import { LeaseTerm, OrderStatus } from "./enums/order.enum";

export const MORGAN_FORMAT = `:method :url :response-time [:status] \n`;
export const AUTH_TIMER = 24;

export const shapeIntoMongooseObjectId = (target: any) => {
    return typeof target === 'string' ? new mongoose.Types.ObjectId(target) : target;
};

export const LEASE_DISCOUNTS: Record<LeaseTerm, number> = {
  [LeaseTerm.ONE_MONTH]: 0,
  [LeaseTerm.THREE_MONTHS]: 0.03,
  [LeaseTerm.SIX_MONTHS]: 0.06,
  [LeaseTerm.TWELVE_MONTHS]: 0.10,
  [LeaseTerm.TWENTY_FOUR_MONTHS]: 0.15,
  [LeaseTerm.THIRTY_SIX_MONTHS]: 0.20,
};

export const ACTIVE_STATUSES = [OrderStatus.CREATED, OrderStatus.PROCESSING];
export const HISTORY_STATUSES = [OrderStatus.FINISHED, OrderStatus.CANCELLED];

export const UNAVAILABLE_STATUSES = [OrderStatus.CREATED, OrderStatus.PROCESSING];
export const AVAILABLE_STATUSES = [OrderStatus.FINISHED, OrderStatus.CANCELLED];