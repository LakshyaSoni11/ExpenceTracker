import mongoose from "mongoose";

const connectDB = async() =>{
    mongoose.connection.on('connected', () => console.log("DB connected"))
    mongoose.connection.on('error', ()=> console.log("DB connection error"))
    await mongoose.connect(process.env.MONGO_URI)

}
export default connectDB;