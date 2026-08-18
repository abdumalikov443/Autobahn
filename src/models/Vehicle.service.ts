import Errors, { HttpCode, Message } from "../libs/Errors";
import { Vehicle, VehicleInput } from "../libs/types/vehicle";
import VehicleModel from "../schema/Vehicle.model";

class VehicleService {
    private readonly vehicleModel;

    constructor() {
        this.vehicleModel = VehicleModel;
    }

    /* SPA */


    /* BSSR */
    public async createNewVehicle(input: VehicleInput): Promise<Vehicle> {
        try{
            return await this.vehicleModel.create(input) as unknown as Vehicle;
        } catch (err) {
            console.log("Error, createNewVehicle: ", err);
           throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED); 
        }
    }
};

export default VehicleService;