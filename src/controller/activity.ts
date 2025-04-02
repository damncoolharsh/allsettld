import { Request, Response } from "express";
import Activity from "../models/activity";
import GroupMember from "../models/groupMember";

export class ActivityController {
  async getActivity(req: Request, res: Response) {
    try {
      const groupId = req.query?.groupId as string;
      const userId = req.query?.userId as string;

      if (groupId) {
        const activities = await Activity.find({
          groupId: groupId,
        })
          .populate("userId")
          .populate("groupId")
          .sort({ timestamp: -1 });
        res.json({ data: activities });
        return;
      } else if (userId) {
        const groups = await GroupMember.find({
          member_id: userId,
        })
          .populate("group_id")
          .populate("member_id");
        const groupIds = groups.map((val) => val.group_id._id);
        const activities = await Activity.find({
          groupId: { $in: groupIds },
        })
          .populate("groupId")
          .populate("userId");
        res.json({ data: activities });
        return;
      } else {
        res.status(400).json({ message: "Group id or user id is required" });
      }
    } catch (err) {
      console.log("🚀 ~ file: activity.ts:router.get ~ err:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
