import mongoose, { Schema } from "mongoose";
import { VehicleDriveTrain, VehicleFuelType, VehicleStatus, VehicleType } from "../libs/enums/vehicle.enum";
import { VehicleSpecs } from "../libs/types/vehicle";

const VehicleSpecsSchema = new Schema<VehicleSpecs>({
    power: { 
        type: Number, 
        required: true 
    },

    acceleration: { 
        type: Number, 
        required: true 
    },

    topSpeed: { 
        type: Number, 
        required: true 
    },

    fuel: {
        type: String,
        enum: VehicleFuelType,
        required: true
    },

    driveTrain: {
        type: String,
        enum: VehicleDriveTrain,
        required: true
    },

    seats: { 
        type: Number, 
        required: true 
    },
}, { _id: false }
);


const vehicleSchema = new Schema(
    {
        vehicleStatus: {
            type: String,
            enum: VehicleStatus,
            default: VehicleStatus.PAUSED
        },

        vehicleType: {
            type: String,
            enum: VehicleType,
            required: true
        },

        vehicleBrand: {
            type: String,
            required: true
        },

        vehicleModel: {
            type: String,
            required: true
        },

        vehicleYear: {
            type: Number,
            required: true
        },

        vehicleQuantity: {
            type: Number,
            required: true
        },

        vehiclePrice: {
            type: Number,
            required: true
        },

        vehicleRentedCount: {
            type: Number,
            default: 0
        },

        vehicleViews: {
            type: Number,
            default: 0
        },

        vehicleDesc: {
            type: String
        },

        vehicleSpecs: {
            type: VehicleSpecsSchema,
            required: true 
        },

        vehicleImages: {
            type: [String],
            default: []
        },

    }, { timestamps: true, collection: "vehicles" } //createdAt, updatedAt
);

vehicleSchema.index(
    { vehicleBrand: 1, vehicleModel: 1, vehicleYear: 1 },
    { unique: true }
);

export default mongoose.model("Vehicle", vehicleSchema);