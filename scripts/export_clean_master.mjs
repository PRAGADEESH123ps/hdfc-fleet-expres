import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import XLSX from 'xlsx';

const db = new DatabaseSync(path.resolve('data/fleet.db'));
const allVehicles = db.prepare('SELECT * FROM vehicles ORDER BY lastFourDigits').all();

console.log(`Updating Vehicle_Master.xlsx with ${allVehicles.length} vehicles matching exact 6-column format...`);

const data = allVehicles.map((v) => ({
    'Vehicle No': v.vehicleNumber,
    'Card No': v.cardNumber,
    'Driver Name': v.driverName,
    'Driver No': v.driverNumber,
    'incharge name': v.inchargeName || v.remarks,
    'ton': v.ton || '30/35'
}));

const ws = XLSX.utils.json_to_sheet(data);
ws['!cols'] = [18, 14, 24, 16, 18, 12].map(w => ({ wch: w }));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Master');

XLSX.writeFile(wb, 'Vehicle_Master.xlsx');
XLSX.writeFile(wb, 'Vehicle_Master_Import_Template.xlsx');

console.log('Vehicle_Master.xlsx updated successfully with exact headers: Vehicle No | Card No | Driver Name | Driver No | incharge name | ton');
