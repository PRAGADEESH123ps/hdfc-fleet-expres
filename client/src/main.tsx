import React, { useEffect, useRef, useState } from 'react'; import { createRoot } from 'react-dom/client'; import './styles.css';
type Vehicle = { id: number; vehicleNumber: string; lastFourDigits: string; cardNumber: string; driverName: string; driverNumber: string; inchargeName?: string; ton?: string; status: string; remarks: string }; type Advance = { id: number; date: string; vehicleId: number; inchargeName: string; ton: string; totalAmount: number; remarks: string; driverNameOverride?: string } & Vehicle;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); const api = async (path: string, opt?: RequestInit) => {
    const r = await fetch('/api' + path, opt);
    if (!r.ok) {
        const txt = await r.text().catch(() => '');
        try { throw JSON.parse(txt) } catch (e: any) { throw { message: e.message || txt || 'Request failed' } }
    }
    if (r.status === 204) return null;
    const txt = await r.text().catch(() => '');
    try { return txt ? JSON.parse(txt) : null } catch { return { success: true } }
};
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
function Login({ onLogin, logo }: { onLogin: (user: { id: number; username: string; name: string; role: 'admin' | 'user' }) => void; logo?: string }) {
    const [username, setUsername] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState('');
    const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setError(''); try { const res = await api('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); onLogin(res); } catch (x: any) { setError(x.message || 'Invalid username or password.'); } };
    return <div className="loginwrap"><div className="logincard">{logo ? <img src={logo} alt="Office Logo" className="loginlogo" /> : null}<h1>DRIVER ADVANCE</h1><p>Sign in to manage daily advances and fleet master</p><form className="loginform" onSubmit={handleLogin}><label>Username<input value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter username" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" /></label>{error && <p className="error">{error}</p>}<button className="primary loginbtn">Sign In</button></form></div></div>
}

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

function Settings({ logo, setLogo, notify }: { logo: string; setLogo: (l: string) => void; notify: (s: string) => void }) {
    const [contacts, setContacts] = useState<{ name: string; number: string }[]>([]);

    useEffect(() => {
        api('/settings/whatsapp').then(r => setContacts(r?.contacts || [])).catch(() => { });
    }, []);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) return notify('Logo image size must be less than 3MB.');
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            await api('/settings/logo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo: base64 }) });
            setLogo(base64);
            notify('Office Logo updated successfully!');
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = async () => {
        if (confirm('Remove Office Logo?')) {
            await api('/settings/logo', { method: 'DELETE' });
            setLogo('');
            notify('Office Logo removed');
        }
    };

    const saveContacts = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api('/settings/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contacts }) });
            notify('Quick WhatsApp Contacts saved successfully!');
        } catch (x: any) { notify(x.message) }
    };

    const addContact = () => {
        if (contacts.length >= 5) return notify('Maximum 5 WhatsApp contacts allowed.');
        setContacts([...contacts, { name: '', number: '' }]);
    };

    const removeContact = (idx: number) => {
        setContacts(contacts.filter((_, i) => i !== idx));
    };

    const updateContact = (idx: number, field: 'name' | 'number', val: string) => {
        const copy = [...contacts];
        copy[idx] = { ...copy[idx], [field]: val };
        setContacts(copy);
    };

    return <section>
        <h1>Settings</h1>
        <div className="card">
            <h2>🏢 Transport Office Branding Logo</h2>
            <p>Upload your transport office logo to display on sidebar menu and login page.</p>
            {logo ? <div style={{ marginBottom: 16 }}>
                <img src={logo} alt="Office Logo" style={{ maxHeight: 90, display: 'block', marginBottom: 12, borderRadius: 8, border: '1px solid #cbd5e1', padding: 8, background: '#fff' }} />
                <button type="button" className="danger" onClick={removeLogo}>Remove Office Logo</button>
            </div> : <p style={{ color: '#64748b' }}>No custom logo uploaded yet.</p>}
            <div style={{ marginTop: 12 }}>
                <label style={{ display: 'inline-block' }}>
                    <span className="button primary" style={{ cursor: 'pointer', padding: '10px 16px', display: 'inline-block' }}>📷 Select & Upload Office Logo</span>
                    <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </label>
            </div>
        </div>
        <form className="card" onSubmit={saveContacts}>
            <h2>📲 Quick WhatsApp Share Contacts (Up to 5)</h2>
            <p>Add up to 5 target WhatsApp contacts (e.g. Owner, Manager, Accounts). When clicking <b>Share WhatsApp</b>, you can choose which contact to send to in 1-click!</p>

            {contacts.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: 12 }}>
                    <input style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #cbd5e1' }} value={c.name} onChange={e => updateContact(idx, 'name', e.target.value)} placeholder="Name (e.g. Owner / Manager)" required />
                    <input style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #cbd5e1' }} value={c.number} onChange={e => updateContact(idx, 'number', e.target.value)} placeholder="Mobile No. (e.g. 9876543210)" required />
                    <button type="button" className="danger" onClick={() => removeContact(idx)}>Remove</button>
                </div>
            ))}

            <div style={{ display: 'flex', gap: '12px', marginTop: 16 }}>
                {contacts.length < 5 && <button type="button" className="button" onClick={addContact}>+ Add WhatsApp Contact</button>}
                <button type="submit" className="primary">Save All Contacts</button>
            </div>
        </form>
        <div className="card">
            <h3>Data Persistence</h3>
            <p>Your fleet master and daily advance records are saved in Turso Cloud Database.</p>
        </div>
    </section>;
}

function App() {
    const [user, setUser] = useState<{ id: number; username: string; name: string; role: 'admin' | 'user' } | null>(() => { try { return JSON.parse(localStorage.getItem('fleet_user') || 'null') } catch { return null } });
    const [page, setPage] = useState('Dashboard'), [date, setDate] = useState(today()), [toast, setToast] = useState(''), [master, setMaster] = useState<Vehicle[]>([]);
    const [logo, setLogo] = useState('');
    const notify = (x: string) => { setToast(x); setTimeout(() => setToast(''), 3500) };
    const nav = ['Dashboard', 'Daily Advance', 'Advance History', 'Vehicle Master', 'User Control', 'Import / Export', 'Settings'];

    useEffect(() => {
        api('/settings/logo').then(r => setLogo(r?.logo || '')).catch(() => { });
    }, []);

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

    if (!user) return <Login onLogin={handleSetUser} logo={logo} />;

    return <div className="app">
        <aside>
            <div className="brand">
                {logo ? <img src={logo} alt="Office Logo" className="officelogo" /> : null}
                <div>DRIVER <span>ADVANCE</span><small>EXPRESS SYSTEM</small></div>
            </div>
            {nav.map(x => {
                const isAdminOnly = x === 'Vehicle Master' || x === 'User Control' || x === 'Settings';
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
            {page === 'Daily Advance' && <><Daily logo={logo} date={date} setDate={setDate} master={master} refresh={() => api('/vehicles').then(setMaster)} notify={notify} /><BulkPaste date={date} master={master} notify={notify} /></>}
            {page === 'Advance History' && <History logo={logo} notify={notify} />}
            {page === 'Vehicle Master' && (user.role === 'admin' ? <Master items={master} refresh={() => api('/vehicles').then(setMaster)} notify={notify} /> : <section><div className="restricted card"><h2>🔒 Restricted Access</h2><p>Only <b>Admin</b> users can create, edit, or manage the Vehicle Master database.</p><p>Daily advance entry and reporting functions remain fully available to all operators.</p></div></section>)}
            {page === 'User Control' && (user.role === 'admin' ? <UserControl notify={notify} /> : <section><div className="restricted card"><h2>🔒 Restricted Access</h2><p>Only <b>Admin</b> users can manage system users and access controls.</p></div></section>)}
            {page === 'Import / Export' && <Master items={master} refresh={() => api('/vehicles').then(setMaster)} notify={notify} />}
            {page === 'Settings' && (user.role === 'admin' ? <Settings logo={logo} setLogo={setLogo} notify={notify} /> : <section><div className="restricted card"><h2>🔒 Restricted Access</h2><p>Only <b>Admin</b> users can manage system settings and branding logo.</p></div></section>)}
        </main>
    </div>
}


function Dashboard({ date, setDate }: { date: string, setDate: (d: string) => void }) { const [d, setD] = useState<any>(); useEffect(() => { api('/dashboard?date=' + date).then(setD) }, [date]); return <section><div className="top"><div><h1>Dashboard</h1><p>Daily fleet advance overview</p></div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div><div className="stats"><Stat t="Today's Vehicles" v={d?.vehicles ?? '—'} /><Stat t="Total TON" v={d?.ton ?? '—'} /><Stat t="Total Advance" v={d ? money(d.amount) : '—'} /><Stat t="Active Vehicles" v={d?.activeVehicles ?? '—'} /></div><div className="card"><h2>Recent Entries</h2><Table items={d?.recent || []} compact /></div></section> }; const Stat = ({ t, v }: { t: string, v: any }) => <div className="stat"><span>{t}</span><b>{v}</b></div>;
function Daily({ date, setDate, master, refresh, notify, logo }: { date: string; setDate: (d: string) => void; master: Vehicle[]; refresh: () => void; notify: (x: string) => void; logo?: string }) {
    const [items, setItems] = useState<Advance[]>([]), [last, setLast] = useState(''), [v, setV] = useState<Vehicle | null>(null);
    const [form, setForm] = useState<any>({ vehicleNumberOverride: '', cardNumberOverride: '', driverNameOverride: '', driverNumberOverride: '', inchargeName: '', ton: '', totalAmount: '', remarks: '', entryType: 'LOADING', allowDuplicate: false });
    const [edit, setEdit] = useState<Advance | null>(null), input = useRef<HTMLInputElement>(null);
    const load = () => api('/advances?date=' + date).then(setItems);
    useEffect(() => { load(); setLast(''); setV(null); setEdit(null) }, [date]);

    const selectVehicle = (x: Vehicle) => {
        setV(x);
        setLast(x.lastFourDigits);
        const isPA = x.cardNumber?.toUpperCase() === 'P/A' || x.cardNumber?.toUpperCase() === 'PA';
        setForm((f: any) => ({
            ...f,
            vehicleNumberOverride: (x.vehicleNumber && !x.vehicleNumber.startsWith('PENDING')) ? x.vehicleNumber : '',
            cardNumberOverride: (x.cardNumber && x.cardNumber !== 'PENDING') ? x.cardNumber : '',
            driverNameOverride: (x.driverName && x.driverName !== 'Pending update') ? x.driverName : '',
            driverNumberOverride: (x.driverNumber && x.driverNumber !== 'PENDING') ? x.driverNumber : '',
            inchargeName: x.inchargeName || f.inchargeName || '',
            ton: x.ton || f.ton || '',
            entryType: isPA ? 'PERSONAL' : f.entryType
        }));
    };

    const lookup = (digits: string) => {
        setLast(digits);
        if (!digits) {
            setV(null);
            setForm((f: any) => ({ ...f, vehicleNumberOverride: '', cardNumberOverride: '', driverNameOverride: '', driverNumberOverride: '', inchargeName: '', ton: '' }));
            return;
        }

        const matches = master.filter(x => x.status === 'Active' && x.lastFourDigits === digits);
        if (matches.length === 1) {
            selectVehicle(matches[0]);
        } else if (matches.length > 1) {
            setV(null);
            setForm((f: any) => ({ ...f, vehicleNumberOverride: '', cardNumberOverride: '', driverNameOverride: '', driverNumberOverride: '', inchargeName: '', ton: '' }));
        } else if (digits.length === 4) {
            api('/vehicles/lookup/' + digits).then(res => {
                if (res) selectVehicle(res);
            }).catch(() => setV(null));
        } else {
            setV(null);
        }
    };

    const handleRemarksChange = (rem: string) => {
        const isPA = (form.cardNumberOverride || v?.cardNumber)?.toUpperCase() === 'P/A' || (form.cardNumberOverride || v?.cardNumber)?.toUpperCase() === 'PA';
        const isEx = !isPA && /\bextra\b/i.test(rem);
        setForm((f: any) => ({ ...f, remarks: rem, entryType: isPA ? 'PERSONAL' : (isEx ? 'EXTRA' : f.entryType) }));
    };

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!v) return notify('Vehicle not found — please select a valid vehicle from the list.');
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
    const suggestions = master.filter(x => x.status === 'Active' && (x.lastFourDigits.includes(last) || x.vehicleNumber.includes(last))).slice(0, 8);
    const showSuggestions = last && (!v || suggestions.length > 1);

    return <section>
        <div className="top">
            <div><h1>DRIVER ADVANCE ENTRY</h1><p>Daily Advance · {date.split('-').reverse().join('.')}</p></div>
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
            {showSuggestions && <div className="suggestions">
                {suggestions.length > 1 && <p style={{ margin: '4px 8px', fontSize: '13px', fontWeight: 600, color: '#0284c7' }}>⚠️ Multiple vehicles match "{last}". Please select one:</p>}
                {suggestions.map(x => <button type="button" onClick={() => selectVehicle(x)} key={x.id}><b>{x.lastFourDigits}</b> — {x.vehicleNumber} — {x.driverName} {x.ton ? `(${x.ton})` : ''}</button>)}
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
                <div style={{ display: 'flex', gap: '8px' }}>
                    <WhatsAppShareButton items={items} date={date} />
                    <a className="primary button" href={'/api/export/advances?date=' + date + '&sets=three'}>Export 3 Sets Excel</a>
                </div>
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

function WhatsAppShareButton({ items, date }: { items: Advance[]; date: string }) {
    const [modal, setModal] = useState(false);
    const [contacts, setContacts] = useState<{ name: string; number: string }[]>([]);

    const triggerShare = async () => {
        if (!items.length) return alert('No advance entries available to share.');
        try {
            const res = await api('/settings/whatsapp');
            setContacts(res?.contacts || []);
        } catch {
            setContacts([]);
        }
        setModal(true);
    };

    return <>
        <button type="button" style={{ background: '#25D366', color: '#fff', border: 'none', fontWeight: 700 }} className="button" onClick={triggerShare}>📲 Share WhatsApp</button>
        {modal && <div className="modalback"><div className="modal" style={{ maxWidth: 460 }}><div className="tableHead"><h2 style={{ color: '#0f172a' }}>📲 Select WhatsApp Recipient</h2><button onClick={() => setModal(false)}>Close</button></div><p style={{ margin: '8px 0 16px', color: '#64748b' }}>Choose where you want to send today's advance summary:</p><div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
            <button style={{ background: '#25D366', color: '#fff', border: 'none', padding: '14px 16px', borderRadius: 8, textAlign: 'left', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }} onClick={() => { setModal(false); openWa('', items, date); }}>👥 Share to Transport WhatsApp Group</button>
            {contacts.map((c, i) => (
                <button key={i} style={{ background: '#128C7E', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: 8, textAlign: 'left', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }} onClick={() => { setModal(false); openWa(c.number, items, date); }}>👤 Send to {c.name}</button>
            ))}
            <button style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: 8, textAlign: 'left', fontWeight: 600, cursor: 'pointer', fontSize: '15px' }} onClick={() => { setModal(false); openWa('', items, date); }}>📱 Select Any Other Chat / Contact</button>
        </div></div></div>}
    </>;
}

function openWa(rawPhone: string, items: Advance[], dateStr: string) {
    let targetPhone = rawPhone.replace(/\D/g, '');
    if (targetPhone.length === 10) targetPhone = '91' + targetPhone;

    const dText = dateStr ? dateStr.split('-').reverse().join('.') : new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    let text = `🚛 *DRIVER ADVANCE SUMMARY*\n📅 *Date:* ${dText}\n\n`;

    const groups = ['LOADING', 'PERSONAL', 'EXTRA'];
    let grandTotal = 0;

    groups.forEach(group => {
        const list = items.filter((x: any) => ((x as any).entryType || 'LOADING') === group);
        if (!list.length) return;

        text += `🔹 *${group} ADVANCE*\n`;
        let subtotal = 0;
        list.forEach((x, idx) => {
            text += `${idx + 1}. ${x.vehicleNumber} | ${x.driverName} | ₹${Number(x.totalAmount).toLocaleString('en-IN')}${x.remarks ? ' (' + x.remarks + ')' : ''}\n`;
            subtotal += Number(x.totalAmount || 0);
        });
        text += `*Subtotal: ₹${subtotal.toLocaleString('en-IN')} (${list.length} Vehicles)*\n\n`;
        grandTotal += subtotal;
    });

    text += `===============================\n💰 *GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN')}*\n🚚 *Total Vehicles: ${items.length}*\n===============================`;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const encodedText = encodeURIComponent(text);

    if (isMobile) {
        const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
        window.location.href = waUrl;
    } else {
        const waUrl = targetPhone ? `https://web.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}` : `https://api.whatsapp.com/send?text=${encodedText}`;
        window.open(waUrl, '_blank');
    }
}

function Table({ items, onEdit, onDelete, compact }: { items: Advance[]; onEdit?: (x: Advance) => void; onDelete?: (x: Advance) => void; compact?: boolean }) {
    if (!items.length) return <div className="empty">No entries found for this selection.</div>;
    return <div className="tablewrap">
        <table>
            <thead>
                <tr>{['S.NO', 'VEHICLE NO', 'CARD NO', 'DRIVER NAME', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'TOTAL AMOUNT', 'SET', 'REMARKS', ...(compact ? [] : ['ACTIONS'])].map(x => <th key={x}>{x}</th>)}</tr>
            </thead>
            <tbody>
                {items.map((x, i) => {
                    const cleanPhone = (x.driverNumber || '').replace(/\D/g, '');
                    const hasValidPhone = cleanPhone.length >= 10;
                    return <tr key={x.id}>
                        <td>{i + 1}</td>
                        <td>{x.vehicleNumber}</td>
                        <td>{x.cardNumber}</td>
                        <td>{x.driverName}</td>
                        <td>
                            {hasValidPhone ? (
                                <a href={`https://wa.me/91${cleanPhone.slice(-10)}`} target="_blank" rel="noreferrer" title="Click to WhatsApp Driver" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                                    📱 {x.driverNumber}
                                </a>
                            ) : (x.driverNumber || '-')}
                        </td>
                        <td>{x.inchargeName}</td>
                        <td>{x.ton}</td>
                        <td>{money(x.totalAmount)}</td>
                        <td><span className={'badge ' + ((x as any).entryType || 'LOADING')}>{(x as any).entryType || 'LOADING'}</span></td>
                        <td>{x.remarks}</td>
                        {!compact && <td><button onClick={() => onEdit?.(x)}>Edit</button><button className="danger" onClick={() => onDelete?.(x)}>Delete</button></td>}
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;
}

function Master({ items, refresh, notify }: { items: Vehicle[]; refresh: () => void; notify: (s: string) => void }) { const blank = { vehicleNumber: '', cardNumber: '', driverName: '', driverNumber: '', inchargeName: '', ton: '', status: 'Active', remarks: '' }; const [f, setF] = useState<any>(blank), [edit, setEdit] = useState<Vehicle | null>(null), [q, setQ] = useState(''); const save = async (e: React.FormEvent) => { e.preventDefault(); try { await api('/vehicles' + (edit ? '/' + edit.id : ''), { method: edit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); notify(edit ? 'Vehicle updated' : 'Vehicle added'); setF(blank); setEdit(null); refresh() } catch (x: any) { notify(x.message) } }; const filtered = items.filter(x => Object.values(x).join(' ').toLowerCase().includes(q.toLowerCase())); const imp = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.[0]) return; const fd = new FormData(); fd.append('file', e.target.files[0]); try { const x = await api('/import/vehicles', { method: 'POST', body: fd }); notify(`Imported ${x.imported}; duplicates ${x.duplicates}; invalid ${x.invalid}`); refresh() } catch (x: any) { notify(x.message) } }; return <section><div className="top"><div><h1>Vehicle Master</h1><p>The last four digits are derived automatically from the vehicle number for lookup.</p></div><div><a className="button" href="/api/export/template/vehicles">Download Import Template</a><a className="button" href="/api/export/vehicles">Export Excel</a><label className="button">Import Vehicle Master<input type="file" accept=".xlsx,.csv" onChange={imp} hidden /></label></div></div><form className="card masterform" onSubmit={save}><h2>{edit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>{[['vehicleNumber', 'Full Vehicle Number'], ['cardNumber', 'Card Number'], ['driverName', 'Driver Name'], ['driverNumber', 'Driver Number'], ['inchargeName', 'Default Incharge Name (e.g. SILAMBU, SIVA)'], ['ton', 'Default TON / Capacity (e.g. 30/35)'], ['remarks', 'Remarks']].map(([k, l]) => <label key={k}>{l}<input value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} required={!['remarks', 'ton', 'inchargeName', 'driverNumber'].includes(k)} /></label>)}<label>Status<select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label><div className="actions"><button className="primary">{edit ? 'Save Vehicle' : 'Add Vehicle'}</button>{edit && <button type="button" onClick={() => { setEdit(null); setF(blank) }}>Cancel</button>}</div></form><div className="card"><input className="search" placeholder="Search vehicle, driver or card number" value={q} onChange={e => setQ(e.target.value)} /><div className="tablewrap"><table><thead><tr>{['VEHICLE NO', 'CARD NO', 'DRIVER', 'DRIVER NO', 'INCHARGE NAME', 'TON', 'STATUS', 'REMARKS', 'ACTIONS'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{filtered.map(x => <tr key={x.id}><td>{x.vehicleNumber}</td><td>{x.cardNumber}</td><td>{x.driverName}</td><td>{x.driverNumber}</td><td>{x.inchargeName || '-'}</td><td>{x.ton || '-'}</td><td><span className={'badge ' + x.status}>{x.status}</span></td><td>{x.remarks}</td><td><button onClick={() => { setEdit(x); setF(x); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button><button onClick={async () => { if (confirm('Delete this vehicle?')) try { await api('/vehicles/' + x.id, { method: 'DELETE' }); refresh(); notify('Vehicle deleted') } catch (e: any) { notify(e.message) } }} className="danger">Delete</button></td></tr>)}</tbody></table></div></div></section> }
function downloadPdfReport(items: Advance[], dateStr: string, logo: string) {
    if (!items || !items.length) {
        alert('No advance records found to save as PDF.');
        return;
    }

    const dText = dateStr ? dateStr.split('-').reverse().join('.') : new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    const grandTotal = items.reduce((a, b) => a + Number(b.totalAmount || 0), 0);
    const groups = ['LOADING', 'PERSONAL', 'EXTRA'];

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#0f172a';
    container.style.background = '#ffffff';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0284c7; padding-bottom:12px;">
            <div>
                ${logo ? `<img src="${logo}" style="max-height:50px; display:block; margin-bottom:6px;" />` : ''}
                <h2 style="margin:0; font-size:20px; color:#0284c7; font-weight:800;">DRIVER ADVANCE STATEMENT</h2>
                <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Daily Advance Record & Fleet Summary</p>
            </div>
            <div style="text-align:right;">
                <div style="font-size:14px; font-weight:700;">DATE: ${dText}</div>
                <div style="font-size:11px; color:#64748b; margin-top:4px;">Generated: ${new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    `;

    groups.forEach(g => {
        const list = items.filter((x: any) => ((x as any).entryType || 'LOADING') === g);
        if (!list.length) return;
        const sub = list.reduce((a, b) => a + Number(b.totalAmount || 0), 0);

        html += `
            <div style="margin-top:16px;">
                <h4 style="background:#0284c7; color:#fff; padding:6px 10px; margin:0; border-radius:4px 4px 0 0; font-size:13px; font-weight:700;">
                    ${g} ADVANCE STATEMENT
                </h4>
                <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:4px;">
                    <thead>
                        <tr style="background:#f1f5f9; text-align:left;">
                            <th style="border:1px solid #cbd5e1; padding:5px; width:30px;">S.NO</th>
                            <th style="border:1px solid #cbd5e1; padding:5px;">VEHICLE NO</th>
                            <th style="border:1px solid #cbd5e1; padding:5px;">CARD NO</th>
                            <th style="border:1px solid #cbd5e1; padding:5px;">DRIVER NAME</th>
                            <th style="border:1px solid #cbd5e1; padding:5px;">INCHARGE</th>
                            <th style="border:1px solid #cbd5e1; padding:5px;">TON</th>
                            <th style="border:1px solid #cbd5e1; padding:5px; text-align:right;">AMOUNT (₹)</th>
                            <th style="border:1px solid #cbd5e1; padding:5px;">REMARKS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((x, i) => `
                            <tr>
                                <td style="border:1px solid #e2e8f0; padding:5px; text-align:center;">${i + 1}</td>
                                <td style="border:1px solid #e2e8f0; padding:5px; font-weight:600;">${x.vehicleNumber}</td>
                                <td style="border:1px solid #e2e8f0; padding:5px;">${x.cardNumber}</td>
                                <td style="border:1px solid #e2e8f0; padding:5px;">${x.driverName}</td>
                                <td style="border:1px solid #e2e8f0; padding:5px;">${x.inchargeName || '-'}</td>
                                <td style="border:1px solid #e2e8f0; padding:5px;">${x.ton || '-'}</td>
                                <td style="border:1px solid #e2e8f0; padding:5px; text-align:right; font-weight:600;">₹${Number(x.totalAmount).toLocaleString('en-IN')}</td>
                                <td style="border:1px solid #e2e8f0; padding:5px; color:#64748b;">${x.remarks || '-'}</td>
                            </tr>
                        `).join('')}
                        <tr style="background:#e0f2fe; font-weight:700;">
                            <td colspan="6" style="border:1px solid #cbd5e1; padding:5px; text-align:right;">${g} SUBTOTAL:</td>
                            <td style="border:1px solid #cbd5e1; padding:5px; text-align:right;">₹${sub.toLocaleString('en-IN')}</td>
                            <td style="border:1px solid #cbd5e1; padding:5px; font-size:10px; color:#0369a1;">(${list.length} Vehicles)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    });

    html += `
        <div style="margin-top:20px; padding:10px; background:#0f172a; color:#fff; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; font-weight:700;">TOTAL VEHICLES: ${items.length}</span>
            <span style="font-size:16px; font-weight:800; color:#38bdf8;">GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN')}</span>
        </div>
    `;

    container.innerHTML = html;

    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
        const opt = {
            margin: [8, 8, 8, 8],
            filename: `Driver_Advance_${dateStr || 'Report'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(container).save();
    } else {
        alert('PDF library is loading, please try again in 2 seconds.');
    }
}

function History({ notify, logo }: { notify: (s: string) => void; logo?: string }) { const [items, setItems] = useState<Advance[]>([]), [date, setDate] = useState(''), [q, setQ] = useState(''); useEffect(() => { api('/advances' + (date ? '?date=' + date : '')).then(setItems) }, [date]); const shown = items.filter(x => Object.values(x).join(' ').toLowerCase().includes(q.toLowerCase())); return <section><div className="top"><div><h1>Advance History</h1><p>Search prior daily advance records. <strong style={{ fontWeight: 700, color: '#0284c7' }}>(Retaining Recent 15-Day Active Advance Records)</strong></p></div><div style={{ display: 'flex', gap: '8px' }}><button type="button" style={{ background: '#0284c7', color: '#fff', border: 'none', fontWeight: 600 }} className="button" onClick={() => downloadPdfReport(shown, date, logo || '')}>📄 Save PDF</button><WhatsAppShareButton items={shown} date={date} /><a className="button" href={'/api/export/advances?date=' + date}>Export Selected Date</a><a className="primary button" href="/api/export/advances?all=true">Export All Records</a></div></div><div className="card filters"><label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>Search<input placeholder="Vehicle, last 4, driver, card, incharge" value={q} onChange={e => setQ(e.target.value)} /></label></div><div className="card"><Table items={shown} /></div></section> }
type Parsed = { lastFourDigits: string; totalAmount: number; remarks: string; driverNameOverride: string; ton: string; isPersonal: boolean; isExtra: boolean; found: boolean };
function parseMessage(message: string, master: Vehicle[]): Parsed[] {
    return message.split(/\r?\n/).map(line => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const digitMatch = trimmed.match(/^(\d{4})\b/) || trimmed.match(/([A-Za-z]{2}\s*\d{1,2}\s*[A-Za-z]{1,3}\s*\d{4}|\b\d{4}\b)/i);
        if (!digitMatch) return null;

        const last = (digitMatch[1] || digitMatch[0]).replace(/\D/g, '').slice(-4).padStart(4, '0');

        let amount = 0;
        let remarks = '';
        let driverNameOverride = '';

        const slashIdx = trimmed.indexOf('/');
        if (slashIdx !== -1) {
            remarks = trimmed.slice(slashIdx + 1).trim();
            const beforeSlash = trimmed.slice(0, slashIdx);
            const amtM = beforeSlash.match(/(\d{3,6})\s*$/);
            if (amtM) {
                amount = Number(amtM[1]);
            }
        }

        if (!amount) {
            const allNums = Array.from(trimmed.matchAll(/(?:^|[\s\-\/:]+)(\d{3,6})(?:[\s\-\/:]|$)/g)).map(m => Number(m[1]));
            const candidates = allNums.filter(n => n >= 100 && String(n).padStart(4, '0') !== last);
            if (candidates.length) {
                amount = candidates[candidates.length - 1];
            }
        }

        if (!amount) return null;

        const dashParts = trimmed.split('-').map(s => s.trim());
        if (dashParts.length >= 3) {
            const potentialName = dashParts[1];
            if (/^[A-Za-z\s]{3,30}$/.test(potentialName) && !/^(P\/A|PA|CARD|EXTRA|LOADING|PERSONAL)$/i.test(potentialName)) {
                driverNameOverride = potentialName;
            }
        }

        if (!remarks) {
            remarks = trimmed
                .replace(/^[0-9]+\s*[-]/, '')
                .replace(digitMatch[0], '')
                .replace(new RegExp(amount.toString(), 'g'), '')
                .replace(/\b(P\/A|PA|CARD|EXTRA|LOADING|PERSONAL)\b/gi, '')
                .replace(driverNameOverride, '')
                .replace(/^[\s\-:]+/, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        const personalMatch = trimmed.match(/\*?\s*personal\s+a\w*\s+driver\s+name\s*:\s*([^*]+)\*?/i);
        const matchV = master.find(v => v.status === 'Active' && v.lastFourDigits === last);
        const isPA = matchV?.cardNumber?.trim().toUpperCase() === 'P/A' || matchV?.cardNumber?.trim().toUpperCase() === 'PA' || /\b(P\/A|PA)\b/i.test(trimmed);
        const isPersonal = !!personalMatch || isPA || /\bpersonal\b/i.test(trimmed);
        const isExtra = !isPersonal && /\bextra\b/i.test(trimmed);

        return {
            lastFourDigits: last,
            totalAmount: amount,
            remarks,
            driverNameOverride: driverNameOverride || personalMatch?.[1].trim() || '',
            ton: matchV?.ton || '',
            isPersonal,
            isExtra,
            found: !!matchV
        };
    }).filter(Boolean) as Parsed[];
}

function BulkPaste({ date, master, notify }: { date: string; master: Vehicle[]; notify: (x: string) => void }) {
    const [open, setOpen] = useState(false), [message, setMessage] = useState(''), [incharge, setIncharge] = useState(''), [ton, setTon] = useState(''), [entryType, setEntryType] = useState('LOADING'), [parsed, setParsed] = useState<Parsed[]>([]);
    const parse = (e?: React.FormEvent) => { if (e) e.preventDefault(); const res = parseMessage(message, master); setParsed(res); if (!res.length) notify('No valid advance lines detected in message. Check format e.g. "4511 - 5000"'); };
    const save = async () => {
        if (!incharge) return notify('Please enter Incharge Name before saving.');
        if (!parsed.length) return notify('Please click Preview Message first.');
        try {
            const r = await api('/advances/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, inchargeName: incharge, ton, entryType, entries: parsed, allowUnmatched: true, allowDuplicate: true }) });
            notify(`Added ${r.added} entries successfully! ${r.duplicates ? `(${r.duplicates} duplicates skipped)` : ''}`);
            setOpen(false); setMessage(''); setParsed([]); window.dispatchEvent(new Event('advancesChanged'));
        } catch (e: any) { notify(e.message) }
    };
    return <>{open && <div className="modalback"><div className="modal"><div className="tableHead"><h2>Paste Today's Advance Message</h2><button onClick={() => setOpen(false)}>Close</button></div><p>Paste message below and click <b>Preview Message</b>. Supports formats like <i>4511 - 5000</i> or <i>TN38AB4511 5000</i>.</p><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Paste your WhatsApp advance message here..." /><div className="bulkfields"><label>Set Type<select value={entryType} onChange={e => setEntryType(e.target.value)}><option value="LOADING">Loading</option><option value="PERSONAL">Personal</option><option value="EXTRA">Extra</option></select></label><label>Incharge Name<input value={incharge} onChange={e => setIncharge(e.target.value)} placeholder="e.g. SILAMBU or DEEPAK" required /></label><label>Default TON (Fallback)<input value={ton} onChange={e => setTon(e.target.value)} placeholder="e.g. 30/35" /></label><button type="button" onClick={parse}>Preview Message</button></div>{parsed.length > 0 && <><div className="preview"><b>{parsed.length} entries detected</b><span>{parsed.filter(x => !x.found).length} will be added as PENDING</span></div><div className="tablewrap"><table><thead><tr><th>LAST 4</th><th>TON (AUTO)</th><th>AMOUNT</th><th>REMARKS</th><th>PERSONAL DRIVER</th><th>SET</th><th>STATUS</th></tr></thead><tbody>{parsed.map((x, i) => <tr key={i}><td>{x.lastFourDigits}</td><td><input style={{ width: 80 }} value={x.ton} onChange={e => { const updated = [...parsed]; updated[i].ton = e.target.value; setParsed(updated) }} placeholder={ton || 'TON'} /></td><td>{money(x.totalAmount)}</td><td>{x.remarks}</td><td>{x.driverNameOverride || '-'}</td><td><select value={x.isPersonal ? 'PERSONAL' : (x.isExtra ? 'EXTRA' : entryType)} onChange={e => { const updated = [...parsed]; const val = e.target.value; updated[i].isPersonal = val === 'PERSONAL'; updated[i].isExtra = val === 'EXTRA'; setParsed(updated) }}><option value="LOADING">LOADING</option><option value="PERSONAL">PERSONAL</option><option value="EXTRA">EXTRA</option></select></td><td>{x.found ? 'Ready' : 'Pending - update in Excel'}</td></tr>)}</tbody></table></div><div className="actions"><button className="primary" onClick={save}>Add All {parsed.length} Entries</button></div></>}</div></div>}<div className="pasteactions"><a className="button" href={'/api/export/advances?date=' + date + '&sets=three'}>Export 3 Sets Excel</a><button className="pastebutton" onClick={() => setOpen(true)}>Paste Advance Message</button></div></>
}


createRoot(document.getElementById('root')!).render(<App />);
