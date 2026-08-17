import { createWorker } from 'tesseract.js';

async function main() {
    const worker = await createWorker('eng');
    for (let i = 0; i < 4; i++) {
        console.log(`--- SLICE ${i} ---`);
        const ret = await worker.recognize(`C:/tmp/slice_${i}.png`);
        console.log(ret.data.text);
    }
    await worker.terminate();
}

main();
