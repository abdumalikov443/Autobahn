import Errors, { HttpCode } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Request, Response } from "express";
import ReviewService from "../models/Review.service";
import { ReviewInput } from "../libs/types/review";
import { MemberRequest } from "../libs/types/member";

const reviewService = new ReviewService();

const reviewController: T = {}

/* SPA */


/* BSSR */

reviewController.getAllReviews = async (req: Request, res: Response) => {
    try {
        console.log("--getAllReviews--");
        const result = await reviewService.getAllReviews();
        res.render("reviews", {vehicles: result});
        // res.status(HttpCode.OK).json({ data: result });
    } catch (err) {
        console.log("Error, getAllReviews:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
};


reviewController.createNewReview = async (req: MemberRequest, res: Response) => {
    try {
        console.log("--createNewReview--");
        const data:  ReviewInput = req.body;
        const result = await reviewService.createNewReview(req.member, data);

        res.status(HttpCode.CREATED).json({ data: result });
    } catch (err) {
        console.log("Error, createNewReview:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }

};


reviewController.updateChosenReview = async (req: Request, res: Response) => {
    try {
        console.log("--updateChosenReview--");
        const id = req.params.id;
        const result = await reviewService.updateChosenReview(id, req.body);
    } catch (err) {
        console.log("Error, updateChosenReview:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
}

export default reviewController;