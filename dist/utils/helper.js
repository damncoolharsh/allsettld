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
exports.sendSms = exports.generateOTP = void 0;
exports.uploadImages = uploadImages;
const cloudinary_1 = require("cloudinary");
const smsProvider_1 = __importDefault(require("./smsProvider"));
function uploadImages(imageFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadPromises = imageFiles.map((item) => __awaiter(this, void 0, void 0, function* () {
            const b64 = Buffer.from(item.buffer).toString("base64");
            let dataUri = "data:" + item.mimetype + ";base64," + b64;
            const res = yield cloudinary_1.v2.uploader.upload(dataUri);
            return res.url;
        }));
        const imageUrls = yield Promise.all(uploadPromises);
        return imageUrls;
    });
}
const generateOTP = (otp_length = 6) => {
    // Declare a digits variable
    // which stores all digits
    var digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < otp_length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
};
exports.generateOTP = generateOTP;
const sendSms = (mobile, sms) => {
    smsProvider_1.default.sms
        .send({ to: mobile, from: "Fanbuzz", text: sms })
        .then((resp) => {
        console.log("Message sent successfully");
        console.log(resp);
    })
        .catch((err) => {
        console.log("There was an error sending the messages.", err);
    });
};
exports.sendSms = sendSms;
