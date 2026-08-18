import VehicleModel from "../schema/Vehicle.model";

class VehicleService {
    private readonly vehicleModel;

    constructor() {
        this.vehicleModel = VehicleModel;
    }
};

export default VehicleService;