import mongoose from "mongoose";

const splitSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    splitType: {
      type: String,
      enum: ["equal", "exact", "percent"],
      default: "equal",
    },
    splits: [splitSchema],
  },
  { timestamps: true }
);

expenseSchema.index({ groupId: 1 });

export default mongoose.model("Expense", expenseSchema);