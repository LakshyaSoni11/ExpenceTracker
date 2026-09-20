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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: {
      configured: !!process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    },
    mailer: {
      brevo: !!process.env.BREVO_API_KEY,
      smtp: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    },
  });
});

app.get('/api/ai-test', async (req, res) => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ ok: false, error: 'GEMINI_API_KEY missing' });
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const tries = [
    process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
  ];
  let lastErr = null;
  for (const candidate of new Set(tries)) {
    const t0 = Date.now();
    try {
      const model = genAI.getGenerativeModel({ model: candidate, generationConfig: { maxOutputTokens: 10 } });
      const result = await model.generateContent('Reply with exactly: OK');
      const text = result.response.text().trim();
      return res.json({ ok: true, model: candidate, latency: Date.now() - t0, sample: text.slice(0, 30) });
    } catch (err) {
      lastErr = err;
      const msg = String(err.message || '');
      console.error(`[ai-test] ${candidate} failed:`, msg.slice(0, 150));
      if (!/503|429|exhausted|high demand/i.test(msg)) break;
    }
  }
  res.status(500).json({ ok: false, error: String(lastErr?.message || 'no model responded').slice(0, 300) });
});

export default app