"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const group_1 = require("../controller/group");
const upload_1 = __importDefault(require("../utils/upload"));
const router = express_1.default.Router();
const groupController = new group_1.GroupController();
router.get("/", auth_1.verifyToken, groupController.getGroups);
router.get("/members", auth_1.verifyToken, groupController.getGroupMembers);
router.post("/createGroup", auth_1.verifyToken, upload_1.default.single("image"), [
    (0, express_validator_1.check)("name", "Group name is required").not().isEmpty(),
    (0, express_validator_1.check)("userId", "User id is required").isString(),
    (0, express_validator_1.check)("description", "Description is required").isString(),
], groupController.createGroup);
router.post("/updateGroup", auth_1.verifyToken, upload_1.default.single("image"), [(0, express_validator_1.check)("groupId", "Group Id is required").not().isEmpty()], groupController.updateGroup);
router.post("/addMember", auth_1.verifyToken, [
    (0, express_validator_1.check)("groupId", "Group Id is required").not().isEmpty(),
    (0, express_validator_1.check)("userId", "User Id is required").not().isEmpty(),
], groupController.addMember);
router.post("/bulkAddMember", auth_1.verifyToken, [
    (0, express_validator_1.check)("groupId", "Group Id is required").not().isEmpty(),
    (0, express_validator_1.check)("members", "Members is required").not().isEmpty(),
], groupController.bulkAddMember);
router.post("/removeMember", auth_1.verifyToken, [
    (0, express_validator_1.check)("groupId", "Group Id is required").not().isEmpty(),
    (0, express_validator_1.check)("userId", "User Id is required").not().isEmpty(),
], groupController.removeMember);
exports.default = router;
