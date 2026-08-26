import {ObjectId} from "mongoose";
import { ViewGroup } from "../enums/view.enum";

export interface View {
  _id: ObjectId;
  viewGroup: ViewGroup;
  memberId: ObjectId;
  vehicleId: ObjectId;
  createdAt: Date;
  updateAt: Date;
}

export interface ViewInput {
  memberId: ObjectId;
  vehicleId: ObjectId;
  viewGroup: ViewGroup;
}