"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const balanceSchema = new mongoose_1.default.Schema({
    payer_id: { type: String },
    payee_id: { type: String },
    payee_mobile: { type: String },
    payer_mobile: { type: String },
    amount: { type: Number, required: true },
    updated_at: { type: Date, default: Date.now },
    group_id: { type: String },
});
const Balance = mongoose_1.default.model("Balance", balanceSchema);
exports.default = Balance;
