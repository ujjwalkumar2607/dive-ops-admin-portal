import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import jwt from 'jsonwebtoken';

const {
  MANAGER_USER, MANAGER_PASS,
  COMANAGER_USER, COMANAGER_PASS,
  JWT_SECRET,
} = process.env;

const app = express();
app.use(cors());
app.use(express.json());

// --- Authentication & Authorization ---

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  let role;
  if (username === MANAGER_USER && password === MANAGER_PASS) {
    role = 'manager';
  } else if (username === COMANAGER_USER && password === COMANAGER_PASS) {
    role = 'co-manager';
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: username, role }, JWT_SECRET, {
    expiresIn: '8h'
  });
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireManager(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Forbidden: managers only' });
  }
  next();
}

// protect crew routes (managers only) and schedule routes (any authenticated)
app.use('/api/crew', authMiddleware, requireManager);
app.use('/api/schedule', authMiddleware);

// Health check
app.get('/', (req, res) => res.send('API is up 🚀'));

// --- Crew CRUD ---

app.get('/api/crew', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id               AS "_id",
        first_name       AS "firstName",
        last_name        AS "lastName",
        email,
        telephone,
        contact_method   AS "contactMethod",
        date_employment_started  AS "dateEmploymentStarted",
        current_cycle_start      AS "currentCycleStart",
        cycle_length_weeks       AS "cycleLengthWeeks",
        positions_trained_captain      AS "positionsTrainedCaptain",
        positions_trained_1st_mate     AS "positionsTrained1stMate",
        positions_trained_engineer     AS "positionsTrainedEngineer",
        positions_trained_chef         AS "positionsTrainedChef",
        positions_trained_deckhand     AS "positionsTrainedDeckhand",
        boats_trained_catppalu         AS "boatsTrainedCatPpalu",
        boats_trained_morningstar      AS "boatsTrainedMorningStar",
        boats_trained_seaexplorer      AS "boatsTrainedSeaExplorer",
        preferred_name                 AS "preferredName",
        bank_name                      AS "bankName",
        institute_number               AS "instituteNumber",
        transit_number                 AS "transitNumber",
        account_number                 AS "accountNumber",
        (current_cycle_start + cycle_length_weeks * INTERVAL '1 week')::DATE
          AS "currentCycleEnd"
      FROM crew
      WHERE is_active = TRUE
      ORDER BY id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crew/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id               AS "_id",
        first_name       AS "firstName",
        last_name        AS "lastName",
        email,
        telephone,
        contact_method   AS "contactMethod",
        date_employment_started  AS "dateEmploymentStarted",
        current_cycle_start      AS "currentCycleStart",
        cycle_length_weeks       AS "cycleLengthWeeks",
        positions_trained_captain      AS "positionsTrainedCaptain",
        positions_trained_1st_mate     AS "positionsTrained1stMate",
        positions_trained_engineer     AS "positionsTrainedEngineer",
        positions_trained_chef         AS "positionsTrainedChef",
        positions_trained_deckhand     AS "positionsTrainedDeckhand",
        boats_trained_catppalu         AS "boatsTrainedCatPpalu",
        boats_trained_morningstar      AS "boatsTrainedMorningStar",
        boats_trained_seaexplorer      AS "boatsTrainedSeaExplorer",
        preferred_name                 AS "preferredName",
        bank_name                      AS "bankName",
        institute_number               AS "instituteNumber",
        transit_number                 AS "transitNumber",
        account_number                 AS "accountNumber",
        (current_cycle_start + cycle_length_weeks * INTERVAL '1 week')::DATE
          AS "currentCycleEnd"
      FROM crew
      WHERE id = $1;
    `, [req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crew', async (req, res) => {
  try {
    const {
      firstName, lastName, email, telephone,
      contactMethod, dateEmploymentStarted,
      currentCycleStart, cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber
    } = req.body;

    const result = await pool.query(`
      INSERT INTO crew (
        first_name, last_name, email, telephone,
        contact_method, date_employment_started,
        current_cycle_start, cycle_length_weeks,
        positions_trained_captain,
        positions_trained_1st_mate,
        positions_trained_engineer,
        positions_trained_chef,
        positions_trained_deckhand,
        boats_trained_catppalu,
        boats_trained_morningstar,
        boats_trained_seaexplorer,
        preferred_name,
        bank_name,
        institute_number,
        transit_number,
        account_number
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING
        id               AS "_id",
        first_name       AS "firstName",
        last_name        AS "lastName",
        email,
        telephone,
        contact_method   AS "contactMethod",
        date_employment_started  AS "dateEmploymentStarted",
        current_cycle_start      AS "currentCycleStart",
        cycle_length_weeks       AS "cycleLengthWeeks",
        positions_trained_captain  AS "positionsTrainedCaptain",
        positions_trained_1st_mate AS "positionsTrained1stMate",
        positions_trained_engineer AS "positionsTrainedEngineer",
        positions_trained_chef     AS "positionsTrainedChef",
        positions_trained_deckhand AS "positionsTrainedDeckhand",
        boats_trained_catppalu     AS "boatsTrainedCatPpalu",
        boats_trained_morningstar  AS "boatsTrainedMorningStar",
        boats_trained_seaexplorer  AS "boatsTrainedSeaExplorer",
        preferred_name                 AS "preferredName",
        bank_name                      AS "bankName",
        institute_number               AS "instituteNumber",
        transit_number                 AS "transitNumber",
        account_number                 AS "accountNumber",
        (current_cycle_start + cycle_length_weeks * INTERVAL '1 week')::DATE
          AS "currentCycleEnd"
    `, [
      firstName,
      lastName,
      email,
      telephone,
      contactMethod,
      dateEmploymentStarted,
      currentCycleStart,
      cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/crew/:id', async (req, res) => {
  try {
    const {
      firstName, lastName, email, telephone,
      contactMethod, dateEmploymentStarted,
      currentCycleStart, cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber
    } = req.body;

    const result = await pool.query(`
      UPDATE crew SET
        first_name                 = $1,
        last_name                  = $2,
        email                      = $3,
        telephone                  = $4,
        contact_method             = $5,
        date_employment_started    = $6,
        current_cycle_start        = $7,
        cycle_length_weeks         = $8,
        positions_trained_captain  = $9,
        positions_trained_1st_mate = $10,
        positions_trained_engineer = $11,
        positions_trained_chef     = $12,
        positions_trained_deckhand = $13,
        boats_trained_catppalu     = $14,
        boats_trained_morningstar  = $15,
        boats_trained_seaexplorer  = $16,
        preferred_name             = $17,
        bank_name                  = $18,
        institute_number           = $19,
        transit_number             = $20,
        account_number             = $21
      WHERE id = $22
      RETURNING id;
    `, [
      firstName,
      lastName,
      email,
      telephone,
      contactMethod,
      dateEmploymentStarted,
      currentCycleStart,
      cycleLengthWeeks,
      positionsTrainedCaptain,
      positionsTrained1stMate,
      positionsTrainedEngineer,
      positionsTrainedChef,
      positionsTrainedDeckhand,
      boatsTrainedCatPpalu,
      boatsTrainedMorningStar,
      boatsTrainedSeaExplorer,
      preferredName,
      bankName,
      instituteNumber,
      transitNumber,
      accountNumber,
      req.params.id
    ]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ message: 'Updated', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/crew/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // soft‐delete: mark inactive
    await pool.query(`UPDATE crew SET is_active = FALSE WHERE id = $1`, [id]);
    res.json({ message: 'Deleted', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Schedule endpoints ---

// GET schedule for one week
app.get('/api/schedule', async (req, res) => {
  try {
    const weekStart = req.query.date;
    const result = await pool.query(`
      SELECT
        e.boat_id,
        e.position,
        e.crew_id,
        e.week_number   AS week_number,
        e.cycle_length  AS cycle_length,
        e.cycle_count   AS cycle_count,
        c.first_name,
        c.last_name,
        c.preferred_name AS "preferredName"
      FROM schedule_entries e
      JOIN crew c ON c.id = e.crew_id
      WHERE e.week_start = $1;
    `, [weekStart]);

    const slots = {};
    for (const r of result.rows) {
      slots[r.boat_id] = slots[r.boat_id] || {};
      const displayName = r.preferredName?.trim()
        ? r.preferredName
        : `${r.first_name} ${r.last_name}`;
      slots[r.boat_id][r.position] = {
        crewId:      r.crew_id,
        name:        displayName,
        week:        r.week_number,
        cycleLength: r.cycle_length,
        cycleCount:  r.cycle_count
      };
    }
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST schedule for one week, replace entries
app.post('/api/schedule', async (req, res) => {
  try {
    const { date: weekStart, slots } = req.body;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // preload each crew's configured cycle_length_weeks
    const crewRows = await pool.query(`SELECT id, cycle_length_weeks FROM crew`);
    const crewCycles = {};
    crewRows.rows.forEach(c => {
      crewCycles[c.id] = c.cycle_length_weeks;
    });

    // delete old entries
    await pool.query(`DELETE FROM schedule_entries WHERE week_start = $1;`, [weekStart]);

    const queries = [];
    for (const [boatId, positions] of Object.entries(slots)) {
      for (const [position, slot] of Object.entries(positions)) {
        const { crewId, week, name } = slot;
        if (!crewId) continue;

        // ensure non-null cycle_length & cycle_count
        const cycleLength = Number.isInteger(slot.cycleLength)
          ? slot.cycleLength
          : crewCycles[crewId] || week || 1;
        const cycleCount = typeof slot.cycleCount === 'string'
          ? slot.cycleCount
          : `${week}/${cycleLength}`;

        queries.push(
          pool.query(
            `
            INSERT INTO schedule_entries
              (week_start, week_end, week_number,
               cycle_length, cycle_count,
               boat_id, position, crew_id, crew_name)
            VALUES
              ($1,         $2,       $3,
               $4,          $5,
               $6,      $7,     $8,      $9);
            `,
            [
              weekStart,      // $1
              weekEnd,        // $2
              week,           // $3
              cycleLength,    // $4
              cycleCount,     // $5
              boatId,         // $6
              position,       // $7
              crewId,         // $8
              name            // $9
            ]
          )
        );
      }
    }

    await Promise.all(queries);
    res.json({ message: 'Saved' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
