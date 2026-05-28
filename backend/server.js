require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { email } = req.body || {};
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    const successUrl = process.env.STRIPE_SUCCESS_URL || 'http://localhost:19007/';
    const cancelUrl = process.env.STRIPE_CANCEL_URL || 'http://localhost:19007/';

    if (!secretKey || !priceId) return res.status(500).json({ error: 'Stripe is not configured' });

    let stripeFactory;
    try {
      stripeFactory = require('stripe');
    } catch {
      return res.status(500).json({ error: 'Install the stripe backend dependency before accepting payments' });
    }

    const stripe = stripeFactory(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { product: 'blacktip_action_plan' },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe Checkout failed' });
  }
});

app.post('/explain', async (req, res) => {
  try {
    const { profile, goals, recommendations, planningModules = [], projection = [] } = req.body;
    if (!profile || !recommendations) return res.status(400).json({ error: 'Missing profile or recommendations' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: [
            'You are the analysis layer for Blacktip Wealth, a personal finance planning app for young adults.',
            'Interpret calculations, module scores, chart data, and recommendations in polished, specific language.',
            'Use short sections: Situation, What the charts mean, Priority moves, Watchouts.',
            'Always state that this is educational and not tax, legal, investment, insurance, or financial advice. Do not guarantee returns.',
          ].join(' '),
        },
        { role: 'user', content: JSON.stringify({ profile, goals, recommendations, planningModules, projection }) }
      ],
      temperature: 0.4,
    });

    res.json({ explanation: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI explanation failed' });
  }
});

app.post('/weekly-suggestions', async (req, res) => {
  try {
    const { profile, goals = [], recommendations = [], planningModules = [] } = req.body;
    if (!profile) return res.status(400).json({ error: 'Missing profile' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: [
            'You are the weekly action layer for Blacktip Wealth, a personal finance planning app for young adults.',
            'Create short, practical suggestions for the next seven days only.',
            'Use 4 numbered actions. Each action should be specific, measurable, and grounded in the supplied calculations.',
            'Do not give tax, legal, investment, insurance, or financial advice as a licensed professional. Include an educational-only note.',
          ].join(' '),
        },
        { role: 'user', content: JSON.stringify({ profile, goals, recommendations, planningModules }) }
      ],
      temperature: 0.35,
    });

    res.json({ suggestions: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI weekly suggestions failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`DecisionEngine backend running on port ${port}`));
