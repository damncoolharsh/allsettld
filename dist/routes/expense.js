"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const expense_1 = require("../controller/expense");
const router = express_1.default.Router();
const expenseController = new expense_1.ExpenseController();
router.get("/", auth_1.verifyToken, expenseController.getExpenseByGroupId);
router.post("/addExpense", auth_1.verifyToken, [
    (0, express_validator_1.check)("groupId", "Group id is required").isString(),
    (0, express_validator_1.check)("paidBy", "Paid by is required").isString(),
    (0, express_validator_1.check)("amount", "Amount is required").isNumeric(),
    (0, express_validator_1.check)("expenseDetails", "Expense details is required")
        .isArray()
        .not()
        .isEmpty(),
], expenseController.addExpense);
router.post("/updateExpense", auth_1.verifyToken, [
    (0, express_validator_1.check)("expenseId", "Expense id is required").isString(),
    (0, express_validator_1.check)("amount", "Amount is required").isString(),
    (0, express_validator_1.check)("expenseDetails", "Expense details is required")
        .isArray()
        .not()
        .isEmpty(),
], expenseController.updateExpense);
router.post("/settleAmount", auth_1.verifyToken, expenseController.settleAmount);
exports.default = router;
