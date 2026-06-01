const { query } = require('../config/db');

const getMedications = async (req, res) => {
  try {
    const uid = req.query.patient_id && req.user.role !== 'patient' ? req.query.patient_id : req.user.id;
    const r = await query('SELECT * FROM medications WHERE user_id=$1 AND is_active=true ORDER BY created_at DESC', [uid]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const addMedication = async (req, res) => {
  try {
    const { name, dosage, frequency, times, category, instructions, start_date, end_date } = req.body;
    if (!name || !dosage || !frequency || !times || !start_date)
      return res.status(400).json({ error: 'Name, dosage, frequency, times and start_date required' });
    const timesArr = Array.isArray(times) ? times : [times];
    const r = await query(
      `INSERT INTO medications (user_id,name,dosage,frequency,times,category,instructions,start_date,end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, name, dosage, frequency, timesArr, category||'General', instructions||null, start_date, end_date||null]
    );
    const med = r.rows[0];
    // Auto-generate today's reminders
    const today = new Date().toISOString().split('T')[0];
    for (const t of timesArr) {
      await query(
        `INSERT INTO reminders (medication_id,user_id,scheduled_time,scheduled_date) VALUES ($1,$2,$3::TIME,$4) ON CONFLICT DO NOTHING`,
        [med.id, req.user.id, t, today]
      );
    }
    res.status(201).json({ message: `${name} added! Reminders scheduled.`, medication: med });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateMedication = async (req, res) => {
  try {
    const { name, dosage, frequency, times, category, instructions, start_date, end_date } = req.body;
    const timesArr = Array.isArray(times) ? times : [times];
    const r = await query(
      `UPDATE medications SET name=$1,dosage=$2,frequency=$3,times=$4,category=$5,instructions=$6,start_date=$7,end_date=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [name, dosage, frequency, timesArr, category, instructions, start_date, end_date||null, req.params.id, req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated', medication: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteMedication = async (req, res) => {
  try {
    const r = await query('UPDATE medications SET is_active=false WHERE id=$1 AND user_id=$2 RETURNING name', [req.params.id, req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ message: r.rows[0].name + ' removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getMedications, addMedication, updateMedication, deleteMedication };
