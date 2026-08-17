import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://hdfc-fleet-pragadeesh123ps.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY5NzIwMDEsImlkIjoiMDFhMDBmYzktYTQwMS03YTQ2LWE0YWEtNjVhYzlmZjBlZDNiIiwia2lkIjoiNEY2Y01HOEVqamtjRE8tODRYdHRaN0Y2aTVIVEg0SmlpazF6bUVzeXd0dyIsInJpZCI6ImU3ZmY4NjllLTEyOWEtNDI4Ny1hNjY4LTNhNDQzMWVlODNiYiJ9.5k_bSNvdcQNMklpACg8eLugP6XLyW9KncbuUOUuTX_AwFF-qkMdDoQ-srcwCknwxVZ0t-BcVokxbsnP4ankqBQ'
});

async function main() {
    console.log('Re-creating vehicles table without UNIQUE on lastFourDigits...');
    await client.execute(`PRAGMA foreign_keys=OFF;`);
    await client.execute(`CREATE TABLE IF NOT EXISTS vehicles_new(id INTEGER PRIMARY KEY AUTOINCREMENT,vehicleNumber TEXT NOT NULL,lastFourDigits TEXT NOT NULL,cardNumber TEXT NOT NULL,driverName TEXT NOT NULL,driverNumber TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Active',remarks TEXT DEFAULT '',ton TEXT DEFAULT '',inchargeName TEXT DEFAULT '',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await client.execute(`INSERT OR IGNORE INTO vehicles_new SELECT * FROM vehicles;`);
    await client.execute(`DROP TABLE vehicles;`);
    await client.execute(`ALTER TABLE vehicles_new RENAME TO vehicles;`);
    await client.execute(`PRAGMA foreign_keys=ON;`);
    console.log('Successfully updated vehicles table in Turso Cloud DB!');
}

main().catch(err => console.error('Migration error:', err));
