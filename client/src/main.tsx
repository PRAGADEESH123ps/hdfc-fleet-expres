import React, { useEffect, useRef, useState } from 'react'; import { createRoot } from 'react-dom/client'; import './styles.css';
type Vehicle = { id: number; vehicleNumber: string; lastFourDigits: string; cardNumber: string; driverName: string; driverNumber: string; inchargeName?: string; ton?: string; status: string; remarks: string }; type Advance = { id: number; date: string; vehicleId: number; inchargeName: string; ton: string; totalAmount: number; remarks: string; driverNameOverride?: string } & Vehicle;
const today = () => new Date().toISOString().slice(0, 10), money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); const api = async (path: string, opt?: RequestInit) => { const r = await fetch('/api' + path, opt); if (!r.ok) throw await r.json().catch(() => ({ message: 'Request failed' })); return r.status === 204 ? null : r.json() };
const formatIST = (str: string) => {
    if (!str) return '—';
    const d = new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T') + 'Z');
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};
const formatDateIST = (str: string) => {
    if (!str) return '—';
    const d = new Date(str.includes('Z') || str.includes('+') ? str : str.replace(' ', 'T') + 'Z');
    return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
};
function Login({ onLogin }: { onLogin: (user: { id: number; username: string; name: string; role: 'admin' | 'user' }) => void }) { const [username, setUsername] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''); const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setError(''); try { const res = await api('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); onLogin(res); } catch (x: any) { setError(x.message || 'Invalid username or password.'); } }; return <div className="loginwrap"><div className="logincard"><h1>HDFC FLEET ADVANCE</h1><p>Sign in to manage daily advances and fleet master</p><form className="loginform" onSubmit={handleLogin}><label>Username<input value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter username" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" /></label>{error && <p className="error">{error}</p>}<button className="primary loginbtn">Sign In</button></form></div></div> }

function UserControl({ notify }: { notify: (s: string) => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [form, setForm] = useState({ username: '', password: '', name: '', role: 'user' });
    const [editId, setEditId] = useState<number | null>(null);

    const load = () => api('/users').then(setUsers);
    useEffect(() => { load() }, []);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editId) await api('/users/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            else await api('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            notify(editId ? 'User updated' : 'User created');
            setForm({ username: '', password: '', name: '', role: 'user' });
            setEditId(null);
            load();
        } catch (x: any) { notify(x.message) }
    };

    const editUser = (u: any) => { setEditId(u.id); setForm({ username: u.username, password: '', name: u.name, role: u.role }) };
    const deleteUser = async (id: number) => { if (confirm('Delete this user account?')) { await api('/users/' + id, { method: 'DELETE' }); notify('User deleted'); load() } };
    const [logs, setLogs] = useState<any[]>([]);
    const loadLogs = () => api('/user_logs').then(setLogs).catch(() => { });
    useEffect(() => { loadLogs(); }, []);

    return <section>
        <div className="top"><div><h1>User Control</h1><p>Manage system operators, admin permissions, and view login activity history</p></div></div>
        <form className="card masterform" onSubmit={save}>
            <h2>{editId ? 'Edit User Account' : 'Create New User Account'}</h2>
            <label>Username<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required disabled={!!editId} placeholder="e.g. driver1 or supervisor" /></label>
            <label>Password {editId ? '(Leave blank to keep current)' : ''}<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editId} placeholder="••••••••" /></label>
            <label>Full Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Ramesh Kumar" /></label>
            <label>Role / Access Level
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="user">Operator User (Daily Advance Only)</option>
                    <option value="admin">Admin (Full Access & Vehicle Master)</option>
                </select>
            </label>
            <div className="actions">
                <button className="primary">{editId ? 'Save Changes' : 'Create User'}</button>
                {editId && <button type="button" onClick={() => { setEditId(null); setForm({ username: '', password: '', name: '', role: 'user' }) }}>Cancel</button>}
            </div>
        </form>
        <div className="card">
            <h2>System Accounts ({users.length})</h2>
            <div className="tablewrap">
                <table>
                    <thead>
                        <tr><th>ID</th><th>USERNAME</th><th>FULL NAME</th><th>ROLE</th><th>CREATED AT</th><th>ACTIONS</th></tr>
                    </thead>
                    <tbody>
                        {users.map(u => <tr key={u.id}>
                            <td>{u.id}</td>
                            <td><b>{u.username}</b></td>
                            <td>{u.name}</td>
                            <td><span className={'rolebadge ' + u.role}>{u.role}</span></td>
                            <td>{formatDateIST(u.createdAt)}</td>
                            <td>
                                <button onClick={() => editUser(u)}>Edit</button>
                                <button className="danger" onClick={() => deleteUser(u.id)}>Delete</button>
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
            <div className="tableHead">
                <h2>User Login & Logout Activity Logs (India Time IST)</h2>
                <button type="button" onClick={loadLogs}>Refresh Activity Logs</button>
            </div>
            <div className="tablewrap">
                <table>
                    <thead>
                        <tr><th>S.NO</th><th>USERNAME</th><th>NAME</th><th>ROLE</th><th>ACTION</th><th>DATE & TIME (IST)</th></tr>
                    </thead>
                    <tbody>
                        {!logs.length ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>No login activity recorded yet.</td></tr> :
                            logs.map((l: any, i: number) => <tr key={l.id}>
                                <td>{i + 1}</td>
                                <td><b>{l.username}</b></td>
                                <td>{l.name}</td>
                                <td><span className={'rolebadge ' + l.role}>{l.role}</span></td>
                                <td><span className={'badge ' + (l.action === 'LOGIN' ? 'Active' : 'Inactive')}>{l.action}</span></td>
                                <td>{formatIST(l.createdAt)}</td>
                            </tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    </section>;
}

function App() {
    const [user, setUser] = useState<{ id: number; username: string; name: string; role: 'admin' | 'user' } | null>(() => { try { return JSON.parse(localStorage.getItem('fleet_user') || 'null') } catch { return null } });
    const [page, setPage] = useState('Dashboard'), [date, setDate] = useState(today()), [toast, setToast] = useState(''), [master, setMaster] = useState<Vehicle[]>([]);
    const notify = (x: string) => { setToast(x); setTimeout(() => setToast(''), 3500) };
    const nav = ['Dashboard', 'Daily Advance', 'Advance History', 'Vehicle Master', 'User Control', 'Import / Export', 'Settings'];

    useEffect(() => { if (user) api('/vehicles').then(setMaster) }, [user]);

    const handleSetUser = (u: { id: number; username: string; name: string; role: 'admin' | 'user' } | null) => {
        setUser(u);
        if (u) localStorage.setItem('fleet_user', JSON.stringify(u));
        else localStorage.removeItem('fleet_user');
    };

    const handleLogout = async () => {
        if (user) {
            try {
                await api('/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
            } catch { }
        }
        handleSetUser(null);
    };


    if (!user) return <Login onLogin={handleSetUser} />;

    return <div className="app">
        <aside>
            <div className="brand">HDFC <span>FLEET</span><small>EXPRESS ADVANCE</small></div>
            {nav.map(x => {
                const isAdminOnly = x === 'Vehicle Master' || x === 'User Control';
                const isLocked = isAdminOnly && user.role !== 'admin';
                return <button className={page === x ? 'active' : ''} onClick={() => setPage(x)} key={x}>{x} {isLocked ? '🔒' : ''}</button>;
            })}
            <div className="userinfo">
                <div>
                    <span className={'rolebadge ' + user.role}>{user.role}</span>
                    <div style={{ marginTop: 4, fontWeight: 600 }}>{user.name}</div>
                </div>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="sample">Logged in as {user.name} ({user.role.toUpperCase()}).</div>
        </aside>

        <main>
            {toast && <div className="toast">{toast}</div>}
            {page === 'Dashboard' && <Dashboard date={date} setDate={setDate} />}
            {page === 'Daily Advance' && <><Daily date={date} setDate={setDate} master={master} refresh={() => api('/vehicles').then(setMaster)} notify={notify} /><BulkPaste date={date} master={master} notify={notify} /></>}
            {page === 'Advance History' && <History notify={notify} />}
            {page === 'Vehicle Master' && (user.role === 'admin' ? <Master items={master} refresh={() => api('/vehicles').then(setMaster)} notify={notify} /> : <section><div className="restricted card"><h2>🔒 Restricted Access</h2><p>Only <b>Admin</b> users can create, edit, or manage the Vehicle Master database.</p><p>Daily advance entry and reporting functions remain fully available to all operators.</p></div></section>)}
            {page === 'User Control' && (user.role === 'admin' ? <UserControl notify={notify} /> : <section><div className="restricted card"><h2>🔒 Restricted Access</h2><p>Only <b>Admin</b> users can manage system users and access controls.</p></div></section>)}
            {page === 'Import / Export' && <Master items={master} refresh={() => api('/vehicles').then(setMaster)} notify={notify} />}
            {page === 'Settings' && <section><h1>Settings</h1><div className="card"><h3>Data safety</h3><p>Your fleet master and daily advance records are stored in the local SQLite database at <code>data/fleet.db</code>. Include this file in your regular backup process.</p></div></section>}
        </main>
    </div>
}


function Dashboard({ date, setDate }: { date: string, setDate: (d: string) => void }) { const [d, setD] = useState<any>(); useEffect(() => { api('/dashboard?date=' + date).then(setD) }, [date]); return <section><div className="top"><div><h1>Dashboard</h1><p>Daily fleet advance overview</p></div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div><div className="stats"><Stat t="Today's Vehicles" v={d?.vehicles ?? '—'} /><Stat t="Total TON" v={d?.ton ?? '—'} /><Stat t="Total Advance" v={d ? money(d.amount) : '—'} /><Stat t="Active Vehicles" v={d?.activeVehicles ?? '—'} /></div><div className="card"><h2>Recent Entries</h2><Table items={d?.recent || []} compact /></div></section> }; const Stat = ({ t, v }: { t: string, v: any }) => <div className="stat"><span>{t}</span><b>{v}</b></div>;
function Daily({ date, setDate, master, refresh, notify }: { date: string; setDate: (d: string) => void; master: Vehicle[]; refresh: () => void; notify: (x: string) => void }) {
    const [items, setItems] = useState<Advance[]>([]), [last, setLast] = useState(''), [v, setV] = useState<Vehicle | null>(null);
    const [form, setForm] = useState<any>({ vehicleNumberOverride: '', cardNumberOverride: '', driverNameOverride: '', driverNumberOverride: '', inchargeName: '', ton: '', totalAmount: '', remarks: '', entryType: 'LOADING', allowDuplicate: false });
    const [edit, setEdit] = useState<Advance | null>(null), input = useRef<HTMLInputElement>(null);
    const load = () => api('/advances?date=' + date).then(setItems);
    useEffect(() => { load(); setLast(''); setV(null); setEdit(null) }, [date]);

    useEffect(() => {
        if (last.length === 4) api('/vehicles/lookup/' + last).then(res => {
            setV(res);
            const isPA = res.cardNumber?.toUpperCase() === 'P/A' || res.cardNumber?.toUpperCase() === 'PA';
            setForm((f: any) => ({
                ...f,
                vehicleNumberOverride: (res.vehicleNumber && !res.vehicleNumber.startsWith('PENDING')) ? res.vehicleNumber : f.vehicleNumberOverride,
                cardNumberOverride: (res.cardNumber && res.cardNumber !== 'PENDING') ? res.cardNumber : f.cardNumberOverride,
                driverNameOverride: (res.driverName && res.driverName !== 'Pending update') ? res.driverName : f.driverNameOverride,
                driverNumberOverride: (res.driverNumber && res.driverNumber !== 'PENDING') ? res.driverNumber : f.driverNumberOverride,
                inchargeName: res.inchargeName || f.inchargeName || '',
                ton: res.ton || f.ton || '',
                entryType: isPA ? 'PERSONAL' : f.entryType
            }));
        }).catch(() => setV(null));
    }, [last]);

    const lookup = (x: string) => {
        setLast(x);
        if (x.length < 4) {
            setV(null);
            setForm((f: any) => ({ ...f, vehicleNumberOverride: '', cardNumberOverride: '', driverNameOverride: '', driverNumberOverride: '', inchargeName: '', ton: '' }));
        }
    };

    const handleRemarksChange = (rem: string) => {
        const isPA = (form.cardNumberOverride || v?.cardNumber)?.toUpperCase() === 'P/A' || (form.cardNumberOverride || v?.cardNumber)?.toUpperCase() === 'PA';
        const isEx = !isPA && /\bextra\b/i.test(rem);
        setForm((f: any) => ({ ...f, remarks: rem, entryType: isPA ? 'PERSONAL' : (isEx ? 'EXTRA' : f.entryType) }));
    };

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!v) return notify('Vehicle not found — add it to Vehicle Master first.');
        try {
            const payload = { ...form, ton: form.ton || v.ton, date, vehicleId: v.id };
            if (edit) await api('/advances/' + edit.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            else await api('/advances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            notify(edit ? 'Entry updated' : 'Advance entry added');
            setForm({ vehicleNumberOverride: '', cardNumberOverride: '', driverNameOverride: '', driverNumberOverride: '', inchargeName: '', ton: '', totalAmount: '', remarks: '', entryType: 'LOADING', allowDuplicate: false });
            setLast(''); setV(null); setEdit(null);
            load();
            refresh();
            setTimeout(() => input.current?.focus(), 20);
        } catch (x: any) {
            if (x.duplicate) {
                if (confirm(x.message + ' Allow a duplicate entry?')) setForm({ ...form, allowDuplicate: true });
                else notify('Open the existing entry below to edit it.');
            } else notify(x.message);
        }
    };

    const editItem = (x: Advance) => {
        setEdit(x);
        const match = master.find(m => m.id === x.vehicleId || m.lastFourDigits === x.lastFourDigits) || null;
        setV(match || { id: x.vehicleId, vehicleNumber: x.vehicleNumber, lastFourDigits: x.lastFourDigits, cardNumber: x.cardNumber, driverName: x.driverName, driverNumber: x.driverNumber, status: 'Active', remarks: '' });
        setLast(x.lastFourDigits);
        setForm({
            vehicleNumberOverride: x.vehicleNumber || '',
            cardNumberOverride: x.cardNumber || '',
            driverNameOverride: x.driverName || '',
            driverNumberOverride: x.driverNumber || '',
            inchargeName: x.inchargeName || '',
            ton: x.ton || '',
            totalAmount: x.totalAmount,
            remarks: x.remarks,
            entryType: (x as any).entryType || 'LOADING',
            allowDuplicate: false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const changeDate = (n: number) => {
        let d = new Date(date + 'T12:00:00');
        d.setDate(d.getDate() + n);
        setDate(d.toISOString().slice(0, 10));
    };

    const totals = items.reduce((a, x) => ({ amount: a.amount + Number(x.totalAmount) }), { amount: 0 });
    const uniqueTons = Array.from(new Set(items.map(x => x.ton).filter(Boolean))).join(', ');
    const suggestions = master.filter(x => x.status === 'Active' && (x.lastFourDigits.includes(last) || x.vehicleNumber.includes(last))).slice(0, 5);

    return <section>
        <div className="top">
            <div><h1>HDFC FLEET EXPRESS CARD</h1><p>Daily Advance · {date.split('-').reverse().join('.')}</p></div>
            <div className="dateNav">
                <button onClick={() => changeDate(-1)}>← Previous Day</button>
                <button onClick={() => setDate(today())}>Today</button>
                <button onClick={() => changeDate(1)}>Next Day →</button>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
        </div>

        <form className="card entry" onSubmit={add}>
            <h2>{edit ? 'Edit Advance Entry' : 'Fast Advance Entry'}</h2>
            <label>Vehicle Last 4 Digits
                <input ref={input} autoFocus maxLength={4} value={last} onChange={e => lookup(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 4511" required />
            </label>
            {last && last.length < 4 && <div className="suggestions">
                {suggestions.map(x => <button type="button" onClick={() => {
                    setLast(x.lastFourDigits); setV(x);
                    const isPA = x.cardNumber?.toUpperCase() === 'P/A' || x.cardNumber?.toUpperCase() === 'PA';
                    setForm((f: any) => ({
                        ...f,
                        vehicleNumberOverride: (x.vehicleNumber && !x.vehicleNumber.startsWith('PENDING')) ? x.vehicleNumber : f.vehicleNumberOverride,
                        cardNumberOverride: (x.cardNumber && x.cardNumber !== 'PENDING') ? x.cardNumber : f.cardNumberOverride,
                        driverNameOverride: (x.driverName && x.driverName !== 'Pending update') ? x.driverName : f.driverNameOverride,
                        driverNumberOverride: (x.driverNumber && x.driverNumber !== 'PENDING') ? x.driverNumber : f.driverNumberOverride,
                        inchargeName: x.inchargeName || f.inchargeName || '',
                        ton: x.ton || f.ton || '',
                        entryType: isPA ? 'PERSONAL' : f.entryType
                    }));
                }} key={x.id}><b>{x.lastFourDigits}</b> — {x.vehicleNumber} — {x.driverName} {x.ton ? `(${x.ton})` : ''}</button>)}
            </div>}

            <label>Vehicle No<input value={form.vehicleNumberOverride} onChange={e => setForm({ ...form, vehicleNumberOverride: e.target.value })} placeholder={v?.vehicleNumber || "Vehicle No (Editable)"} /></label>
            <label>Card No<input value={form.cardNumberOverride} onChange={e => setForm({ ...form, cardNumberOverride: e.target.value })} placeholder={v?.cardNumber || "Card No (Editable)"} /></label>
            <label>Driver Name<input value={form.driverNameOverride} onChange={e => setForm({ ...form, driverNameOverride: e.target.value })} placeholder={v?.driverName || "Driver Name (Editable)"} /></label>
            <label>Driver No<input value={form.driverNumberOverride} onChange={e => setForm({ ...form, driverNumberOverride: e.target.value })} placeholder={v?.driverNumber || "Driver Mobile (Editable)"} /></label>
            <label>Set Type
                <select value={form.entryType} onChange={e => setForm({ ...form, entryType: e.target.value })}>
                    <option value="LOADING">LOADING</option>
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="EXTRA">EXTRA</option>
                </select>
            </label>
            <label>Incharge Name<input value={form.inchargeName} onChange={e => setForm({ ...form, inchargeName: e.target.value })} placeholder={v?.inchargeName || "Incharge Name (Editable)"} required /></label>
            <label>TON<input value={form.ton} onChange={e => setForm({ ...form, ton: e.target.value })} placeholder={v?.ton || "e.g. 30/35 (Editable)"} /></label>
            <label>Total Amount<input type="number" step="0.01" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} required /></label>
            <label>Remarks<input value={form.remarks} onChange={e => handleRemarksChange(e.target.value)} placeholder="Remarks" /></label>

            <div className="actions">
                <label className="check"><input type="checkbox" checked={form.allowDuplicate} onChange={e => setForm({ ...form, allowDuplicate: e.target.checked })} /> Allow Duplicate Entry</label>
                <button className="primary">{edit ? 'Save Changes' : 'Add Entry (Enter)'}</button>
                {edit && <button type="button" onClick={() => { setEdit(null); setLast(''); setV(null) }}>Cancel</button>}
            </div>
            {last.length === 4 && !v && <p className="error">Vehicle not found. Add New Vehicle from Vehicle Master, or try again.</p>}
        </form>

        <div className="card">
            <div className="tableHead">
                <h2>Daily Entries</h2>
                <a className="primary button" href={'/api/export/advances?date=' + date + '&sets=three'}>Export 3 Sets Excel</a>
            </div>
            <Table items={items} onEdit={editItem} onDelete={async x => { if (confirm('Are you sure you want to delete this entry?')) { await api('/advances/' + x.id, { method: 'DELETE' }); load(); notify('Entry deleted') } }} />
            <div className="summary">
                <Stat t="Total Vehicles" v={items.length} />
                <Stat t="TON Summary" v={uniqueTons || '—'} />
                <Stat t="Total Advance Amount" v={money(totals.amount)} />
            </div>
        </div>
    </section>;
}



function Table({ items, onEdit, onDelete, compact }: { items: Advance[]; onEdit?: (x: Advance) => void; onDelete?: (x: Advance) => void; compact?: boolean }) { if (!items.length) return <div className="empty">No entries found for this selection.</div>; return <div className="tablewrap"><table><thead><tr>{['S.NO', 'VEHICLE NO', 'CARD NO', 'DRIVER NAME', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'TOTAL AMOUNT', 'SET', 'REMARKS', ...(compact ? [] : ['ACTIONS'])].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{items.map((x, i) => <tr key={x.id}><td>{i + 1}</td><td>{x.vehicleNumber}</td><td>{x.cardNumber}</td><td>{x.driverName}</td><td>{x.driverNumber}</td><td>{x.inchargeName}</td><td>{x.ton}</td><td>{money(x.totalAmount)}</td><td><span className={'badge ' + ((x as any).entryType || 'LOADING')}>{(x as any).entryType || 'LOADING'}</span></td><td>{x.remarks}</td>{!compact && <td><button onClick={() => onEdit?.(x)}>Edit</button><button className="danger" onClick={() => onDelete?.(x)}>Delete</button></td>}</tr>)}</tbody></table></div> }

function Master({ items, refresh, notify }: { items: Vehicle[]; refresh: () => void; notify: (s: string) => void }) { const blank = { vehicleNumber: '', cardNumber: '', driverName: '', driverNumber: '', inchargeName: '', ton: '', status: 'Active', remarks: '' }; const [f, setF] = useState<any>(blank), [edit, setEdit] = useState<Vehicle | null>(null), [q, setQ] = useState(''); const save = async (e: React.FormEvent) => { e.preventDefault(); try { await api('/vehicles' + (edit ? '/' + edit.id : ''), { method: edit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); notify(edit ? 'Vehicle updated' : 'Vehicle added'); setF(blank); setEdit(null); refresh() } catch (x: any) { notify(x.message) } }; const filtered = items.filter(x => Object.values(x).join(' ').toLowerCase().includes(q.toLowerCase())); const imp = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.[0]) return; const fd = new FormData(); fd.append('file', e.target.files[0]); try { const x = await api('/import/vehicles', { method: 'POST', body: fd }); notify(`Imported ${x.imported}; duplicates ${x.duplicates}; invalid ${x.invalid}`); refresh() } catch (x: any) { notify(x.message) } }; return <section><div className="top"><div><h1>Vehicle Master</h1><p>The last four digits are derived automatically from the vehicle number for lookup.</p></div><div><a className="button" href="/api/export/template/vehicles">Download Import Template</a><a className="button" href="/api/export/vehicles">Export Excel</a><label className="button">Import Vehicle Master<input type="file" accept=".xlsx,.csv" onChange={imp} hidden /></label></div></div><form className="card masterform" onSubmit={save}><h2>{edit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>{[['vehicleNumber', 'Full Vehicle Number'], ['cardNumber', 'Card Number'], ['driverName', 'Driver Name'], ['driverNumber', 'Driver Number'], ['inchargeName', 'Default Incharge Name (e.g. SILAMBU, SIVA)'], ['ton', 'Default TON / Capacity (e.g. 30/35)'], ['remarks', 'Remarks']].map(([k, l]) => <label key={k}>{l}<input value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} required={!['remarks', 'ton', 'inchargeName', 'driverNumber'].includes(k)} /></label>)}<label>Status<select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label><div className="actions"><button className="primary">{edit ? 'Save Vehicle' : 'Add Vehicle'}</button>{edit && <button type="button" onClick={() => { setEdit(null); setF(blank) }}>Cancel</button>}</div></form><div className="card"><input className="search" placeholder="Search vehicle, driver or card number" value={q} onChange={e => setQ(e.target.value)} /><div className="tablewrap"><table><thead><tr>{['VEHICLE NO', 'CARD NO', 'DRIVER', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'STATUS', 'REMARKS', 'ACTIONS'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{filtered.map(x => <tr key={x.id}><td>{x.vehicleNumber}</td><td>{x.cardNumber}</td><td>{x.driverName}</td><td>{x.driverNumber}</td><td>{x.inchargeName || '-'}</td><td>{x.ton || '-'}</td><td><span className={'badge ' + x.status}>{x.status}</span></td><td>{x.remarks}</td><td><button onClick={() => { setEdit(x); setF(x); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button><button onClick={async () => { if (confirm('Delete this vehicle?')) try { await api('/vehicles/' + x.id, { method: 'DELETE' }); refresh(); notify('Vehicle deleted') } catch (e: any) { notify(e.message) } }} className="danger">Delete</button></td></tr>)}</tbody></table></div></div></section> }
function History({ notify }: { notify: (s: string) => void }) { const [items, setItems] = useState<Advance[]>([]), [date, setDate] = useState(''), [q, setQ] = useState(''); useEffect(() => { api('/advances' + (date ? '?date=' + date : '')).then(setItems) }, [date]); const shown = items.filter(x => Object.values(x).join(' ').toLowerCase().includes(q.toLowerCase())); return <section><div className="top"><div><h1>Advance History</h1><p>Search prior daily advance records.</p></div><div><a className="button" href={'/api/export/advances?date=' + date}>Export Selected Date</a><a className="primary button" href="/api/export/advances?all=true">Export All Records</a></div></div><div className="card filters"><label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>Search<input placeholder="Vehicle, last 4, driver, card, incharge" value={q} onChange={e => setQ(e.target.value)} /></label></div><div className="card"><Table items={shown} /></div></section> }
type Parsed = { lastFourDigits: string; totalAmount: number; remarks: string; driverNameOverride: string; ton: string; isPersonal: boolean; isExtra: boolean; found: boolean };
function parseMessage(message: string, master: Vehicle[]): Parsed[] { return message.split(/\r?\n/).map(line => { const m = line.match(/^\s*(?:\d+\)?\s*)?([A-Za-z]?\d{4})\s*-\s*([\d,]+)\s*(.*)$/i); if (!m) return null; const last = m[1].replace(/\D/g, '').slice(-4), amount = Number(m[2].replace(/,/g, '')), rest = m[3].trim(), personal = rest.match(/\*?\s*personal\s+a\w*\s+driver\s+name\s*:\s*([^*]+)\*?/i); const matchV = master.find(v => v.status === 'Active' && v.lastFourDigits === last); const isPA = matchV?.cardNumber?.trim().toUpperCase() === 'P/A' || matchV?.cardNumber?.trim().toUpperCase() === 'PA'; const isPersonal = !!personal || isPA; const isExtra = !isPersonal && /\bextra\b/i.test(rest); return { lastFourDigits: last, totalAmount: amount, remarks: rest.replace(/\*?\s*personal\s+a\w*\s+driver\s+name\s*:\s*[^*]+\*?/i, '').trim(), driverNameOverride: personal?.[1].trim() || '', ton: matchV?.ton || '', isPersonal, isExtra, found: !!matchV } }).filter(Boolean) as Parsed[] }
function BulkPaste({ date, master, notify }: { date: string; master: Vehicle[]; notify: (x: string) => void }) { const [open, setOpen] = useState(false), [message, setMessage] = useState(''), [incharge, setIncharge] = useState(''), [ton, setTon] = useState(''), [entryType, setEntryType] = useState('LOADING'), [parsed, setParsed] = useState<Parsed[]>([]); const parse = () => setParsed(parseMessage(message, master)); const save = async () => { if (!incharge || !parsed.length) return notify('Enter an incharge name and preview at least one entry.'); try { const r = await api('/advances/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, inchargeName: incharge, ton, entryType, entries: parsed, allowUnmatched: true }) }); notify(`Added ${r.added}; pending ${r.pending}; duplicates ${r.duplicates}`); setOpen(false); setMessage(''); setParsed([]); window.dispatchEvent(new Event('advancesChanged')) } catch (e: any) { notify(e.message) } }; return <>{open && <div className="modalback"><div className="modal"><div className="tableHead"><h2>Paste Today's Advance Message</h2><button onClick={() => setOpen(false)}>Close</button></div><p>Choose the set before saving. Vehicles with Card No 'P/A' go to PERSONAL. Lines containing 'EXTRA' in remarks go to EXTRA automatically.</p><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Paste your WhatsApp advance message here..." /><div className="bulkfields"><label>Set Type<select value={entryType} onChange={e => setEntryType(e.target.value)}><option value="LOADING">Loading</option><option value="EXTRA">Extra</option></select></label><label>Incharge Name<input value={incharge} onChange={e => setIncharge(e.target.value)} required /></label><label>Default TON (Fallback)<input value={ton} onChange={e => setTon(e.target.value)} placeholder="e.g. 30/35" /></label><button onClick={parse}>Preview Message</button></div>{parsed.length > 0 && <><div className="preview"><b>{parsed.length} entries detected</b><span>{parsed.filter(x => !x.found).length} will be added as PENDING</span></div><div className="tablewrap"><table><thead><tr><th>LAST 4</th><th>TON (AUTO)</th><th>AMOUNT</th><th>REMARKS</th><th>PERSONAL DRIVER</th><th>SET</th><th>STATUS</th></tr></thead><tbody>{parsed.map((x, i) => <tr key={i}><td>{x.lastFourDigits}</td><td><input style={{ width: 80 }} value={x.ton} onChange={e => { const updated = [...parsed]; updated[i].ton = e.target.value; setParsed(updated) }} placeholder={ton || 'TON'} /></td><td>{money(x.totalAmount)}</td><td>{x.remarks}</td><td>{x.driverNameOverride || '-'}</td><td>{x.isPersonal ? 'PERSONAL' : (x.isExtra ? 'EXTRA' : entryType)}</td><td>{x.found ? 'Ready' : 'Pending - update in Excel'}</td></tr>)}</tbody></table></div><div className="actions"><button className="primary" onClick={save}>Add All {parsed.length} Entries</button></div></>}</div></div>}<div className="pasteactions"><a className="button" href={'/api/export/advances?date=' + date + '&sets=three'}>Export 3 Sets Excel</a><button className="pastebutton" onClick={() => setOpen(true)}>Paste Advance Message</button></div></> }


createRoot(document.getElementById('root')!).render(<App />);
