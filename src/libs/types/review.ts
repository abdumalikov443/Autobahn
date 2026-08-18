import { ObjectId } from "mongoose";
import { ReviewStatus } from "../enums/review.enum";

export interface Review {
    _id: ObjectId;
    reviewStatus: ReviewStatus;
    content: string;
    rating: number;
    memberId: ObjectId;
    vehicleId: ObjectId;
}

export interface ReviewInput {
    content: string;
    rating: number;
    vehicleId: ObjectId;
}

export interface ReviewUpdateInput {
    _id: ObjectId;
    reviewStatus: ReviewStatus;
}