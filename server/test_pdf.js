const { generateInvoicePDF } = require('./src/services/pdfService');
const mongoose = require('mongoose');

const invoice = {
    invoiceNumber: "INV-2024-001",
    invoiceDate: new Date(),
    seller: {
        name: "M/S RASHI",
        address: "123 Business Park, City",
        gstin: "22AAAAA0000A1Z5",
        state: "MAHARASHTRA",
        stateCode: "27"
    },
    buyer: {
        name: "JS ENTERPRISES",
        address: "456 Main Street, Town",
        gstin: "27BBBBB1111B1Z6",
        state: "MAHARASHTRA",
        stateCode: "27"
    },
    consignee: {
        name: "JS ENTERPRISES (WAREHOUSE)",
        address: "789 Logistics Park",
        gstin: "27BBBBB1111B1Z6",
        state: "MAHARASHTRA",
        stateCode: "27"
    },
    eWayBillNo: "123456789012",
    referenceNo: "REF-001",
    referenceDate: new Date(),
    otherReferences: "N/A",
    buyersOrderNo: "PO-999",
    buyersOrderDate: new Date(),
    dispatchDocNo: "DD-888",
    deliveryNoteDate: new Date(),
    dispatchedThrough: "ROAD",
    destination: "MUMBAI",
    billOfLading: "LR-777",
    motorVehicleNo: "MH-01-AB-1234",
    termsOfDelivery: "DOOR DELIVERY",
    products: [
        {
            name: "Industrial Widget A",
            hsnCode: "8471",
            quantity: 50,
            unit: "NOS",
            rate: 1000,
            taxPercent: 18,
            amount: 50000
        },
        {
            name: "Industrial Widget B",
            hsnCode: "8472",
            quantity: 20,
            unit: "NOS",
            rate: 2500,
            taxPercent: 18,
            amount: 50000
        }
    ],
    subtotal: 100000,
    cgst: 9000,
    sgst: 9000,
    igst: 0,
    totalTax: 18000,
    grandTotal: 118000,
    amountInWords: "One Lakh Eighteen Thousand Only",
    isInterstate: false
};

generateInvoicePDF(invoice).then(path => {
    console.log("PDF generated at: " + path);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
