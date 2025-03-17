import { Request, Response } from "express";
import Friend from "../models/friend";
import User from "../models/user";

export class FriendController {
  async getFriends(req: Request, res: Response) {
    try {
      const id = req.query?.id;
      if (!id) {
        return res.status(400).json({ message: "User id is required" });
      }

      const pageSize = 100;
      const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
      const friends = await Friend.find({ user_id: id })
        .populate("friend_id")
        .skip(pageNumber)
        .limit(pageSize);
      const total = await Friend.find({ user_id: id }).countDocuments();

      res.json({
        data: friends,
        pagination: { page: pageNumber, pageSize: pageSize, total: total },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async addFriend(req: Request, res: Response) {
    try {
      const { userId, name, mobileNumber } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User id are required" });
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
        user_id: userId,
        friend_id: friendId,
        friend_mobile: mobileNumber,
        friend_name: name,
      });

      await friend.save();
      res.json({ message: "Friend added successfully", data: friend });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteFriend(req: Request, res: Response) {
    try {
      const { userId, mobile } = req.query;
      if (!userId) {
        return res
          .status(400)
          .json({ message: "User id and friend id are required" });
      }
      await Friend.deleteOne({ user_id: userId, friend_mobile: mobile });
      res.json({ message: "Friend deleted successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
