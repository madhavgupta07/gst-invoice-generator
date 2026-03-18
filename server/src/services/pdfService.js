/**
 * PDF Generation Service using PDFKit
 * Generates professional Indian-style GST invoices matching Tally layout.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { amountInWords } = require('../utils/numberToWords');

const INVOICES_DIR = path.join(__dirname, '../../invoices');
if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
}

/**
 * Generate an invoice PDF matching the strict Tally template format
 */
function generateInvoicePDF(invoice) {
    return new Promise((resolve, reject) => {
        const filename = `invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const filePath = path.join(INVOICES_DIR, filename);

        // A4 Dimensions: 595.28 x 841.89
        const doc = new PDFDocument({ size: 'A4', margin: 30, autoFirstPage: false });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.addPage();
        doc.lineWidth(0.5);

        const X = 30; // Left margin
        const Y = 30; // Top margin
        const W = 535; // Total width
        const XMid = X + (W / 2); // Center X

        const drawGrid = () => {
            // Main Outer Box
            doc.rect(X, Y, W, 765).stroke();

            // 1. Title Row
            const r1 = 20;
            doc.moveTo(X, Y + r1).lineTo(X + W, Y + r1).stroke();
            doc.fontSize(12).font('Helvetica-Bold').text('Tax Invoice', X, Y + 5, { width: W, align: 'center' });

            // 2. Left / Right Divider for Top Section
            const topGridHeight = 240;
            doc.moveTo(XMid, Y + r1).lineTo(XMid, Y + r1 + topGridHeight).stroke();

            // --- LEFT COLUMN ---
            let lY = Y + r1;
            // Seller (80)
            doc.moveTo(X, lY + 80).lineTo(XMid, lY + 80).stroke();
            // Consignee (80)
            doc.moveTo(X, lY + 160).lineTo(XMid, lY + 160).stroke();

            // Left Text content
            doc.fontSize(9).font('Helvetica-Bold').text(invoice.seller.name || 'SELLER', X + 4, lY + 4);
            doc.font('Helvetica').fontSize(8).text(invoice.seller.address || '', X + 4, lY + 16, { width: 260 });
            doc.text(`GSTIN/UIN: ${invoice.seller.gstin || ''}`, X + 4, lY + 54);
            doc.text(`State Name : ${invoice.seller.state || ''}, Code : ${invoice.seller.stateCode || ''}`, X + 4, lY + 66);

            lY += 80;
            const shipTo = invoice.consignee?.name ? invoice.consignee : invoice.buyer;
            doc.fontSize(7).font('Helvetica').text('Consignee (Ship to)', X + 4, lY + 4);
            doc.fontSize(9).font('Helvetica-Bold').text(shipTo.name || '', X + 4, lY + 14);
            doc.font('Helvetica').fontSize(8).text(shipTo.address || '', X + 4, lY + 26, { width: 260 });
            doc.text(`GSTIN/UIN        : ${shipTo.gstin || ''}`, X + 4, lY + 54);
            doc.text(`State Name       : ${shipTo.state || ''}, Code : ${shipTo.stateCode || ''}`, X + 4, lY + 66);

            lY += 80;
            doc.fontSize(7).font('Helvetica').text('Buyer (Bill to)', X + 4, lY + 4);
            doc.fontSize(9).font('Helvetica-Bold').text(invoice.buyer.name || '', X + 4, lY + 14);
            doc.font('Helvetica').fontSize(8).text(invoice.buyer.address || '', X + 4, lY + 26, { width: 260 });
            doc.text(`GSTIN/UIN        : ${invoice.buyer.gstin || ''}`, X + 4, lY + 54);
            doc.text(`State Name       : ${invoice.buyer.state || ''}, Code : ${invoice.buyer.stateCode || ''}`, X + 4, lY + 66);

            // --- RIGHT COLUMN ---
            let rY = Y + r1;
            const thirdVLineX1 = XMid + 89;
            const thirdVLineX2 = thirdVLineX1 + 89;

            // Right row dividers and text
            // Row 1 (36)
            doc.moveTo(XMid, rY + 36).lineTo(X + W, rY + 36).stroke();
            doc.moveTo(thirdVLineX1, rY).lineTo(thirdVLineX1, rY + 36).stroke();
            doc.moveTo(thirdVLineX2, rY).lineTo(thirdVLineX2, rY + 36).stroke();

            doc.fontSize(7).font('Helvetica').text('Invoice No.', XMid + 4, rY + 4);
            doc.fontSize(9).font('Helvetica-Bold').text(invoice.invoiceNumber || '', XMid + 4, rY + 16);

            doc.fontSize(7).font('Helvetica').text('e-Way Bill No.', thirdVLineX1 + 4, rY + 4);
            doc.fontSize(9).font('Helvetica-Bold').text(invoice.eWayBillNo || '', thirdVLineX1 + 4, rY + 16);

            doc.fontSize(7).font('Helvetica').text('Dated', thirdVLineX2 + 4, rY + 4);
            doc.fontSize(9).font('Helvetica-Bold').text(formatDate(invoice.invoiceDate), thirdVLineX2 + 4, rY + 16);
            rY += 36;

            const midRight = XMid + 133.75; // Half of right box

            // Loop for right side rows 2-7
            const rows = [
                { h: 24, lHead: 'Delivery Note', lVal: '', rHead: 'Mode/Terms of Payment', rVal: invoice.paymentStatus || '' },
                { h: 30, lHead: 'Reference No. & Date.', lVal: `${invoice.referenceNo || ''} ${formatDate(invoice.referenceDate)}`, rHead: 'Other References', rVal: invoice.otherReferences || '' },
                { h: 30, lHead: "Buyer's Order No.", lVal: invoice.buyersOrderNo || '', rHead: 'Dated', rVal: formatDate(invoice.buyersOrderDate) },
                { h: 30, lHead: 'Dispatch Doc No.', lVal: invoice.dispatchDocNo || '', rHead: 'Delivery Note Date', rVal: formatDate(invoice.deliveryNoteDate) },
                { h: 30, lHead: 'Dispatched through', lVal: invoice.dispatchedThrough || '', rHead: 'Destination', rVal: invoice.destination || '' },
                { h: 30, lHead: 'Bill of Lading/LR-RR No.', lVal: invoice.billOfLading || '', rHead: 'Motor Vehicle No.', rVal: invoice.motorVehicleNo || '' },
            ];

            rows.forEach(r => {
                doc.moveTo(XMid, rY + r.h).lineTo(X + W, rY + r.h).stroke();
                doc.moveTo(midRight, rY).lineTo(midRight, rY + r.h).stroke();

                doc.fontSize(7).font('Helvetica').text(r.lHead, XMid + 4, rY + 4);
                if (r.lVal) doc.fontSize(9).font('Helvetica-Bold').text(r.lVal, XMid + 4, rY + 16);

                doc.fontSize(7).font('Helvetica').text(r.rHead, midRight + 4, rY + 4);
                if (r.rVal) doc.fontSize(9).font('Helvetica-Bold').text(r.rVal, midRight + 4, rY + 16);

                rY += r.h;
            });

            // Right Row 8 (Balance height)
            doc.fontSize(7).font('Helvetica').text('Terms of Delivery', XMid + 4, rY + 4);
            doc.fontSize(9).font('Helvetica-Bold').text(invoice.termsOfDelivery || '', XMid + 4, rY + 16);

            // 3. Product Table Headers
            const tY = Y + r1 + topGridHeight; // 290
            doc.moveTo(X, tY).lineTo(X + W, tY).stroke();

            const pCols = [30, 175, 50, 50, 45, 45, 40, 100];
            let cw = X;
            const cX = [];
            pCols.forEach(w => {
                cX.push(cw);
                doc.moveTo(cw, tY).lineTo(cw, 560).stroke(); // Draw vertical lines down to total area
                cw += w;
            });
            // Product Header Row
            doc.moveTo(X, tY + 25).lineTo(X + W, tY + 25).stroke();

            doc.fontSize(8).font('Helvetica-Bold');
            doc.text("Sl\nNo.", cX[0] + 2, tY + 4, { width: pCols[0] - 4, align: 'center' });
            doc.text("Description of Goods", cX[1] + 2, tY + 8, { width: pCols[1] - 4, align: 'center' });
            doc.text("HSN/SAC", cX[2] + 2, tY + 8, { width: pCols[2] - 4, align: 'center' });
            doc.text("Quantity", cX[3] + 2, tY + 8, { width: pCols[3] - 4, align: 'center' });
            doc.text("Rate", cX[4] + 2, tY + 2, { width: pCols[4] - 4, align: 'center' });
            doc.fontSize(6).text("(Incl. of Tax)", cX[4] + 2, tY + 14, { width: pCols[4] - 4, align: 'center' });
            doc.fontSize(8).text("Rate", cX[5] + 2, tY + 8, { width: pCols[5] - 4, align: 'center' });
            doc.text("per", cX[6] + 2, tY + 8, { width: pCols[6] - 4, align: 'center' });
            doc.text("Amount", cX[7] + 2, tY + 8, { width: pCols[7] - 4, align: 'center' });

            // Products list
            let pY = tY + 30;
            let totalQty = 0;
            invoice.products.forEach((p, i) => {
                const inclTaxRate = p.rate * (1 + p.taxPercent / 100);

                doc.fontSize(8).font('Helvetica');
                doc.text(i + 1, cX[0] + 2, pY, { width: pCols[0] - 4, align: 'center' });
                doc.font('Helvetica-Bold').text(p.name, cX[1] + 4, pY, { width: pCols[1] - 8 });

                let descH = 0;
                if (p.description) {
                    doc.font('Helvetica').fontSize(7).text(p.description, cX[3] + 2, pY + 10, { width: pCols[3] - 4, align: 'right' });
                    descH = doc.heightOfString(p.description, { width: pCols[3] - 4, font: 'Helvetica', size: 7 }) + 2;
                }

                doc.font('Helvetica').text(p.hsnCode || '', cX[2] + 2, pY, { width: pCols[2] - 4, align: 'center' });
                doc.font('Helvetica-Bold').text(p.quantity + ' ' + p.unit, cX[3] + 2, pY, { width: pCols[3] - 4, align: 'right' });
                doc.font('Helvetica').text(inclTaxRate.toFixed(2), cX[4] + 2, pY, { width: pCols[4] - 4, align: 'right' });
                doc.text(p.rate.toFixed(2), cX[5] + 2, pY, { width: pCols[5] - 4, align: 'right' });
                doc.text(p.unit, cX[6] + 2, pY, { width: pCols[6] - 4, align: 'center' });
                doc.font('Helvetica-Bold').text(p.amount.toFixed(2), cX[7] + 2, pY, { width: pCols[7] - 6, align: 'right' });

                totalQty += parseFloat(p.quantity) || 0;
                pY += 15 + Math.max(15, descH);
            });

            // Tax Output items
            pY += 20;
            doc.font('Helvetica-BoldOblique').fontSize(8);
            if (invoice.isInterstate) {
                doc.text("IGST OUTPUT", cX[1] + 4, pY, { width: pCols[1] - 8, align: 'right' });
                doc.font('Helvetica-Bold').text(invoice.igst.toFixed(2), cX[7] + 2, pY, { width: pCols[7] - 6, align: 'right' });
            } else {
                doc.text("CGST OUTPUT", cX[1] + 4, pY, { width: pCols[1] - 8, align: 'right' });
                doc.font('Helvetica-Bold').text(invoice.cgst.toFixed(2), cX[7] + 2, pY, { width: pCols[7] - 6, align: 'right' });
                pY += 15;
                doc.font('Helvetica-BoldOblique').text("SGST OUTPUT", cX[1] + 4, pY, { width: pCols[1] - 8, align: 'right' });
                doc.font('Helvetica-Bold').text(invoice.sgst.toFixed(2), cX[7] + 2, pY, { width: pCols[7] - 6, align: 'right' });
            }

            // 4. Totals Row
            doc.moveTo(X, 560).lineTo(X + W, 560).stroke();
            doc.moveTo(X, 580).lineTo(X + W, 580).stroke();

            // Draw continuing vertical lines for total row
            doc.moveTo(cX[1], 560).lineTo(cX[1], 580).stroke();
            doc.moveTo(cX[2], 560).lineTo(cX[2], 580).stroke();
            doc.moveTo(cX[3], 560).lineTo(cX[3], 580).stroke();
            doc.moveTo(cX[4], 560).lineTo(cX[4], 580).stroke();
            doc.moveTo(cX[7], 560).lineTo(cX[7], 580).stroke();

            doc.font('Helvetica').fontSize(8).text("Total", cX[1] + 4, 566, { width: pCols[1] - 8, align: 'right' });
            const totalUnit = invoice.products[0]?.unit || '';
            doc.font('Helvetica-Bold').text(totalQty + ' ' + totalUnit, cX[3] + 2, 566, { width: pCols[3] - 4, align: 'right' });
            doc.text("Rs. " + invoice.grandTotal.toFixed(2), cX[7] + 2, 566, { width: pCols[7] - 6, align: 'right' });

            // 5. Amount Chargeable
            doc.moveTo(X, 610).lineTo(X + W, 610).stroke();
            doc.font('Helvetica').fontSize(7).text("Amount Chargeable (in words)", X + 4, 584);
            doc.font('Helvetica-BoldOblique').text("E. & O.E", X + W - 50, 584);
            doc.font('Helvetica-Bold').fontSize(9).text(`INR ${amountInWords(invoice.grandTotal)}`, X + 4, 596);

            // 6. Tax Table
            const taxTop = 610;
            doc.moveTo(X, taxTop + 24).lineTo(X + W, taxTop + 24).stroke();
            doc.moveTo(X, taxTop + 12).lineTo(X + W, taxTop + 12).stroke(); // internal Header H-line

            const txCols = invoice.isInterstate ? [160, 100, 80, 100, 95] : [160, 95, 45, 70, 45, 70, 50]; // W=535

            let cwT = X;
            const cxT = [];
            txCols.forEach(w => {
                cxT.push(cwT);
                cwT += w;
            });

            // Headers
            doc.font('Helvetica').fontSize(7);
            doc.text("HSN/SAC", cxT[0] + 4, taxTop + 6);
            doc.text("Taxable", cxT[1] + 4, taxTop + 2);
            doc.text("Value", cxT[1] + 4, taxTop + 12);

            if (invoice.isInterstate) {
                // Vertical lines
                doc.moveTo(cxT[1], taxTop).lineTo(cxT[1], 660).stroke();
                doc.moveTo(cxT[2], taxTop).lineTo(cxT[2], 660).stroke();
                doc.moveTo(cxT[3], taxTop + 12).lineTo(cxT[3], 660).stroke();
                doc.moveTo(cxT[4], taxTop).lineTo(cxT[4], 660).stroke();

                doc.text("IGST", cxT[2], taxTop + 4, { width: txCols[2] + txCols[3], align: 'center' });
                doc.text("Rate", cxT[2] + 2, taxTop + 14, { width: txCols[2] - 4, align: 'right' });
                doc.text("Amount", cxT[3] + 2, taxTop + 14, { width: txCols[3] - 4, align: 'right' });
                doc.text("Total", cxT[4] + 2, taxTop + 2, { width: txCols[4] - 4, align: 'center' });
                doc.text("Tax Amount", cxT[4] + 2, taxTop + 12, { width: txCols[4] - 4, align: 'center' });

                let currY = taxTop + 28;
                invoice.products.forEach(p => {
                    const taxAmt = p.amount * p.taxPercent / 100;
                    doc.text(p.hsnCode || '', cxT[0] + 4, currY);
                    doc.text(p.amount.toFixed(2), cxT[1] + 2, currY, { width: txCols[1] - 6, align: 'right' });
                    doc.text(`${p.taxPercent}%`, cxT[2] + 2, currY, { width: txCols[2] - 6, align: 'right' });
                    doc.text(taxAmt.toFixed(2), cxT[3] + 2, currY, { width: txCols[3] - 6, align: 'right' });
                    doc.text(taxAmt.toFixed(2), cxT[4] + 2, currY, { width: txCols[4] - 6, align: 'right' });
                    currY += 12;
                });
            } else {
                // Vertical lines
                doc.moveTo(cxT[1], taxTop).lineTo(cxT[1], 660).stroke();
                doc.moveTo(cxT[2], taxTop).lineTo(cxT[2], 660).stroke();
                doc.moveTo(cxT[3], taxTop + 12).lineTo(cxT[3], 660).stroke();
                doc.moveTo(cxT[4], taxTop).lineTo(cxT[4], 660).stroke();
                doc.moveTo(cxT[5], taxTop + 12).lineTo(cxT[5], 660).stroke();
                doc.moveTo(cxT[6], taxTop).lineTo(cxT[6], 660).stroke();

                doc.text("CGST", cxT[2], taxTop + 4, { width: txCols[2] + txCols[3], align: 'center' });
                doc.text("Rate", cxT[2] + 2, taxTop + 14, { width: txCols[2] - 4, align: 'right' });
                doc.text("Amount", cxT[3] + 2, taxTop + 14, { width: txCols[3] - 4, align: 'right' });

                doc.text("SGST", cxT[4], taxTop + 4, { width: txCols[4] + txCols[5], align: 'center' });
                doc.text("Rate", cxT[4] + 2, taxTop + 14, { width: txCols[4] - 4, align: 'right' });
                doc.text("Amount", cxT[5] + 2, taxTop + 14, { width: txCols[5] - 4, align: 'right' });

                doc.text("Total", cxT[6] + 2, taxTop + 2, { width: txCols[6] - 4, align: 'center' });
                doc.text("Tax", cxT[6] + 2, taxTop + 12, { width: txCols[6] - 4, align: 'center' });

                let currY = taxTop + 28;
                invoice.products.forEach(p => {
                    const halfTax = p.taxPercent / 2;
                    const taxAmt = p.amount * halfTax / 100;
                    doc.text(p.hsnCode || '', cxT[0] + 4, currY);
                    doc.text(p.amount.toFixed(2), cxT[1] + 2, currY, { width: txCols[1] - 6, align: 'right' });
                    doc.text(`${halfTax}%`, cxT[2] + 2, currY, { width: txCols[2] - 6, align: 'right' });
                    doc.text(taxAmt.toFixed(2), cxT[3] + 2, currY, { width: txCols[3] - 6, align: 'right' });
                    doc.text(`${halfTax}%`, cxT[4] + 2, currY, { width: txCols[4] - 6, align: 'right' });
                    doc.text(taxAmt.toFixed(2), cxT[5] + 2, currY, { width: txCols[5] - 6, align: 'right' });
                    doc.text((taxAmt * 2).toFixed(2), cxT[6] + 2, currY, { width: txCols[6] - 6, align: 'right' });
                    currY += 12;
                });
            }

            // Tax Total Row
            doc.moveTo(X, 660).lineTo(X + W, 660).stroke();
            doc.moveTo(X, 674).lineTo(X + W, 674).stroke();

            doc.font('Helvetica-Bold');
            doc.text("Total", cxT[0] + 4, 664, { width: txCols[0] - 10, align: 'right' });
            doc.text(invoice.subtotal.toFixed(2), cxT[1] + 2, 664, { width: txCols[1] - 6, align: 'right' });

            if (invoice.isInterstate) {
                doc.text(invoice.igst.toFixed(2), cxT[3] + 2, 664, { width: txCols[3] - 6, align: 'right' });
                doc.text(invoice.igst.toFixed(2), cxT[4] + 2, 664, { width: txCols[4] - 6, align: 'right' });
            } else {
                doc.text(invoice.cgst.toFixed(2), cxT[3] + 2, 664, { width: txCols[3] - 6, align: 'right' });
                doc.text(invoice.sgst.toFixed(2), cxT[5] + 2, 664, { width: txCols[5] - 6, align: 'right' });
                doc.text((invoice.cgst + invoice.sgst).toFixed(2), cxT[6] + 2, 664, { width: txCols[6] - 6, align: 'right' });
            }

            // 7. Footer Meta
            doc.font('Helvetica').fontSize(7).text(`Tax Amount (in words) :`, X + 4, 680);
            doc.font('Helvetica-Bold').fontSize(8).text(`INR ${amountInWords(invoice.totalTax)}`, X + 100, 680);

            doc.font('Helvetica').fontSize(7);
            doc.text("Amount of tax subject to Reverse Charge", X + 4, 694);

            doc.text("Declaration", X + 4, 715, { underline: true });
            doc.text("We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.", X + 4, 725, { width: 250 });

            // Signature Box
            doc.moveTo(XMid, 710).lineTo(XMid, 795).stroke();

            doc.moveTo(XMid, 710).lineTo(X + W, 710).stroke();
            doc.font('Helvetica-Bold').text(`for ${invoice.seller.name || ''}`, XMid + 10, 715, { width: 250, align: 'right' });

            doc.font('Helvetica').text("Authorised Signatory", XMid + 10, 755, { width: 250, align: 'right' });

            doc.fontSize(6).text("This is a Computer Generated Invoice", X, 797, { width: W, align: 'center' });
        };

        drawGrid();

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

module.exports = { generateInvoicePDF };
