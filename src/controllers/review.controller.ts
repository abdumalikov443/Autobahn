import Errors, { HttpCode } from "../libs/Errors";
import { T } from "../libs/types/common";
import { Request, Response } from "express";
import ReviewService from "../models/Review.service";
import { AdminReviewInquiry, ReviewInput } from "../libs/types/review";
import { MemberRequest } from "../libs/types/member";
import { ReviewStatus } from "../libs/enums/review.enum";
import { wantsJson } from "../libs/config";

const reviewService = new ReviewService();

const reviewController: T = {}

/* SPA */


/* BSSR */

/**
 * Serves the browser the EJS page, and that page's fetch() the paginated rows.
 * Query params (JSON mode): page, limit, reviewStatus, rating, search.
 */
reviewController.getAllReviews = async (req: Request, res: Response) => {
    try {
        console.log("--getAllReviews--");
        if (!wantsJson(req)) return res.render("reviews", { page: "reviews" });

        const { page, limit, reviewStatus, rating, search } = req.query;
        const inquiry: AdminReviewInquiry = {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            reviewStatus: reviewStatus ? (reviewStatus as ReviewStatus) : undefined,
            rating: rating ? Number(rating) : undefined,
            search: search ? String(search) : undefined,
        };

        const result = await reviewService.getAllReviews(inquiry);
        res.status(HttpCode.OK).json({ data: result });
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

        res.status(HttpCode.OK).json({ data: result });
    } catch (err) {
        console.log("Error, updateChosenReview:", err);
        if (err instanceof Errors) res.status(err.code).json(err);
        else res.status(Errors.standard.code).json(Errors.standard);
    }
}

export default reviewController;