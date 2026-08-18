import Errors, { Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Request, Response } from "express";
import VehicleService from "../models/Vehicle.service";

const vehicleService = new VehicleService();

const vehicleController: T = {}

vehicleController.getAllVehicles = async (req: Request, res: Response) => {
    try { 
        console.log("getAllVehicles");
        res.render("vehicles");
    } catch (err) {
        console.log("Error, getAllVehicles:", err);
        if(err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};


vehicleController.createNewVehicle = async (req: Request, res: Response) => {
    try { 
        console.log("createNewVehicle");
        res.send("Done");
    } catch (err) {
        console.log("Error, createNewVehicle:", err);
        if(err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};


vehicleController.updateChosenVehicle = async (req: Request, res: Response) => {
    try { 
        console.log("updateChosenVehicle");
    } catch (err) {
        console.log("Error, updateChosenVehicle:", err);
        if(err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};

export default vehicleController;
