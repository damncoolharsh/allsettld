"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const friend_1 = __importDefault(require("./routes/friend"));
const group_1 = __importDefault(require("./routes/group"));
const expense_1 = __importDefault(require("./routes/expense"));
require("dotenv/config");
mongoose_1.default.connect(process.env.MONGODB_CONNECTION, {
    dbName: "test",
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api/auth", auth_1.default);
app.use("/api/user", user_1.default);
app.use("/api/friend", friend_1.default);
app.use("/api/group", group_1.default);
app.use("/api/expense", expense_1.default);
app.listen(3001, () => {
    console.log("Server running on port 3001");
});
