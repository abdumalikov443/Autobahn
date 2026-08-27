import { ObjectId } from "mongoose";
import { LeaseTerm, OrderDeliveryLocation, OrderStatus, OrderTab } from "../enums/order.enum";
import { Vehicle } from "./vehicle";


export interface Order {
    _id: ObjectId;
    orderTotal: number;
    orderLeaseTerm: LeaseTerm;
    orderDeliveryLocation: OrderDeliveryLocation;
    orderStartDate: Date;
    orderStatus: OrderStatus;
    memberId: ObjectId;
    vehicleId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    /** from aggregations **/
    vehicleData: Vehicle;
}

export interface OrderInput {
    orderLeaseTerm: LeaseTerm;
    orderDeliveryLocation: OrderDeliveryLocation;
    orderStartDate: Date;
    vehicleId: ObjectId;
}

export interface OrderInquiry {
  page: number;
  limit: number;
  tab: OrderTab;
}