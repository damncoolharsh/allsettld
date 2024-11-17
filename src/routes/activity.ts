import express, { Request, Response } from "express";
import Activity from "../models/activity";
import { check, validationResult } from "express-validator";

const router = express.Router();

router.get("/", async (req, res) => {
  const { userId, groupId, page } = req.query;

  if (!userId && !groupId) {
    return res
      .status(400)
      .json({ message: "Either User id or group id are required" });
  }

  try {
    const pageSize = 20;
    const pageNumber = parseInt(page ? page.toString() : "0");
    const activity = await Activity.find({ userId: userId, groupId: groupId })
      .skip(pageNumber)
      .limit(pageSize);
    const total = await Activity.countDocuments();

    res.json({
      data: activity,
      pagination: { page: pageNumber, pageSize: pageSize, total: total },
    });
  } catch (err) {
    console.log("🚀 ~ file: activity.ts:router.get ~ err:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/",
  [
    check("userId", "User id is required").isString(),
    check("groupId", "Group id is required").isString(),
    check("type", "Activity type is required").isString(),
    check("amount", "Amount is required").isNumeric(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const activity = new Activity(req.body);
      await activity.save();
      res.status(201).json({ message: "Success", data: activity });
    } catch (err) {
      console.log("🚀 ~ file: activity.ts:router.post ~ err:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
