import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import { check, validationResult } from "express-validator";
import Group from "../models/group";

const router = express.Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const id = req.query?.id;
    if (!id) {
      return res.status(400).json({ message: "Group id is required" });
    }

    const pageSize = 20;
    const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
    const groups = await Group.find({ members: { $in: [id] } })
      .skip(pageNumber)
      .limit(pageSize);
    console.log("🚀 ~ router.get ~ id:", id);
    const total = await Group.countDocuments();

    res.json({
      data: groups,
      pagination: { page: pageNumber, pageSize: pageSize, total: total },
    });
  } catch (err) {
    console.log("🚀 ~ file: group.ts:router.get ~ err:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/createGroup",
  verifyToken,
  [
    check("name", "Group name is required").not().isEmpty(),
    check("userId", "User id is required").isString(),
    check("description", "Description is required").isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name } = req.body;
      const newGroup = new Group({
        name: name,
        createdBy: req.body.userId,
        description: req.body.description,
      });
      await newGroup.save();
      res.json({ message: "Group created successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
);

router.post(
  "/updateGroup",
  verifyToken,
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
      await group.save();
      res.json({ message: "Group updated successfully" });
    } catch (err) {
      console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
);

export default router;
