"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const user_1 = require("../controller/user");
const router = express_1.default.Router();
const userController = new user_1.UserController();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
router.post("/register", upload.single("profilePic"), [
    (0, express_validator_1.check)("name", "Name is required").isString(),
    (0, express_validator_1.check)("mobile", "Invalid Mobile").isMobilePhone("en-IN"),
    (0, express_validator_1.check)("password", "Password must be of minimum 6 length").isLength({
        min: 6,
    }),
    (0, express_validator_1.check)("email", "Invalid Email").isEmail(),
], userController.register);
router.post("/sendOtp", userController.sendOtp);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/updateUser", upload.single("profilePic"), auth_1.verifyToken, [(0, express_validator_1.check)("_id", "Id is required").isString()], userController.updateUser);
router.get("/getUserData", auth_1.verifyToken, userController.getUserData);
router.get("/summary", auth_1.verifyToken, userController.getUserSummary);
exports.default = router;
