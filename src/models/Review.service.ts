import { shapeIntoMongooseObjectId } from "../libs/config";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { Member } from "../libs/types/member";
import { Review, ReviewInput, ReviewUpdateInput } from "../libs/types/review";
import ReviewModel from "../schema/Review.model";

class ReviewService {
    private readonly reviewModel;

    constructor() {
        this.reviewModel = ReviewModel;
    }


    public async getAllReviews(): Promise<Review[]> {
        const result = await this.reviewModel.find().exec();
        if (!result)
            throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

        return result as unknown as Review[];
    }

    public async createNewReview(member: Member, input: ReviewInput): Promise<Review> {
        try {
            const newReview = { ...input, memberId: member._id };
            return await this.reviewModel.create(newReview) as unknown as Review;
        } catch (err) {
            console.log("Error, createNewReview: ", err);
            throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
        }
    }

    public async updateChosenReview(id: string | string[], input: ReviewUpdateInput): Promise<Review> {
        id = shapeIntoMongooseObjectId(id);
        const result = await this.reviewModel
            .findOneAndUpdate({ _id: id }, input, { new: true })
            .exec();
        if (!result) 
            throw new Errors(HttpCode.BAD_REQUEST, Message.UPDATE_FAILED);

        return result as unknown as Review;
    }
};

export default ReviewService;