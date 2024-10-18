import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import Friend from "../models/friend";
import { check } from "express-validator";
import User, { UserType } from "../models/user";

const router = express.Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = req.query?.id;
    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const pageSize = 20;
    const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
    const friends = await Friend.find({ userId: id })
      .skip(pageNumber)
      .limit(pageSize);
    const total = await Friend.countDocuments();

    let finalData: Friend[] = [];
    for (let item of friends) {
      let user: UserType | undefined | null = undefined;
      if (item.friendId) {
        user = await User.findOne({ _id: item.friendId });
      }
      finalData.push({
        _id: item._id.toString(),
        userId: item.userId,
        friendId: item.friendId,
        balance: item.balance,
        name: item?.name,
        mobileNumber: item?.mobileNumber,
        profilePic: user?.profilePic || "",
      });
    }

    res.json({
      data: finalData,
      pagination: { page: pageNumber, pageSize: pageSize, total: total },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/addFriend",
  verifyToken,
  [
    check("userId", "User id is required").isNumeric(),
    check("balance", "Balance is required").isNumeric(),
    check("name", "Name is required").isString(),
    check("mobileNumber", "Mobile number is required").isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { userId, name, mobileNumber } = req.body;
      if (!userId) {
        return res
          .status(400)
          .json({ message: "User id and friend id are required" });
      }
      let tempFriend = await Friend.findOne({
        userId: userId,
        mobileNumber: mobileNumber,
      });
      if (tempFriend) {
        return res.status(400).json({ message: "Friend already exists" });
      }
      let friendId = "";
      const user = await User.findOne({ mobile: mobileNumber });
      if (user) {
        friendId = user._id.toString();
      }
      const friend = new Friend({
        userId: userId,
        friendId: friendId,
        name: name,
        mobileNumber: mobileNumber,
        balance: 0,
      });

      await friend.save();
      res.json({ message: "Friend added successfully", data: friend });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/deleteFriend",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { userId, mobile } = req.body;
      if (!userId) {
        return res
          .status(400)
          .json({ message: "User id and friend id are required" });
      }
      await Friend.deleteOne({ userId: userId, mobileNumber: mobile });
      res.json({ message: "Friend deleted successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
