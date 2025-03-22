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
exports.GroupController = void 0;
const express_validator_1 = require("express-validator");
const group_1 = __importDefault(require("../models/group"));
const groupMember_1 = __importDefault(require("../models/groupMember"));
const balance_1 = __importDefault(require("../models/balance"));
const friend_1 = __importDefault(require("../models/friend"));
const user_1 = __importDefault(require("../models/user"));
class GroupController {
    getGroups(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
                if (!id) {
                    return res.status(400).json({ message: "User id is required" });
                }
                if ((_b = req.query) === null || _b === void 0 ? void 0 : _b.groupId) {
                    const group = yield group_1.default.findOne({ _id: req.query.groupId });
                    if (!group) {
                        return res.status(400).json({ message: "Group not found" });
                    }
                    return res.json({ data: group });
                }
                else {
                    const pageSize = 20;
                    const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
                    const groups = yield groupMember_1.default.find({
                        member_id: id,
                    })
                        .populate("group_id")
                        .skip(pageNumber)
                        .limit(pageSize);
                    const total = yield groupMember_1.default.find({
                        member_id: id,
                    }).countDocuments();
                    res.json({
                        data: groups,
                        pagination: { page: pageNumber, pageSize: pageSize, total: total },
                    });
                }
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.get ~ err:", err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    getGroupMembers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
                const userId = (_b = req.query) === null || _b === void 0 ? void 0 : _b.userId;
                if (!id) {
                    return res.status(400).json({ message: "Group id is required" });
                }
                if (!userId) {
                    return res.status(400).json({ message: "User id is required" });
                }
                const group = yield group_1.default.findOne({ _id: id });
                if (!group) {
                    return res.status(400).json({ message: "Group not found" });
                }
                const membersData = yield groupMember_1.default.find({
                    group_id: id,
                }).populate("member_id");
                let members = membersData.map((val) => val.toJSON());
                for (let i = 0; i < members.length; i++) {
                    if (members[i].member_id) {
                        const balance = yield balance_1.default.findOne({
                            $and: [
                                { group_id: id },
                                {
                                    $or: [
                                        {
                                            $and: [
                                                { payer_id: ((_c = members[i].member_id) === null || _c === void 0 ? void 0 : _c._id) || "NA" },
                                                { payee_id: userId || "NA" },
                                            ],
                                        },
                                        {
                                            $and: [
                                                { payer_id: userId || "NA" },
                                                { payee_id: ((_d = members[i].member_id) === null || _d === void 0 ? void 0 : _d._id) || "NA" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        });
                        let amount = (balance === null || balance === void 0 ? void 0 : balance.amount) || 0;
                        if ((balance === null || balance === void 0 ? void 0 : balance.payer_id) !== ((_e = members[i].member_id) === null || _e === void 0 ? void 0 : _e._id.toString())) {
                            amount = amount * -1;
                        }
                        members[i].balance = amount;
                    }
                    else {
                        const balance = yield balance_1.default.findOne({
                            $and: [
                                { group_id: id },
                                {
                                    $or: [
                                        {
                                            $and: [
                                                { payer_id: userId || "NA" },
                                                { payee_mobile: members[i].mobile || "NA" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        });
                        let amount = (balance === null || balance === void 0 ? void 0 : balance.amount) || 0;
                        if ((balance === null || balance === void 0 ? void 0 : balance.payee_mobile) === members[i].mobile) {
                            amount = amount * -1;
                        }
                        members[i].balance = amount;
                    }
                }
                const result = Object.assign(Object.assign({}, group.toJSON()), { members });
                res.json({ data: result });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.get ~ err:", err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    createGroup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const { name } = req.body;
                const image = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
                const newGroup = new group_1.default({
                    name: name,
                    created_by: req.body.userId,
                    description: req.body.description,
                    image: image,
                });
                const newGroupMember = new groupMember_1.default({
                    group_id: newGroup._id,
                    member_id: req.body.userId,
                });
                yield newGroupMember.save();
                yield newGroup.save();
                res.json({ message: "Group created successfully", data: newGroup });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    updateGroup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            try {
                const { name, description, groupId, members } = req.body;
                const group = yield group_1.default.findOne({ _id: groupId });
                if (!group) {
                    res.status(400).json({ message: "Group not found" });
                    return;
                }
                if (name)
                    group.name = name;
                if (description)
                    group.description = description;
                if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)
                    group.image = req.file.path;
                yield group.save();
                res.json({ message: "Group updated successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    addMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { groupId, memberId, name, mobile } = req.body;
                const group = yield group_1.default.findOne({ _id: groupId });
                if (!group) {
                    res.status(400).json({ message: "Group not found" });
                    return;
                }
                if (memberId) {
                    const newGroupMember = new groupMember_1.default({
                        group_id: group._id,
                        member_id: memberId,
                    });
                    yield newGroupMember.save();
                }
                else {
                    const user = yield user_1.default.findOne({ mobile: mobile });
                    if (user) {
                        const newGroupMember = new groupMember_1.default({
                            group_id: group._id,
                            member_id: user._id,
                        });
                        yield newGroupMember.save();
                    }
                    const newGroupMember = new groupMember_1.default({
                        group_id: group._id,
                        name: name,
                        mobile: mobile,
                    });
                    yield newGroupMember.save();
                }
                const allMembers = yield groupMember_1.default.find({ group_id: groupId });
                for (let i = 0; i < allMembers.length; i++) {
                    let userId = allMembers[i].member_id;
                    const user1 = userId === null || userId === void 0 ? void 0 : userId.toString();
                    let user1Mobile = allMembers[i].mobile;
                    if (user1Mobile) {
                        const mobileUser = yield user_1.default.findOne({ mobile: user1Mobile });
                        if (mobileUser) {
                            userId = mobileUser._id;
                            user1Mobile = undefined;
                        }
                    }
                    const friendRel1 = yield friend_1.default.findOne({
                        $and: [
                            {
                                $or: [
                                    ...(user1 ? [{ user_id: user1 }] : []),
                                    ...(user1Mobile ? [{ user_mobile: user1Mobile }] : []),
                                ],
                            },
                            {
                                $or: [
                                    ...(memberId ? [{ friend_id: memberId }] : []),
                                    ...(mobile ? [{ friend_mobile: mobile }] : []),
                                ],
                            },
                        ],
                    });
                    const friendRel2 = yield friend_1.default.findOne({
                        $and: [
                            {
                                $or: [
                                    ...(memberId ? [{ user_id: memberId }] : []),
                                    ...(mobile ? [{ user_mobile: mobile }] : []),
                                ],
                            },
                            {
                                $or: [
                                    ...(user1 ? [{ friend_id: user1 }] : []),
                                    ...(user1Mobile ? [{ friend_mobile: user1Mobile }] : []),
                                ],
                            },
                        ],
                    });
                    if (!friendRel1) {
                        const friend = new friend_1.default({
                            user_id: user1 || null,
                            user_mobile: user1Mobile || null,
                            friend_id: memberId || null,
                            friend_mobile: mobile || null,
                            friend_name: name || null,
                        });
                        yield friend.save();
                    }
                    if (!friendRel2) {
                        const friend = new friend_1.default({
                            user_id: memberId || null,
                            friend_mobile: user1Mobile || null,
                            friend_id: user1 || null,
                            user_mobile: mobile || null,
                            friend_name: name || null,
                        });
                        yield friend.save();
                    }
                }
                res.json({ message: "Member added successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    bulkAddMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { groupId, members } = req.body;
                const group = yield group_1.default.findOne({ _id: groupId });
                if (!group) {
                    res.status(400).json({ message: "Group not found" });
                    return;
                }
                const newGroupMembers = [];
                for (let i = 0; i < members.length; i++) {
                    const member = members[i];
                    const alreadyMember = yield groupMember_1.default.findOne({
                        $and: [
                            { group_id: groupId },
                            {
                                $or: [
                                    { member_id: member.id || null },
                                    { mobile: member.mobile || "NA" },
                                ],
                            },
                        ],
                    });
                    if (alreadyMember) {
                        continue;
                    }
                    if (member.id) {
                        newGroupMembers.push(new groupMember_1.default({
                            group_id: group._id,
                            member_id: member.id,
                            name: member.name,
                        }));
                    }
                    else {
                        newGroupMembers.push(new groupMember_1.default({
                            group_id: group._id,
                            name: member.name,
                            mobile: member.mobile,
                        }));
                    }
                }
                yield groupMember_1.default.insertMany(newGroupMembers);
                const allMembers = yield groupMember_1.default.find({ group_id: groupId });
                for (let i = 0; i < allMembers.length; i++) {
                    for (let j = i + 1; j < allMembers.length; j++) {
                        if (i === j)
                            continue;
                        const userId = allMembers[i].member_id;
                        const user1 = userId === null || userId === void 0 ? void 0 : userId.toString();
                        const user1Mobile = allMembers[i].mobile;
                        const memberId = allMembers[j].member_id;
                        const mobile = allMembers[j].mobile;
                        const friendRel1 = yield friend_1.default.findOne({
                            $and: [
                                {
                                    $or: [
                                        ...(user1 ? [{ user_id: user1 }] : []),
                                        ...(user1Mobile ? [{ user_mobile: user1Mobile }] : []),
                                    ],
                                },
                                {
                                    $or: [
                                        ...(memberId ? [{ friend_id: memberId }] : []),
                                        ...(mobile ? [{ friend_mobile: mobile }] : []),
                                    ],
                                },
                            ],
                        });
                        const friendRel2 = yield friend_1.default.findOne({
                            $and: [
                                {
                                    $or: [
                                        ...(memberId ? [{ user_id: memberId }] : []),
                                        ...(mobile ? [{ user_mobile: mobile }] : []),
                                    ],
                                },
                                {
                                    $or: [
                                        ...(user1 ? [{ friend_id: user1 }] : []),
                                        ...(user1Mobile ? [{ friend_mobile: user1Mobile }] : []),
                                    ],
                                },
                            ],
                        });
                        if (!friendRel1) {
                            const friend = new friend_1.default({
                                user_id: user1 || null,
                                user_mobile: user1Mobile || null,
                                friend_id: memberId || null,
                                friend_mobile: mobile || null,
                                friend_name: allMembers[j].name || null,
                            });
                            yield friend.save();
                        }
                        if (!friendRel2) {
                            const friend = new friend_1.default({
                                user_id: memberId || null,
                                friend_mobile: user1Mobile || null,
                                friend_id: user1 || null,
                                user_mobile: mobile || null,
                                friend_name: allMembers[j].name || null,
                            });
                            yield friend.save();
                        }
                    }
                }
                res.json({ message: "Members added successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
    removeMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { groupId, memberId, mobile } = req.body;
                const group = yield group_1.default.findOne({ _id: groupId });
                if (!group) {
                    res.status(400).json({ message: "Group not found" });
                    return;
                }
                if (memberId) {
                    yield groupMember_1.default.deleteOne({ group_id: groupId, member_id: memberId });
                }
                else {
                    yield groupMember_1.default.deleteOne({ group_id: groupId, mobile: mobile });
                }
                res.json({ message: "Member removed successfully" });
            }
            catch (err) {
                console.log("🚀 ~ file: group.ts:router.post ~ err:", err);
                res.status(400).json({ message: "Something went wrong" });
            }
        });
    }
}
exports.GroupController = GroupController;
