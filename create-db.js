const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection config for postgres user
const config = {
  user: 'postgres',
  password: '1234',
  host: 'localhost',
  port: 5432,
  database: 'postgres' // Connect to default postgres database first
};

async function createDatabase() {
  const client = new Client(config);
  
  try {
    // Connect to postgres database
    await client.connect();
    console.log('Connected to postgres database');
    
    // Check if billing_software database exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'billing_software'"
    );
    
    // Create database if it doesn't exist
    if (checkResult.rows.length === 0) {
      console.log('Creating billing_software database...');
      await client.query('CREATE DATABASE billing_software');
      console.log('Database created successfully');
    } else {
      console.log('Database billing_software already exists');
    }
    
    // Close connection to postgres
    await client.end();
    
    // Now connect to billing_software database to create tables
    const dbClient = new Client({
      ...config,
      database: 'billing_software'
    });
    
    await dbClient.connect();
    console.log('Connected to billing_software database');
    
    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute schema SQL
      console.log('Creating tables...');
      await dbClient.query(schemaSql);
      console.log('Tables created successfully');
    } else {
      console.error('Schema file not found at:', schemaPath);
    }
    
    await dbClient.end();
    console.log('Database setup completed');
    
  } catch (err) {
    console.error('Error setting up database:', err);
  }
}

createDatabase(); 