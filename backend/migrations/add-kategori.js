/**
 * MIGRATION - Add kategori column to buku table
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function migrate() {
  try {
    console.log('Adding kategori column to buku table...');

    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'buku'
      AND COLUMN_NAME = 'kategori'
    `);

    if (columns.length > 0) {
      console.log('Column kategori already exists');
      return;
    }

    // Add column
    await pool.query(`
      ALTER TABLE buku
      ADD COLUMN kategori VARCHAR(50) DEFAULT 'novel' AFTER terjual
    `);

    console.log('Column kategori added successfully');

    // Update existing books to have kategori
    await pool.query(`
      UPDATE buku SET kategori = 'novel' WHERE kategori IS NULL
    `);

    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
