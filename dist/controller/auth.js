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
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../models/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { email, password } = req.body;
            try {
                const user = yield user_1.default.findOne({ email: email }).select("+password");
                if (!user) {
                    return res
                        .status(400)
                        .json({ errors: [{ msg: "Invalid Credentials" }] });
                }
                const isMatch = yield bcryptjs_1.default.compare(password, user.password);
                if (!isMatch) {
                    return res
                        .status(400)
                        .json({ errors: [{ msg: "Invalid Credentials" }] });
                }
                const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: "1d",
                });
                return res.status(200).json({ userID: user._id, token });
            }
            catch (err) {
                console.log(err);
                res.status(500).json({ message: "Something went wrong" });
            }
        });
    }
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.send("Register");
        });
    }
    validateToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.status(200).send({ userId: req.userId });
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.cookie("auth_token", "", {
                expires: new Date(0),
            });
            res.send();
        });
    }
}
exports.AuthController = AuthController;
