import express from "express";
import { verifyToken } from "../middleware/auth";
import { check } from "express-validator";
import { ExpenseController } from "../controller/expense";

const router = express.Router();
const expenseController = new ExpenseController();

router.get("/", verifyToken, expenseController.getExpenseByGroupId);

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
  expenseController.addExpense
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
  expenseController.updateExpense
);

export default router;
