import Errors, { HttpCode, Message } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Request, Response } from "express";
import VehicleService from "../models/Vehicle.service";
import { AdminRequest, MemberRequest } from "../libs/types/member";
import { AdminVehicleInquiry, VehicleInput, VehicleInquiry } from "../libs/types/vehicle";
import { VehicleSortBy, VehicleStatus, VehicleType } from "../libs/enums/vehicle.enum";
import { wantsJson } from "../libs/config";

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

/**
 * Serves the browser the EJS page, and that page's fetch() the paginated rows.
 * Query params (JSON mode): page, limit, vehicleType, vehicleStatus, search.
 */
vehicleController.getAllVehicles = async (req: Request, res: Response) => {
    try {
        console.log("--getAllVehicles--");
        if (!wantsJson(req)) return res.render("vehicles", { page: "vehicles" });

        const { page, limit, vehicleType, vehicleStatus, search } = req.query;
        const inquiry: AdminVehicleInquiry = {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            vehicleType: vehicleType ? (vehicleType as VehicleType) : undefined,
            vehicleStatus: vehicleStatus ? (vehicleStatus as VehicleStatus) : undefined,
            search: search ? String(search) : undefined,
        };

        const result = await vehicleService.getAllVehicles(inquiry);
        res.status(HttpCode.OK).json({ data: result });
    } catch (err) {
        console.log("Error, getAllVehicles:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};


/**
 * Turns a multipart body into a VehicleInput.
 * The modal sends vehicleSpecs as a JSON string because multipart has no nested objects,
 * and mongoose will not auto-parse a string into a nested schema.
 */
const buildVehicleInput = (req: AdminRequest): VehicleInput => {
    if (!req.files?.length)
        throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

    const data: VehicleInput = req.body;
    if (typeof data.vehicleSpecs === "string") {
        try {
            data.vehicleSpecs = JSON.parse(req.body.vehicleSpecs);
        } catch (err) {
            throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
        }
    }

    data.vehicleImages = req.files.map((ele) => ele.path.replace(/\\/g, "/"));
    return data;
};


vehicleController.createNewVehicle = async (req: AdminRequest, res: Response) => {
    try {
        console.log("--createNewVehicle--");
        const data = buildVehicleInput(req);
        const result = await vehicleService.createNewVehicle(data);

        // The Add-vehicle modal posts with fetch and wants JSON; a plain form post
        // still gets the original alert + redirect.
        if (wantsJson(req)) return res.status(HttpCode.CREATED).json({ data: result });
        res.send(
            `<script> alert("Successful creation"); window.location.replace('/admin/vehicle/all') </script>`
        );
    } catch (err) {
        console.log("Error, createNewVehicle:", err);
        if (wantsJson(req)) {
            if (err instanceof Errors) return res.status(err.code).json(err);
            return res.status(Errors.standard.code).json(Errors.standard);
        }
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
