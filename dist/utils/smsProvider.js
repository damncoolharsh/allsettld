"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("@vonage/auth");
const server_sdk_1 = require("@vonage/server-sdk");
require("dotenv/config");
const vonageAuth = new auth_1.Auth({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
});
const vonage = new server_sdk_1.Vonage(vonageAuth);
exports.default = vonage;
