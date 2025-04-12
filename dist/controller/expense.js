"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ExpenseController = void 0;
const expense_1 = __importDefault(require("../models/expense"));
const express_validator_1 = require("express-validator");
const expenseSplit_1 = __importDefault(require("../models/expenseSplit"));
const balance_1 = __importDefault(require("../models/balance"));
const activity_1 = __importStar(require("../models/activity"));
class ExpenseController {
    getExpenseByGroupId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.query.id) {
                    return res.status(400).json({ message: "Group id is required" });
                }
                const pageSize = 40;
                const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
                const expenses = yield expense_1.default.find({
                    group_id: req.query.id,
                })
                    .skip(pageNumber)
                    .populate("paid_by")
                    .limit(pageSize);
                const finalExpenses = expenses.map((val) => val.toJSON());
                const total = yield expense_1.default.countDocuments();
                for (let i = 0; i < finalExpenses.length; i++) {
                    finalExpenses[i].split = yield expenseSplit_1.default.find({
                        expense_id: expenses[i]._id,
                    }).populate("user_id");
                }
                res.json({
                    data: finalExpenses,
                    message: "Success",
                    pagination: { page: pageNumber, pageSize: pageSize, total: total },
                });
            }
            catch (err) {
                console.log("🚀 ~ file: expense.ts:router.get ~ err:", err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    addExpense(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const { groupId, expenseDetails, amount, paidBy } = req.body;
                const newExpense = new expense_1.default({
                    amount: amount,
                    date: new Date(),
                    group_id: groupId,
                    paid_by: paidBy,
                    description: req.body.description,
                });
                let memberSplits = [];
                for (let i = 0; i < expenseDetails.length; i++) {
                    const split = new expenseSplit_1.default({
                        amount: Number(expenseDetails[i].balance).toFixed(3),
                        expense_id: newExpense._id,
                        user_id: expenseDetails[i].id,
                        user_name: expenseDetails[i].name,
                        user_mobile: expenseDetails[i].mobile,
                    });
                    if (expenseDetails[i].id !== paidBy) {
                        let balance = yield balance_1.default.findOne({
                            $and: [
                                {
                                    group_id: groupId,
                                },
                                {
                                    $or: [
                                        {
                                            $and: [
                                                { payer_id: expenseDetails[i].id || "NA" },
                                                { payee_id: paidBy || "NA" },
                                            ],
                                        },
                                        {
                                            $and: [
                                                { payer_id: paidBy || "NA" },
                                                { payee_id: expenseDetails[i].id || "NA" },
                                            ],
                                        },
                                        {
                                            $and: [
                                                { payer_id: paidBy || "NA" },
                                                { payee_mobile: expenseDetails[i].mobile || "NA" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        });
                        if (!balance) {
                            balance = new balance_1.default({
                                group_id: groupId,
                                payer_id: paidBy,
                                payee_id: expenseDetails[i].id,
                                payee_mobile: expenseDetails[i].mobile,
                                amount: expenseDetails[i].balance,
                            });
                        }
                        else {
                            if (expenseDetails[i].id) {
                                if (balance.payer_id === expenseDetails[i].id) {
                                    balance.amount -= expenseDetails[i].balance;
                                }
                                else {
                                    balance.amount += expenseDetails[i].balance;
                                }
                            }
                            else {
                                if (balance.payer_mobile === expenseDetails[i].mobile) {
                                    balance.amount -= expenseDetails[i].balance;
                                }
                                else {
                                    balance.amount += expenseDetails[i].balance;
                                }
                            }
                        }
                        yield balance.save();
                    }
                    yield split.save();
                    memberSplits.push(split);
                }
                const activity = new activity_1.default({
                    groupId: groupId,
                    userId: paidBy,
                    activityType: activity_1.ActivityType.EXPENSE_ADDED,
                    details: {
                        expenseAmount: amount,
                        expenseSplit: memberSplits,
                        expenseDescription: req.body.description,
                    },
                    timestamp: new Date(),
                });
                yield activity.save();
                yield newExpense.save();
                res.json({
                    data: Object.assign(Object.assign({}, newExpense.toJSON()), { split: memberSplits }),
                    message: "Expense added successfully",
                });
            }
            catch (err) {
                console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    settleAmount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { groupId, amount, userId, payee_id, payee_mobile, payeeName } = req.body;
                const balance = yield balance_1.default.findOne({
                    $and: [
                        { group_id: groupId },
                        {
                            $or: [{ payer_id: userId || "NA" }, { payee_id: userId || "NA" }],
                        },
                        {
                            $or: [
                                {
                                    $and: [
                                        { payer_id: userId || "NA" },
                                        { payee_id: payee_id || "NA" },
                                    ],
                                },
                                {
                                    $and: [
                                        { payer_id: userId || "NA" },
                                        { payee_mobile: payee_mobile || "NA" },
                                    ],
                                },
                                {
                                    $and: [
                                        { payer_id: payee_id || "NA" },
                                        { payee_id: userId || "NA" },
                                    ],
                                },
                                {
                                    $and: [
                                        { payer_mobile: payee_mobile || "NA" },
                                        { payee_id: userId || "NA" },
                                    ],
                                },
                            ],
                        },
                    ],
                });
                if (!balance) {
                    return res.status(400).json({ message: "Balance not found" });
                }
                let newAmount = balance.amount;
                if (balance.payer_id === userId) {
                    newAmount = balance.amount + Number(amount);
                }
                else {
                    newAmount = balance.amount - Number(amount);
                }
                balance.amount = newAmount;
                const acitivity = new activity_1.default({
                    groupId: balance.group_id,
                    userId: userId,
                    activityType: activity_1.ActivityType.SETTLEMENT_PAID,
                    details: {
                        settlementAmount: amount,
                        paidTo: payee_id,
                        memberName: payeeName,
                    },
                });
                yield acitivity.save();
                yield balance.save();
                res.json({ message: "Amount settled successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong", error: true });
            }
        });
    }
    // TODO: Need to add some calculation to update the balance
    updateExpense(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const { expenseId, amount, expenseDetails, description } = req.body;
                const expense = yield expense_1.default.findById(expenseId);
                if (!expense) {
                    return res.status(404).json({ message: "Expense not found" });
                }
                if (amount)
                    expense.amount = amount;
                if (description)
                    expense.description = description;
                if (expenseDetails.length > 0) {
                    for (let i = 0; i < expenseDetails.length; i++) {
                        const split = yield expenseSplit_1.default.findById(expenseDetails[i].id);
                        if (split) {
                            split.amount = expenseDetails[i].balance;
                            let balance = yield balance_1.default.findOne({
                                $and: [
                                    { group_id: expense.group_id },
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    { payer_id: expenseDetails[i].id || "NA" },
                                                    { payee_id: expense.paid_by || "NA" },
                                                ],
                                            },
                                            {
                                                $and: [
                                                    { payer_id: expense.paid_by || "NA" },
                                                    { payee_id: expenseDetails[i].id || "NA" },
                                                ],
                                            },
                                            {
                                                $and: [
                                                    { payer_id: expense.paid_by || "NA" },
                                                    { payee_mobile: expenseDetails[i].mobile || "NA" },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            });
                            if (!balance) {
                                balance = new balance_1.default({
                                    group_id: expense.group_id,
                                    payer_id: expense.paid_by,
                                    payee_id: expenseDetails[i].id,
                                    payee_mobile: expenseDetails[i].mobile,
                                    amount: expenseDetails[i].balance,
                                });
                            }
                            else {
                                if (expenseDetails[i].id) {
                                    if (balance.payer_id === expenseDetails[i].id) {
                                        balance.amount -= expenseDetails[i].balance;
                                    }
                                    else {
                                        balance.amount += expenseDetails[i].balance;
                                    }
                                }
                                else {
                                    if (balance.payer_mobile === expenseDetails[i].mobile) {
                                        balance.amount -= expenseDetails[i].balance;
                                    }
                                    else {
                                        balance.amount += expenseDetails[i].balance;
                                    }
                                }
                            }
                            yield balance.save();
                            yield split.save();
                        }
                    }
                }
                yield expense.save();
                res.json({ data: expense, message: "Expense updated successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
}
exports.ExpenseController = ExpenseController;
