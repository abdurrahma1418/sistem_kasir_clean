/**
 * MIGRATION - Update book categories
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function migrate() {
  try {
    console.log('Updating book categories...');

    // Update specific books to appropriate categories
    await pool.query(`
      UPDATE buku SET kategori = 'novel'
      WHERE id IN (1, 2, 3, 5, 6, 7)
    `);
    console.log('Novels updated');

    await pool.query(`
      UPDATE buku SET kategori = 'alat_sekolah'
      WHERE id IN (8, 9, 10)
    `);
    console.log('School supplies updated');

    await pool.query(`
      UPDATE buku SET kategori = 'buku_anak'
      WHERE id IN (4)
    `);
    console.log('Children books updated');

    // Show results
    const [books] = await pool.query('SELECT id, kode_barang, nama, kategori FROM buku');
    console.log('\nUpdated books:');
    books.forEach(b => {
      console.log(`  [${b.id}] ${b.nama} - ${b.kategori}`);
    });

    console.log('\nMigration completed!');
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
