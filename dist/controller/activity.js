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
exports.ActivityController = void 0;
const activity_1 = __importDefault(require("../models/activity"));
const groupMember_1 = __importDefault(require("../models/groupMember"));
class ActivityController {
    getActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const groupId = (_a = req.query) === null || _a === void 0 ? void 0 : _a.groupId;
                const userId = (_b = req.query) === null || _b === void 0 ? void 0 : _b.userId;
                if (groupId) {
                    const activities = yield activity_1.default.find({
                        groupId: groupId,
                    })
                        .populate("userId")
                        .populate("groupId")
                        .sort({ timestamp: -1 });
                    res.json({ data: activities });
                    return;
                }
                else if (userId) {
                    const groups = yield groupMember_1.default.find({
                        member_id: userId,
                    })
                        .populate("group_id")
                        .populate("member_id");
                    const groupIds = groups.map((val) => val.group_id._id);
                    const activities = yield activity_1.default.find({
                        groupId: { $in: groupIds },
                    }).populate("groupId");
                    res.json({ data: activities });
                    return;
                }
                else {
                    res.status(400).json({ message: "Group id or user id is required" });
                }
            }
            catch (err) {
                console.log("🚀 ~ file: activity.ts:router.get ~ err:", err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}
exports.ActivityController = ActivityController;
