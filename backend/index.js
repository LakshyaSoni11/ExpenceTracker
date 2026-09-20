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
  })
  .catch((err) => {
    console.error('Startup error:', err.message)
    process.exit(1)
  })