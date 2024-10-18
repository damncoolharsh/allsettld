import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/auth";
import Expense, { MemberType } from "../models/expense";
import { check, validationResult } from "express-validator";

const router = express.Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({ message: "Group id is required" });
    }
    const pageSize = 40;
    const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
    const expenses = await Expense.find({ groupId: req.query.id })
      .skip(pageNumber)
      .limit(pageSize);
    const total = await Expense.countDocuments();

    res.json({
      data: expenses,
      message: "Success",
      pagination: { page: pageNumber, pageSize: pageSize, total: total },
    });
  } catch (err) {
    console.log("🚀 ~ file: expense.ts:router.get ~ err:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/addExpense",
  verifyToken,
  [
    check("groupId", "Group id is required").isString(),
    check("paidBy", "Paid by is required").isString(),
    check("amount", "Amount is required").isNumeric(),
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
      const { groupId, expenseDetails, amount } = req.body;
      let members: MemberType[] = [];
      for (let i = 0; i < expenseDetails.length; i++) {
        members.push({
          id: expenseDetails[i].id,
          balance: expenseDetails[i].balance,
        });
      }
      const newExpense = new Expense({
        amount: amount,
        date: new Date(),
        groupId: groupId,
        members: members,
      });

      await newExpense.save();
      res.json({ data: newExpense, message: "Expense added successfully" });
    } catch (err) {
      console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
);

router.post(
  "/updateExpense",
  verifyToken,
  [
    check("expenseId", "Expense id is required").isString(),
    check("amount", "Amount is required").isString(),
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
      const { expenseId, amount, expenseDetails } = req.body;
      let members: MemberType[] = [];
      for (let i = 0; i < expenseDetails.length; i++) {
        members.push({
          id: expenseDetails[i].id,
          balance: expenseDetails[i].balance,
        });
      }
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      expense.amount = amount;
      expense.members = members;
      await expense.save();
      res.json({ data: expense, message: "Expense updated successfully" });
    } catch (err) {
      console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
);

export default router;
