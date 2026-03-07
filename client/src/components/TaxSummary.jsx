import { calculateGST, amountInWords } from '../utils/gstCalc';

export default function TaxSummary({ products, sellerStateCode, buyerStateCode }) {
    const tax = calculateGST(products, sellerStateCode, buyerStateCode);
    const words = amountInWords(tax.grandTotal);

    return (
        <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Tax Summary
            </h3>

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-gray-200 font-mono">₹{tax.subtotal.toFixed(2)}</span>
                </div>

                {tax.isInterstate ? (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">IGST</span>
                        <span className="text-yellow-300 font-mono">₹{tax.igst.toFixed(2)}</span>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">CGST</span>
                            <span className="text-blue-300 font-mono">₹{tax.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">SGST</span>
                            <span className="text-blue-300 font-mono">₹{tax.sgst.toFixed(2)}</span>
                        </div>
                    </>
                )}

                <div className="border-t border-white/10 pt-3 flex justify-between">
                    <span className="text-white font-semibold">Grand Total</span>
                    <span className="text-lg font-bold gradient-text font-mono">₹{tax.grandTotal.toFixed(2)}</span>
                </div>

                <div className="bg-primary-900/20 rounded-xl p-3 border border-primary-500/10">
                    <p className="text-xs text-gray-400 mb-1">Amount in Words</p>
                    <p className="text-sm text-primary-200 font-medium">{words}</p>
                </div>

                {sellerStateCode && buyerStateCode && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-lg ${tax.isInterstate ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                            {tax.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
