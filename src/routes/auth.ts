import express, { Request, Response } from "express";
import { body, check, validationResult } from "express-validator";

import { verifyToken } from "../middleware/auth";
import { AuthController } from "../controller/auth";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const router = express.Router();
const authController = new AuthController();

router.post(
  "/login",
  [
    check("email", "Invalid Email").isEmail(),
    check("password", "Password must be of minimum 6 length").isLength({
      min: 6,
    }),
  ],
  authController.login
);

router.post("/validate-token", verifyToken, authController.validateToken);

router.post("/logout", authController.logout);

export default router;
