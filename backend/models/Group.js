import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: {
      type: [String],
      required: true,
      validate: v => v.length >= 2,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Group", groupSchema);
