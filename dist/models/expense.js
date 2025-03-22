"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const expenseSchema = new mongoose_1.default.Schema({
    group_id: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    paid_by: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    created_at: { type: Date, default: Date.now },
});
const Expense = mongoose_1.default.model("Expense", expenseSchema);
exports.default = Expense;
