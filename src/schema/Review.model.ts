import mongoose, { Schema } from "mongoose";
import { ReviewStatus } from "../libs/enums/review.enum";

const reviewSchema = new Schema({
    content: {
        type: String,
        required: true,
    },

    rating: {
        type: Number,
        default: 0,
    },

    reviewStatus: {
        type: String,
        enum: ReviewStatus,
        default: ReviewStatus.PAUSE,
    }
}, { timestamps: true, collection: "reviews" }
);

export default mongoose.model('Review', reviewSchema);