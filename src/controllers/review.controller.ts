import Errors from "../libs/Errors";
import { T } from "../libs/types/common";
import { Request, Response } from "express";
import ReviewService from "../models/Review.service";

const reviewService = new ReviewService();

const reviewController: T = {}

reviewController.getAllReviews = async (req: Request, res: Response) => {
    try {
        console.log("getAllReviews");
        res.send("done");
    } catch (err) {
        console.log("Error, getAllReviews:", err);
        if(err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};

export default reviewController;