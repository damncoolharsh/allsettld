import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import Friend from "../models/friend";
import { check } from "express-validator";
import User, { UserType } from "../models/user";
import { FriendController } from "../controller/friend";

const router = express.Router();
const friendController = new FriendController();

router.get("/", verifyToken, friendController.getFriends);

router.post(
  "/addFriend",
  verifyToken,
  [
    check("userId", "User id is required").isNumeric(),
    check("balance", "Balance is required").isNumeric(),
    check("name", "Name is required").isString(),
    check("mobileNumber", "Mobile number is required").isString(),
  ],
  friendController.addFriend
);

router.post("/deleteFriend", verifyToken, friendController.deleteFriend);

export default router;
