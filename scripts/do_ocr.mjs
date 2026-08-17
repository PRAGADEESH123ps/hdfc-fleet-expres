import { createWorker } from 'tesseract.js';
import fs from 'fs';

async function main() {
    const worker = await createWorker('eng');
    const ret = await worker.recognize('C:/Users/Pragadeesh S/.gemini/antigravity/brain/aa9f55f3-5bb6-4479-b345-8b5b3332cfbe/media__1786969866919.png');
    fs.writeFileSync('/tmp/ocr_out.txt', ret.data.text);
    console.log('OCR Complete! Lines:', ret.data.text.split('\n').length);
    await worker.terminate();
}

main();
