// ============================================================
// AI Controller - OpenAI assisted medication guidance
// This feature supports Assessment Brief 4 requirement for AI API implementation.
// It generates simple, non-clinical reminder and adherence suggestions.
// ============================================================

const OpenAI = require('openai');
const pool = require('../db');

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

exports.getMedicationAdvice = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { question } = req.body;

    if (!question || question.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please enter a clear question.' });
    }

    const meds = await pool.query(
      `SELECT medication_name, dosage, frequency, times, instructions
       FROM medications
       WHERE user_id = $1 AND is_active = true
       ORDER BY medication_name ASC`,
      [userId]
    );

    const medList = meds.rows.map(m =>
      `${m.medication_name} ${m.dosage}, ${m.frequency}, times: ${Array.isArray(m.times) ? m.times.join(', ') : m.times}, instructions: ${m.instructions || 'none'}`
    ).join('\n');

    const systemPrompt = `You are a safe medication reminder assistant for a student project. Do not diagnose, prescribe, or change doses. Give simple reminder, scheduling, adherence, and organisation advice. Always tell users to contact a doctor or pharmacist for medical decisions.`;

    let answer;
    const client = getClient();

    if (client) {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current medications:\n${medList || 'No medication records found.'}\n\nUser question: ${question}` }
        ],
        max_output_tokens: 350
      });
      answer = response.output_text;
    } else {
      answer = `AI demo mode: Based on your saved medication list, you should keep reminders clear, mark each dose as taken or missed, and check your History & Reports page weekly. For the question "${question}", please speak with your doctor or pharmacist before changing any medicine, dose, or timing.`;
    }

    res.json({ success: true, answer });
  } catch (error) {
    next(error);
  }
};
