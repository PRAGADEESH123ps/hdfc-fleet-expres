import express from 'express'; import cors from 'cors'; import multer from 'multer'; import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const XLSX = require('xlsx-js-style'); import { DatabaseSync } from 'node:sqlite'; import path from 'node:path'; import fs from 'node:fs';
const app = express(), upload = multer({ dest: process.env.VERCEL ? '/tmp/uploads/' : 'uploads/' }); app.use(cors()); app.use(express.json());
const dbPath = process.env.VERCEL ? path.resolve('/tmp/fleet.db') : path.resolve('data/fleet.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT,vehicleNumber TEXT NOT NULL,lastFourDigits TEXT NOT NULL UNIQUE,cardNumber TEXT NOT NULL,driverName TEXT NOT NULL,driverNumber TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Active',remarks TEXT DEFAULT '',ton TEXT DEFAULT '',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS daily_advances(id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT NOT NULL,vehicleId INTEGER NOT NULL REFERENCES vehicles(id),inchargeName TEXT NOT NULL,ton TEXT NOT NULL DEFAULT '',totalAmount REAL NOT NULL,remarks TEXT DEFAULT '',driverNameOverride TEXT DEFAULT '',driverNumberOverride TEXT DEFAULT '',vehicleNumberOverride TEXT DEFAULT '',cardNumberOverride TEXT DEFAULT '',entryType TEXT DEFAULT 'LOADING',createdAt TEXT DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',createdAt TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS user_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,action TEXT NOT NULL,createdAt TEXT DEFAULT CURRENT_TIMESTAMP);`);
try { db.exec("ALTER TABLE daily_advances ADD COLUMN driverNameOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN driverNumberOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN vehicleNumberOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN cardNumberOverride TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE daily_advances ADD COLUMN entryType TEXT DEFAULT 'LOADING'") } catch { }
try { db.exec("ALTER TABLE vehicles ADD COLUMN ton TEXT DEFAULT ''") } catch { }
try { db.exec("ALTER TABLE vehicles ADD COLUMN inchargeName TEXT DEFAULT ''") } catch { }

if (!(db.prepare("SELECT count(*) c FROM users WHERE lower(username)='admin'").get() as any).c) {
    db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run('admin', 'admin123', 'System Administrator', 'admin');
}
if (!(db.prepare("SELECT count(*) c FROM users WHERE lower(username)='deepak'").get() as any).c) {
    db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run('deepak', 'DEEPAK12', 'Deepak (Operator)', 'user');
}
if (!(db.prepare("SELECT count(*) c FROM users WHERE lower(username)='praga'").get() as any).c) {
    db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run('praga', '8667488685', 'Pragadeesh (Admin)', 'admin');
}
if (!(db.prepare("SELECT count(*) c FROM users WHERE lower(username)='user'").get() as any).c) {
    db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)').run('user', 'user', 'Daily Advance Operator', 'user');
}


const rows = (sql: string, ...v: any[]) => db.prepare(sql).all(...v), one = (sql: string, ...v: any[]) => db.prepare(sql).get(...v);

const seed = [
    [
        "AP39UZ8043",
        "8043",
        "P/A",
        "GANESAN",
        "1262",
        "30/35",
        "SILAMPU",
        "Master Vehicle"
    ],
    [
        "TN33AT7963",
        "7963",
        "9143",
        "GANESAN",
        "1584",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "AP39UY 2380",
        "2380",
        "P/A",
        "RAMESHKUMAR YADHAV",
        "-",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "TN86F6849",
        "6849",
        "P/A",
        "RVV SATHYA",
        "1831",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "AP39WA9501",
        "9501",
        "P/A",
        "KIRSHNAMOORTHY",
        "1510",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA9507",
        "9507",
        "P/A",
        "MARIRAJA",
        "4032",
        "30/35",
        "SILAMPU",
        "Master Vehicle"
    ],
    [
        "AP39WA2434",
        "2434",
        "P/A",
        "MARIDURAI",
        "1603",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA9532",
        "9532",
        "P/A",
        "MANIKANDAN",
        "4079",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA9536",
        "9536",
        "P/A",
        "SATHEESH KUMAR ROY",
        "1598",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA6681",
        "6681",
        "P/A",
        "AYANAR",
        "4026",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA6682",
        "6682",
        "P/A",
        "POOVAIYA",
        "1737",
        "30/35",
        "SHIVA",
        "Master Vehicle"
    ],
    [
        "AP39WA6690",
        "6690",
        "P/A",
        "SATHYARAJ",
        "4077",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA6684",
        "6684",
        "P/A",
        "IVARKULARAJA",
        "1597",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA2432",
        "2432",
        "P/A",
        "MUTHUKUMAR",
        "1743",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA6688",
        "6688",
        "P/A",
        "RAJUSIRIPALLI",
        "1823",
        "30/35",
        "SHIVA",
        "Master Vehicle"
    ],
    [
        "AP39WA2435",
        "2435",
        "4523",
        "GOPAL",
        "1718",
        "30/35",
        "SHIVA",
        "Master Vehicle"
    ],
    [
        "AP39WA 2433",
        "2433",
        "P/A",
        "BHARATHI",
        "2088",
        "30/35",
        "SHIVA",
        "Master Vehicle"
    ],
    [
        "AP39WA 2436",
        "2436",
        "P/A",
        "DLIP",
        "4086",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "TN33AV9014",
        "9014",
        "1727",
        "SEERANGAN",
        "1282",
        "30/35",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "AP39UY 2384",
        "2384",
        "P/A",
        "VETRIVEL",
        "4082",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UY 2381",
        "2381",
        "P/A",
        "SELVAKUMAR",
        "4091",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA9528",
        "9528",
        "P/A",
        "SIVA NAIDU",
        "1730",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8074",
        "8074",
        "P/A",
        "SELVAM",
        "4079",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8070",
        "8070",
        "P/A",
        "KALIMUTHU",
        "4059",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8051",
        "8051",
        "P/A",
        "MURUGAN",
        "1798",
        "32/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8052",
        "8052",
        "P/A",
        "RAJA",
        "-",
        "32/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA6690",
        "6690",
        "P/A",
        "SATHYARAJ",
        "4077",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UY2379",
        "2379",
        "P/A",
        "RAVIKUMAR",
        "1564",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UY2378",
        "2378",
        "P/A",
        "SRIDHAR",
        "4096",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UY2381",
        "2381",
        "P/A",
        "RAJU",
        "1766",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8041",
        "8041",
        "P/A",
        "MOHAN",
        "4070",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8043",
        "8043",
        "P/A",
        "AYYAPPAN",
        "4019",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "AP39WA 2436",
        "2436",
        "P/A",
        "DLIP",
        "1805",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "TN86H2206",
        "2206",
        "P/A",
        "VIGNESH",
        "1734",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN33AU9776",
        "9776",
        "4473",
        "NAWASDEEN",
        "1101",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86K4714",
        "4714",
        "6029",
        "GOBIRAJAN",
        "1398",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K4765",
        "4765",
        "4214",
        "KANNAN",
        "1653",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K4795",
        "4795",
        "4206",
        "PRABHU",
        "1663",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K4722",
        "4722",
        "6037",
        "MANI K",
        "1650",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K4740",
        "4740",
        "0951",
        "SAMPANGIRAMAN",
        "1429",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86K3618",
        "3618",
        "0829",
        "PRAKASH",
        "1503",
        "30/35",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "COROMANDEL",
        "0000",
        "0894",
        "SIVARAJAN",
        "1525",
        "30/35",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86K3606",
        "3606",
        "0845",
        "RAMESH",
        "1819",
        "30/35",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86K3659",
        "3659",
        "0902",
        "VIJAYASANTHOSE",
        "1670",
        "30/35",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86C7455",
        "7455",
        "P/A",
        "RAJENDRAN",
        "1427",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0995",
        "0995",
        "6276",
        "GANESH",
        "1218",
        "32",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AU9776",
        "9776",
        "4473",
        "Unknown",
        "-",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN33AQ0676",
        "0676",
        "-",
        "-",
        "-",
        "16/19",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AQ0750",
        "0750",
        "2236",
        "MANOHAR",
        "2056",
        "16/19",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AQ1605",
        "1605",
        "0844",
        "MURUGASAN",
        "1708",
        "16/19",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN20BU5689",
        "5689",
        "0844",
        "SUBRAMANI",
        "1725",
        "16/19",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN20BU5699",
        "5699",
        "0844",
        "Unknown",
        "-",
        "16/19",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AR5239",
        "5239",
        "0844",
        "DANIAL",
        "1726",
        "16/19",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33BB9379",
        "9379",
        "P/A",
        "NARAYANAN",
        "1506",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN33AS6874",
        "6874",
        "P/A",
        "Unknown",
        "-",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN864511",
        "4511",
        "P/A",
        "AJITH",
        "1694",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN864551",
        "4551",
        "P/A",
        "SUBDOH",
        "1769",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN864736",
        "4736",
        "P/A",
        "AJAY",
        "1701",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN860011",
        "0011",
        "P/A",
        "ABISHEK",
        "1709",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN860022",
        "0022",
        "P/A",
        "SAROJ KUMAR",
        "1840",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33BA2277",
        "2277",
        "4515",
        "MAHENDRAN",
        "2111",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86A1144",
        "1144",
        "P/A",
        "SUMANKUMAR",
        "1779",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "COROMANDEL",
        "0000",
        "9841",
        "RVV SATHIYA",
        "1831",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "AP39UZ8073",
        "8073",
        "P/A",
        "MANIKANDAN",
        "4033",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ],
    [
        "TN86C7461",
        "7461",
        "4440",
        "MANIKANDAN",
        "1498",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86C7459",
        "7459",
        "P/A",
        "VIJAYANAND",
        "1825",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86D5221",
        "5221",
        "2277",
        "MADHU",
        "2129",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86D1155",
        "1155",
        "P/A",
        "Unknown",
        "-",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86D5234",
        "5234",
        "P/A",
        "MUNIYASAMY",
        "1801",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86C8741",
        "8741",
        "P/A",
        "SUNDAR S",
        "1125",
        "24/28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86C8772",
        "8772",
        "6506",
        "ABUBAKKER",
        "1582",
        "24/28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86D1122",
        "1122",
        "P/A",
        "KUMARESAN",
        "2007",
        "24/28",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86D1177",
        "1177",
        "9817",
        "JOTHI",
        "2068",
        "24/28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86D1188",
        "1188",
        "8801",
        "MAHAVISHNU",
        "1735",
        "24/28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86D5364",
        "5364",
        "P/A",
        "MUHAMAD SAI",
        "1457",
        "24/28",
        "YUVARAJ",
        "Master Vehicle"
    ],
    [
        "TN86D5385",
        "5385",
        "0847",
        "SELVAM",
        "1621",
        "24/28",
        "YUVARAJ",
        "Master Vehicle"
    ],
    [
        "TN86D5387",
        "5387",
        "8850",
        "SANKAR",
        "1209",
        "24/28",
        "YUVARAJ",
        "Master Vehicle"
    ],
    [
        "TN33AR7108",
        "7108",
        "8954",
        "SELVAM",
        "2104",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AR7587",
        "7587",
        "0844",
        "Unknown",
        "-",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AR8107",
        "8107",
        "0885",
        "-",
        "-",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AT6665",
        "6665",
        "P/A",
        "SUMAN",
        "1155",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AT7399",
        "7399",
        "6415",
        "MANIVANNAN",
        "1574",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33BA2244",
        "2244",
        "4156",
        "NAGAMUTHU",
        "1563",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33BA2299",
        "2299",
        "9077",
        "LANKA DRINIVASAN",
        "1836",
        "24",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN33BA2277",
        "2277",
        "4515",
        "MAHENDRAN",
        "2111",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33BA2288",
        "2288",
        "6415",
        "MANIVANNAN",
        "1574",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AL9357",
        "9357",
        "0527",
        "PARAMASIVAM",
        "1391",
        "HYDROGEN",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN 43 C 9769",
        "9769",
        "P/A",
        "NAGARAJ",
        "1795",
        "HYDROGEN",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN04AH9762",
        "9762",
        "2269",
        "MUTHU",
        "1435",
        "HYDROGEN",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN33AT6462",
        "6462",
        "P/A",
        "SUNDHAR RAJ",
        "4178",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN33AU9554",
        "9554",
        "0862",
        "MANIKANDAN",
        "2014",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86F6049",
        "6049",
        "P/A",
        "MELSON PHIP",
        "1839",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86F6076",
        "6076",
        "P/A",
        "SENTHIL",
        "1596",
        "30/35",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86F6088",
        "6088",
        "9874",
        "SANJAY GHANDHI",
        "1388",
        "30/35",
        "SATHEESH",
        "Master Vehicle"
    ],
    [
        "TN86F6035",
        "6035",
        "P/A",
        "KALA DURGA PRASAD",
        "1806",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86F6159",
        "6159",
        "0729",
        "SENTHIL",
        "1832",
        "30/35",
        "SILAMPU",
        "Master Vehicle"
    ],
    [
        "TN86F6039",
        "6039",
        "P/A",
        "PALANIVEL",
        "1794",
        "30/35",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86F6219",
        "6219",
        "5402",
        "SIVAKUMAR",
        "1342",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86F6181",
        "6181",
        "0745",
        "SATHISH",
        "1562",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86F6208",
        "6208",
        "9890",
        "VEL MURUGAN",
        "4014",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86F6159",
        "6159",
        "0729",
        "JAYAPAL",
        "4062",
        "30/35",
        "SHIVA",
        "Master Vehicle"
    ],
    [
        "TN86F6150",
        "6150",
        "8835",
        "PATTAMUTHU",
        "4043",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86F6457",
        "6457",
        "P/A",
        "ASHOCK",
        "1710",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86F6455",
        "6455",
        "P/A",
        "DURAIMURUGAN",
        "1828",
        "30/35",
        "SATHEESH",
        "Master Vehicle"
    ],
    [
        "TN86F6454",
        "6454",
        "8744",
        "KUPPUSAMY",
        "1339",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86H2101",
        "2101",
        "0928",
        "SURESH",
        "1367",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86H2269",
        "2269",
        "4465",
        "MANIKANDAN",
        "1517",
        "30/35",
        "SATHEESH",
        "Master Vehicle"
    ],
    [
        "TN86H2157",
        "2157",
        "8434",
        "MUTHURAJ",
        "1318",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86H2188",
        "2188",
        "0852",
        "RAJKUMAR",
        "1394",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86H2253",
        "2253",
        "0535",
        "MANIKANDAN P",
        "1292",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86H2296",
        "2296",
        "0910",
        "PRABHUDEVA",
        "4031",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86H2208",
        "2208",
        "P/A",
        "SENTHAMILSELVAN",
        "1595",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86H2230",
        "2230",
        "0519",
        "SURESH",
        "-",
        "30/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86H8170",
        "8170",
        "2251",
        "MANOHAR",
        "2056",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86H8157",
        "8157",
        "2251",
        "MANOHAR",
        "2056",
        "24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN40F4954",
        "4954",
        "0667",
        "SARAVANAN.P",
        "1194",
        "16",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86H2221",
        "2221",
        "8988",
        "VIJAYAKUMAR",
        "1637",
        "30/35",
        "SILAMPU",
        "Master Vehicle"
    ],
    [
        "TN86C8731",
        "8731",
        "P/A",
        "VINOTH",
        "1713",
        "24/28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0508",
        "0508",
        "9119",
        "SUNDARMOORTHY",
        "1829",
        "28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0510",
        "0510",
        "6284",
        "GOPPAL",
        "1718",
        "28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0518",
        "0518",
        "P/A",
        "SHANKAR",
        "1844",
        "28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0531",
        "0531",
        "9135",
        "VIGNESH",
        "1305",
        "28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0594",
        "0594",
        "9150",
        "HARI",
        "1786",
        "28",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0018",
        "0018",
        "8962",
        "DHARMANDRA RAI",
        "1842",
        "20/24",
        "YUVARAJ",
        "Master Vehicle"
    ],
    [
        "TN86K0039",
        "0039",
        "4560",
        "SANTHOSH",
        "1835",
        "24/28",
        "YUVARAJ",
        "Master Vehicle"
    ],
    [
        "TN86K0047",
        "0047",
        "9675",
        "SURYAMOORTY",
        "1002",
        "24/28",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN 86 K 0084",
        "0084",
        "P/A",
        "ESAKIPANDI",
        "1773",
        "28",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86K0091",
        "0091",
        "8970",
        "Unknown",
        "-",
        "20/24",
        "YUVARAAJ",
        "Master Vehicle"
    ],
    [
        "TN86K0938",
        "0938",
        "9168",
        "BALAMURUGAN",
        "1729",
        "32",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0918",
        "0918",
        "9176",
        "MANIKANDAN",
        "2119",
        "32",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0947",
        "0947",
        "9184",
        "SANTHNA KUMAR",
        "1183",
        "32",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K0920",
        "0920",
        "9200",
        "SHECK DIWAN",
        "1515",
        "32",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K1473",
        "1473",
        "9036",
        "AROGYA ARUL",
        "1387",
        "32/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K1431",
        "1431",
        "9002",
        "PRAGASH",
        "1820",
        "32/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K1411",
        "1411",
        "8996",
        "MUTHUKUMAR",
        "1743",
        "32/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86K1433",
        "1433",
        "9010",
        "RANJITHKUMAR",
        "1812",
        "32/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K1464",
        "1464",
        "9028",
        "KIRUBAKARAN",
        "1365",
        "32/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "AP39WB8351",
        "8351",
        "9085",
        "KRISHNAMOORTHY",
        "1510",
        "32/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "AP39WB8352",
        "8352",
        "P/A",
        "SIVASANKAR",
        "1770",
        "32/35",
        "SATHEESH",
        "Master Vehicle"
    ],
    [
        "AP39WB9975",
        "9975",
        "P/A",
        "ARJUNAN",
        "1821",
        "32/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "AP39WB9976",
        "9976",
        "P/A",
        "RAVIKUMAR",
        "1564",
        "32/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "AP39WB9980",
        "9980",
        "9077",
        "PETCHIMUTHU",
        "1791",
        "32/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86K2157",
        "2157",
        "4578",
        "AJITHKUMAR",
        "1480",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2130",
        "2130",
        "P/A",
        "MANIKANDAN",
        "1348",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2135",
        "2135",
        "4586",
        "VELMURUGAN PONDY",
        "1775",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2118",
        "2118",
        "4602",
        "SANKAR",
        "-",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2158",
        "2158",
        "P/A",
        "MUTHU",
        "-",
        "30/35",
        "SILAMPU",
        "Master Vehicle"
    ],
    [
        "TN86K2118",
        "2118",
        "4602",
        "S.SUNDHAR",
        "1125",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2101",
        "2101",
        "4636",
        "GOVINTHASAMY",
        "1468",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2167",
        "2167",
        "P/A",
        "SUTHAGAR",
        "1550",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2268",
        "2268",
        "9044",
        "RAJKUMAR",
        "1057",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86H2268",
        "2268",
        "P/A",
        "SENTHAMIL SELVAN",
        "1361",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2530",
        "2530",
        "9833",
        "RAMACHANDRAN",
        "1672",
        "32/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "AP39UZ8425",
        "8425",
        "P/A",
        "SELVAKUMAR",
        "4091",
        "30/35",
        "SILMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8428",
        "8428",
        "P/A",
        "MANJAYKUMAR",
        "1796",
        "30/35",
        "SILMBU",
        "Master Vehicle"
    ],
    [
        "AP39UZ8422",
        "8422",
        "P/A",
        "SANKAR",
        "-",
        "30/35",
        "SILMBU",
        "Master Vehicle"
    ],
    [
        "TN86K2129",
        "2129",
        "4628",
        "PRABAKARAN",
        "1399",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86K2518",
        "2518",
        "9866",
        "LIYAGATH ALI",
        "1636",
        "32/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86A1122",
        "1122",
        "P/A",
        "AMIT KUMAR",
        "1728",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86K2586",
        "2586",
        "P/A",
        "MUTHURAJA",
        "1648",
        "32/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86K2562",
        "2562",
        "9858",
        "MURUGAN",
        "1679",
        "32/35",
        "SIVA",
        "Master Vehicle"
    ],
    [
        "TN86K2580",
        "2580",
        "9825",
        "ALAGUSUNDARAM",
        "1298",
        "30/35",
        "ABISHEK",
        "Master Vehicle"
    ],
    [
        "TN86A1155",
        "1155",
        "P/A",
        "SARGUNADASS",
        "1837",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "TN86C3513",
        "3513",
        "6472",
        "Unknown",
        "-",
        "20/24",
        "DEEPAK",
        "Master Vehicle"
    ],
    [
        "KRISHNAN",
        "0000",
        "1256",
        "Unknown",
        "1277",
        "30/35",
        "SILAMBU",
        "Master Vehicle"
    ]
]];
for (const x of seed) {
    const existing = one('SELECT id FROM vehicles WHERE lastFourDigits=?', x[1]);
    if (!existing) {
        db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,ton,inchargeName,remarks) VALUES(?,?,?,?,?,?,?,?)').run(...x);
    }
}

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

const norm = (x: any) => String(x ?? '').trim();
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
app.get('/api/vehicles', (q, r) => { const s = '%' + norm(q.query.q) + '%'; r.json(rows(`SELECT * FROM vehicles WHERE vehicleNumber LIKE ? OR lastFourDigits LIKE ? OR cardNumber LIKE ? OR driverName LIKE ? OR inchargeName LIKE ? ORDER BY status,lastFourDigits`, s, s, s, s, s)); });
app.get('/api/vehicles/lookup/:last4', (q, r) => { const v = one("SELECT * FROM vehicles WHERE lastFourDigits=? AND status='Active'", norm(q.params.last4).padStart(4, '0')); v ? r.json(v) : r.status(404).json({ message: 'Vehicle not found' }); });
app.post('/api/vehicles', (q, r) => { const v = vehiclePayload(q.body); if (!valid(v)) return r.status(400).json({ message: 'Please complete all required vehicle fields; last 4 must contain exactly 4 digits.' }); try { const x = db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,inchargeName,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?,?)').run(v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton); r.status(201).json(one('SELECT * FROM vehicles WHERE id=?', x.lastInsertRowid)); } catch { r.status(409).json({ message: 'A vehicle with these last 4 digits already exists.' }) } });
app.put('/api/vehicles/:id', (q, r) => { const v = vehiclePayload(q.body); if (!valid(v)) return r.status(400).json({ message: 'Invalid vehicle data' }); try { db.prepare('UPDATE vehicles SET vehicleNumber=?,lastFourDigits=?,cardNumber=?,driverName=?,driverNumber=?,inchargeName=?,status=?,remarks=?,ton=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?').run(v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton, q.params.id); r.json(one('SELECT * FROM vehicles WHERE id=?', q.params.id)); } catch { r.status(409).json({ message: 'Last 4 digits must be unique.' }) } }); app.delete('/api/vehicles/:id', (q, r) => { try { db.prepare('DELETE FROM vehicles WHERE id=?').run(q.params.id); r.sendStatus(204) } catch { r.status(409).json({ message: 'Cannot delete a vehicle with advance records. Deactivate it instead.' }) } });
const join = `SELECT a.*,COALESCE(NULLIF(a.vehicleNumberOverride,''),v.vehicleNumber) AS vehicleNumber,v.lastFourDigits,COALESCE(NULLIF(a.cardNumberOverride,''),v.cardNumber) AS cardNumber,COALESCE(NULLIF(a.driverNameOverride,''),v.driverName) AS driverName,COALESCE(NULLIF(a.driverNumberOverride,''),v.driverNumber) AS driverNumber,COALESCE(NULLIF(a.ton,''),v.ton) AS ton FROM daily_advances a JOIN vehicles v ON v.id=a.vehicleId`;

app.get('/api/advances', (q, r) => { const date = norm(q.query.date); r.json(rows(join + (date ? ' WHERE a.date=?' : '') + ' ORDER BY a.id DESC', ...(date ? [date] : []))); });
app.post('/api/advances', (q, r) => { const b = q.body, date = norm(b.date), vehicleId = Number(b.vehicleId); const v = one('SELECT * FROM vehicles WHERE id=?', vehicleId); if (!date || !v || !norm(b.inchargeName) || isNaN(Number(b.totalAmount))) return r.status(400).json({ message: 'Complete all required fields with a valid active vehicle.' }); if (!b.allowDuplicate && one('SELECT id FROM daily_advances WHERE date=? AND vehicleId=?', date, vehicleId)) return r.status(409).json({ message: "This vehicle has already been added for today's advance.", duplicate: true }); const driverNameInput = norm(b.driverNameOverride) || norm(b.driverName); const driverNumberInput = norm(b.driverNumberOverride) || norm(b.driverNumber); const vehicleNumberInput = norm(b.vehicleNumberOverride); const cardNumberInput = norm(b.cardNumberOverride); if (driverNameInput && (!norm((v as any).driverName) || (v as any).driverName === 'Pending update')) { db.prepare("UPDATE vehicles SET driverName=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(driverNameInput, vehicleId) } if (driverNumberInput && (!norm((v as any).driverNumber) || (v as any).driverNumber === 'PENDING')) { db.prepare("UPDATE vehicles SET driverNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(driverNumberInput, vehicleId) } if (vehicleNumberInput && (norm((v as any).vehicleNumber).startsWith('PENDING') || !norm((v as any).vehicleNumber))) { db.prepare("UPDATE vehicles SET vehicleNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(vehicleNumberInput, vehicleId) } if (cardNumberInput && (norm((v as any).cardNumber) === 'PENDING' || !norm((v as any).cardNumber))) { db.prepare("UPDATE vehicles SET cardNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(cardNumberInput, vehicleId) } const tonVal = norm(b.ton) || norm((v as any).ton); const cardCheck = cardNumberInput || norm((v as any).cardNumber); const isPersonal = cardCheck.toUpperCase() === 'P/A' || cardCheck.toUpperCase() === 'PA'; const isExtra = !isPersonal && (/\bextra\b/i.test(norm(b.remarks)) || norm(b.entryType).toUpperCase() === 'EXTRA'); const entryType = isPersonal ? 'PERSONAL' : (isExtra ? 'EXTRA' : (norm(b.entryType) || 'LOADING')); const x = db.prepare('INSERT INTO daily_advances(date,vehicleId,inchargeName,ton,totalAmount,remarks,driverNameOverride,driverNumberOverride,vehicleNumberOverride,cardNumberOverride,entryType) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(date, vehicleId, norm(b.inchargeName), tonVal, Number(b.totalAmount), norm(b.remarks), driverNameInput, driverNumberInput, vehicleNumberInput, cardNumberInput, entryType); r.status(201).json(one(join + ' WHERE a.id=?', x.lastInsertRowid)); });
app.post('/api/advances/bulk', (q, r) => { const b = q.body, date = norm(b.date), incharge = norm(b.inchargeName), globalTon = norm(b.ton), entries = Array.isArray(b.entries) ? b.entries : [], group = ['LOADING', 'PERSONAL', 'EXTRA'].includes(b.entryType) ? b.entryType : 'LOADING'; if (!date || !incharge) return r.status(400).json({ message: 'Date and incharge name are required.' }); let added = 0, duplicates = 0, invalid = 0, pending = 0; for (const x of entries) { const lastFour = norm(x.lastFourDigits).padStart(4, '0'); let v = one('SELECT * FROM vehicles WHERE lastFourDigits=?', lastFour); if (!v && b.allowUnmatched && /^\d{4}$/.test(lastFour)) { const id = db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?)').run(`PENDING-${lastFour}`, lastFour, 'PENDING', 'Pending update', 'PENDING', 'Inactive', 'Auto-created from pasted advance message — update this vehicle before future use.', norm(x.ton) || globalTon).lastInsertRowid; v = one('SELECT * FROM vehicles WHERE id=?', id) } if (!v || isNaN(Number(x.totalAmount))) { invalid++; continue } if (!b.allowDuplicate && one('SELECT id FROM daily_advances WHERE date=? AND vehicleId=?', date, (v as any).id)) { duplicates++; continue } const isPersonal = !!x.driverNameOverride || norm((v as any).cardNumber).toUpperCase() === 'P/A' || norm((v as any).cardNumber).toUpperCase() === 'PA'; const isExtra = !isPersonal && (/\bextra\b/i.test(norm(x.remarks)) || group === 'EXTRA'); const entryType = isPersonal ? 'PERSONAL' : (isExtra ? 'EXTRA' : group); const tonVal = norm(x.ton) || (v as any).ton || globalTon; db.prepare('INSERT INTO daily_advances(date,vehicleId,inchargeName,ton,totalAmount,remarks,driverNameOverride,entryType) VALUES(?,?,?,?,?,?,?,?)').run(date, (v as any).id, incharge, tonVal, Number(x.totalAmount), norm(x.remarks), norm(x.driverNameOverride), entryType); added++ } r.json({ added, duplicates, invalid, pending }) });


app.put('/api/advances/:id', (q, r) => {
    const id = Number(q.params.id);
    const b = q.body;
    const driverNameInput = norm(b.driverNameOverride) || norm(b.driverName);
    const driverNumberInput = norm(b.driverNumberOverride) || norm(b.driverNumber);
    const vehicleNumberInput = norm(b.vehicleNumberOverride);
    const cardNumberInput = norm(b.cardNumberOverride);
    const type = ['LOADING', 'PERSONAL', 'EXTRA'].includes(norm(b.entryType).toUpperCase()) ? norm(b.entryType).toUpperCase() : 'LOADING';
    db.prepare('UPDATE daily_advances SET inchargeName=?,ton=?,totalAmount=?,remarks=?,driverNameOverride=?,driverNumberOverride=?,vehicleNumberOverride=?,cardNumberOverride=?,entryType=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?').run(norm(b.inchargeName), norm(b.ton), Number(b.totalAmount), norm(b.remarks), driverNameInput, driverNumberInput, vehicleNumberInput, cardNumberInput, type, id);
    const updated = one(join + ' WHERE a.id=?', id);
    r.json(updated || { success: true });
});
app.delete('/api/advances/:id', (q, r) => {
    db.prepare('DELETE FROM daily_advances WHERE id=?').run(Number(q.params.id));
    r.status(200).json({ success: true });
});




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
app.get('/api/export/template/vehicles', (q, r) => {
    const headers = [['Vehicle No', 'Card No', 'Driver Name', 'Driver No', 'incharge name', 'Ton']];
    const samples = [
        ['TN38AB4511', '123456', 'Ajit', '9876543210', 'SILAMBU', '30/35'],
        ['TN38AB0947', '234567', 'Kumar', '9876543211', 'DEEPAK', '20/24'],
        ['TN38AB0022', 'P/A', 'Ravi', '9876543212', 'SILAMBU', '32/35']
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...samples]);
    ws['!cols'] = [18, 16, 22, 16, 18, 12].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master Import Template');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    r.attachment('Vehicle_Master_Import_Template.xlsx').send(buf);
});

app.post('/api/import/vehicles', upload.single('file'), (q, r) => { try { const wb = XLSX.readFile(q.file!.path, { raw: false }); const sheet = wb.Sheets[wb.SheetNames[0]]; const incoming = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' }); let imported = 0, updated = 0, invalid = 0; for (const row of incoming) { const getVal = (...keys: string[]) => { for (const k of Object.keys(row)) { const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); if (keys.some(key => cleanK === key.toLowerCase().replace(/[^a-z0-9]/g, ''))) return String(row[k]).trim(); } return ''; }; const vehNo = getVal('vehicleno', 'fullvehiclenumber', 'vehiclenumber', 'vehicle', 'vehno', 'vno', 'truckno', 'lorryno', 'tnno'); const last4 = getVal('last4', 'lastfourdigits', 'last4digits', 'digits', 'last4no'); const cardNo = getVal('cardno', 'cardnumber', 'card', 'hdfccard', 'cardnum'); const driverName = getVal('drivername', 'driver', 'drivername/mobile', 'name', 'drivernameoverride'); const driverNumber = getVal('driverno', 'drivernumber', 'drivermobile', 'mobile', 'phone', 'contact', 'driverphone'); const inchargeName = getVal('inchargename', 'incharge', 'incharge name', 'supervisor'); const ton = getVal('ton', 'capacity', 'weight'); const status = getVal('status', 'state'); const remarks = getVal('remarks', 'remark', 'notes', 'note'); const v = vehiclePayload({ vehicleNumber: vehNo, lastFourDigits: last4, cardNumber: cardNo, driverName: driverName, driverNumber: driverNumber, inchargeName: inchargeName, status: status, remarks: remarks, ton: ton }); if (!valid(v)) { invalid++; continue } const existing = one('SELECT id FROM vehicles WHERE lastFourDigits=?', v.lastFourDigits); if (existing) { db.prepare('UPDATE vehicles SET vehicleNumber=?,cardNumber=?,driverName=?,driverNumber=?,inchargeName=?,status=?,remarks=?,ton=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?').run(v.vehicleNumber, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton, (existing as any).id); updated++; } else { db.prepare('INSERT INTO vehicles(vehicleNumber,lastFourDigits,cardNumber,driverName,driverNumber,inchargeName,status,remarks,ton) VALUES(?,?,?,?,?,?,?,?,?)').run(v.vehicleNumber, v.lastFourDigits, v.cardNumber, v.driverName, v.driverNumber, v.inchargeName, v.status, v.remarks, v.ton); imported++; } } fs.unlinkSync(q.file!.path); r.json({ imported, updated, invalid }) } catch (e) { r.status(400).json({ message: 'Unable to import file. Check the expected column names.' }) } });


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

