import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx-js-style');
import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@libsql/client';

const app = express();
const upload = multer({ dest: process.env.VERCEL ? '/tmp/uploads/' : 'uploads/' });
app.use(cors());
app.use(express.json());

const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://hdfc-fleet-pragadeesh123ps.aws-ap-south-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY5NzIwMDEsImlkIjoiMDFhMDBmYzktYTQwMS03YTQ2LWE0YWEtNjVhYzlmZjBlZDNiIiwia2lkIjoiNEY2Y01HOEVqamtjRE8tODRYdHRaN0Y2aTVIVEg0SmlpazF6bUVzeXd0dyIsInJpZCI6ImU3ZmY4NjllLTEyOWEtNDI4Ny1hNjY4LTNhNDQzMWVlODNiYiJ9.5k_bSNvdcQNMklpACg8eLugP6XLyW9KncbuUOUuTX_AwFF-qkMdDoQ-srcwCknwxVZ0t-BcVokxbsnP4ankqBQ';

const db = createClient({
    url: tursoUrl,
    authToken: tursoToken
});

const norm = (x: any) => String(x ?? '').trim();

async function cleanupOldData() {
    try {
        await db.execute("DELETE FROM daily_advances WHERE date < date('now', '-15 days');");
        await db.execute("DELETE FROM user_logs WHERE createdAt < datetime('now', '-15 days');");
    } catch (e) {
        console.error('Data cleanup error:', e);
    }
}

async function initDb() {
    await db.execute(`CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT,vehicleNumber TEXT NOT NULL,lastFourDigits TEXT NOT NULL,cardNumber TEXT NOT NULL,driverName TEXT NOT NULL,driverNumber TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Active',remarks TEXT DEFAULT '',ton TEXT DEFAULT '',inchargeName TEXT DEFAULT '',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await db.execute(`CREATE TABLE IF NOT EXISTS daily_advances(id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT NOT NULL,vehicleId INTEGER NOT NULL REFERENCES vehicles(id),inchargeName TEXT NOT NULL,ton TEXT NOT NULL DEFAULT '',totalAmount REAL NOT NULL,remarks TEXT DEFAULT '',driverNameOverride TEXT DEFAULT '',driverNumberOverride TEXT DEFAULT '',vehicleNumberOverride TEXT DEFAULT '',cardNumberOverride TEXT DEFAULT '',entryType TEXT DEFAULT 'LOADING',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await db.execute(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',createdAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await db.execute(`CREATE TABLE IF NOT EXISTS user_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,action TEXT NOT NULL,createdAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
    await db.execute(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
    await cleanupOldData();
}
initDb().catch(console.error);

const rows = async (sql: string, ...v: any[]) => (await db.execute({ sql, args: v })).rows as any[];
const one = async (sql: string, ...v: any[]) => (await db.execute({ sql, args: v })).rows[0] as any;

app.get('/api/settings/logo', async (q, r) => {
    const item = await one("SELECT value FROM settings WHERE key='office_logo'");
    r.json({ logo: item ? item.value : '' });
});
app.post('/api/settings/logo', async (q, r) => {
    const { logo } = q.body;
    await db.execute({ sql: "INSERT INTO settings(key, value) VALUES('office_logo', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", args: [logo || ''] });
    r.json({ success: true, logo });
});
app.delete('/api/settings/logo', async (q, r) => {
    await db.execute("DELETE FROM settings WHERE key='office_logo'");
    r.json({ success: true });
});

app.post('/api/login', async (q, r) => {
    const username = String(q.body.username || '').trim().toLowerCase();
    const password = String(q.body.password || '').trim();
    const user = await one('SELECT id,username,name,role FROM users WHERE lower(username)=? AND password=?', username, password);
    if (!user) return r.status(401).json({ message: 'Invalid username or password' });
    await db.execute({ sql: 'INSERT INTO user_logs(username,name,role,action) VALUES(?,?,?,?)', args: [user.username, user.name, user.role, 'LOGIN'] });
    r.json(user);
});

app.post('/api/logout', async (q, r) => {
    const username = String(q.body?.username || '').trim().toLowerCase();
    const name = String(q.body?.name || username).trim();
    const role = String(q.body?.role || 'user').trim();
    if (username) {
        await db.execute({ sql: 'INSERT INTO user_logs(username,name,role,action) VALUES(?,?,?,?)', args: [username, name, role, 'LOGOUT'] });
    }
    r.json({ success: true });
});

app.get('/api/user_logs', async (q, r) => { r.json(await rows('SELECT * FROM user_logs ORDER BY id DESC LIMIT 100')); });
app.get('/api/users', async (q, r) => { r.json(await rows('SELECT id,username,name,role,createdAt FROM users ORDER BY id')); });
app.post('/api/users', async (q, r) => {
    const { username, password, name, role } = q.body;
    if (!username || !password || !name) return r.status(400).json({ message: 'Username, password, and name are required.' });
    try {
        const x = await db.execute({ sql: 'INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)', args: [String(username).trim().toLowerCase(), String(password).trim(), String(name).trim(), role === 'admin' ? 'admin' : 'user'] });
        r.status(201).json(await one('SELECT id,username,name,role,createdAt FROM users WHERE id=?', Number(x.lastInsertRowid)));
    } catch {
        r.status(409).json({ message: 'Username already exists.' });
    }
});
app.put('/api/users/:id', async (q, r) => {
    const { password, name, role } = q.body;
    if (!name) return r.status(400).json({ message: 'Name is required.' });
    if (password) await db.execute({ sql: 'UPDATE users SET password=?,name=?,role=? WHERE id=?', args: [String(password).trim(), String(name).trim(), role === 'admin' ? 'admin' : 'user', Number(q.params.id)] });
    else await db.execute({ sql: 'UPDATE users SET name=?,role=? WHERE id=?', args: [String(name).trim(), role === 'admin' ? 'admin' : 'user', Number(q.params.id)] });
    r.json(await one('SELECT id,username,name,role,createdAt FROM users WHERE id=?', Number(q.params.id)));
});
app.delete('/api/users/:id', async (q, r) => {
    await db.execute({ sql: 'DELETE FROM users WHERE id=?', args: [Number(q.params.id)] });
    r.status(200).json({ success: true });
});

const vehiclePayload = (b: any) => {
    const vehicleNumber = norm(b.vehicleNumber).toUpperCase();
    const digitsOnly = (norm(b.lastFourDigits) || vehicleNumber).replace(/\D/g, '');
    const lastFourDigits = (digitsOnly.slice(-4) || '0000').padStart(4, '0');
    return {
        vehicleNumber: vehicleNumber || `VEH-${lastFourDigits}`,
        lastFourDigits,
        cardNumber: norm(b.cardNumber) || 'N/A',
        driverName: norm(b.driverName) || 'Driver',
        driverNumber: norm(b.driverNumber) || 'N/A',
        inchargeName: norm(b.inchargeName),
        status: b.status === 'Inactive' ? 'Inactive' : 'Active',
        remarks: norm(b.remarks),
        ton: norm(b.ton)
    };
};
function valid(v: any) { return /^\d{4}$/.test(v.lastFourDigits); }

app.get('/api/vehicles', async (q, r) => {
    const s = '%' + norm(q.query.q) + '%';
    r.json(await rows(`SELECT * FROM vehicles WHERE vehicleNumber LIKE ? OR lastFourDigits LIKE ? OR cardNumber LIKE ? OR driverName LIKE ? OR inchargeName LIKE ? ORDER BY status,lastFourDigits`, s, s, s, s, s));
});
app.get('/api/vehicles/lookup/:last4', async (q, r) => {
    const v = await one("SELECT * FROM vehicles WHERE lastFourDigits=? AND status='Active'", norm(q.params.last4).padStart(4, '0'));
    v ? r.json(v) : r.status(404).json({ message: 'Vehicle not found' });
});
app.post('/api/vehicles', async (q, r) => {
    const v = vehiclePayload(q.body);
    if (!valid(v)) return r.status(400).json({ message: 'Please complete all required vehicle fields; last 4 must contain exactly 4 digits.' });
    const dup = await one('SELECT id FROM vehicles WHERE lower(vehicleNumber)=lower(?)', v.vehicleNumber);
    if (dup) return r.status(409).json({ message: `Vehicle Number ${v.vehicleNumber} already exists in Master list.` });
    const x = await db.execute({ sql: 'INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,inchargeName,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?,?)', args: [v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton] });
    r.status(201).json(await one('SELECT * FROM vehicles WHERE id=?', Number(x.lastInsertRowid)));
});
app.put('/api/vehicles/:id', async (q, r) => {
    const v = vehiclePayload(q.body);
    if (!valid(v)) return r.status(400).json({ message: 'Invalid vehicle data' });
    const dup = await one('SELECT id FROM vehicles WHERE lower(vehicleNumber)=lower(?) AND id!=?', v.vehicleNumber, Number(q.params.id));
    if (dup) return r.status(409).json({ message: `Vehicle Number ${v.vehicleNumber} already exists in Master list.` });
    await db.execute({ sql: 'UPDATE vehicles SET vehicleNumber=?,lastFourDigits=?,cardNumber=?,driverName=?,driverNumber=?,inchargeName=?,status=?,remarks=?,ton=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?', args: [v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton, Number(q.params.id)] });
    r.json(await one('SELECT * FROM vehicles WHERE id=?', Number(q.params.id)));
});
app.delete('/api/vehicles/:id', async (q, r) => {
    try {
        await db.execute({ sql: 'DELETE FROM vehicles WHERE id=?', args: [Number(q.params.id)] });
        r.status(200).json({ success: true });
    } catch {
        r.status(409).json({ message: 'Cannot delete a vehicle with advance records. Deactivate it instead.' });
    }
});

const join = `SELECT a.*,COALESCE(NULLIF(a.vehicleNumberOverride,''),v.vehicleNumber) AS vehicleNumber,v.lastFourDigits,COALESCE(NULLIF(a.cardNumberOverride,''),v.cardNumber) AS cardNumber,COALESCE(NULLIF(a.driverNameOverride,''),v.driverName) AS driverName,COALESCE(NULLIF(a.driverNumberOverride,''),v.driverNumber) AS driverNumber,COALESCE(NULLIF(a.ton,''),v.ton) AS ton FROM daily_advances a JOIN vehicles v ON v.id=a.vehicleId`;

app.get('/api/advances', async (q, r) => {
    await cleanupOldData();
    const date = norm(q.query.date);
    r.json(await rows(join + (date ? ' WHERE a.date=?' : '') + ' ORDER BY a.id DESC', ...(date ? [date] : [])));
});

app.post('/api/advances', async (q, r) => {
    const b = q.body, date = norm(b.date), vehicleId = Number(b.vehicleId);
    const v = await one('SELECT * FROM vehicles WHERE id=?', vehicleId);
    if (!date || !v || !norm(b.inchargeName) || isNaN(Number(b.totalAmount))) return r.status(400).json({ message: 'Complete all required fields with a valid active vehicle.' });
    if (!b.allowDuplicate && await one('SELECT id FROM daily_advances WHERE date=? AND vehicleId=?', date, vehicleId)) return r.status(409).json({ message: "This vehicle has already been added for today's advance.", duplicate: true });

    const driverNameInput = norm(b.driverNameOverride) || norm(b.driverName);
    const driverNumberInput = norm(b.driverNumberOverride) || norm(b.driverNumber);
    const vehicleNumberInput = norm(b.vehicleNumberOverride);
    const cardNumberInput = norm(b.cardNumberOverride);

    if (driverNameInput && (!norm(v.driverName) || v.driverName === 'Pending update')) {
        await db.execute({ sql: "UPDATE vehicles SET driverName=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?", args: [driverNameInput, vehicleId] });
    }
    if (driverNumberInput && (!norm(v.driverNumber) || v.driverNumber === 'PENDING')) {
        await db.execute({ sql: "UPDATE vehicles SET driverNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?", args: [driverNumberInput, vehicleId] });
    }
    if (vehicleNumberInput && (norm(v.vehicleNumber).startsWith('PENDING') || !norm(v.vehicleNumber))) {
        await db.execute({ sql: "UPDATE vehicles SET vehicleNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?", args: [vehicleNumberInput, vehicleId] });
    }
    if (cardNumberInput && (norm(v.cardNumber) === 'PENDING' || !norm(v.cardNumber))) {
        await db.execute({ sql: "UPDATE vehicles SET cardNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?", args: [cardNumberInput, vehicleId] });
    }

    const tonVal = norm(b.ton) || norm(v.ton);
    const cardCheck = cardNumberInput || norm(v.cardNumber);
    const isPersonal = cardCheck.toUpperCase() === 'P/A' || cardCheck.toUpperCase() === 'PA';
    const isExtra = !isPersonal && (/\bextra\b/i.test(norm(b.remarks)) || norm(b.entryType).toUpperCase() === 'EXTRA');
    const entryType = isPersonal ? 'PERSONAL' : (isExtra ? 'EXTRA' : (norm(b.entryType) || 'LOADING'));

    const x = await db.execute({ sql: 'INSERT INTO daily_advances(date,vehicleId,inchargeName,ton,totalAmount,remarks,driverNameOverride,driverNumberOverride,vehicleNumberOverride,cardNumberOverride,entryType) VALUES(?,?,?,?,?,?,?,?,?,?,?)', args: [date, vehicleId, norm(b.inchargeName), tonVal, Number(b.totalAmount), norm(b.remarks), driverNameInput, driverNumberInput, vehicleNumberInput, cardNumberInput, entryType] });
    r.status(201).json(await one(join + ' WHERE a.id=?', Number(x.lastInsertRowid)));
});

app.post('/api/advances/bulk', async (q, r) => {
    const b = q.body, date = norm(b.date), incharge = norm(b.inchargeName), globalTon = norm(b.ton), entries = Array.isArray(b.entries) ? b.entries : [], group = ['LOADING', 'PERSONAL', 'EXTRA'].includes(b.entryType) ? b.entryType : 'LOADING';
    if (!date || !incharge) return r.status(400).json({ message: 'Date and incharge name are required.' });
    let added = 0, duplicates = 0, invalid = 0, pending = 0;

    for (const x of entries) {
        const lastFour = norm(x.lastFourDigits).padStart(4, '0');
        let v = await one('SELECT * FROM vehicles WHERE lastFourDigits=?', lastFour);
        if (!v && b.allowUnmatched && /^\d{4}$/.test(lastFour)) {
            const res = await db.execute({ sql: 'INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?)', args: [`PENDING-${lastFour}`, lastFour, 'PENDING', 'Pending update', 'PENDING', 'Inactive', 'Auto-created from pasted advance message — update this vehicle before future use.', norm(x.ton) || globalTon] });
            v = await one('SELECT * FROM vehicles WHERE id=?', Number(res.lastInsertRowid));
        }
        if (!v || isNaN(Number(x.totalAmount))) { invalid++; continue }
        if (b.allowDuplicate === false && await one('SELECT id FROM daily_advances WHERE date=? AND vehicleId=?', date, Number(v.id))) { duplicates++; continue }
        const isPersonal = !!x.driverNameOverride || norm(v.cardNumber).toUpperCase() === 'P/A' || norm(v.cardNumber).toUpperCase() === 'PA';
        const isExtra = !isPersonal && (/\bextra\b/i.test(norm(x.remarks)) || group === 'EXTRA');
        const entryType = isPersonal ? 'PERSONAL' : (isExtra ? 'EXTRA' : group);
        const tonVal = norm(x.ton) || v.ton || globalTon;

        await db.execute({ sql: 'INSERT INTO daily_advances(date,vehicleId,inchargeName,ton,totalAmount,remarks,driverNameOverride,entryType) VALUES(?,?,?,?,?,?,?,?)', args: [date, v.id, incharge, tonVal, Number(x.totalAmount), norm(x.remarks), norm(x.driverNameOverride), entryType] });
        added++;
    }
    r.json({ added, duplicates, invalid, pending });
});

app.put('/api/advances/:id', async (q, r) => {
    const id = Number(q.params.id);
    const b = q.body;
    const driverNameInput = norm(b.driverNameOverride) || norm(b.driverName);
    const driverNumberInput = norm(b.driverNumberOverride) || norm(b.driverNumber);
    const vehicleNumberInput = norm(b.vehicleNumberOverride);
    const cardNumberInput = norm(b.cardNumberOverride);
    const type = ['LOADING', 'PERSONAL', 'EXTRA'].includes(norm(b.entryType).toUpperCase()) ? norm(b.entryType).toUpperCase() : 'LOADING';

    await db.execute({ sql: 'UPDATE daily_advances SET inchargeName=?,ton=?,totalAmount=?,remarks=?,driverNameOverride=?,driverNumberOverride=?,vehicleNumberOverride=?,cardNumberOverride=?,entryType=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?', args: [norm(b.inchargeName), norm(b.ton), Number(b.totalAmount), norm(b.remarks), driverNameInput, driverNumberInput, vehicleNumberInput, cardNumberInput, type, id] });
    const updated = await one(join + ' WHERE a.id=?', id);
    r.json(updated || { success: true });
});

app.delete('/api/advances/:id', async (q, r) => {
    await db.execute({ sql: 'DELETE FROM daily_advances WHERE id=?', args: [Number(q.params.id)] });
    r.status(200).json({ success: true });
});

app.get('/api/dashboard', async (q, r) => {
    const date = norm(q.query.date);
    const s = await one('SELECT count(*) vehicles, COALESCE(sum(totalAmount),0) amount FROM daily_advances WHERE date=?', date);
    const tonCount = await one("SELECT GROUP_CONCAT(ton, ', ') t FROM (SELECT ton FROM daily_advances WHERE date=? AND ton!='' GROUP BY ton)", date);
    const activeVehicles = (await one("SELECT count(*) c FROM vehicles WHERE status='Active'")).c;
    const recent = await rows(join + (date ? ' WHERE a.date=?' : '') + ' ORDER BY a.createdAt DESC LIMIT 5', ...(date ? [date] : []));
    r.json({
        vehicles: s?.vehicles || 0,
        amount: s?.amount || 0,
        ton: tonCount?.t || '—',
        activeVehicles: activeVehicles || 0,
        recent: recent || []
    });
});

function workbook(data: any[], title: string) {
    const headers = ['S.NO', 'VEHICLE NO', 'CARD NO', 'DRIVER NAME', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'TOTAL AMOUNT', 'REMARKS'];
    const sheet = XLSX.utils.aoa_to_sheet([[title], headers, ...data.map((x, i) => [i + 1, x.vehicleNumber, x.entryType === 'PERSONAL' ? 'P/A' : x.cardNumber, x.driverName, x.driverNumber, x.inchargeName, x.ton, x.totalAmount, x.remarks])]);
    sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
    sheet['!cols'] = [8, 18, 16, 18, 16, 20, 10, 16, 30].map(w => ({ wch: w }));
    sheet['!freeze'] = { xSplit: 0, ySplit: 2 };
    sheet['!pageSetup'] = { orientation: 'portrait', fitToWidth: 1, fitToHeight: 0 };
    return sheet;
}

function exportThreeSetsExcel(data: any[], dateText: string) {
    const headers = ['S.NO', 'VEHICLE NO', 'CARD NO', 'DRIVER NAME', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'TOTAL AMOUNT', 'REMARKS'];
    const aoa: any[][] = [];
    const merges: any[] = [];
    const rowTypes: string[] = [];

    aoa.push([`HDFC FLEET EXPRESS CARD DATE : ${dateText}`]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });
    rowTypes.push('title');

    let grandTotal = 0;
    for (const type of ['LOADING', 'PERSONAL', 'EXTRA']) {
        const group = data.filter((x: any) => (x.entryType || 'LOADING') === type);
        const sectionTotal = group.reduce((n: number, x: any) => n + Number(x.totalAmount || 0), 0);
        grandTotal += sectionTotal;

        const headerRowIdx = aoa.length;
        aoa.push([type]);
        merges.push({ s: { r: headerRowIdx, c: 0 }, e: { r: headerRowIdx, c: 8 } });
        rowTypes.push('sectionHeader');

        aoa.push(headers);
        rowTypes.push('tableHeader');

        for (let i = 0; i < group.length; i++) {
            const x = group[i];
            const cardNo = (type === 'PERSONAL' || norm(x.cardNumber).toUpperCase() === 'P/A' || norm(x.cardNumber).toUpperCase() === 'PA') ? 'P/A' : x.cardNumber;
            aoa.push([
                i + 1,
                x.vehicleNumber || '',
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

        aoa.push(['', '', '', '', '', '', 'TOTAL', sectionTotal, '']);
        rowTypes.push('total');

        if (type === 'EXTRA') {
            aoa.push(['', '', '', '', '', '', 'GRAND TOTAL', grandTotal, '']);
            rowTypes.push('grandTotal');
        } else {
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
        { wch: 18 }, // VEHICLE NO
        { wch: 14 }, // CARD NO
        { wch: 24 }, // DRIVER NAME
        { wch: 16 }, // DRIVER NO
        { wch: 20 }, // INCHARGE NAME
        { wch: 12 }, // TON
        { wch: 18 }, // TOTAL AMOUNT
        { wch: 34 }  // REMARKS
    ];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    ws['!pageSetup'] = { orientation: 'portrait', fitToWidth: 1, fitToHeight: 0 };

    const blueHeaderFill = { fgColor: { rgb: '00A2E8' }, patternType: 'solid' };
    const blueTotalFill = { fgColor: { rgb: '00A2E8' }, patternType: 'solid' };
    const thinBorder = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
    };

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:I1');
    for (let r = range.s.r; r <= range.e.r; r++) {
        const rowType = rowTypes[r] || 'data';
        if (rowType === 'blank') continue;

        for (let c = 0; c <= 8; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            if (!ws[cellAddress]) {
                ws[cellAddress] = { t: 's', v: '' };
            }
            const cell = ws[cellAddress];

            if (rowType === 'title') {
                cell.s = { font: { bold: true, sz: 12, color: { rgb: '000000' }, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder };
            } else if (rowType === 'sectionHeader') {
                cell.s = { font: { bold: true, sz: 11, color: { rgb: '000000' }, name: 'Calibri' }, fill: blueHeaderFill, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder };
            } else if (rowType === 'tableHeader') {
                cell.s = { font: { bold: true, sz: 10, color: { rgb: '000000' }, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder };
            } else if (rowType === 'total' || rowType === 'grandTotal') {
                cell.s = { font: { bold: true, sz: 10, color: { rgb: '000000' }, name: 'Calibri' }, fill: blueTotalFill, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder };
            } else {
                cell.s = { font: { sz: 10, color: { rgb: '000000' }, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder };
            }
        }
    }
    return ws;
}

app.get('/api/export/advances', async (q, r) => {
    const date = norm(q.query.date), all = q.query.all === 'true', three = q.query.sets === 'three', data = await rows(join + (all ? '' : ' WHERE a.date=?') + ' ORDER BY a.date,a.id', ...(all ? [] : [date]));
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

app.get('/api/export/vehicles', async (q, r) => {
    const data = await rows('SELECT * FROM vehicles ORDER BY lastFourDigits,vehicleNumber');
    const ws = XLSX.utils.json_to_sheet(data.map(v => ({
        'Vehicle No': v.vehicleNumber,
        'Card No': v.cardNumber,
        'Driver Name': v.driverName,
        'Driver No': v.driverNumber,
        'Incharge Name': v.inchargeName || '',
        'Ton': v.ton || '',
        'Status': v.status || 'Active',
        'Remarks': v.remarks || ''
    })));
    ws['!cols'] = [18, 16, 22, 16, 18, 12, 12, 25].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Master');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    r.attachment('Vehicle_Master.xlsx').send(buf);
});

app.get('/api/export/template/vehicles', (q, r) => {
    const headers = [['Vehicle No', 'Card No', 'Driver Name', 'Driver No', 'Incharge Name', 'Ton', 'Status', 'Remarks']];
    const samples = [
        ['TN38AB4511', '123456', 'Ajit', '9876543210', 'SILAMBU', '30/35', 'Active', ''],
        ['TN38AB0947', '234567', 'Kumar', '9876543211', 'DEEPAK', '20/24', 'Active', ''],
        ['TN38AB0022', 'P/A', 'Ravi', '9876543212', 'SILAMBU', '32/35', 'Active', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...samples]);
    ws['!cols'] = [18, 16, 22, 16, 18, 12, 12, 25].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master Import Template');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    r.attachment('Vehicle_Master_Import_Template.xlsx').send(buf);
});

app.post('/api/import/vehicles', upload.single('file'), async (q, r) => {
    try {
        const wb = XLSX.readFile(q.file!.path, { raw: false });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const incoming = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
        let imported = 0, updated = 0, invalid = 0;
        for (const row of incoming) {
            const getVal = (...keys: string[]) => {
                for (const k of Object.keys(row)) {
                    const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (keys.some(key => cleanK === key.toLowerCase().replace(/[^a-z0-9]/g, ''))) return String(row[k]).trim();
                }
                return '';
            };
            const vehNo = getVal('vehicleno', 'fullvehiclenumber', 'vehiclenumber', 'vehicle', 'vehno', 'vno', 'truckno', 'lorryno', 'tnno');
            const last4 = getVal('last4', 'lastfourdigits', 'last4digits', 'digits', 'last4no');
            const cardNo = getVal('cardno', 'cardnumber', 'card', 'hdfccard', 'cardnum');
            const driverName = getVal('drivername', 'driver', 'drivername/mobile', 'name', 'drivernameoverride');
            const driverNumber = getVal('driverno', 'drivernumber', 'drivermobile', 'mobile', 'phone', 'contact', 'driverphone');
            const inchargeName = getVal('inchargename', 'incharge', 'incharge name', 'supervisor');
            const ton = getVal('ton', 'capacity', 'weight');
            const status = getVal('status', 'state');
            const remarks = getVal('remarks', 'remark', 'notes', 'note');

            const v = vehiclePayload({ vehicleNumber: vehNo, lastFourDigits: last4, cardNumber: cardNo, driverName: driverName, driverNumber: driverNumber, inchargeName: inchargeName, status: status, remarks: remarks, ton: ton });
            if (!valid(v)) { invalid++; continue; }

            const existing = await one('SELECT id FROM vehicles WHERE lower(vehicleNumber)=lower(?)', v.vehicleNumber);
            if (existing) {
                await db.execute({ sql: 'UPDATE vehicles SET lastFourDigits=?,cardNumber=?,driverName=?,driverNumber=?,inchargeName=?,status=?,remarks=?,ton=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?', args: [v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton, Number(existing.id)] });
                updated++;
            } else {
                await db.execute({ sql: 'INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,inchargeName,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?,?)', args: [v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton] });
                imported++;
            }
        }
        fs.unlinkSync(q.file!.path);
        r.json({ imported, updated, invalid });
    } catch (e) {
        r.status(400).json({ message: 'Unable to import file. Check the expected column names.' });
    }
});

const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            return res.sendFile(path.join(distPath, 'index.html'));
        }
        next();
    });
}

const PORT = Number(process.env.PORT) || 3001;
if (process.env.NODE_ENV !== 'production' || process.env.RENDER || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => console.log(`Fleet API running on port ${PORT}`));
}
export default app;
