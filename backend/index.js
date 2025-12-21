import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js'
import expenseRoutes from './routes/expenseRoutes.js'
import groupRoutes from './routes/groupRoutes.js'


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', groupRoutes)
app.use('/api', expenseRoutes);
app.listen(5000, ()=> console.log('Server running in port 5000'))