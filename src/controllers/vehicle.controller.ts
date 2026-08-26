import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Request, Response } from "express";
import VehicleService from "../models/Vehicle.service";
import { AdminRequest, MemberRequest } from "../libs/types/member";
import { VehicleInput, VehicleInquiry } from "../libs/types/vehicle";
import { VehicleSortBy, VehicleType } from "../libs/enums/vehicle.enum";

const vehicleService = new VehicleService();

const vehicleController: T = {}

/* SPA */

vehicleController.getTopVehicles = async (req: Request, res: Response) => {
    try {
        console.log("getTopVehicles");

        const result = await vehicleService.getTopVehicles();

        res.status(HttpCode.OK).json(result)
    } catch (err) {
        console.log("Error, getTopVehicles:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
}

vehicleController.getVehicles = async (req: Request, res: Response) => {
    try {
        console.log("getVehicles");
        const {page, limit, order, search, vehicleType} = req.query;

        const isValidSort = (value: string): value is VehicleSortBy =>
        Object.values(VehicleSortBy).includes(value as VehicleSortBy);

        const inquiry: VehicleInquiry = {
            order:  isValidSort(order as string) ? (order as VehicleSortBy) : VehicleSortBy.POPULAR,
            page: Number(page),
            limit: Number(limit),
        };
        if (vehicleType) {
            inquiry.vehicleType = vehicleType as VehicleType;
        }
        if (search) inquiry.search = String(search);

        const result = await vehicleService.getVehicles(inquiry);

        res.status(HttpCode.OK).json({data: result});
    } catch (err) {
        console.log("Error, getVehicles:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
}

vehicleController.getVehicle = async (req: MemberRequest, res: Response) => {
    try {
        console.log("getVehicle");

        const { id } = req.params;
        console.log("req.member-->", req.member);

        const memberId = req.member?._id ?? null; // @ts-ignore
        const result = await vehicleService.getVehicle(memberId, id);

        res.status(HttpCode.OK).json({data: result});
    } catch(err) {
       console.log("Error, getVehicle:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard); 
    }
}


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
            `<script> alert("Successful creation"); window.location.replace('/admin/vehicle/all') </script>`
        );
    } catch (err) {
        console.log("Error, createNewVehicle:", err);
        const message = err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
        res.send(
            `<script> alert("${message}"); window.location.replace('/admin/vehicle/all') </script>`
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
