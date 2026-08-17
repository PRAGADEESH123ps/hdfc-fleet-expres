import { createClient } from '@libsql/client';
import fs from 'fs';

const client = createClient({
    url: 'libsql://hdfc-fleet-pragadeesh123ps.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY5NzIwMDEsImlkIjoiMDFhMDBmYzktYTQwMS03YTQ2LWE0YWEtNjVhYzlmZjBlZDNiIiwia2lkIjoiNEY2Y01HOEVqamtjRE8tODRYdHRaN0Y2aTVIVEg0SmlpazF6bUVzeXd0dyIsInJpZCI6ImU3ZmY4NjllLTEyOWEtNDI4Ny1hNjY4LTNhNDQzMWVlODNiYiJ9.5k_bSNvdcQNMklpACg8eLugP6XLyW9KncbuUOUuTX_AwFF-qkMdDoQ-srcwCknwxVZ0t-BcVokxbsnP4ankqBQ'
});

async function seed() {
    console.log('Creating tables in Turso Cloud DB...');
    await client.execute(`CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT,vehicleNumber TEXT NOT NULL,lastFourDigits TEXT NOT NULL UNIQUE,cardNumber TEXT NOT NULL,driverName TEXT NOT NULL,driverNumber TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Active',remarks TEXT DEFAULT '',ton TEXT DEFAULT '',inchargeName TEXT DEFAULT '',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS daily_advances(id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT NOT NULL,vehicleId INTEGER NOT NULL REFERENCES vehicles(id),inchargeName TEXT NOT NULL,ton TEXT NOT NULL DEFAULT '',totalAmount REAL NOT NULL,remarks TEXT DEFAULT '',driverNameOverride TEXT DEFAULT '',driverNumberOverride TEXT DEFAULT '',vehicleNumberOverride TEXT DEFAULT '',cardNumberOverride TEXT DEFAULT '',entryType TEXT DEFAULT 'LOADING',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',createdAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS user_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,action TEXT NOT NULL,createdAt TEXT DEFAULT CURRENT_TIMESTAMP);`);

    // Seed default users
    const users = [
        ['admin', 'admin123', 'System Administrator', 'admin'],
        ['deepak', 'DEEPAK12', 'Deepak (Operator)', 'user'],
        ['praga', '8667488685', 'Pragadeesh (Admin)', 'admin'],
        ['user', 'user', 'Daily Advance Operator', 'user']
    ];
    for (const u of users) {
        await client.execute({
            sql: `INSERT OR IGNORE INTO users(username,password,name,role) VALUES(?,?,?,?)`,
            args: u
        });
    }

    // Seed master vehicles
    const seedVehicles = JSON.parse(fs.readFileSync('c:/Users/Pragadeesh S/Desktop/advance/master_seed.json', 'utf8'));
    console.log(`Seeding ${seedVehicles.length} master vehicles into Turso Cloud DB...`);

    let count = 0;
    for (const v of seedVehicles) {
        await client.execute({
            sql: `INSERT OR IGNORE INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,ton,inchargeName,remarks) VALUES(?,?,?,?,?,?,?,?)`,
            args: v
        });
        count++;
    }

    console.log(`Successfully seeded ${count} master vehicles into Turso Cloud Database!`);
}

seed().catch(err => console.error('Seeding failed:', err));
