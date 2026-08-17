const todayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
console.log('Current IST Today Date:', todayIST());
