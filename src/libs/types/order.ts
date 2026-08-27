import { ObjectId } from "mongoose";
import { LeaseTerm, OrderDeliveryLocation, OrderStatus } from "../enums/order.enum";


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
}

export interface OrderInput {
    orderLeaseTerm: LeaseTerm;
    orderDeliveryLocation: OrderDeliveryLocation;
    orderStartDate: Date;
    vehicleId: ObjectId;
}