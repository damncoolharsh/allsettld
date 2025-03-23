"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var ActivityType;
(function (ActivityType) {
    ActivityType["GROUP_CREATED"] = "GROUP_CREATED";
    ActivityType["MEMBER_ADDED"] = "MEMBER_ADDED";
    ActivityType["MULTI_MEMBER_ADDED"] = "MULTI_MEMBER_ADDED";
    ActivityType["MEMBER_REMOVED"] = "MEMBER_REMOVED";
    ActivityType["EXPENSE_ADDED"] = "EXPENSE_ADDED";
    ActivityType["EXPENSE_EDITED"] = "EXPENSE_EDITED";
    ActivityType["EXPENSE_DELETED"] = "EXPENSE_DELETED";
    ActivityType["SETTLEMENT_PAID"] = "SETTLEMENT_PAID";
    ActivityType["GROUP_SETTLED"] = "GROUP_SETTLED";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
const activitySchema = new mongoose_1.default.Schema({
    groupId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Group" },
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    activityType: { type: String, required: true },
    details: { type: Object, required: true },
    timestamp: { type: Date, default: Date.now },
});
const Activity = mongoose_1.default.model("Activity", activitySchema);
exports.default = Activity;
