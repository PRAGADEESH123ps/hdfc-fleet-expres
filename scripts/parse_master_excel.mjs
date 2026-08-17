import XLSX from 'xlsx-js-style';
import fs from 'fs';

const file = 'c:/Users/Pragadeesh S/Desktop/advance/master.xlsx.xlsx';
const wb = XLSX.readFile(file, { raw: false });
const sheet = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const seed = [];

for (let i = 2; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !row[0]) continue;

    const vehNo = String(row[0]).trim();
    if (!vehNo || vehNo.length < 5) continue;

    const last4 = vehNo.replace(/\D/g, '').slice(-4).padStart(4, '0');
    const cardNo = String(row[1] || 'P/A').trim();
    const driverName = String(row[2] || 'Unknown').trim();
    const driverNumber = String(row[3] || '-').trim();
    const inchargeName = String(row[4] || 'SILAMBU').trim();
    const ton = String(row[5] || '30/35').trim();
    const remarks = 'Master Vehicle';

    seed.push([
        vehNo,
        last4,
        cardNo,
        driverName,
        driverNumber,
        ton,
        inchargeName,
        remarks
    ]);
}

console.log(`Successfully parsed ${seed.length} master vehicles!`);
console.log('Sample parsed item:', seed[0]);

fs.writeFileSync('c:/Users/Pragadeesh S/Desktop/advance/master_seed.json', JSON.stringify(seed, null, 2));
