import { calculateGST, amountInWords } from '../utils/gstCalc';

export default function InvoicePreview({ seller, buyer, consignee, products, invoiceNumber, invoiceDate, dispatchInfo }) {
    // Fallback consignee to buyer if empty
    const shipTo = consignee?.name ? consignee : buyer;
    const tax = calculateGST(products, seller?.stateCode, buyer?.stateCode);
    const words = amountInWords(tax.grandTotal);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    };

    const dateStr = formatDate(invoiceDate);

    return (
        <div className="bg-white text-black font-sans text-[11px] leading-snug border-2 border-black max-w-4xl mx-auto overflow-x-auto print:border-none">
            {/* Header */}
            <div className="text-center py-2 font-bold text-base border-b-2 border-black">
                Tax Invoice
            </div>

            {/* Top Grid Area */}
            <div className="grid grid-cols-2 border-b-2 border-black">
                {/* Left Column (Addresses) */}
                <div className="flex flex-col border-r-2 border-black">
                    {/* Seller */}
                    <div className="p-1.5 border-b border-black flex-1 min-h-[90px]">
                        <div className="font-bold">{seller?.name || 'SELLER NAME'}</div>
                        <div>{seller?.address || ''}</div>
                        <div>GSTIN/UIN: {seller?.gstin || ''}</div>
                        <div>State Name : {seller?.state || ''}, Code : {seller?.stateCode || ''}</div>
                    </div>
                    {/* Consignee */}
                    <div className="p-1.5 border-b border-black flex-1 min-h-[90px]">
                        <div className="text-gray-600 text-[10px]">Consignee (Ship to)</div>
                        <div className="font-bold">{shipTo?.name || ''}</div>
                        <div>{shipTo?.address || ''}</div>
                        <div>GSTIN/UIN <span className="ml-[20px]">: {shipTo?.gstin || ''}</span></div>
                        <div>State Name <span className="ml-[15px]">: {shipTo?.state || ''}, Code : {shipTo?.stateCode || ''}</span></div>
                    </div>
                    {/* Buyer */}
                    <div className="p-1.5 flex-1 min-h-[90px]">
                        <div className="text-gray-600 text-[10px]">Buyer (Bill to)</div>
                        <div className="font-bold">{buyer?.name || ''}</div>
                        <div>{buyer?.address || ''}</div>
                        <div>GSTIN/UIN <span className="ml-[20px]">: {buyer?.gstin || ''}</span></div>
                        <div>State Name <span className="ml-[15px]">: {buyer?.state || ''}, Code : {buyer?.stateCode || ''}</span></div>
                    </div>
                </div>

                {/* Right Column (Meta & Dispatch) */}
                <div className="flex flex-col">
                    {/* Row 1 */}
                    <div className="grid grid-cols-3 border-b border-black min-h-[36px]">
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">Invoice No.</div>
                            <div className="font-bold">{invoiceNumber}</div>
                        </div>
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">e-Way Bill No.</div>
                            <div className="font-bold">{dispatchInfo?.eWayBillNo}</div>
                        </div>
                        <div className="p-1">
                            <div className="text-xs">Dated</div>
                            <div className="font-bold">{dateStr}</div>
                        </div>
                    </div>
                    {/* Row 2 */}
                    <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">Delivery Note</div>
                        </div>
                        <div className="p-1">
                            <div className="text-xs">Mode/Terms of Payment</div>
                        </div>
                    </div>
                    {/* Row 3 */}
                    <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">Reference No. & Date.</div>
                            <div className="font-bold">{dispatchInfo?.referenceNo} {formatDate(dispatchInfo?.referenceDate)}</div>
                        </div>
                        <div className="p-1">
                            <div className="text-xs">Other References</div>
                            <div className="font-bold">{dispatchInfo?.otherReferences}</div>
                        </div>
                    </div>
                    {/* Row 4 */}
                    <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">Buyer's Order No.</div>
                            <div className="font-bold">{dispatchInfo?.buyersOrderNo}</div>
                        </div>
                        <div className="p-1">
                            <div className="text-xs">Dated</div>
                            <div className="font-bold">{formatDate(dispatchInfo?.buyersOrderDate)}</div>
                        </div>
                    </div>
                    {/* Row 5 */}
                    <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">Dispatch Doc No.</div>
                            <div className="font-bold">{dispatchInfo?.dispatchDocNo}</div>
                        </div>
                        <div className="p-1">
                            <div className="text-xs">Delivery Note Date</div>
                            <div className="font-bold">{formatDate(dispatchInfo?.deliveryNoteDate)}</div>
                        </div>
                    </div>
                    {/* Row 6 */}
                    <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">Dispatched through</div>
                            <div className="font-bold">{dispatchInfo?.dispatchedThrough}</div>
                        </div>
                        <div className="p-1">
                            <div className="text-xs">Destination</div>
                            <div className="font-bold">{dispatchInfo?.destination}</div>
                        </div>
                    </div>
                    {/* Row 7 */}
                    <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
                        <div className="p-1 border-r border-black">
                            <div className="text-xs">Bill of Lading/LR-RR No.</div>
                            <div className="font-bold">{dispatchInfo?.billOfLading}</div>
                        </div>
                        <div className="p-1">
                            <div className="text-xs">Motor Vehicle No.</div>
                            <div className="font-bold">{dispatchInfo?.motorVehicleNo}</div>
                        </div>
                    </div>
                    {/* Row 8 (Flex 1 to fill remaining space) */}
                    <div className="p-1 flex-1 min-h-[50px]">
                        <div className="text-xs">Terms of Delivery</div>
                        <div className="font-bold mt-1">{dispatchInfo?.termsOfDelivery}</div>
                    </div>
                </div>
            </div>

            {/* Product Table */}
            <table className="w-full border-collapse border-b-2 border-black text-center">
                <thead>
                    <tr className="border-b border-black h-10">
                        <td className="w-8 border-r border-black align-top py-1">Sl<br />No.</td>
                        <td className="border-r border-black align-top py-1 text-center font-bold">Description of Goods</td>
                        <td className="w-20 border-r border-black align-top py-1">HSN/SAC</td>
                        <td className="w-20 border-r border-black align-top py-1">Quantity</td>
                        <td className="w-16 border-r border-black align-top py-1">Rate<br /><span className="text-[9px]">(Incl. of Tax)</span></td>
                        <td className="w-16 border-r border-black align-top py-1">Rate</td>
                        <td className="w-10 border-r border-black align-top py-1">per</td>
                        <td className="w-24 align-top py-1">Amount</td>
                    </tr>
                </thead>
                <tbody>
                    {tax.products.map((p, i) => (
                        <tr key={i} className="h-20 align-top">
                            <td className="w-8 border-r border-black pt-1">{i + 1}</td>
                            <td className="border-r border-black pt-1 px-2 text-left font-bold">{p.name || ''}</td>
                            <td className="border-r border-black pt-1">{p.hsnCode || ''}</td>
                            <td className="border-r border-black pt-1">
                                <span className="font-bold">{p.quantity} {p.unit}</span>
                                {p.description && <div className="text-[9px] text-gray-700 leading-tight whitespace-pre-wrap mt-0.5">{p.description}</div>}
                            </td>
                            <td className="border-r border-black pt-1">{(p.rate * (1 + p.taxPercent / 100)).toFixed(2)}</td>
                            <td className="border-r border-black pt-1">{p.rate.toFixed(2)}</td>
                            <td className="border-r border-black pt-1">{p.unit}</td>
                            <td className="pt-1 font-bold text-right px-2">{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                    {/* Blank filler row to stretch table */}
                    <tr className="h-32">
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black text-right pr-4 font-bold italic">
                            {tax.isInterstate ? 'IGST OUTPUT' : 'CGST OUTPUT\nSGST OUTPUT'}
                        </td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="text-right px-2 font-bold whitespace-pre-line">
                            {tax.isInterstate ? tax.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 }) :
                                `${tax.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n${tax.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        </td>
                    </tr>
                    {/* Total Row */}
                    <tr className="border-t border-black">
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black text-right pr-2">Total</td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black font-bold">
                            {tax.products.reduce((acc, p) => acc + (parseFloat(p.quantity) || 0), 0)}
                        </td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="font-bold text-right px-2">₹ {tax.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>

            {/* Amount In Words & E.O.E */}
            <div className="flex justify-between p-1 border-b border-black text-xs">
                <div>
                    <div>Amount Chargeable (in words)</div>
                    <div className="font-bold">INR {words}</div>
                </div>
                <div className="italic font-bold">E. & O.E</div>
            </div>

            {/* Tax Rate Table */}
            <table className="w-full border-collapse border-b border-black text-center text-[10px]">
                <thead>
                    <tr className="border-b border-black">
                        <td rowSpan={2} className="border-r border-black py-1 w-1/3">HSN/SAC</td>
                        <td rowSpan={2} className="border-r border-black py-1">Taxable<br />Value</td>
                        {tax.isInterstate ? (
                            <td colSpan={2} className="border-r border-black py-1">IGST</td>
                        ) : (
                            <>
                                <td colSpan={2} className="border-r border-black py-1">CGST</td>
                                <td colSpan={2} className="border-r border-black py-1">SGST</td>
                            </>
                        )}
                        <td rowSpan={2} className="py-1">Total<br />Tax Amount</td>
                    </tr>
                    <tr className="border-b border-black">
                        <td className="border-r border-black border-t border-black">Rate</td>
                        <td className="border-r border-black border-t border-black">Amount</td>
                        {!tax.isInterstate && (
                            <>
                                <td className="border-r border-black border-t border-black">Rate</td>
                                <td className="border-r border-black border-t border-black">Amount</td>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {tax.products.map((p, i) => (
                        <tr key={i}>
                            <td className="border-r border-black text-left pl-2">{p.hsnCode}</td>
                            <td className="border-r border-black text-right pr-2">{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            {tax.isInterstate ? (
                                <>
                                    <td className="border-r border-black text-right pr-1">{p.taxPercent}%</td>
                                    <td className="border-r border-black text-right pr-2">{(p.amount * p.taxPercent / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </>
                            ) : (
                                <>
                                    <td className="border-r border-black text-right pr-1">{p.taxPercent / 2}%</td>
                                    <td className="border-r border-black text-right pr-2">{(p.amount * p.taxPercent / 200).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="border-r border-black text-right pr-1">{p.taxPercent / 2}%</td>
                                    <td className="border-r border-black text-right pr-2">{(p.amount * p.taxPercent / 200).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </>
                            )}
                            <td className="text-right pr-2">{(p.amount * p.taxPercent / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                    <tr className="border-t border-black font-bold">
                        <td className="border-r border-black text-right pr-2">Total</td>
                        <td className="border-r border-black text-right pr-2">{tax.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        {tax.isInterstate ? (
                            <>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black text-right pr-2">{tax.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </>
                        ) : (
                            <>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black text-right pr-2">{tax.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="border-r border-black"></td>
                                <td className="border-r border-black text-right pr-2">{tax.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </>
                        )}
                        <td className="text-right pr-2">{tax.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>

            {/* Bottom Footer Section */}
            <div className="flex border-b-2 border-black min-h-[100px]">
                <div className="flex-1 p-1 border-r border-black flex flex-col justify-between">
                    <div>
                        <div className="text-[10px] mb-1">Tax Amount (in words) : <span className="font-bold text-[11px]">INR {amountInWords(tax.totalTax)}</span></div>
                        <div className="text-[10px]">Amount of tax subject to Reverse Charge</div>

                        <div className="text-[10px] underline mt-3 mb-1">Declaration</div>
                        <div className="pr-4 leading-tight">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                    </div>
                </div>
                <div className="w-64 p-1 flex flex-col justify-between items-end">
                    <div className="font-bold">for {seller?.name || ''}</div>
                    <div className="text-xs text-gray-700 italic border-t border-black pt-1 w-full text-right mt-16">
                        Authorised Signatory
                    </div>
                </div>
            </div>

            <div className="text-center text-[10px] p-2 bg-white">
                This is a Computer Generated Invoice
            </div>
        </div>
    );
}
