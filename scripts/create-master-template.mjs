import XLSX from 'xlsx';
const rows = [['VEHICLE MASTER IMPORT TEMPLATE'], ['Vehicle No', 'Last 4', 'Card No', 'Driver Name', 'Driver No', 'TON', 'Status', 'Remarks'], ['TN38AB4511', '4511', '123456', 'Ajit', '9876543210', '30/35', 'Active', 'Example row - replace with your data']];
const ws = XLSX.utils.aoa_to_sheet(rows); ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]; ws['!cols'] = [18, 10, 16, 22, 16, 12, 12, 38].map(w => ({ wch: w })); ws['!freeze'] = { xSplit: 0, ySplit: 2 }; ws['A1'].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } }; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Master'); XLSX.writeFile(wb, 'Vehicle_Master_Import_Template.xlsx', { cellStyles: true });

