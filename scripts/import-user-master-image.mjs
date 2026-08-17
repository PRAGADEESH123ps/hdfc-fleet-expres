import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import XLSX from 'xlsx';

const db = new DatabaseSync(path.resolve('data/fleet.db'));

const newVehicles = [
    { vehicleNumber: 'AP39UZ8043', cardNumber: 'P/A', driverName: 'GANESAN', driverNumber: '1262', remarks: 'SILAMPU', ton: '30/35' },
    { vehicleNumber: 'TN33AT7963', cardNumber: '9143', driverName: 'GANESAN', driverNumber: '1584', remarks: 'DEEPAK', ton: '24' },
    { vehicleNumber: 'AP39UY2380', cardNumber: 'P/A', driverName: 'RAMESHKUMAR YADHAV', driverNumber: '', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'TN86F6849', cardNumber: 'P/A', driverName: 'RVV SATHYA', driverNumber: '1831', remarks: 'SIVA', ton: '30/35' },
    { vehicleNumber: 'AP39WA9501', cardNumber: 'P/A', driverName: 'KIRSHNAMOORTHY', driverNumber: '1510', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA9507', cardNumber: 'P/A', driverName: 'MARIRAJA', driverNumber: '4032', remarks: 'SILAMPU', ton: '30/35' },
    { vehicleNumber: 'AP39WA2434', cardNumber: 'P/A', driverName: 'MARIDURAI', driverNumber: '1603', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA9532', cardNumber: 'P/A', driverName: 'MANIKANDAN', driverNumber: '4079', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA9536', cardNumber: 'P/A', driverName: 'SATHEESH KUMAR ROY', driverNumber: '1598', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA6681', cardNumber: 'P/A', driverName: 'AYANAR', driverNumber: '4026', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA6682', cardNumber: 'P/A', driverName: 'POOVAIYA', driverNumber: '1737', remarks: 'SHIVA', ton: '30/35' },
    { vehicleNumber: 'AP39WA6690', cardNumber: 'P/A', driverName: 'SATHYARAJ', driverNumber: '4077', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA6684', cardNumber: 'P/A', driverName: 'IVARKULARAJA', driverNumber: '1597', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA2432', cardNumber: 'P/A', driverName: 'MUTHUKUMAR', driverNumber: '1743', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'AP39WA6688', cardNumber: 'P/A', driverName: 'RAJUSIRIPALLI', driverNumber: '1823', remarks: 'SHIVA', ton: '30/35' },
    { vehicleNumber: 'AP39WA2435', cardNumber: '4523', driverName: 'GOPAL', driverNumber: '1718', remarks: 'SHIVA', ton: '30/35' },
    { vehicleNumber: 'AP39WA2433', cardNumber: 'P/A', driverName: 'BHARATHI', driverNumber: '2088', remarks: 'SHIVA', ton: '30/35' },
    { vehicleNumber: 'AP39WA2436', cardNumber: 'P/A', driverName: 'DLIP', driverNumber: '4086', remarks: 'SILAMBU', ton: '30/35' },
    { vehicleNumber: 'TN33AV9014', cardNumber: '1727', driverName: 'SEERANGAN', driverNumber: '1282', remarks: 'DEEPAK', ton: '30/35' },
    { vehicleNumber: 'AP39UY2384', cardNumber: 'P/A', driverName: 'VETRIVEL', driverNumber: '4082', remarks: 'SILAMBU', ton: '30/35' }
];

let added = 0, updated = 0;

for (const v of newVehicles) {
    const lastFour = v.vehicleNumber.replace(/\D/g, '').slice(-4).padStart(4, '0');
    const existing = db.prepare('SELECT id FROM vehicles WHERE lastFourDigits=?').get(lastFour);
    if (existing) {
        db.prepare('UPDATE vehicles SET vehicleNumber=?, cardNumber=?, driverName=?, driverNumber=?, ton=?, remarks=?, status=? WHERE id=?')
            .run(v.vehicleNumber, v.cardNumber, v.driverName, v.driverNumber, v.ton, v.remarks, 'Active', existing.id);
        updated++;
    } else {
        db.prepare('INSERT INTO vehicles (vehicleNumber, lastFourDigits, cardNumber, driverName, driverNumber, status, remarks, ton) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(v.vehicleNumber, lastFour, v.cardNumber, v.driverName, v.driverNumber, 'Active', v.remarks, v.ton);
        added++;
    }
}

console.log(`Successfully added ${added} new vehicles, updated ${updated} existing vehicles in database.`);

// Re-export Vehicle_Master.xlsx
const allVehicles = db.prepare('SELECT * FROM vehicles ORDER BY lastFourDigits').all();
const ws = XLSX.utils.json_to_sheet(allVehicles.map(v => ({
    'Vehicle No': v.vehicleNumber,
    'Last 4': v.lastFourDigits,
    'Card No': v.cardNumber,
    'Driver Name': v.driverName,
    'Driver No': v.driverNumber,
    'TON': v.ton,
    'Status': v.status,
    'Incharge / Remarks': v.remarks
})));
ws['!cols'] = [18, 10, 14, 22, 14, 12, 10, 20].map(w => ({ wch: w }));
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Master');
XLSX.writeFile(wb, 'Vehicle_Master.xlsx');
XLSX.writeFile(wb, 'Vehicle_Master_Import_Template.xlsx');
console.log('Vehicle_Master.xlsx updated successfully.');
