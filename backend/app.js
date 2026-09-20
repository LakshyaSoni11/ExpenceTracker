import express from 'express'
import cors from 'cors'
import groupRoutes from './routes/groupRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api', userRoutes)
app.use('/api', groupRoutes)
app.use('/api', expenseRoutes)
app.use('/api', aiRoutes)

export default app