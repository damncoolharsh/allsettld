import mongoose from "mongoose";
import express from "express";
import AuthRoutes from "./routes/auth";
import UserRoutes from "./routes/user";
import FriendRoutes from "./routes/friend";
import GroupRoutes from "./routes/group";
import ExpenseRoutes from "./routes/expense";
import "dotenv/config";

mongoose.connect(process.env.MONGODB_CONNECTION as string, {
  dbName: "test",
});

const app = express();
app.use(express.json());

app.use("/api/auth", AuthRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/friend", FriendRoutes);
app.use("/api/group", GroupRoutes);
app.use("/api/expense", ExpenseRoutes);

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
