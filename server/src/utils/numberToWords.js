/**
 * Convert a number to Indian words (Lakh, Crore system).
 * Example: 142380 → "One Lakh Forty Two Thousand Three Hundred Eighty"
 */

const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
];

const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n) {
    if (n === 0) return '';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let result = '';
    if (hundred) result += ones[hundred] + ' Hundred';
    if (hundred && rest) result += ' ';
    if (rest) result += twoDigits(rest);
    return result;
}

function numberToIndianWords(num) {
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToIndianWords(-num);

    // Round to nearest integer
    num = Math.round(num);

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const remainder = num;

    const parts = [];
    if (crore) parts.push(threeDigits(crore) + ' Crore');
    if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
    if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
    if (remainder) parts.push(threeDigits(remainder));

    return parts.join(' ');
}

/**
 * @param {number} amount
 * @returns {string} e.g. "One Lakh Forty Two Thousand Three Hundred Eighty Only"
 */
function amountInWords(amount) {
    if (amount === 0) return 'Zero Only';

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let result = 'Rupees ' + numberToIndianWords(rupees);
    if (paise > 0) {
        result += ' and ' + numberToIndianWords(paise) + ' Paise';
    }
    result += ' Only';
    return result;
}

module.exports = { numberToIndianWords, amountInWords };
