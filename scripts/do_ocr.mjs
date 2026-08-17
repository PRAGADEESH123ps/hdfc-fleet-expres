import createWorker from 'tesseract.js';
import fs from 'node:fs';

const imgPath = 'c:\\Users\\Pragadeesh S\\Desktop\\advance\\master_large.png';

async function main() {
    console.log('Starting OCR on upscaled image...');
    const worker = await createWorker.createWorker('eng');
    const ret = await worker.recognize(imgPath);
    console.log('OCR Complete. Text length:', ret.data.text.length);
    fs.writeFileSync('extracted_master_text.txt', ret.data.text, 'utf8');
    await worker.terminate();
    console.log('Saved to extracted_master_text.txt');
}

main().catch(err => console.error(err));
