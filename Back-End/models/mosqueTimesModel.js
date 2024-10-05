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
    mosqueId, 
    date, 
    times.fajr || null, 
    times.dhuhr || null, 
    times.asr || null, 
    times.maghrib || null, 
    times.isha || null,
    times.jumuah1 || null, 
    times.jumuah2 || null, 
    times.jumuah3 || null, 
    times.tarawih || null
  ];

  try {
    await pool.query(query, values);
    console.log(`Prayer times saved successfully for mosque ID ${mosqueId} on date ${date}`);
  } catch (error) {
    console.error(`Failed to save prayer times for mosque ID ${mosqueId} on date ${date}:`, error);
    throw error;
  }
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

const addMosque = async (name, address, city, latitude, longitude) => {
  const query = `
    INSERT INTO mosques (name, address, city, latitude, longitude)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  const result = await pool.query(query, [name, address, city, parseFloat(latitude), parseFloat(longitude)]);
  return result.rows[0].id;
};

const searchCities = async (queryStr) => {
  const sqlQuery = `
    SELECT DISTINCT city
    FROM mosques
    WHERE city ILIKE $1
    ORDER BY city ASC
    LIMIT 10
  `;
  const values = [`%${queryStr}%`];
  const result = await pool.query(sqlQuery, values);
  return result.rows.map(row => row.city);
};

const getMosquesByCity = async (city) => {
  const sqlQuery = `
    SELECT *
    FROM mosques
    WHERE city ILIKE $1
    ORDER BY name ASC
  `;
  const values = [city];
  const result = await pool.query(sqlQuery, values);
  return result.rows;
};

const checkDataExists = async (date) => {
  try {
    const query = 'SELECT COUNT(*) FROM prayer_times WHERE date = $1';
    const values = [date];
    const result = await pool.query(query, values);
    const count = parseInt(result.rows[0].count, 10);
    return count > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification des données existantes :', error);
    throw error;
  }
};

const getAllCities = async () => {
  try {
    const query = 'SELECT DISTINCT city FROM mosques';
    const result = await pool.query(query);
    return result.rows.map(row => row.city);
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les villes :', error);
    throw error;
  }
};

const getPrayerTimesByMosqueAndDate = async (mosqueId, date) => {
  try {
    const query = 'SELECT * FROM prayer_times WHERE mosque_id = $1 AND date = $2';
    const values = [mosqueId, date];
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires de prière:', error);
    throw error;
  }
};

module.exports = {
  savePrayerTimes,
  getPrayerTimes,
  getAllMosques,
  searchMosques,
  addMosque,
  searchCities,
  getMosquesByCity,
  checkDataExists,
  getAllCities,
  getPrayerTimesByMosqueAndDate,
};
