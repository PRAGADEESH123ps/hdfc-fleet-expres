# HDFC Fleet Express Advance

A production-oriented daily driver advance entry system. It uses React + TypeScript, Express, SQLite (`data/fleet.db`), and SheetJS/XLSX. Text identifiers (vehicle number, last four, card and driver numbers) are never converted to numbers.

## Start

Prerequisite: Node.js 22+ (Node 25 is supported). Run:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on port 3001. Data persists in `data/fleet.db` even after browser refresh or server restart. Back up this database file regularly.

## Daily entry

Select a date, type the four-character vehicle key (including leading zeros), then fill the remaining fields. Vehicle/card/driver details are retrieved automatically. Press Enter in Total Amount to submit. Duplicate vehicles for a date are blocked unless **Allow Duplicate Entry** is selected. Edit and delete controls are available on each row.

## Vehicle master and imports

Vehicle Master includes editable seed records marked as samples. Import `.xlsx` or `.csv` files using headers: `Vehicle No`, `Card No`, `Driver Name`, `Driver No`, `Status`, `Remarks`. The lookup key is derived from the final four characters of `Vehicle No`; legacy imports containing `Last 4` also work. Imports report imported, duplicate, and invalid rows. Export is also available.

## Excel export

Daily and history exports create `.xlsx` workbooks with the requested HDFC header, formatted date, column widths, bold headings, alignment, and freeze panes. Amount and TON remain numeric; identifier fields remain text.

## Production build

Run `npm run build` for the frontend bundle. For a simple local production run, compile or deploy the Node server and serve the generated `dist` folder behind a reverse proxy. Ensure `data/` is a durable writable location and set an appropriate backup policy.
