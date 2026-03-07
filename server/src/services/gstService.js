/**
 * GST Calculation Service
 * Handles IGST (interstate) and CGST+SGST (intrastate) logic.
 */

const { amountInWords } = require('../utils/numberToWords');

/**
 * Calculate GST for an invoice.
 * @param {Array} products - Array of { quantity, rate, taxPercent, ... }
 * @param {string} sellerStateCode - e.g. "27"
 * @param {string} buyerStateCode - e.g. "29"
 * @returns {Object} { subtotal, cgst, sgst, igst, totalTax, grandTotal, isInterstate, amountInWords, products }
 */
function calculateInvoice(products, sellerStateCode, buyerStateCode) {
    const isInterstate = sellerStateCode !== buyerStateCode;

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const calculatedProducts = products.map((p) => {
        const amount = Number((p.quantity * p.rate).toFixed(2));
        const taxAmount = Number((amount * (p.taxPercent / 100)).toFixed(2));

        subtotal += amount;

        if (isInterstate) {
            totalIgst += taxAmount;
        } else {
            totalCgst += Number((taxAmount / 2).toFixed(2));
            totalSgst += Number((taxAmount / 2).toFixed(2));
        }

        return {
            ...p,
            amount,
        };
    });

    subtotal = Number(subtotal.toFixed(2));
    totalCgst = Number(totalCgst.toFixed(2));
    totalSgst = Number(totalSgst.toFixed(2));
    totalIgst = Number(totalIgst.toFixed(2));

    const totalTax = Number((totalCgst + totalSgst + totalIgst).toFixed(2));
    const grandTotal = Math.round(subtotal + totalTax); // Round to nearest rupee

    return {
        products: calculatedProducts,
        subtotal,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        totalTax,
        grandTotal,
        isInterstate,
        amountInWords: amountInWords(grandTotal),
    };
}

module.exports = { calculateInvoice };
