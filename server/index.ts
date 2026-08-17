import express from 'express'; import cors from 'cors'; import multer from 'multer'; import XLSX from 'xlsx-js-style'; import { DatabaseSync } from 'node:sqlite'; import path from 'node:path'; import fs from 'node:fs';
const app = express(), upload = multer({ dest: 'uploads/' }); app.use(cors()); app.use(express.json());
fs.mkdirSync('data', { recursive: true }); const db = new DatabaseSync(path.resolve('data/fleet.db'));
db.exec(`PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT,vehicleNumber TEXT NOT NULL,lastFourDigits TEXT NOT NULL UNIQUE,cardNumber TEXT NOT NULL,driverName TEXT NOT NULL,driverNumber TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Active',remarks TEXT DEFAULT '',ton TEXT DEFAULT '',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS daily_advances(id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT NOT NULL,vehicleId INTEGER NOT NULL REFERENCES vehicles(id),inchargeName TEXT NOT NULL,ton TEXT NOT NULL DEFAULT '',totalAmount REAL NOT NULL,remarks TEXT DEFAULT '',driverNameOverride TEXT DEFAULT '',driverNumberOverride TEXT DEFAULT '',vehicleNumberOverride TEXT DEFAULT '',cardNumberOverride TEXT DEFAULT '',entryType TEXT DEFAULT 'LOADING',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',createdAt TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS user_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,action TEXT NOT NULL,createdAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
try { db.exec("ALTER TABLE daily_advances ADD COLUMN driverNameOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN driverNumberOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN vehicleNumberOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN cardNumberOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN entryType TEXT DEFAULT 'LOADING'") } catch { }
try { db.exec("ALTER TABLE vehicles ADD COLUMN ton TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE vehicles ADD COLUMN inchargeName TEXT DEFAULT ''") } catch { }

if (!(db.prepare("SELECT count(*) c FROM users WHERE lower(username)='deepak'").get() as any).c) {
    db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run('deepak', 'DEEPAK12', 'Deepak (Operator)', 'user');
}
if (!(db.prepare("SELECT count(*) c FROM users WHERE lower(username)='praga'").get() as any).c) {
    db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run('praga', '8667488685', 'Pragadeesh (Admin)', 'admin');
}
if (!(db.prepare("SELECT count(*) c FROM users WHERE lower(username)='user'").get() as any).c) {
    db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run('user', 'user', 'Daily Advance Operator', 'user');
}


const seed = [['TN38AB4511', '4511', '123456', 'Ajit', '9876543210', '30/35', 'SIVA'], ['TN38AB0947', '0947', '234567', 'Kumar', '9876543211', '20/24', 'DEEPAK'], ['TN38AB0022', '0022', '345678', 'Ravi', '9876543212', '32/35', 'SILAMBU'], ['TN38AB0531', '0531', '456789', 'Suresh', '9876543213', '28', 'SILAMPU'], ['TN38AB1122', '1122', '567890', 'Mani', '9876543214', '30/35', 'SHIVA']]; if (!(db.prepare('SELECT count(*) c FROM vehicles').get() as any).c) seed.forEach(x => db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,ton,inchargeName,remarks) VALUES(?,?,?,?,?,?,?,?)').run(...x, 'Sample data'));
const rows = (sql: string, ...v: any[]) => db.prepare(sql).all(...v), one = (sql: string, ...v: any[]) => db.prepare(sql).get(...v);

app.post('/api/login', (q, r) => {
    const username = String(q.body.username || '').trim().toLowerCase();
    const password = String(q.body.password || '').trim();
    const u = one('SELECT id,username,name,role FROM users WHERE lower(username)=? AND password=?', username, password) as any;
    if (!u) return r.status(401).json({ message: 'Invalid username or password.' });
    db.prepare('INSERT INTO user_logs(username,name,role,action) VALUES(?,?,?,?)').run(u.username, u.name, u.role, 'LOGIN');
    r.json(u);
});

app.post('/api/logout', (q, r) => {
    const username = String(q.body?.username || '').trim().toLowerCase();
    const name = String(q.body?.name || username).trim();
    const role = String(q.body?.role || 'user').trim();
    if (username) {
        db.prepare('INSERT INTO user_logs(username,name,role,action) VALUES(?,?,?,?)').run(username, name, role, 'LOGOUT');
    }
    r.json({ success: true });
});

app.get('/api/user_logs', (q, r) => { r.json(rows('SELECT * FROM user_logs ORDER BY id DESC LIMIT 100')); });
app.get('/api/users', (q, r) => { r.json(rows('SELECT id,username,name,role,createdAt FROM users ORDER BY id')); });
app.post('/api/users', (q, r) => {
    const { username, password, name, role } = q.body;
    if (!username || !password || !name) return r.status(400).json({ message: 'Username, password, and name are required.' });
    try {
        const x = db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run(String(username).trim().toLowerCase(), String(password).trim(), String(name).trim(), role === 'admin' ? 'admin' : 'user');
        r.status(201).json(one('SELECT id,username,name,role,createdAt FROM users WHERE id=?', x.lastInsertRowid));
    } catch {
        r.status(409).json({ message: 'Username already exists.' });
    }
});
app.put('/api/users/:id', (q, r) => {
    const { password, name, role } = q.body;
    if (!name) return r.status(400).json({ message: 'Name is required.' });
    if (password) db.prepare('UPDATE users SET password=?,name=?,role=? WHERE id=?').run(String(password).trim(), String(name).trim(), role === 'admin' ? 'admin' : 'user', q.params.id);
    else db.prepare('UPDATE users SET name=?,role=? WHERE id=?').run(String(name).trim(), role === 'admin' ? 'admin' : 'user', q.params.id);
    r.json(one('SELECT id,username,name,role,createdAt FROM users WHERE id=?', q.params.id));
});
app.delete('/api/users/:id', (q, r) => {
    db.prepare('DELETE FROM users WHERE id=?').run(q.params.id);
    r.sendStatus(204);
});

const norm = (x: any) => String(x ?? '').trim(); const vehiclePayload = (b: any) => { const vehicleNumber = norm(b.vehicleNumber).toUpperCase(); return { vehicleNumber, lastFourDigits: (norm(b.lastFourDigits) || vehicleNumber.slice(-4)).padStart(4, '0'), cardNumber: norm(b.cardNumber), driverName: norm(b.driverName), driverNumber: norm(b.driverNumber), inchargeName: norm(b.inchargeName), status: b.status === 'Inactive' ? 'Inactive' : 'Active', remarks: norm(b.remarks), ton: norm(b.ton) } };
function valid(v: any) { return v.vehicleNumber && /^\d{4}$/.test(v.lastFourDigits) && v.cardNumber && v.driverName }
app.get('/api/vehicles', (q, r) => { const s = '%' + norm(q.query.q) + '%'; r.json(rows(`SELECT * FROM vehicles WHERE vehicleNumber LIKE ? OR lastFourDigits LIKE ? OR cardNumber LIKE ? OR driverName LIKE ? OR inchargeName LIKE ? ORDER BY status,lastFourDigits`, s, s, s, s, s)); });
app.get('/api/vehicles/lookup/:last4', (q, r) => { const v = one("SELECT * FROM vehicles WHERE lastFourDigits=? AND status='Active'", norm(q.params.last4).padStart(4, '0')); v ? r.json(v) : r.status(404).json({ message: 'Vehicle not found' }); });
app.post('/api/vehicles', (q, r) => { const v = vehiclePayload(q.body); if (!valid(v)) return r.status(400).json({ message: 'Please complete all required vehicle fields; last 4 must contain exactly 4 digits.' }); try { const x = db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,inchargeName,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?,?)').run(v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton); r.status(201).json(one('SELECT * FROM vehicles WHERE id=?', x.lastInsertRowid)); } catch { r.status(409).json({ message: 'A vehicle with these last 4 digits already exists.' }) } });
app.put('/api/vehicles/:id', (q, r) => { const v = vehiclePayload(q.body); if (!valid(v)) return r.status(400).json({ message: 'Invalid vehicle data' }); try { db.prepare('UPDATE vehicles SET vehicleNumber=?,lastFourDigits=?,cardNumber=?,driverName=?,driverNumber=?,inchargeName=?,status=?,remarks=?,ton=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?').run(v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton, q.params.id); r.json(one('SELECT * FROM vehicles WHERE id=?', q.params.id)); } catch { r.status(409).json({ message: 'Last 4 digits must be unique.' }) } }); app.delete('/api/vehicles/:id', (q, r) => { try { db.prepare('DELETE FROM vehicles WHERE id=?').run(q.params.id); r.sendStatus(204) } catch { r.status(409).json({ message: 'Cannot delete a vehicle with advance records. Deactivate it instead.' }) } });
const join = `SELECT a.*,COALESCE(NULLIF(a.vehicleNumberOverride,''),v.vehicleNumber) AS vehicleNumber,v.lastFourDigits,COALESCE(NULLIF(a.cardNumberOverride,''),v.cardNumber) AS cardNumber,COALESCE(NULLIF(a.driverNameOverride,''),v.driverName) AS driverName,COALESCE(NULLIF(a.driverNumberOverride,''),v.driverNumber) AS driverNumber,COALESCE(NULLIF(a.ton,''),v.ton) AS ton FROM daily_advances a JOIN vehicles v ON v.id=a.vehicleId`;

app.get('/api/advances', (q, r) => { const date = norm(q.query.date); r.json(rows(join + (date ? ' WHERE a.date=?' : '') + ' ORDER BY a.id DESC', ...(date ? [date] : []))); });
app.post('/api/advances', (q, r) => { const b = q.body, date = norm(b.date), vehicleId = Number(b.vehicleId); const v = one('SELECT * FROM vehicles WHERE id=?', vehicleId); if (!date || !v || !norm(b.inchargeName) || isNaN(Number(b.totalAmount))) return r.status(400).json({ message: 'Complete all required fields with a valid active vehicle.' }); if (!b.allowDuplicate && one('SELECT id FROM daily_advances WHERE date=? AND vehicleId=?', date, vehicleId)) return r.status(409).json({ message: "This vehicle has already been added for today's advance.", duplicate: true }); const driverNameInput = norm(b.driverNameOverride) || norm(b.driverName); const driverNumberInput = norm(b.driverNumberOverride) || norm(b.driverNumber); const vehicleNumberInput = norm(b.vehicleNumberOverride); const cardNumberInput = norm(b.cardNumberOverride); if (driverNameInput && (!norm((v as any).driverName) || (v as any).driverName === 'Pending update')) { db.prepare("UPDATE vehicles SET driverName=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(driverNameInput, vehicleId) } if (driverNumberInput && (!norm((v as any).driverNumber) || (v as any).driverNumber === 'PENDING')) { db.prepare("UPDATE vehicles SET driverNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(driverNumberInput, vehicleId) } if (vehicleNumberInput && (norm((v as any).vehicleNumber).startsWith('PENDING') || !norm((v as any).vehicleNumber))) { db.prepare("UPDATE vehicles SET vehicleNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(vehicleNumberInput, vehicleId) } if (cardNumberInput && (norm((v as any).cardNumber) === 'PENDING' || !norm((v as any).cardNumber))) { db.prepare("UPDATE vehicles SET cardNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(cardNumberInput, vehicleId) } const tonVal = norm(b.ton) || norm((v as any).ton); const cardCheck = cardNumberInput || norm((v as any).cardNumber); const isPersonal = cardCheck.toUpperCase() === 'P/A' || cardCheck.toUpperCase() === 'PA'; const isExtra = !isPersonal && (/\bextra\b/i.test(norm(b.remarks)) || norm(b.entryType).toUpperCase() === 'EXTRA'); const entryType = isPersonal ? 'PERSONAL' : (isExtra ? 'EXTRA' : (norm(b.entryType) || 'LOADING')); const x = db.prepare('INSERT INTO daily_advances(date,vehicleId,inchargeName,ton,totalAmount,remarks,driverNameOverride,driverNumberOverride,vehicleNumberOverride,cardNumberOverride,entryType) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(date, vehicleId, norm(b.inchargeName), tonVal, Number(b.totalAmount), norm(b.remarks), driverNameInput, driverNumberInput, vehicleNumberInput, cardNumberInput, entryType); r.status(201).json(one(join + ' WHERE a.id=?', x.lastInsertRowid)); });
app.post('/api/advances/bulk', (q, r) => { const b = q.body, date = norm(b.date), incharge = norm(b.inchargeName), globalTon = norm(b.ton), entries = Array.isArray(b.entries) ? b.entries : [], group = ['LOADING', 'PERSONAL', 'EXTRA'].includes(b.entryType) ? b.entryType : 'LOADING'; if (!date || !incharge) return r.status(400).json({ message: 'Date and incharge name are required.' }); let added = 0, duplicates = 0, invalid = 0, pending = 0; for (const x of entries) { const lastFour = norm(x.lastFourDigits).padStart(4, '0'); let v = one('SELECT * FROM vehicles WHERE lastFourDigits=?', lastFour); if (!v && b.allowUnmatched && /^\d{4}$/.test(lastFour)) { const id = db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?)').run(`PENDING-${lastFour}`, lastFour, 'PENDING', 'Pending update', 'PENDING', 'Inactive', 'Auto-created from pasted advance message — update this vehicle before future use.', norm(x.ton) || globalTon).lastInsertRowid; v = one('SELECT * FROM vehicles WHERE id=?', id) } if (!v || isNaN(Number(x.totalAmount))) { invalid++; continue } if (!b.allowDuplicate && one('SELECT id FROM daily_advances WHERE date=? AND vehicleId=?', date, (v as any).id)) { duplicates++; continue } const isPersonal = !!x.driverNameOverride || norm((v as any).cardNumber).toUpperCase() === 'P/A' || norm((v as any).cardNumber).toUpperCase() === 'PA'; const isExtra = !isPersonal && (/\bextra\b/i.test(norm(x.remarks)) || group === 'EXTRA'); const entryType = isPersonal ? 'PERSONAL' : (isExtra ? 'EXTRA' : group); const tonVal = norm(x.ton) || (v as any).ton || globalTon; db.prepare('INSERT INTO daily_advances(date,vehicleId,inchargeName,ton,totalAmount,remarks,driverNameOverride,entryType) VALUES(?,?,?,?,?,?,?,?)').run(date, (v as any).id, incharge, tonVal, Number(x.totalAmount), norm(x.remarks), norm(x.driverNameOverride), entryType); added++ } r.json({ added, duplicates, invalid, pending }) });


app.put('/api/advances/:id', (q, r) => { const b = q.body; const driverNameInput = norm(b.driverNameOverride) || norm(b.driverName); const driverNumberInput = norm(b.driverNumberOverride) || norm(b.driverNumber); const vehicleNumberInput = norm(b.vehicleNumberOverride); const cardNumberInput = norm(b.cardNumberOverride); const type = ['LOADING', 'PERSONAL', 'EXTRA'].includes(norm(b.entryType).toUpperCase()) ? norm(b.entryType).toUpperCase() : 'LOADING'; db.prepare('UPDATE daily_advances SET inchargeName=?,ton=?,totalAmount=?,remarks=?,driverNameOverride=?,driverNumberOverride=?,vehicleNumberOverride=?,cardNumberOverride=?,entryType=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?').run(norm(b.inchargeName), norm(b.ton), Number(b.totalAmount), norm(b.remarks), driverNameInput, driverNumberInput, vehicleNumberInput, cardNumberInput, type, q.params.id); r.json(one(join + ' WHERE a.id=?', q.params.id)); }); app.delete('/api/advances/:id', (q, r) => { db.prepare('DELETE FROM daily_advances WHERE id=?').run(q.params.id); r.sendStatus(204) });




app.get('/api/dashboard', (q, r) => {
    const date = norm(q.query.date);
    const s = one('SELECT count(*) vehicles, COALESCE(sum(totalAmount),0) amount FROM daily_advances WHERE date=?', date) as any;
    const tonCount = one("SELECT GROUP_CONCAT(ton, ', ') t FROM (SELECT ton FROM daily_advances WHERE date=? AND ton!='' GROUP BY ton)", date) as any;
    const activeVehicles = (one("SELECT count(*) c FROM vehicles WHERE status='Active'") as any).c;
    const recent = rows(join + (date ? ' WHERE a.date=?' : '') + ' ORDER BY a.createdAt DESC LIMIT 5', ...(date ? [date] : []));
    r.json({
        vehicles: s?.vehicles || 0,
        amount: s?.amount || 0,
        ton: tonCount?.t || '—',
        activeVehicles: activeVehicles || 0,
        recent: recent || []
    });
});

function workbook(data: any[], title: string) { const headers = ['S.NO', 'VEHICLE NO', 'CARD NO', 'DRIVER NAME', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'TOTAL AMOUNT', 'REMARKS']; const sheet = XLSX.utils.aoa_to_sheet([[title], headers, ...data.map((x, i) => [i + 1, x.vehicleNumber, x.entryType === 'PERSONAL' ? 'P/A' : x.cardNumber, x.driverName, x.driverNumber, x.inchargeName, x.ton, x.totalAmount, x.remarks])]); sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }]; sheet['!cols'] = [8, 18, 16, 18, 16, 20, 10, 16, 30].map(w => ({ wch: w })); sheet['!freeze'] = { xSplit: 0, ySplit: 2 }; return sheet; }

function exportThreeSetsExcel(data: any[], dateText: string) {
    const headers = ['S.NO', 'CARD NO', 'DRIVER NAME', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'TOTAL AMOUNT', 'REMARKS'];
    const aoa: any[][] = [];
    const merges: any[] = [];
    const rowTypes: string[] = [];

    // Top Title Row
    aoa.push([`HDFC FLEET EXPRESS CARD DATE : ${dateText}`]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });
    rowTypes.push('title');

    let grandTotal = 0;

    for (const type of ['LOADING', 'PERSONAL', 'EXTRA']) {
        const group = data.filter((x: any) => (x.entryType || 'LOADING') === type);
        const sectionTotal = group.reduce((n: number, x: any) => n + Number(x.totalAmount || 0), 0);
        grandTotal += sectionTotal;

        const headerRowIdx = aoa.length;
        aoa.push([type]); // Section Header Bar (LOADING / PERSONAL / EXTRA)
        merges.push({ s: { r: headerRowIdx, c: 0 }, e: { r: headerRowIdx, c: 7 } });
        rowTypes.push('sectionHeader');

        aoa.push(headers); // Table Column Headers
        rowTypes.push('tableHeader');

        for (let i = 0; i < group.length; i++) {
            const x = group[i];
            const cardNo = (type === 'PERSONAL' || norm(x.cardNumber).toUpperCase() === 'P/A' || norm(x.cardNumber).toUpperCase() === 'PA') ? 'P/A' : x.cardNumber;
            aoa.push([
                i + 1, // S.NO
                cardNo,
                x.driverName || '',
                x.driverNumber || '',
                x.inchargeName || '',
                x.ton || '',
                Number(x.totalAmount || 0),
                x.remarks || ''
            ]);
            rowTypes.push('data');
        }

        // Section Subtotal Row
        aoa.push(['', '', '', '', '', 'TOTAL', sectionTotal, '']);
        rowTypes.push('total');

        if (type === 'EXTRA') {
            // Grand Total Row right after EXTRA subtotal
            aoa.push(['', '', '', '', '', 'GRAND TOTAL', grandTotal, '']);
            rowTypes.push('grandTotal');
        } else {
            // 2 Blank Spacer Rows between sections
            aoa.push([]);
            rowTypes.push('blank');
            aoa.push([]);
            rowTypes.push('blank');
        }
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;
    ws['!cols'] = [
        { wch: 8 },  // S.NO
        { wch: 14 }, // CARD NO
        { wch: 24 }, // DRIVER NAME
        { wch: 16 }, // DRIVER NO
        { wch: 20 }, // INCHARGE NAME
        { wch: 12 }, // TON
        { wch: 18 }, // TOTAL AMOUNT
        { wch: 34 }  // REMARKS
    ];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Apply styles to all cells using xlsx-js-style specification
    const blueHeaderFill = { fgColor: { rgb: '00A2E8' }, patternType: 'solid' };
    const blueTotalFill = { fgColor: { rgb: '00A2E8' }, patternType: 'solid' };
    const thinBorder = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
    };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1');
    for (let r = range.s.r; r <= range.e.r; r++) {
        const rowType = rowTypes[r] || 'data';
        if (rowType === 'blank') continue;

        for (let c = 0; c <= 7; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            if (!ws[cellAddress]) {
                ws[cellAddress] = { t: 's', v: '' };
            }
            const cell = ws[cellAddress];

            if (rowType === 'title') {
                cell.s = {
                    font: { bold: true, sz: 12, color: { rgb: '000000' }, name: 'Calibri' },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: thinBorder
                };
            } else if (rowType === 'sectionHeader') {
                cell.s = {
                    font: { bold: true, sz: 11, color: { rgb: '000000' }, name: 'Calibri' },
                    fill: blueHeaderFill,
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: thinBorder
                };
            } else if (rowType === 'tableHeader') {
                cell.s = {
                    font: { bold: true, sz: 10, color: { rgb: '000000' }, name: 'Calibri' },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: thinBorder
                };
            } else if (rowType === 'total' || rowType === 'grandTotal') {
                cell.s = {
                    font: { bold: true, sz: 10, color: { rgb: '000000' }, name: 'Calibri' },
                    fill: blueTotalFill,
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: thinBorder
                };
            } else {
                cell.s = {
                    font: { sz: 10, color: { rgb: '000000' }, name: 'Calibri' },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: thinBorder
                };
            }
        }
    }

    return ws;
}

app.get('/api/export/advances', (q, r) => {
    const date = norm(q.query.date), all = q.query.all === 'true', three = q.query.sets === 'three', data = rows(join + (all ? '' : ' WHERE a.date=?') + ' ORDER BY a.date,a.id', ...(all ? [] : [date]));
    const wb = XLSX.utils.book_new(), dateText = date.split('-').reverse().join('.');
    if (three && !all) {
        const ws = exportThreeSetsExcel(data, dateText);
        XLSX.utils.book_append_sheet(wb, ws, 'DAILY ADVANCE');
    } else {
        XLSX.utils.book_append_sheet(wb, workbook(data, all ? 'HDFC FLEET EXPRESS CARD - ALL RECORDS' : `HDFC FLEET EXPRESS CARD DATE : ${dateText}`), 'Advances');
    }
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
    r.setHeader('Content-Disposition', `attachment; filename="HDFC_Fleet_${three ? 'Combined_Sets_' : ''}${all ? 'All' : date}.xlsx"`);
    r.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buf);
});

app.get('/api/export/vehicles', (q, r) => { const data = rows('SELECT * FROM vehicles ORDER BY lastFourDigits'); const ws = XLSX.utils.json_to_sheet(data.map(v => ({ 'Vehicle No': v.vehicleNumber, 'Card No': v.cardNumber, 'Driver Name': v.driverName, 'Driver No': v.driverNumber, 'incharge name': v.inchargeName || v.remarks, 'ton': v.ton }))); ws['!cols'] = [18, 16, 22, 16, 18, 12].map(w => ({ wch: w })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Master'); const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }); r.attachment('Vehicle_Master.xlsx').send(buf) });

app.post('/api/import/vehicles', upload.single('file'), (q, r) => { try { const wb = XLSX.readFile(q.file!.path, { raw: false }); const sheet = wb.Sheets[wb.SheetNames[0]]; const incoming = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' }); let imported = 0, updated = 0, invalid = 0; for (const row of incoming) { const getVal = (...keys: string[]) => { for (const k of Object.keys(row)) { const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); if (keys.some(key => cleanK === key.toLowerCase().replace(/[^a-z0-9]/g, ''))) return String(row[k]).trim(); } return ''; }; const vehNo = getVal('vehicleno', 'fullvehiclenumber', 'vehiclenumber', 'vehicle'); const last4 = getVal('last4', 'lastfourdigits', 'last4digits'); const cardNo = getVal('cardno', 'cardnumber', 'card'); const driverName = getVal('drivername', 'driver'); const driverNumber = getVal('driverno', 'drivernumber', 'drivermobile', 'mobile'); const inchargeName = getVal('inchargename', 'incharge', 'incharge name'); const ton = getVal('ton', 'capacity'); const status = getVal('status'); const remarks = getVal('remarks'); const v = vehiclePayload({ vehicleNumber: vehNo, lastFourDigits: last4, cardNumber: cardNo, driverName: driverName, driverNumber: driverNumber, inchargeName: inchargeName, status: status, remarks: remarks, ton: ton }); if (!valid(v)) { invalid++; continue } const existing = one('SELECT id FROM vehicles WHERE lastFourDigits=?', v.lastFourDigits); if (existing) { db.prepare('UPDATE vehicles SET vehicleNumber=?,cardNumber=?,driverName=?,driverNumber=?,inchargeName=?,status=?,remarks=?,ton=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?').run(v.vehicleNumber, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton, (existing as any).id); updated++; } else { db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,inchargeName,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?,?)').run(v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton); imported++; } } fs.unlinkSync(q.file!.path); r.json({ imported, updated, invalid }) } catch (e) { r.status(400).json({ message: 'Unable to import file. Check the expected column names.' }) } });


app.listen(3001, () => console.log('Fleet API running on http://localhost:3001'));

