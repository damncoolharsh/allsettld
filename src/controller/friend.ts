import { Request, Response } from "express";
import Friend from "../models/friend";
import User from "../models/user";
import Balance from "../models/balance";
import { ObjectId } from "mongodb";

export class FriendController {
  async getFriends(req: Request, res: Response) {
    try {
      const id = req.query?.id;
      if (!id) {
        return res.status(400).json({ message: "User id is required" });
      }

      const pageSize = 100;
      const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
      const friendsData = await Friend.find({
        user_id: new ObjectId(id as string),
      })
        .populate("friend_id")
        .skip(pageNumber)
        .limit(pageSize);
      const total = await Friend.find({
        user_id: new ObjectId(id as string),
      }).countDocuments();
      const friends = friendsData.map((val) => val.toJSON());
      for (let i = 0; i < friends.length; i++) {
        const balance: any = await Balance.find({
          $or: [
            {
              $and: [
                { payer_id: friends[i].friend_id?._id || "NA" },
                { payee_id: id || "NA" },
              ],
            },
            {
              $and: [
                { payer_id: id || "NA" },
                { payee_id: friends[i].friend_id?._id || "NA" },
              ],
            },
            {
              $and: [
                { payee_mobile: friends[i].friend_mobile || "NA" },
                { payee_id: id || "NA" },
              ],
            },
            {
              $and: [
                { payer_id: id || "NA" },
                { payee_mobile: friends[i].friend_mobile || "NA" },
              ],
            },
          ],
        });
        let amount = 0;
        for (let j = 0; j < balance.length; j++) {
          if (balance[j].payer_id === id) {
            amount += balance[j].amount;
          } else {
            amount -= balance[j].amount;
          }
        }
        friends[i].balance = amount;
      }

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
      const { userId, name, mobile } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User id are required" });
      }
      let tempFriend = await Friend.findOne({
        user_id: userId,
        friend_mobile: mobile,
      });
      if (tempFriend) {
        return res.status(400).json({ message: "Friend already exists" });
      }
      let friendId = "";
      const user = await User.findOne({ mobile: mobile });
      if (user) {
        friendId = user._id.toString();
      }
      const friend = new Friend({
        user_id: userId,
        friend_id: friendId || null,
        friend_mobile: mobile,
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
      const { userId, mobile } = req.body;
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
