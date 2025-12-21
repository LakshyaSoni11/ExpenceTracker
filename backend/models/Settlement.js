import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    from: String,
    to: String,
    amount: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Settlement", settlementSchema);
