const testLines = [
    "6690 - SATHYARAJ - P/A - 7000/KKD TO ERODE",
    "8043 - RAJU BABU GUDALAM - P/A - 6000/KKD TO ERODE",
    "9501 - SHIBI - P/A - 7000/KKD TO ERODE",
    "9980 - PETCHIMUTHU - P/A - 1500/CHENNAI TO HYD OLD ADVANCE",
    "2435 - ARUL SELVAN - CARD - 4523 - 7000/KKD TO ERODE",
    "9975 - RAGU - P/A - 4044- 7000/KKD TO ERODE",
    "8422 - MUTHURAJ - P/A - 1500/ERODE TO KKD EMPTY",
    "6049 - MELSON PHILIP - P/A - 5000/DIANOMO SERVICE"
];

function parseLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // 1. Extract Last 4 Digits (starts line or first 4 digits)
    const first4Match = trimmed.match(/^(\d{4})\b/) || trimmed.match(/([A-Za-z]{2}\s*\d{1,2}\s*[A-Za-z]{1,3}\s*\d{4}|\b\d{4}\b)/i);
    if (!first4Match) return null;
    const last = first4Match[1] || first4Match[0].replace(/\D/g, '').slice(-4).padStart(4, '0');

    // 2. Extract Amount & Remarks: e.g. "7000/KKD TO ERODE" or "- 7000/KKD TO ERODE" or "- 4044- 7000/KKD"
    // Find amount followed by slash '/' or space or dash, e.g. (\d{3,6})(?:\/|\s|$)
    // We look for amounts >= 500 (typical advance is 1000 - 50000)
    let amount = 0;
    let remarks = '';
    let driverNameOverride = '';

    // Split line by dashes or slashes
    // Pattern: [LAST4] - [DRIVER NAME] - [P/A or CARD - CARDNO] - [AMOUNT]/[REMARKS]
    const slashParts = trimmed.split('/');
    if (slashParts.length > 1) {
        // e.g. "6690 - SATHYARAJ - P/A - 7000" and "KKD TO ERODE"
        const left = slashParts[0];
        remarks = slashParts.slice(1).join('/').trim();
        const leftAmtMatch = left.match(/(\d{3,6})\s*$/);
        if (leftAmtMatch) {
            amount = Number(leftAmtMatch[1]);
        }
    }

    if (!amount) {
        // Fallback: look for 3 to 6 digits after dash
        const amtMatches = Array.from(trimmed.matchAll(/(?:^|[\s\-\/:]+)(\d{3,6})(?:[\s\-\/:]|$)/g));
        for (const m of amtMatches) {
            const num = Number(m[1]);
            if (num >= 500 && String(num) !== last) {
                amount = num;
                break;
            }
        }
    }

    // Extract Driver Name if present: between last4 and P/A or CARD or amount
    const parts = trimmed.split('-').map(s => s.trim());
    if (parts.length >= 3) {
        // parts[0] is last4
        // parts[1] is Driver Name if it's letters
        if (/^[A-Za-z\s]+$/.test(parts[1])) {
            driverNameOverride = parts[1];
        }
    }

    // Clean remarks if empty
    if (!remarks) {
        remarks = trimmed;
    }

    return {
        lastFourDigits: last,
        driverNameOverride,
        totalAmount: amount,
        remarks
    };
}

testLines.forEach(l => console.log(l, '==>', parseLine(l)));
