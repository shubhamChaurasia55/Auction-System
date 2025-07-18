import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    userName:{
        type: String,
        minLength:[3, "Username must be at least 3 characters"],
        maxLength:[40, "Username must be at most 40 characters"],
    },
    password:{
        type: String,
        selected: false,
        minLength:[6, "Password must be at least 6 characters"],
    },
    email: String,
    address: String,
    phone:{
        type:String,
        minLength:[10, "Phone number must contains 10 characters"],
        maxLength:[10, "Phone number must contains 10 characters"],
    },
    profileImage:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        }
    },
    paymentMethods:{
        bankTransfer:{
            bankAccountNumber: String,
            bankAccountName: String,
            bankName: String,
        },
        UPI:{
            UPI_Id: String,
        },
        paypal:{
            paypalEmail: String,
        },
    },
    role:{
        type:String,
        enum:["Auctioneer", "Bidder", "Super Addmin"],
    },
    unpaidCommission:{
        type:Number,
        default:0,
    },
    auctionsWon:{
        type:Number,
        default:0,
    },
    moneySpent:{
        type:Number,
        default:0,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    }
});

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")){
        next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE,
    });
}

export const User = mongoose.model("User", userSchema);