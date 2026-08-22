import { shapeIntoMongooseObjectId } from "../libs/config";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { Vehicle, VehicleInput, VehicleUpdateInput } from "../libs/types/vehicle";
import VehicleModel from "../schema/Vehicle.model";

class VehicleService {
    private readonly vehicleModel;

    constructor() {
        this.vehicleModel = VehicleModel;
    }

    /* SPA */


    /* BSSR */
    public async getAllVehicles(): Promise<Vehicle[]> {
        const result =  await this.vehicleModel.find().exec();
        if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

        return result as unknown as Vehicle[];
    }


    public async createNewVehicle(input: VehicleInput): Promise<Vehicle> {
        try {
            return await this.vehicleModel.create(input) as unknown as Vehicle;
        } catch (err) {
            console.log("Error, createNewVehicle: ", err);
            throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
        }
    }

    public async updateChosenVehicle(id: string | string[], input: VehicleUpdateInput): Promise<Vehicle> {
        // string --> ObjectId
        id = shapeIntoMongooseObjectId(id);
        const result = await this.vehicleModel.findOneAndUpdate({ _id: id }, input, { new: true }).exec() // id orqali qidiradi --> kirib kelgan qiymatni qo'shadi --> o'zgargan qiymatni qaytaradi agar false bo'sa o'zgarguncha bo'gan qiymatni qaytaradi
        if(!result) 
            throw new Errors(HttpCode.NOT_FOUND, Message.UPDATE_FAILED);

        return result as unknown as Vehicle;
    }
    
};

export default VehicleService;