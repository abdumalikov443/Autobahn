import { ObjectId } from "mongoose";
import { ReviewStatus } from "../enums/review.enum";
import { Member } from "./member";
import { Vehicle } from "./vehicle";

export interface Review {
    _id: ObjectId;
    reviewStatus: ReviewStatus;
    content: string;
    rating: number;
    memberId: ObjectId;
    vehicleId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    /** from aggregations **/
    memberData?: Member;
    vehicleData?: Vehicle;
}

/** Admin reviews table: server-side paging + filtering. */
export interface AdminReviewInquiry {
    page: number;
    limit: number;
    reviewStatus?: ReviewStatus;
    rating?: number;
    search?: string;
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