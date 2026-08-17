const master = [
    { status: 'Active', lastFourDigits: '6690', cardNumber: 'P/A', ton: '30/35' },
    { status: 'Active', lastFourDigits: '8043', cardNumber: 'P/A', ton: '30/35' },
    { status: 'Active', lastFourDigits: '9501', cardNumber: 'P/A', ton: '30/35' },
    { status: 'Active', lastFourDigits: '9980', cardNumber: 'P/A', ton: '30/35' },
    { status: 'Active', lastFourDigits: '2435', cardNumber: '4523', ton: '30/35' },
    { status: 'Active', lastFourDigits: '9975', cardNumber: 'P/A', ton: '32/35' },
    { status: 'Active', lastFourDigits: '8422', cardNumber: 'P/A', ton: '30/35' },
    { status: 'Active', lastFourDigits: '6049', cardNumber: 'P/A', ton: '30/35' }
];

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

function parseMessage(message, master) {
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

        const matchV = master.find(v => v.status === 'Active' && v.lastFourDigits === last);
        const isPA = matchV?.cardNumber?.trim().toUpperCase() === 'P/A' || matchV?.cardNumber?.trim().toUpperCase() === 'PA' || /\b(P\/A|PA)\b/i.test(trimmed);
        const isPersonal = isPA || /\bpersonal\b/i.test(trimmed);
        const isExtra = !isPersonal && /\bextra\b/i.test(trimmed);

        return {
            lastFourDigits: last,
            totalAmount: amount,
            remarks,
            driverNameOverride,
            ton: matchV?.ton || '',
            isPersonal,
            isExtra,
            found: !!matchV
        };
    }).filter(Boolean);
}

const parsed = parseMessage(testLines.join('\n'), master);
console.log('Parsed count:', parsed.length);
console.log('Parsed entries:', parsed);
