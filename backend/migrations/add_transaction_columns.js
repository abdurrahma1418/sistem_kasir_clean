/**
 * DATABASE MIGRATION - Add nomor_transaksi and metode_pembayaran
 * Run this to update existing database schema
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    console.log('Connecting to MySQL...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        const dbName = process.env.DB_NAME || 'penjualan_aa';
        await connection.query(`USE \`${dbName}\``);
        console.log(`✓ Using database '${dbName}'\n`);

        console.log('Running migration...\n');

        // Check if nomor_transaksi column exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'transaksi' AND COLUMN_NAME = 'nomor_transaksi'
        `, [dbName]);

        if (columns.length === 0) {
            console.log('Adding nomor_transaksi column...');
            await connection.query(`
                ALTER TABLE transaksi
                ADD COLUMN nomor_transaksi VARCHAR(50) UNIQUE AFTER id_transaksi
            `);
            await connection.query(`
                CREATE INDEX idx_nomor_transaksi ON transaksi(nomor_transaksi)
            `);

            // Generate nomor_transaksi for existing records
            console.log('Generating nomor_transaksi for existing records...');
            const [transactions] = await connection.query(`
                SELECT id_transaksi, tanggal FROM transaksi WHERE nomor_transaksi IS NULL
            `);

            for (const tx of transactions) {
                const date = new Date(tx.tanggal).toISOString().slice(0, 10).replace(/-/g, '');
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const nomorTransaksi = `TRX-${date}-${random}`;

                await connection.query(`
                    UPDATE transaksi SET nomor_transaksi = ? WHERE id_transaksi = ?
                `, [nomorTransaksi, tx.id_transaksi]);
            }

            console.log('✓ Added nomor_transaksi column');
        } else {
            console.log('✓ nomor_transaksi column already exists');
        }

        // Check if metode_pembayaran column exists
        const [methodColumns] = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'transaksi' AND COLUMN_NAME = 'metode_pembayaran'
        `, [dbName]);

        if (methodColumns.length === 0) {
            console.log('Adding metode_pembayaran column...');
            await connection.query(`
                ALTER TABLE transaksi
                ADD COLUMN metode_pembayaran VARCHAR(20) DEFAULT 'cash' AFTER kembalian
            `);
            console.log('✓ Added metode_pembayaran column');
        } else {
            console.log('✓ metode_pembayaran column already exists');
        }

        // Show updated table structure
        console.log('\nUpdated transaksi table structure:');
        const [structure] = await connection.query('DESCRIBE transaksi');
        structure.forEach((col) => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
        });

        console.log('\n✅ Migration completed successfully!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

migrate()
    .then(() => {
        console.log('✨ Done!\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Migration failed. Check MySQL is running and .env credentials are correct.\n');
        process.exit(1);
    });
