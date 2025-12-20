import mongoose from "mongoose";

const expenceSchema = new mongoose.Schema({
    groupId: {type: mongoose.Schema.Types.ObjectId, ref: 'Group'},
    description: String,
    amount: Number,
    paidBy:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    splitType: { type: String, enum: ['EQUAL', 'EXACT','PERCENT']},
    splits: [{user: String, value: Number}],
    date: {type: Date, default: Date.now}
})

export default mongoose.model('Expence', expenceSchema);