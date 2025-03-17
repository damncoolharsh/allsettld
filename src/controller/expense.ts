import { Request, Response } from "express";
import Expense, { ExpenseType } from "../models/expense";
import { validationResult } from "express-validator";
import ExpenseSplit, { ExpenseSplitType } from "../models/expenseSplit";
import { Document, Types } from "mongoose";
import Balance from "../models/balance";

type ExpenseWithSplit = Document<unknown, {}, ExpenseType> &
  ExpenseType & {
    _id: Types.ObjectId;
  } & { split?: Document<unknown, {}, ExpenseSplitType>[] };

export class ExpenseController {
  async getExpenseByGroupId(req: Request, res: Response) {
    try {
      if (!req.query.id) {
        return res.status(400).json({ message: "Group id is required" });
      }
      const pageSize = 40;
      const pageNumber = parseInt(req.query.page ? req.query.toString() : "0");
      const expenses: ExpenseWithSplit[] = await Expense.find({
        group_id: req.query.id,
      })
        .skip(pageNumber)
        .limit(pageSize);
      const total = await Expense.countDocuments();

      for (let i = 0; i < expenses.length; i++) {
        expenses[i].split = await ExpenseSplit.find({
          expense_id: expenses[i]._id,
        });
      }

      res.json({
        data: expenses,
        message: "Success",
        pagination: { page: pageNumber, pageSize: pageSize, total: total },
      });
    } catch (err) {
      console.log("🚀 ~ file: expense.ts:router.get ~ err:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async addExpense(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { groupId, expenseDetails, amount, paidBy } = req.body;
      const newExpense = new Expense({
        amount: amount,
        date: new Date(),
        group_id: groupId,
        paid_by: paidBy,
      });
      let memberSplits = [];

      for (let i = 0; i < expenseDetails.length; i++) {
        const split = new ExpenseSplit({
          amount: expenseDetails[i].balance,
          expense_id: newExpense._id,
          user_id: expenseDetails[i].id,
          user_name: expenseDetails[i].name,
          user_mobile: expenseDetails[i].mobile,
        });
        let balance = await Balance.findOne({
          $or: [
            {
              $and: [
                { payer_id: expenseDetails[i].id || "NA" },
                { payee_id: paidBy || "NA" },
              ],
            },
            {
              $and: [
                { payer_id: paidBy || "NA" },
                { payee_id: expenseDetails[i].id || "NA" },
              ],
            },
            {
              $and: [
                { payer_id: paidBy || "NA" },
                { payee_mobile: expenseDetails[i].mobile || "NA" },
              ],
            },
          ],
          group_id: groupId,
        });
        if (!balance) {
          balance = new Balance({
            group_id: groupId,
            payer_id: paidBy,
            payee_id: expenseDetails[i].id,
            payee_mobile: expenseDetails[i].mobile,
            amount: expenseDetails[i].balance,
          });
        } else {
          if (expenseDetails[i].id) {
            if (balance.payer_id === expenseDetails[i].id) {
              balance.amount -= expenseDetails[i].balance;
            } else {
              balance.amount += expenseDetails[i].balance;
            }
          } else {
            if (balance.payer_mobile === expenseDetails[i].mobile) {
              balance.amount -= expenseDetails[i].balance;
            } else {
              balance.amount += expenseDetails[i].balance;
            }
          }
        }
        await balance.save();
        await split.save();
        memberSplits.push(split);
      }
      await newExpense.save();
      res.json({
        data: { ...newExpense.toJSON(), split: memberSplits },
        message: "Expense added successfully",
      });
    } catch (err) {
      console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }

  // TODO: Need to add some calculation to update the balance
  async updateExpense(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { expenseId, amount, expenseDetails, description } = req.body;
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      if (amount) expense.amount = amount;
      if (description) expense.description = description;
      if (expenseDetails.length > 0) {
        for (let i = 0; i < expenseDetails.length; i++) {
          const split = await ExpenseSplit.findById(expenseDetails[i].id);
          if (split) {
            split.amount = expenseDetails[i].balance;
            let balance = await Balance.findOne({
              $or: [
                {
                  $and: [
                    { payer_id: expenseDetails[i].id || "NA" },
                    { payee_id: expense.paid_by || "NA" },
                  ],
                },
                {
                  $and: [
                    { payer_id: expense.paid_by || "NA" },
                    { payee_id: expenseDetails[i].id || "NA" },
                  ],
                },
                {
                  $and: [
                    { payer_id: expense.paid_by || "NA" },
                    { payee_mobile: expenseDetails[i].mobile || "NA" },
                  ],
                },
              ],
              group_id: expense.group_id,
            });
            if (!balance) {
              balance = new Balance({
                group_id: expense.group_id,
                payer_id: expense.paid_by,
                payee_id: expenseDetails[i].id,
                payee_mobile: expenseDetails[i].mobile,
                amount: expenseDetails[i].balance,
              });
            } else {
              if (expenseDetails[i].id) {
                if (balance.payer_id === expenseDetails[i].id) {
                  balance.amount -= expenseDetails[i].balance;
                } else {
                  balance.amount += expenseDetails[i].balance;
                }
              } else {
                if (balance.payer_mobile === expenseDetails[i].mobile) {
                  balance.amount -= expenseDetails[i].balance;
                } else {
                  balance.amount += expenseDetails[i].balance;
                }
              }
            }
            await balance.save();
            await split.save();
          }
        }
      }
      await expense.save();
      res.json({ data: expense, message: "Expense updated successfully" });
    } catch (err) {
      console.log("🚀 ~ file: expense.ts:router.post ~ err:", err);
      res.status(400).json({ message: "Something went wrong" });
    }
  }
}
