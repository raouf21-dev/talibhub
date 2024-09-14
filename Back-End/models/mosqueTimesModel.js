const pool = require('../config/db');

const savePrayerTimes = async (mosqueId, date, times) => {
  const query = `
    INSERT INTO prayer_times (mosque_id, date, fajr, dhuhr, asr, maghrib, isha, jumuah1, jumuah2, jumuah3, tarawih)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (mosque_id, date) 
    DO UPDATE SET 
      fajr = EXCLUDED.fajr,
      dhuhr = EXCLUDED.dhuhr,
      asr = EXCLUDED.asr,
      maghrib = EXCLUDED.maghrib,
      isha = EXCLUDED.isha,
      jumuah1 = EXCLUDED.jumuah1,
      jumuah2 = EXCLUDED.jumuah2,
      jumuah3 = EXCLUDED.jumuah3,
      tarawih = EXCLUDED.tarawih
  `;
  
  const values = [
    mosqueId, date, 
    times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha,
    times.jumuah1, times.jumuah2, times.jumuah3, times.tarawih
  ];

  await pool.query(query, values);
};

const getPrayerTimes = async (mosqueId, date) => {
  const query = 'SELECT * FROM prayer_times WHERE mosque_id = $1 AND date = $2';
  const result = await pool.query(query, [mosqueId, date]);
  return result.rows[0];
};

const getAllMosques = async () => {
  const query = 'SELECT * FROM mosques';
  const result = await pool.query(query);
  return result.rows;
};

const searchMosques = async (lat, lon) => {
  const query = `
    SELECT id, name, address, latitude, longitude,
      earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude)) as distance
    FROM mosques
    ORDER BY ll_to_earth($1, $2) <-> ll_to_earth(latitude, longitude)
    LIMIT 10
  `;
  const result = await pool.query(query, [lat, lon]);
  return result.rows;
};

const addMosque = async (name, address, latitude, longitude) => {
  const query = `
    INSERT INTO mosques (name, address, latitude, longitude)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  const result = await pool.query(query, [name, address, latitude, longitude]);
  return result.rows[0].id;
};

const insertPrayerTimes = async (mosqueId, date, times) => {
  const query = `
    INSERT INTO prayer_times (mosque_id, date, fajr, dhuhr, asr, maghrib, isha, jumuah1, jumuah2, jumuah3, tarawih)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;
  const values = [
    mosqueId, 
    date, 
    times.fajr, 
    times.dhuhr, 
    times.asr, 
    times.maghrib, 
    times.isha,
    times.jumuah1 || null,
    times.jumuah2 || null,
    times.jumuah3 || null,
    times.tarawih || null
  ];
  await pool.query(query, values);
};

module.exports = {
  savePrayerTimes,
  getPrayerTimes,
  getAllMosques,
  searchMosques,
  addMosque,
  insertPrayerTimes
};

