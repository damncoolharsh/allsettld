"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const expenseSplitSchema = new mongoose_1.default.Schema({
    user_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    user_mobile: { type: String },
    user_name: { type: String },
    expense_id: { type: String, required: true },
    amount: { type: Number, required: true },
});
const ExpenseSplit = mongoose_1.default.model("ExpenseSplit", expenseSplitSchema);
exports.default = ExpenseSplit;
