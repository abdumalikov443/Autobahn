import ReviewModel from "../schema/Review.model";

class ReviewService {
    private readonly reviewModel;

    constructor() {
        this.reviewModel = ReviewModel;
    }
};

export default ReviewService;