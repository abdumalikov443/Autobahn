import { shapeIntoMongooseObjectId } from "../libs/config";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { Member } from "../libs/types/member";
import { AdminReviewInquiry, Review, ReviewInput, ReviewUpdateInput } from "../libs/types/review";
import { ReviewStatus } from "../libs/enums/review.enum";
import { T } from "../libs/types/common";
import ReviewModel from "../schema/Review.model";

class ReviewService {
    private readonly reviewModel;

    constructor() {
        this.reviewModel = ReviewModel;
    }


    public async getAllReviews(
        inquiry: AdminReviewInquiry
    ): Promise<{ data: Review[]; total: number }> {
        const match: T = {};
        if (inquiry.reviewStatus) match.reviewStatus = inquiry.reviewStatus;
        if (inquiry.rating) match.rating = inquiry.rating;

        const pipeline: any[] = [
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                    $lookup: {
                        from: "members",
                        localField: "memberId",
                        foreignField: "_id",
                        as: "memberData",
                    },
                },
                { $unwind: { path: "$memberData", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "vehicles",
                        localField: "vehicleId",
                        foreignField: "_id",
                        as: "vehicleData",
                    },
                },
                { $unwind: { path: "$vehicleData", preserveNullAndEmptyArrays: true } },
        ];

        // Search spans the joined member / vehicle, so it must run after the lookups.
        if (inquiry.search) {
            const rgx = new RegExp(inquiry.search, "i");
            pipeline.push({
                $match: {
                    $or: [
                        { content: { $regex: rgx } },
                        { "memberData.memberNick": { $regex: rgx } },
                        { "vehicleData.vehicleBrand": { $regex: rgx } },
                        { "vehicleData.vehicleModel": { $regex: rgx } },
                    ],
                },
            });
        }

        pipeline.push({
            $facet: {
                data: [
                    { $skip: (inquiry.page - 1) * inquiry.limit },
                    { $limit: inquiry.limit },
                    {
                        $project: {
                            content: 1,
                            rating: 1,
                            reviewStatus: 1,
                            createdAt: 1,
                            "memberData._id": 1,
                            "memberData.memberNick": 1,
                            "memberData.memberImage": 1,
                            "vehicleData._id": 1,
                            "vehicleData.vehicleBrand": 1,
                            "vehicleData.vehicleModel": 1,
                            "vehicleData.vehicleType": 1,
                            "vehicleData.vehicleImages": 1,
                        },
                    },
                ],
                metaCounter: [{ $count: "total" }],
            },
        });

        const [result] = await this.reviewModel.aggregate(pipeline).exec();

        return {
            data: (result?.data ?? []) as Review[],
            total: result?.metaCounter[0]?.total ?? 0,
        };
    }

    /**
     * Approved reviews for the storefront. Passing a vehicleId narrows it to one
     * car's review list; without it you get the newest approved reviews overall.
     * PENDING and REJECTED are never exposed publicly.
     */
    public async getApprovedReviews(
        limit: number,
        vehicleId?: string
    ): Promise<Review[]> {
        const match: T = { reviewStatus: ReviewStatus.APPROVED };
        if (vehicleId) match.vehicleId = shapeIntoMongooseObjectId(vehicleId);

        const result = await this.reviewModel
            .aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: "members",
                        localField: "memberId",
                        foreignField: "_id",
                        as: "memberData",
                    },
                },
                { $unwind: { path: "$memberData", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "vehicles",
                        localField: "vehicleId",
                        foreignField: "_id",
                        as: "vehicleData",
                    },
                },
                { $unwind: { path: "$vehicleData", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        content: 1,
                        rating: 1,
                        reviewStatus: 1,
                        createdAt: 1,
                        "memberData._id": 1,
                        "memberData.memberNick": 1,
                        "memberData.memberImage": 1,
                        "memberData.memberAddress": 1,
                        "vehicleData._id": 1,
                        "vehicleData.vehicleBrand": 1,
                        "vehicleData.vehicleModel": 1,
                    },
                },
            ])
            .exec();

        return result as unknown as Review[];
    }

    public async createNewReview(member: Member, input: ReviewInput): Promise<Review> {
        try {
            // Fields are whitelisted, not spread: a client sending reviewStatus
            // could otherwise publish its own review straight to APPROVED.
            const newReview = {
                content: input.content,
                rating: input.rating,
                vehicleId: input.vehicleId,
                memberId: member._id,
                reviewStatus: ReviewStatus.PENDING,
            };
            return await this.reviewModel.create(newReview) as unknown as Review;
        } catch (err) {
            console.log("Error, createNewReview: ", err);
            throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
        }
    }

    public async updateChosenReview(id: string | string[], input: ReviewUpdateInput): Promise<Review> {
        const reviewId = shapeIntoMongooseObjectId(id);
        const { _id, ...changes } = input;

        const result = await this.reviewModel
            .findOneAndUpdate({ _id: reviewId }, changes, { new: true })
            .exec();
        if (!result)
            throw new Errors(HttpCode.BAD_REQUEST, Message.UPDATE_FAILED);

        return result as unknown as Review;
    }
};

export default ReviewService;