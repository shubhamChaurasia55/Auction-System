import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/userSchema.js';
import { PaymentProof } from "../models/commissionProofSchema.js";
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { Auction } from '../models/auctionSchema.js';

export const calculateCommission = async (auctionId) => {
  const auction = await Auction.findById(auctionId);
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    return next(new ErrorHandler("Invalid Auction Id format.", 400));
  }
  const commissionRate = 0.05;
  const commission = auction.currentBid * commissionRate;
  return commission;
};

export const proofOfCommission = catchAsyncErrors(async(req, res, next)=>{
    if(!req.files || Object.keys(req.files).length === 0){
        return next(new ErrorHandler("Payment Proof screenshot required.", 400));
    }

    const { proof } = req.files;
    const {amount, comment} = req.body;
    const user = await User.findById(req.user._id);

    if(!amount || !comment){
        return next(new ErrorHandler("Please provide all (amount, comment) details.", 400));
    }

    if(user.unpaidCommission === 0){
        return res.status(200).json({
            success: true,
            message: "You have no unpaid commission.",
        });
    } 
    if(user.unpaidCommission < amount){
        return next(new ErrorHandler("You cannot claim more than your unpaid commission.", 400));
    }

    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if(!allowedFormats.includes(proof.mimetype)) {
        return next(new ErrorHandler("Screenshot must be in JPEG, JPG, PNG, or WEBP format.", 400));
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(proof.tempFilePath, {
        folder: "MERN_AUCTION_PAYMENT_PROOFS" 
    });

    if(!cloudinaryResponse || cloudinaryResponse.error) {
       console.log("Cloudinary upload failed:", cloudinaryResponse.error || "Unknown cloudinary error");
        return next(new ErrorHandler("Failed to upload payment proof. Please try again.", 500));
    }

    const commissionProof = await PaymentProof.create({
        user_id: req.user._id,
        
        proof: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        },
        amount,
        comment,
    });

    res.status(201).json({
        success: true,
        message: "Payment proof submitted successfully.",
        commissionProof
    });
});
