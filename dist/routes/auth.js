"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../controller/auth");
const router = express_1.default.Router();
const authController = new auth_2.AuthController();
router.post("/login", [
    (0, express_validator_1.check)("email", "Invalid Email").isEmail(),
    (0, express_validator_1.check)("password", "Password must be of minimum 6 length").isLength({
        min: 6,
    }),
], authController.login);
router.post("/validate-token", auth_1.verifyToken, authController.validateToken);
router.post("/logout", authController.logout);
exports.default = router;
