const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Ensure password is a string and remove any quotes
const dbPassword = process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD).replace(/^"(.*)"$/, '$1') : '';

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: dbPassword,
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to the database successfully');
    release();
  }
});

// Export the query function to be used in other modules
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
}; 

