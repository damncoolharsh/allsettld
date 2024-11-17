import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import { check, validationResult } from "express-validator";
import Group, { GroupType } from "../models/group";
import upload from "../utils/upload";

const router = express.Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = req.query?.id;
    if (!id) {
      return res.status(400).json({ message: "Group id is required" });
    }

    if (req.query?.groupId) {
      const group = await Group.findOne({ _id: req.query.groupId });
      if (!group) {
        return res.status(400).json({ message: "Group not found" });
      }
      return res.json({ data: group });
    } else {
      const pageSize = 20;
      const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
      const groups = await Group.find({ members: { $in: [id] } })
        .populate(["currentActivity.memberId", "currentActivity.to"])
        .skip(pageNumber)
        .limit(pageSize);
      const total = await Group.find({
        members: { $in: [id] },
      }).countDocuments();

      res.json({
        data: groups,
        pagination: { page: pageNumber, pageSize: pageSize, total: total },
      });
    }
  } catch (err) {
    console.log("🚀 ~ file: group.ts:router.get ~ err:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/createGroup",
  verifyToken,
  upload.single("image"),
  [
    check("name", "Group name is required").not().isEmpty(),
    check("userId", "User id is required").isString(),
    check("description", "Description is required").isString(),
  ],
  async (req: Request, res: Response) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name } = req.body;
      const image = req.file?.path;
      const newGroup = new Group({
        name: name,
        createdBy: req.body.userId,
        description: req.body.description,
        members: [req.body.userId],
        image: image,
      });
      await newGroup.save();
      res.json({ message: "Group created successfully", data: newGroup });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
);

router.post(
  "/updateGroup",
  verifyToken,
  upload.single("image"),
  [check("groupId", "Group Id is required").not().isEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, groupId, members } = req.body;
      const group = await Group.findOne({ _id: groupId });
      if (!group) {
        res.status(400).json({ message: "Group not found" });
        return;
      }
      if (name) group.name = name;
      if (description) group.description = description;
      if (members) group.members = members;
      if (req.file?.path) group.image = req.file.path;
      await group.save();
      res.json({ message: "Group updated successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
);

router.post(
  "/addExpense",
  verifyToken,
  [
    check("groupId", "Group id is required").isString(),
    check("paidBy", "Paid by is required").isString(),
    check("expenseDetails", "Expense details is required")
      .isArray()
      .not()
      .isEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { groupId, expenseDetails, amount, paidBy } = req.body;
      const currentGroup = await Group.findById(groupId);
      if (!currentGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      let newActivity: GroupType["currentActivity"] = [];
      expenseDetails.forEach((element: any) => {
        let activityObj = {
          memberId: element.id,
          amount: element.amount,
          to: paidBy,
        };
        const memberOwes = currentGroup.currentActivity.findIndex(
          (activity) => {
            return (
              activity.memberId.toString() === element.id &&
              activity.to.toString() === paidBy
            );
          }
        );
        const memberRecieves = currentGroup.currentActivity.findIndex(
          (activity) =>
            activity.to.toString() === element.id &&
            activity.memberId.toString() === paidBy
        );
        const currentBalance =
          (currentGroup.currentActivity?.[memberOwes]?.amount || 0) -
          (currentGroup.currentActivity?.[memberRecieves]?.amount || 0) +
          element.amount;
        activityObj =
          currentBalance > 0
            ? { memberId: element.id, amount: currentBalance, to: paidBy }
            : {
                memberId: paidBy,
                amount: Math.abs(currentBalance),
                to: element.id,
              };
        if (currentBalance === 0) return;
        if (memberOwes !== -1) {
          newActivity[memberOwes] = activityObj;
        } else if (memberRecieves !== -1) {
          newActivity[memberRecieves] = activityObj;
        } else {
          newActivity.push(activityObj);
        }
      });

      currentGroup.currentActivity = newActivity;
      await currentGroup.save();
      res.json({ message: "Expense added successfully", data: currentGroup });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(500).json({});
    }
  }
);

export default router;
