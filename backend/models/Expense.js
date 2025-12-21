import mongoose from "mongoose";

const splitSchema = new mongoose.Schema({
  member: String,
  amount: Number,
});

const expenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    description: String,
    amount: {
      type: Number,
      required: true,
    },
    paidBy: {
      type: String,
      required: true,
    },
    splits: [splitSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
