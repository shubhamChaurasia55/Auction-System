import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Commission } from "../models/commissionSchema.js";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";

export const deleteAuctionItem = catchAsyncErrors(async (req, res, next) => {
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

export const getAllPaymentProofs = catchAsyncErrors(async (req, res, next) => {
    let paymentProofs = await PaymentProof.find();
    res.status(200).json({
        success: true,
        paymentProofs,
    });
});

export const getPaymentProofDetail = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const paymentProofDetail = await PaymentProof.findById(id);

    // if (!paymentProofDetail) {
    //     return next(new ErrorHandler("Payment proof not found.", 404));
    // }

    res.status(200).json({
        success: true,
        paymentProofDetail,
    });
});

export const updateProofStatus = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    
    // Check if request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
        return next(new ErrorHandler("Request body is missing or empty.", 400));
    }
    
    const { status, amount } = req.body;
    
    // Validate required fields
    if (!status) {
        return next(new ErrorHandler("Status is required.", 400));
    }
    
    // Validate status value
    const validStatuses = ["Pending", "Approved", "Rejected", "Settled"];
    if (!validStatuses.includes(status)) {
        return next(new ErrorHandler("Invalid status value.", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid payment proof ID.", 400));
    } 

    let proof = await PaymentProof.findById(id);
    if (!proof) {
        return next(new ErrorHandler("Payment proof not found.", 404));
    }

    // Prepare update object
    const updateData = { status };
    if (amount !== undefined && amount !== null) {
        updateData.amount = amount;
    }
    
    // Update comment if provided
    const { comment } = req.body;
    if (comment !== undefined && comment !== null) {
        updateData.comment = comment;
    }

    proof = await PaymentProof.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        message: "Payment proof status updated successfully.",
        proof,
    });
});

export const deletePaymentProof = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    
    const proof = await PaymentProof.findById(id);
    if (!proof) {
        return next(new ErrorHandler("Payment proof not found.", 404));
    }

    await proof.deleteOne();
    res.status(200).json({
        success: true,
        message: "Payment proof deleted successfully.",
    });

});

export const fetchAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.aggregate([
        {
            $group:{
                _id: {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                    role: "$role"
                },
                count: { $sum: 1 },
            },
        },
        {
            $project:{
                month: "$_id.month",
                year: "$_id.year",
                role:"$_id.role",
                count: 1,
                _id: 0,
            },
        },
        {
            $sort: {
                year: 1,
                month: 1,
            }
        }
    ]);

    const bidders = users.filter((user) => user.role === "Bidder");
    const auctioneers = users.filter((user) => user.role === "Auctioneer");

    const transformDataToMonthelyArray = (data, totalMonths = 12) => {
        const result = Array(totalMonths).fill(0);

        data.forEach((item) => {
            result[item.month - 1] = item.count;
        });
        return result;
    };

    const biddersArray = transformDataToMonthelyArray(bidders);
    const auctioneersArray = transformDataToMonthelyArray(auctioneers);

    res.status(200).json({
        success: true,
        biddersArray,
        auctioneersArray,
    });
    
});

export const monthelyRevenue = catchAsyncErrors(async (req, res, next) => {
    const payments = await Commission.aggregate([
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" }
                },
                totalAmount: { $sum: "$amount" }
            },
        },
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1
            }
        }
    ]);

    const transformDataToMonthelyArray = (payments, totalMonths = 12) => {
        const result = Array(totalMonths).fill(0);

        payments.forEach((payment) => {
            result[payment._id.month - 1] = payment.totalAmount;
        });
        return result;
    }

    const totalMonthelyRevenue = transformDataToMonthelyArray(payments);

    res.status(200).json({
        success: true,
        totalMonthelyRevenue,
    });
});



