import dotenv from 'dotenv'
import { createServer } from 'http'
import connectDB from './config/db.js'
import migrate from './config/migrate.js'
import app from './app.js'
import { initRealtime } from './utils/realtime.js'

dotenv.config()

const PORT = process.env.PORT || 5000

connectDB()
  .then(migrate)
  .then(() => {
    const server = createServer(app)
    initRealtime(server)
    server.listen(PORT, () => console.log(`Server running in port ${PORT}`))
    if (process.env.GEMINI_API_KEY) {
      console.log(`[ai] Gemini ready -> ${process.env.GEMINI_MODEL || 'gemini-3.7-flash'}`)
    } else {
      console.log(`[ai] GEMINI_API_KEY NOT configured; AI assistant will return 503`)
    }
  })
  .catch((err) => {
    console.error('Startup error:', err.message)
    process.exit(1)
  })