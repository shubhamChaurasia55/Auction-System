import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
    if(!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Profile image Required.", 400));
    }

    const { profileImage } = req.files;

    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if(!allowedFormats.includes(profileImage.mimetype)) {
        return next(new ErrorHandler("Invalid image format. Allowed formats: jpeg, jpg, png, webp", 400));
    }

    const {
        userName,
        email,
        password,
        phone,
        address,
        role,
        bankAccountNumber,
        bankAccountName,
        bankName,
        UPI_Id,
        paypalEmail
    } = req.body;

    if(!userName || !email || !password || !phone || !address || !role) {
        return next(new ErrorHandler("Please fill all the required fields.", 400));
    }
    if(role == "Auctioneer") {
        if(!bankAccountNumber || !bankAccountName || !bankName) {
            return next(new ErrorHandler("Please fill all the payment method fields.", 400));
        }
        if(!UPI_Id) {
            return next(new ErrorHandler("Please fill all the payment method fields.", 400));
        }
        if(!paypalEmail) {
            return next(new ErrorHandler("Please fill all the payment method fields.", 400));
        }
    }

    const isRegistered = await User.findOne({email});
    if(isRegistered) {
        return next(new ErrorHandler("User already registered with this email.", 400));
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(profileImage.tempFilePath, {
        folder: "MERN_AUCTION_SYSTEM_USERS" 
    });

    if(!cloudinaryResponse || cloudinaryResponse.error) {
       console.log("Cloudinary upload failed:", cloudinaryResponse.error || "Unknown cloudinary error");
        return next(new ErrorHandler("Failed to upload profile image. Please try again.", 500));
    }

    const user = await User.create({
        userName,
        email,
        password,
        phone,
        address,
        role,
        profileImage: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        },
        paymentMethods: {
            bankTransfer: {
                bankAccountNumber,
                bankAccountName,
                bankName
            },
            UPI: {
                UPI_Id
            },
            paypal: {
                paypalEmail
            }
        }
    });
    generateToken(user, "User registered successfully.", 201, res);
    
});

export const login = catchAsyncErrors(async (req, res, next) => {

    const { email, password } = req.body;

    if(!email || !password) {
        return next(new ErrorHandler("Please fill all the required fields.", 400));
    }

    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHandler("User not found with this email.", 404));
    }
    const isPasswordMatch = await user.comparePassword(password);
    if(!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password.", 401));
    }

    generateToken(user, "User logged in successfully.", 200, res);
});

export const getProfile = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user
    });
});

export const logout = catchAsyncErrors(async (req, res, next) => {});

export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {});