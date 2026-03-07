import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import InvoiceForm from '../components/InvoiceForm';
import ProductTable from '../components/ProductTable';
import TaxSummary from '../components/TaxSummary';
import InvoicePreview from '../components/InvoicePreview';
import { invoiceApi } from '../api/invoiceApi';

const DEFAULT_SELLER = {
    name: 'Your Business Name',
    address: 'Your Business Address',
    gstin: '',
    state: '',
    stateCode: '',
};

export default function CreateInvoice() {
    const navigate = useNavigate();
    const [seller, setSeller] = useState({ ...DEFAULT_SELLER });
    const [consignee, setConsignee] = useState({ name: '', address: '', gstin: '', state: '', stateCode: '' });
    const [buyer, setBuyer] = useState({ name: '', address: '', gstin: '', state: '', stateCode: '' });
    const [products, setProducts] = useState([
        { name: '', hsnCode: '', quantity: 1, unit: 'PCS', rate: 0, taxPercent: 18 },
    ]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dispatchInfo, setDispatchInfo] = useState({
        eWayBillNo: '', referenceNo: '', referenceDate: '', otherReferences: '',
        buyersOrderNo: '', buyersOrderDate: '', dispatchDocNo: '', deliveryNoteDate: '',
        dispatchedThrough: '', destination: '', billOfLading: '', motorVehicleNo: '', termsOfDelivery: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!invoiceNumber.trim()) return toast.error('Invoice number is required');
        if (!seller.name.trim()) return toast.error('Seller name is required');
        if (!buyer.name.trim()) return toast.error('Buyer name is required');
        if (products.some(p => !p.name.trim())) return toast.error('All products must have a name');

        setSubmitting(true);
        try {
            const invoice = await invoiceApi.create({
                seller, buyer, consignee, products, invoiceNumber, invoiceDate, ...dispatchInfo
            });
            toast.success('Invoice created successfully!');

            // Auto-download PDF
            await invoiceApi.downloadPdf(invoice._id, invoice.invoiceNumber);
            toast.success('PDF downloaded');

            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create invoice');
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Create Invoice</h1>
                    <p className="text-gray-500 text-sm mt-1">Fill in the details to generate a GST invoice</p>
                </div>
                <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={showPreview ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                        {!showPreview && <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                    </svg>
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={showPreview ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : ''}>
                    <div className="space-y-6">
                        <InvoiceForm
                            seller={seller} setSeller={setSeller}
                            buyer={buyer} setBuyer={setBuyer}
                            consignee={consignee} setConsignee={setConsignee}
                            invoiceNumber={invoiceNumber} setInvoiceNumber={setInvoiceNumber}
                            invoiceDate={invoiceDate} setInvoiceDate={setInvoiceDate}
                            dispatchInfo={dispatchInfo} setDispatchInfo={setDispatchInfo}
                        />
                        <ProductTable products={products} setProducts={setProducts} />
                        <TaxSummary products={products}
                            sellerStateCode={seller.stateCode} buyerStateCode={buyer.stateCode} />

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={submitting} className="btn-success flex items-center gap-2">
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Generate Invoice & Download PDF
                                    </>
                                )}
                            </button>
                            <button type="button" onClick={() => navigate('/')} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>

                    {showPreview && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Live Preview</h3>
                            <InvoicePreview
                                seller={seller} buyer={buyer} consignee={consignee} products={products}
                                invoiceNumber={invoiceNumber} invoiceDate={invoiceDate}
                                dispatchInfo={dispatchInfo}
                            />
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
