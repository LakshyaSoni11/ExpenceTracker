import express from 'express'
import cors from 'cors'
import groupRoutes from './routes/groupRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import aiRoutes from './routes/aiRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', groupRoutes)
app.use('/api', expenseRoutes)
app.use('/api', aiRoutes)

export default app