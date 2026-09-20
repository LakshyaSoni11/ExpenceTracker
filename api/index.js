import connectDB from '../backend/config/db.js'
import app from '../backend/app.js'

connectDB().catch((err) => console.error('DB connection error:', err.message))

export default app