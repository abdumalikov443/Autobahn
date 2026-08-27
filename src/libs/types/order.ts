import { ObjectId } from "mongoose";
import { LeaseTerm, OrderDeliveryLocation, OrderStatus, OrderTab } from "../enums/order.enum";
import { Vehicle } from "./vehicle";
import { Member } from "./member";


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
    memberData: Member;
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

export interface AdminOrderInquiry {
  page: number;
  limit: number;
  orderStatus?: OrderStatus;   
  search?: string;              
}