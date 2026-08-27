import mongoose from "mongoose";
import { LeaseTerm, OrderStatus } from "./enums/order.enum";
import { VehicleStatus } from "./enums/vehicle.enum";

export const MORGAN_FORMAT = `:method :url :response-time [:status] \n`;
export const AUTH_TIMER = 24;

export const shapeIntoMongooseObjectId = (target: any) => {
    return typeof target === 'string' ? new mongoose.Types.ObjectId(target) : target;
};

/**
 * The admin routes serve two audiences from one URL: the browser asking for the EJS
 * page, and that page's own fetch() asking for the table data. This tells them apart
 * so no duplicate "...Api" endpoint is needed.
 */
export const wantsJson = (req: any): boolean => {
    return req.xhr || String(req.get?.("Accept") ?? "").includes("application/json");
};

export const LEASE_DISCOUNTS: Record<LeaseTerm, number> = {
  [LeaseTerm.ONE_MONTH]: 0,
  [LeaseTerm.THREE_MONTHS]: 0.03,
  [LeaseTerm.SIX_MONTHS]: 0.06,
  [LeaseTerm.TWELVE_MONTHS]: 0.10,
  [LeaseTerm.TWENTY_FOUR_MONTHS]: 0.15,
  [LeaseTerm.THIRTY_SIX_MONTHS]: 0.20,
};

/**
 * What a customer may see in the catalogue. A sold-out car stays on the site —
 * it is simply flagged OUT_OF_STOCK and cannot be ordered. PAUSE and DELETED
 * are the only states that hide a listing.
 */
export const VISIBLE_VEHICLE_STATUSES = [
  VehicleStatus.ACTIVE,
  VehicleStatus.OUT_OF_STOCK,
];

export const ACTIVE_STATUSES = [OrderStatus.CREATED, OrderStatus.PROCESSING];
export const HISTORY_STATUSES = [OrderStatus.FINISHED, OrderStatus.CANCELLED];

export const UNAVAILABLE_STATUSES = [OrderStatus.CREATED, OrderStatus.PROCESSING];
export const AVAILABLE_STATUSES = [OrderStatus.FINISHED, OrderStatus.CANCELLED];