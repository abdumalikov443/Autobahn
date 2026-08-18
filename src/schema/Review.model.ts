import mongoose, { Schema } from "mongoose";
import { ReviewStatus } from "../libs/enums/review.enum";

const reviewSchema = new Schema({
    content: {
        type: String,
        required: true,
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "rating must be a whole number",
        },
    },

    reviewStatus: {
        type: String,
        enum: ReviewStatus,
        default: ReviewStatus.PENDING,
    },

    memberId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Member"
    },

    vehicleId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Vehicle"
    }
}, { timestamps: true, collection: "reviews" }
);

export default mongoose.model('Review', reviewSchema);