"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const expense_1 = __importDefault(require("../models/expense"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.get("/", auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.query.id) {
            return res.status(400).json({ message: "Group id is required" });
        }
        const pageSize = 40;
        const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
        const expenses = yield expense_1.default.find({ groupId: req.query.id })
            .skip(pageNumber)
            .limit(pageSize);
        const total = yield expense_1.default.countDocuments();
        res.json({
            data: expenses,
            message: "Success",
            pagination: { page: pageNumber, pageSize: pageSize, total: total },
        });
    }
    catch (err) {
        console.log("🚀 ~ file: expense.ts:router.get ~ err:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}));
router.post("/addExpense", auth_1.verifyToken, [
    (0, express_validator_1.check)("groupId", "Group id is required").isString(),
    (0, express_validator_1.check)("paidBy", "Paid by is required").isString(),
    (0, express_validator_1.check)("amount", "Amount is required").isNumeric(),
    (0, express_validator_1.check)("expenseDetails", "Expense details is required")
        .isArray()
        .not()
        .isEmpty(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { groupId, expenseDetails, amount } = req.body;
        let members = [];
        for (let i = 0; i < expenseDetails.length; i++) {
            members.push({
                id: expenseDetails[i].id,
                balance: expenseDetails[i].balance,
            });
        }
        const newExpense = new expense_1.default({
            amount: amount,
            date: new Date(),
            groupId: groupId,
            members: members,
        });
        yield newExpense.save();
        res.json({ data: newExpense, message: "Expense added successfully" });
    }
    catch (err) {
        console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
router.post("/updateExpense", auth_1.verifyToken, [
    (0, express_validator_1.check)("expenseId", "Expense id is required").isString(),
    (0, express_validator_1.check)("amount", "Amount is required").isString(),
    (0, express_validator_1.check)("expenseDetails", "Expense details is required")
        .isArray()
        .not()
        .isEmpty(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { expenseId, amount, expenseDetails } = req.body;
        let members = [];
        for (let i = 0; i < expenseDetails.length; i++) {
            members.push({
                id: expenseDetails[i].id,
                balance: expenseDetails[i].balance,
            });
        }
        const expense = yield expense_1.default.findById(expenseId);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        expense.amount = amount;
        expense.members = members;
        yield expense.save();
        res.json({ data: expense, message: "Expense updated successfully" });
    }
    catch (err) {
        console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
exports.default = router;
