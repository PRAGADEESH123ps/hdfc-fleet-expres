import createWorker from 'tesseract.js';
import fs from 'node:fs';

const cols = ['vehicle_no', 'card_no', 'driver_name', 'driver_no', 'incharge', 'ton'];

async function run() {
    const worker = await createWorker.createWorker('eng');
    const results = {};

    for (const name of cols) {
        console.log(`Running OCR for column: ${name}...`);
        const ret = await worker.recognize(`c:\\Users\\Pragadeesh S\\Desktop\\advance\\col_${name}.png`);
        results[name] = ret.data.text.split('\n').map(l => l.trim()).filter(Boolean);
    }

    await worker.terminate();
    fs.writeFileSync('column_ocr_results.json', JSON.stringify(results, null, 2));
    console.log('Saved column_ocr_results.json');
}

run().catch(console.error);
