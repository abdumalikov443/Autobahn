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
        res.render("vehicles");
    } catch (err) {
        console.log("Error, getAllVehicles:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};


vehicleController.createNewVehicle = async (req: AdminRequest, res: Response) => {
    try {
        console.log("--createNewVehicle--");
        console.log("req.files: ", req.files);
        if (!req.files?.length)
            throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);

        const data: VehicleInput = req.body;
        data.vehicleImages = req.files.map(ele => {
            return ele.path.replace(/\\/g, "/");
        });
        console.log("data: ", data);

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
    } catch (err) {
        console.log("Error, updateChosenVehicle:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};

export default vehicleController;
