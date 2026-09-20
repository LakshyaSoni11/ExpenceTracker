import dotenv from 'dotenv'
import connectDB from './config/db.js'
import app from './app.js'

dotenv.config()
connectDB().catch((err) => console.error('DB connection error:', err.message))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running in port ${PORT}`))