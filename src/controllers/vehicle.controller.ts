import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Request, Response } from "express";
import VehicleService from "../models/Vehicle.service";
import { AdminRequest } from "../libs/types/member";
import { VehicleInput } from "../libs/types/vehicle";

const vehicleService = new VehicleService();

const vehicleController: T = {}

/* SPA */


/* BSSR */

vehicleController.getAllVehicles = async (req: Request, res: Response) => {
    try {
        console.log("--getAllVehicles--");
        const data = await vehicleService.getAllVehicles();
        res.render("vehicles", {vehicles: data});
    } catch (err) {
        console.log("Error, getAllVehicles:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};


vehicleController.createNewVehicle = async (req: AdminRequest, res: Response) => {
    try {
        console.log("--createNewVehicle--");
        if (!req.files?.length)
            throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);

        const data: VehicleInput = req.body;
        if (typeof data.vehicleSpecs === 'string') {
            try {  // mongoose won't auto-parse a JSON string into a nested schema so that's why we need to parse it manually
                data.vehicleSpecs = JSON.parse(req.body.vehicleSpecs);
            } catch (err) {
                return res.status(400).json({ message: 'vehicleSpecs must be valid JSON' });
            }
        }

        data.vehicleImages = req.files.map(ele => {
            return ele.path.replace(/\\/g, "/");
        });

        await vehicleService.createNewVehicle(data);
        res.send(
            `<script> alert("Successful creation"); window.location.replace('admin/vehicle/all') </script>`
        );
    } catch (err) {
        console.log("Error, createNewVehicle:", err);
        const message = err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
        res.send(
            `<script> alert("${message}"); window.location.replace('admin/vehicle/all') </script>`
        );
    }
};


vehicleController.updateChosenVehicle = async (req: Request, res: Response) => {
    try {
        console.log("--updateChosenVehicle--");
        const id = req.params.id;

        const result = await vehicleService.updateChosenVehicle(id, req.body);

        res.status(HttpCode.OK).json({ data: result });
    } catch (err) {
        console.log("Error, updateChosenVehicle:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};

export default vehicleController;
