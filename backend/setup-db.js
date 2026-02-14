/**
 * SETUP DATABASE - TOKO BUKU AA
 * Database structure sesuai ERD penjualan_aa
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    console.log('Connecting to MySQL...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        const dbName = process.env.DB_NAME || 'penjualan_aa';

        // Recreate database
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        console.log(`✓ Dropped old database (if existed)`);

        await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✓ Created database '${dbName}'`);

        await connection.query(`USE \`${dbName}\``);
        console.log(`✓ Using database '${dbName}'\n`);

        // Create barang table
        console.log('\nCreating table "barang"...');
        await connection.query(`
            CREATE TABLE barang (
                id_barang INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(255) NOT NULL,
                harga_beli DECIMAL(15,2) NOT NULL,
                harga_jual DECIMAL(15,2) NOT NULL,
                stok INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_nama (nama),
                INDEX idx_stok (stok)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Table "barang" created');

        // Create transaksi table
        console.log('\nCreating table "transaksi"...');
        await connection.query(`
            CREATE TABLE transaksi (
                id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
                tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total DECIMAL(15,2) NOT NULL,
                bayar DECIMAL(15,2) NOT NULL,
                kembalian DECIMAL(15,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tanggal (tanggal)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Table "transaksi" created');

        // Create detail_transaksi table
        console.log('\nCreating table "detail_transaksi"...');
        await connection.query(`
            CREATE TABLE detail_transaksi (
                id_detail INT AUTO_INCREMENT PRIMARY KEY,
                id_transaksi INT NOT NULL,
                id_barang INT NOT NULL,
                jumlah INT NOT NULL,
                subtotal DECIMAL(15,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi) ON DELETE CASCADE,
                FOREIGN KEY (id_barang) REFERENCES barang(id_barang) ON DELETE CASCADE,
                INDEX idx_transaksi (id_transaksi),
                INDEX idx_barang (id_barang)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Table "detail_transaksi" created');

        // Insert sample barang
        console.log('\nInserting sample barang...');
        await connection.query(`
            INSERT INTO barang (nama, harga_beli, harga_jual, stok) VALUES
            ('Laskar Pelangi', 45000, 65000, 25),
            ('Bumi Manusia', 55000, 80000, 20),
            ('Negeri 5 Menara', 50000, 75000, 30),
            ('Ayat-Ayat Cinta', 48000, 70000, 15),
            ('Supernova', 52000, 78000, 18),
            ('Pulpen Gel Hitam', 3000, 5000, 100),
            ('Pensil Mekanikal', 7000, 12000, 80),
            ('Buku Tulis A5', 4500, 8000, 150),
            ('Kotak Pensil', 9000, 15000, 60),
            ('Si Kancil', 15000, 25000, 35)
        `);
        console.log('✓ 10 sample barang inserted');

        // Verify data
        const [barangRows] = await connection.query('SELECT COUNT(*) as count FROM barang');
        console.log(`\n✅ Database setup completed! Total barang: ${barangRows[0].count}\n`);

        // Show tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables created:');
        tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

        console.log('\n📦 Sample barang:');
        const [barangs] = await connection.query('SELECT id_barang, nama, harga_jual, stok FROM barang LIMIT 5');
        barangs.forEach(b => {
            console.log(`  [${b.id_barang}] ${b.nama} - Rp ${b.harga_jual.toLocaleString('id-ID')} (Stok: ${b.stok})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

setupDatabase()
    .then(() => {
        console.log('\n✨ Ready! Start the server with: npm start\n');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Setup failed. Check MySQL is running and .env credentials are correct.\n');
        process.exit(1);
    });
