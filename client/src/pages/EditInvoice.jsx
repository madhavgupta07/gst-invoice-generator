import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import InvoiceForm from '../components/InvoiceForm';
import ProductTable from '../components/ProductTable';
import TaxSummary from '../components/TaxSummary';
import InvoicePreview from '../components/InvoicePreview';
import { invoiceApi } from '../api/invoiceApi';

export default function EditInvoice() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState({ name: '', address: '', gstin: '', state: '', stateCode: '' });
    const [buyer, setBuyer] = useState({ name: '', address: '', gstin: '', state: '', stateCode: '' });
    const [consignee, setConsignee] = useState({ name: '', address: '', gstin: '', state: '', stateCode: '' });
    const [products, setProducts] = useState([]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [dispatchInfo, setDispatchInfo] = useState({
        eWayBillNo: '', referenceNo: '', referenceDate: '', otherReferences: '',
        buyersOrderNo: '', buyersOrderDate: '', dispatchDocNo: '', deliveryNoteDate: '',
        dispatchedThrough: '', destination: '', billOfLading: '', motorVehicleNo: '', termsOfDelivery: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const loadInvoice = async () => {
            try {
                const inv = await invoiceApi.get(id);
                setSeller(inv.seller);
                setBuyer(inv.buyer);
                if (inv.consignee) setConsignee(inv.consignee);
                setProducts(inv.products.map(p => ({
                    name: p.name, hsnCode: p.hsnCode || '', quantity: p.quantity,
                    unit: p.unit || 'PCS', rate: p.rate, taxPercent: p.taxPercent,
                })));
                setInvoiceNumber(inv.invoiceNumber);
                setInvoiceDate(inv.invoiceDate ? inv.invoiceDate.split('T')[0] : '');
                setDispatchInfo({
                    eWayBillNo: inv.eWayBillNo || '',
                    referenceNo: inv.referenceNo || '',
                    referenceDate: inv.referenceDate || '',
                    otherReferences: inv.otherReferences || '',
                    buyersOrderNo: inv.buyersOrderNo || '',
                    buyersOrderDate: inv.buyersOrderDate || '',
                    dispatchDocNo: inv.dispatchDocNo || '',
                    deliveryNoteDate: inv.deliveryNoteDate || '',
                    dispatchedThrough: inv.dispatchedThrough || '',
                    destination: inv.destination || '',
                    billOfLading: inv.billOfLading || '',
                    motorVehicleNo: inv.motorVehicleNo || '',
                    termsOfDelivery: inv.termsOfDelivery || '',
                });
            } catch {
                toast.error('Failed to load invoice');
                navigate('/');
            }
            setLoading(false);
        };
        loadInvoice();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await invoiceApi.update(id, {
                seller, buyer, consignee, products, invoiceNumber, invoiceDate, ...dispatchInfo
            });
            toast.success('Invoice updated successfully!');
            await invoiceApi.downloadPdf(id, invoiceNumber);
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update invoice');
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Edit Invoice</h1>
                    <p className="text-gray-500 text-sm mt-1">Invoice #{invoiceNumber}</p>
                </div>
                <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary text-sm">
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
                                {submitting ? 'Updating...' : 'Update Invoice & Download PDF'}
                            </button>
                            <button type="button" onClick={() => navigate('/')} className="btn-secondary">Cancel</button>
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
