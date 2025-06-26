import mongoose from "mongoose";

export const connection = () => {
    mongoose
        .connect(process.env.MONGO_URI, {
            dbName:"AUCTION_PLATFORM"
        })
        .then((data) => {
            console.log(`MongoDB connected with server: ${data.connection.host}`);
        })
        .catch((error) => {
            console.error("MongoDB connection error:", error);
        });
}
