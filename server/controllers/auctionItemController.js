import { Auction } from '../models/auctionSchema.js';
import { User } from '../models/userSchema.js';
import { Bid } from "../models/bidSchema.js";
import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

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

    if (!title || !description || !startingBid || !category || !condition || !startTime || !endTime) {
        return next(new ErrorHandler("Please provide all details.", 400));
    }

    if (new Date(startTime) < Date.now()) {
        return next(new ErrorHandler("Invalid start time.", 400));
    }

    if (new Date(endTime) <= new Date(startTime)) {
        return next(new ErrorHandler("End time must be after start time.", 400));
    }
    const alreadyOneAuctionActive = await Auction.findOne({
        createdBy: req.user._id,
        endTime: { $gte: Date.now() },
    });
    if (alreadyOneAuctionActive) {
        return next(new ErrorHandler("You already have an active auction.", 400));
    }

    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(image.tempFilePath, {
            folder: "MERN_AUCTION_SYSTEM_AUCTIONS"
        });

        if (!cloudinaryResponse || cloudinaryResponse.error) {
            console.log("Cloudinary upload failed:", cloudinaryResponse.error || "Unknown cloudinary error");
            return next(new ErrorHandler("Failed to upload auction image. Please try again.", 500));
        }
        const auctionItem = await Auction.create({
            title,
            description,
            startingBid, 
            category,
            condition,
            startTime,
            endTime,
            image: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url
            },
            createdBy: req.user._id,
            
        });
        return res.status(201).json({
            success: true,
            message: `Auction item created successfully and will be listed on auction page at ${startTime}.`,
            auctionItem,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message || "Failed to create auction item. Please try again.", 500));
    }

});

export const getAllItems = catchAsyncErrors(async (req, res, next) => {
    const items = await Auction.find();
    res.status(200).json({
        success: true,
        items,
    });
});



export const getAuctionDetails = catchAsyncErrors(async (req, res, next) => {

    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid auction ID.", 400));
    }
    const auctionItem = await Auction.findById(id);

    if (!auctionItem) {
        return next(new ErrorHandler("Auction item not found.", 404));
    }

    const bidders = auctionItem.bids.sort((a,b) => b.bid - a.bid);
    res.status(200).json({
        success: true,
        auctionItem,
        bidders,
    });
});

export const getMyAuctionItems = catchAsyncErrors(async (req, res, next) => {
    const items = await Auction.find({ createdBy: req.user._id });
    res.status(200).json({
        success: true,
        items,
    });
});

export const removeFromAuction = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid auction ID.", 400));
    }
    const auctionItem = await Auction.findById(id);

    if (!auctionItem) {
        return next(new ErrorHandler("Auction item not found.", 404));
    }

    await auctionItem.deleteOne();
    res.status(200).json({
        success: true,
        message: "Auction item removed successfully.",
    });
});


export const republishItem = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid auction ID.", 400));
    }
    let auctionItem = await Auction.findById(id);

    if (!auctionItem) {
        return next(new ErrorHandler("Auction item not found.", 404));
    }

    if (new Date(auctionItem.endTime) > Date.now()) {
        return next(new ErrorHandler("Auction item is still active. Cannot republish.", 400));
    }

    if (!req.body || !req.body.startTime || !req.body.endTime) {
        return next(new ErrorHandler("Please provide startTime and endTime for republishing.", 400));
    }

    let data = {
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
    };

    if(data.startTime < Date.now()) {
        return next(new ErrorHandler("Invalid start time. Start time must be in the future.", 400));
    };

    if(data.endTime <= data.startTime) {
        return next(new ErrorHandler("End time must be after start time.", 400));
    }

    if(auctionItem.highestBidder){
        const highestBidder = await User.findById(auctionItem.highestBidder);
        highestBidder.moneySpent -= auctionItem.currentBid;
        highestBidder.auctionsWon -= 1;  
        highestBidder.save();
    }

    data.bids = [];
    data.commissionCalculated = false;
    data.currentBid = 0;
    data.highestBidder = null;

    auctionItem = await Auction.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    await Bid.deleteMany({ auctionItem: auctionItem._id });

    const createdBy = await User.findByIdAndUpdate(req.user._id, { unpaidCommission: 0 },
        {
            new: true,
            runValidators: false,
            useFindAndModify: false,
        }   
    );
    res.status(200).json({
        success: true,
        message: "Auction item republished successfully.",
        auctionItem,
        createdBy
    });


});