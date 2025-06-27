import { Auction } from '../models/auctionSchema.js';
import { User } from '../models/userSchema.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';

export const addNewAuctionItem = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Auction item image Required.", 400));
    }

    const { image } = req.files;

    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedFormats.includes(image.mimetype)) {
        return next(new ErrorHandler("Invalid image format. Allowed formats: jpeg, jpg, png, webp", 400));
    }

    const { title, description, startingBid, category, condition, startTime, endTime } = req.body;

    if(!title || !description || !startingBid || !category || !condition || !startTime || !endTime){
        return next(new ErrorHandler("Please provide all details.", 400));
    }

    if (new Date(startTime) < Date.now()) {
        return next(new ErrorHandler("Invalid start time.", 400));
    }
});