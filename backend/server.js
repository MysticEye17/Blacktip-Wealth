require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const openAiApiKey = process.env.OPENAI_API_KEY;
const openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/explain', async (req, res) => {
  try {
    if (!openai) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });

    const { profile, goals, recommendations } = req.body;
    if (!profile || !recommendations) return res.status(400).json({ error: 'Missing profile or recommendations' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You explain personal finance planning in clear, concise language. Always state that this is educational and not tax, legal, investment, insurance, or financial advice. Do not guarantee returns.' },
        { role: 'user', content: JSON.stringify({ profile, goals, recommendations }) }
      ],
      temperature: 0.4,
    });

    res.json({ explanation: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI explanation failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`DecisionEngine backend running on port ${port}`));
