/**
 * Client-side GST calculation mirror for instant preview.
 */

export function calculateGST(products, sellerStateCode, buyerStateCode) {
    const isInterstate = sellerStateCode !== buyerStateCode;
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const calculated = products.map((p) => {
        const qty = parseFloat(p.quantity) || 0;
        const rate = parseFloat(p.rate) || 0;
        const taxPercent = parseFloat(p.taxPercent) || 0;
        const amount = +(qty * rate).toFixed(2);
        const taxAmount = +(amount * (taxPercent / 100)).toFixed(2);

        subtotal += amount;
        if (isInterstate) {
            totalIgst += taxAmount;
        } else {
            totalCgst += +(taxAmount / 2).toFixed(2);
            totalSgst += +(taxAmount / 2).toFixed(2);
        }

        return { ...p, amount };
    });

    subtotal = +subtotal.toFixed(2);
    totalCgst = +totalCgst.toFixed(2);
    totalSgst = +totalSgst.toFixed(2);
    totalIgst = +totalIgst.toFixed(2);
    const totalTax = +(totalCgst + totalSgst + totalIgst).toFixed(2);
    const grandTotal = Math.round(subtotal + totalTax);

    return {
        products: calculated,
        subtotal,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        totalTax,
        grandTotal,
        isInterstate,
    };
}

// Indian number to words
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n) {
    if (!n) return '';
    const h = Math.floor(n / 100), r = n % 100;
    let res = '';
    if (h) res += ones[h] + ' Hundred';
    if (h && r) res += ' ';
    if (r) res += twoDigits(r);
    return res;
}

export function amountInWords(num) {
    if (!num) return 'Zero Only';
    num = Math.round(num);
    const crore = Math.floor(num / 10000000); num %= 10000000;
    const lakh = Math.floor(num / 100000); num %= 100000;
    const thousand = Math.floor(num / 1000); num %= 1000;
    const parts = [];
    if (crore) parts.push(threeDigits(crore) + ' Crore');
    if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
    if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
    if (num) parts.push(threeDigits(num));
    return 'Rupees ' + parts.join(' ') + ' Only';
}
