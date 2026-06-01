const { query } = require('../config/db');
const logger = require('../utils/logger');

const getUserId = (req) =>
  (req.query.patient_id && req.user.role !== 'patient') ? req.query.patient_id : req.user.id;

const notifyCaregivers = async (patientId, patientName, title, message) => {
  const caregivers = await query(`
    SELECT u.id
    FROM caregiver_patients cp
    JOIN users u ON cp.caregiver_id = u.id
    WHERE cp.patient_id=$1
      AND cp.is_active=true
      AND u.is_active=true
  `, [patientId]);

  for (const caregiver of caregivers.rows) {
    await query(`
      INSERT INTO notifications
      (user_id, type, channel, title, message)
      VALUES ($1, 'patient_update', 'in_app', $2, $3)
    `, [
      caregiver.id,
      title,
      message
    ]);
  }
};

// GET /api/medications
const getMedications = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { active_only = 'true', category } = req.query;

    let sql = 'SELECT * FROM medications WHERE user_id=$1';
    const params = [userId];

    if (active_only === 'true') {
      params.push(true);
      sql += ` AND is_active=$${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND category=$${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const r = await query(sql, params);
    res.json(r.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
};

// GET /api/medications/:id
const getMedication = async (req, res) => {
  try {
    const r = await query(
      'SELECT * FROM medications WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json(r.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medication' });
  }
};

// POST /api/medications
const addMedication = async (req, res) => {
  const {
    name,
    generic_name,
    dosage,
    dosage_unit,
    frequency,
    times,
    category,
    medication_type,
    color,
    shape,
    instructions,
    side_effects,
    food_interactions,
    refill_reminder,
    refill_days_before,
    current_stock,
    start_date,
    end_date,
    prescribed_by,
    pharmacy_name,
    prescription_number
  } = req.body;

  if (!name || !dosage || !frequency || !times || !start_date) {
    return res.status(400).json({
      error: 'Name, dosage, frequency, times and start_date are required'
    });
  }

  const timesArr = Array.isArray(times) ? times : [times];

  try {
    const r = await query(`
      INSERT INTO medications(
        user_id,name,generic_name,dosage,dosage_unit,frequency,times,
        category,medication_type,color,shape,instructions,side_effects,food_interactions,
        refill_reminder,refill_days_before,current_stock,start_date,end_date,prescribed_by,
        pharmacy_name,prescription_number
      )
      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      )
      RETURNING *
    `, [
      req.user.id,
      name,
      generic_name || null,
      dosage,
      dosage_unit || 'mg',
      frequency,
      timesArr,
      category || 'General',
      medication_type || 'tablet',
      color || null,
      shape || null,
      instructions || null,
      side_effects || null,
      food_interactions || null,
      refill_reminder || false,
      refill_days_before || 7,
      current_stock || null,
      start_date,
      end_date || null,
      prescribed_by || null,
      pharmacy_name || null,
      prescription_number || null
    ]);

    const med = r.rows[0];

    const today = new Date().toISOString().split('T')[0];

    if (start_date <= today) {
      for (const t of timesArr) {
        await query(`
          INSERT INTO reminders(medication_id,user_id,scheduled_time,scheduled_date)
          VALUES($1,$2,$3::TIME,$4)
          ON CONFLICT DO NOTHING
        `, [med.id, req.user.id, t, today]);
      }
    }

    await notifyCaregivers(
      req.user.id,
      req.user.full_name,
      'Medication Added',
      `${req.user.full_name} added medication: ${name} ${dosage}`
    ).catch(() => {});

    logger.info(`Medication added: ${name} for user ${req.user.id}`);

    res.status(201).json({
      message: `${name} added and reminders scheduled!`,
      medication: med
    });
  } catch (err) {
    logger.error('Add medication error', { error: err.message });
    res.status(500).json({ error: 'Failed to add medication' });
  }
};

// PUT /api/medications/:id
const updateMedication = async (req, res) => {
  const {
    name,
    generic_name,
    dosage,
    dosage_unit,
    frequency,
    times,
    category,
    medication_type,
    color,
    shape,
    instructions,
    side_effects,
    food_interactions,
    refill_reminder,
    refill_days_before,
    current_stock,
    start_date,
    end_date,
    prescribed_by,
    pharmacy_name,
    prescription_number
  } = req.body;

  const timesArr = Array.isArray(times) ? times : [times];

  try {
    const r = await query(`
      UPDATE medications SET
        name=$1,
        generic_name=$2,
        dosage=$3,
        dosage_unit=$4,
        frequency=$5,
        times=$6,
        category=$7,
        medication_type=$8,
        color=$9,
        shape=$10,
        instructions=$11,
        side_effects=$12,
        food_interactions=$13,
        refill_reminder=$14,
        refill_days_before=$15,
        current_stock=$16,
        start_date=$17,
        end_date=$18,
        prescribed_by=$19,
        pharmacy_name=$20,
        prescription_number=$21,
        updated_at=NOW()
      WHERE id=$22 AND user_id=$23
      RETURNING *
    `, [
      name,
      generic_name || null,
      dosage,
      dosage_unit || 'mg',
      frequency,
      timesArr,
      category || 'General',
      medication_type || 'tablet',
      color || null,
      shape || null,
      instructions || null,
      side_effects || null,
      food_interactions || null,
      refill_reminder || false,
      refill_days_before || 7,
      current_stock || null,
      start_date,
      end_date || null,
      prescribed_by || null,
      pharmacy_name || null,
      prescription_number || null,
      req.params.id,
      req.user.id
    ]);

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    await notifyCaregivers(
      req.user.id,
      req.user.full_name,
      'Medication Updated',
      `${req.user.full_name} updated medication: ${name} ${dosage}`
    ).catch(() => {});

    res.json({
      message: 'Medication updated!',
      medication: r.rows[0]
    });
  } catch {
    res.status(500).json({ error: 'Failed to update medication' });
  }
};

// DELETE /api/medications/:id
const deleteMedication = async (req, res) => {
  try {
    const r = await query(
      'UPDATE medications SET is_active=false WHERE id=$1 AND user_id=$2 RETURNING name,dosage',
      [req.params.id, req.user.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const med = r.rows[0];

    await notifyCaregivers(
      req.user.id,
      req.user.full_name,
      'Medication Removed',
      `${req.user.full_name} removed medication: ${med.name} ${med.dosage || ''}`
    ).catch(() => {});

    res.json({ message: `${med.name} removed` });
  } catch {
    res.status(500).json({ error: 'Failed to remove medication' });
  }
};

// PATCH /api/medications/:id/stock
const updateStock = async (req, res) => {
  try {
    const { current_stock } = req.body;

    const r = await query(
      'UPDATE medications SET current_stock=$1 WHERE id=$2 AND user_id=$3 RETURNING name,current_stock',
      [current_stock, req.params.id, req.user.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const med = r.rows[0];

    await notifyCaregivers(
      req.user.id,
      req.user.full_name,
      'Medication Stock Updated',
      `${req.user.full_name} updated stock for ${med.name}. Current stock: ${med.current_stock}`
    ).catch(() => {});

    res.json({
      message: 'Stock updated',
      medication: med
    });
  } catch {
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

module.exports = {
  getMedications,
  getMedication,
  addMedication,
  updateMedication,
  deleteMedication,
  updateStock
};
