export function getCurrentUnderscoreDateTime() {
    const now = new Date();

    const pad = (num: number) => num.toString().padStart(2, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
}