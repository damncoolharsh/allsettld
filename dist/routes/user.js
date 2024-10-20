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
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const user_1 = __importDefault(require("../models/user"));
const helper_1 = require("../utils/helper");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const friend_1 = __importDefault(require("../models/friend"));
const router = express_1.default.Router();
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
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { mobile } = req.body;
        let user = yield user_1.default.findOne({ mobile: mobile });
        if (user) {
            res.status(400).json({ message: "User already exists" });
        }
        const imageFile = req.file;
        if (imageFile) {
            const profilePics = yield (0, helper_1.uploadImages)([imageFile]);
            req.body.profilePic = profilePics[0];
        }
        user = new user_1.default(req.body);
        yield user.save();
        const friendsData = yield friend_1.default.find({ mobileNumber: user.mobile });
        if (friendsData.length > 0) {
            for (let i = 0; i < friendsData.length; i++) {
                const friend = friendsData[i];
                friend.friendId = user._id.toString();
                yield friend.save();
            }
        }
        res.json({ message: "User registered successfully", data: user });
    }
    catch (err) {
        res.status(400).json({ message: "Something went wrong" });
    }
}));
router.post("/sendOtp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mobile } = req.body;
        let user = yield user_1.default.findOne({ mobile: mobile });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
            // Register user
            // if (req.body.isAdmin) delete req.body.isAdmin;
            // const imageFile = req.file as Express.Multer.File;
            // if (imageFile) {
            //   const profilePics = await uploadImages([imageFile]);
            //   req.body.profilePic = profilePics[0];
            // }
            // user = new User(req.body);
            // await user.save();
        }
        const otp = (0, helper_1.generateOTP)(6);
        user.phoneOtp = otp;
        yield user.save();
        (0, helper_1.sendSms)("91" + mobile, `#allsettld, Your OTP is ${otp}`);
        res.json({ message: "OTP sent successfully" });
    }
    catch (err) {
        console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
router.post("/verifyOtp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mobile, otp } = req.body;
        let user = yield user_1.default.findOne({ mobile: mobile });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        if (user.phoneOtp !== otp) {
            res.status(400).json({ message: "Invalid OTP" });
            return;
        }
        user.phoneOtp = "";
        yield user.save();
        const token = jsonwebtoken_1.default.sign({ user }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        res.json({ token, message: "OTP verified successfully" });
    }
    catch (err) {
        console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
router.post("/updateUser", upload.single("profilePic"), auth_1.verifyToken, [(0, express_validator_1.check)("_id", "Id is required").isString()], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findOne({ _id: req.body._id });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        if (req.body.name)
            user.name = req.body.name;
        const imageFile = req.file;
        if (imageFile) {
            const profilePics = yield (0, helper_1.uploadImages)([imageFile]);
            user.profilePic = profilePics[0];
        }
        yield user.save();
        res.json({ message: "User updated successfully" });
    }
    catch (err) {
        console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
router.post("/getUserData", auth_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = (_a = req.query) === null || _a === void 0 ? void 0 : _a.id;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        const user = yield user_1.default.findOne({ _id: id });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        res.json({ data: user });
    }
    catch (err) {
        console.log("🚀 ~ file: user.ts:router.post ~ err:", err);
        res.status(400).json({ message: "Something went wrong" });
    }
}));
exports.default = router;
