import express from 'express';
import {
    deleteAuctionItem,
    deletePaymentProof,
    getAllPaymentProofs,
    getPaymentProofDetail,
    updateProofStatus,
    fetchAllUsers
    
} from "../controllers/superAdminController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";

const router = express.Router();

router.delete("/auctionitem/delete/:id", isAuthenticated, isAuthorized("Super Admin"), deleteAuctionItem);

router.get("/paymentproofs/getall", isAuthenticated, isAuthorized("Super Admin"), getAllPaymentProofs);

router.get("/paymentproof/:id", isAuthenticated, isAuthorized("Super Admin"), getPaymentProofDetail);

router.put("/paymentproof/status/update/:id", isAuthenticated, isAuthorized("Super Admin"), updateProofStatus);

router.delete("/paymentproof/delete/:id", isAuthenticated, isAuthorized("Super Admin"), deletePaymentProof);

router.get("/users/getall", isAuthenticated, isAuthorized("Super Admin"), fetchAllUsers);

export default router;