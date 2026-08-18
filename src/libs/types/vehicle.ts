import { ObjectId } from "mongoose";
import { VehicleStatus, VehicleType } from "../enums/vehicle.enum";


export interface Vehicle {
  _id: ObjectId;
  vehicleStatus: VehicleStatus;
  vehicleType: VehicleType;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleQuantity: number;
  vehiclePrice: number;
  vehicleRentedCount: number;
  vehicleViews: number;
  vehicleDesc?: string;
  vehicleSpecs: VehicleSpecs;
  vehicleImages: string[];
}


export interface VehicleInput {
  vehicleStatus?: VehicleStatus;
  vehicleType: VehicleType;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleQuantity: number;
  vehiclePrice: number;
  vehicleRentedCount?: number;
  vehicleViews?: number;
  vehicleDesc?: string;
  vehicleSpecs: VehicleSpecs;
  vehicleImages?: string[];
}


export interface VehicleUpdateInput {
  _id: ObjectId;
  vehicleStatus?: VehicleStatus;
  vehicleType?: VehicleType;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleQuantity?: number;
  vehiclePrice?: number;
  vehicleRentedCount?: number;
  vehicleViews?: number;
  vehicleDesc?: string;
  vehicleSpecs?: VehicleSpecs;
  vehicleImages?: string[];
}

export interface VehicleSpecs {
  power: number;
  acceleration: number;
  topSpeed: number;
  fuel: string;
  driveTrain: string; // enum
  seats: number;
}