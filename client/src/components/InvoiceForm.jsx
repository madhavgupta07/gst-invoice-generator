import { useState } from 'react';
import { invoiceApi } from '../api/invoiceApi';
import toast from 'react-hot-toast';

function Field({ label, value, onChange, placeholder, type = 'text', required = false }) {
    return (
        <div>
            <label className="form-label">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} className="form-input" required={required} />
        </div>
    );
}

const INDIAN_STATES = [
    { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra & Nagar Haveli' }, { code: '27', name: 'Maharashtra' },
    { code: '28', name: 'Andhra Pradesh (Old)' }, { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' }, { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' }, { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' }, { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh (New)' },
];

export default function InvoiceForm({
    seller, setSeller, buyer, setBuyer, consignee, setConsignee,
    invoiceNumber, setInvoiceNumber, invoiceDate, setInvoiceDate,
    dispatchInfo, setDispatchInfo
}) {
    const [verifyingTarget, setVerifyingTarget] = useState(null); // 'seller' | 'buyer'
    const [captchaDialog, setCaptchaDialog] = useState(null); // { sessionId, image, input, loading, target }

    const updateSeller = (field, value) => setSeller(prev => ({ ...prev, [field]: value }));
    const updateBuyer = (field, value) => setBuyer(prev => ({ ...prev, [field]: value }));
    const updateConsignee = (field, value) => setConsignee(prev => ({ ...prev, [field]: value }));
    const updateDispatch = (field, value) => setDispatchInfo(prev => ({ ...prev, [field]: value }));

    const handleStateChange = (setter, code) => {
        const state = INDIAN_STATES.find(s => s.code === code);
        if (state) {
            setter(prev => ({ ...prev, state: state.name, stateCode: code }));
        }
    };

    const verifyGSTIN = async (target) => {
        const gstinToVerify = target === 'seller' ? seller.gstin : buyer.gstin;
        if (!gstinToVerify || gstinToVerify.length !== 15) {
            return toast.error('Please enter a valid 15-digit GSTIN');
        }
        setVerifyingTarget(target);
        try {
            // First try the API (if configured)
            const result = await invoiceApi.verifyGst(gstinToVerify);
            if (result.valid) {
                applyGstResult(target, result);
                toast.success('GSTIN verified successfully!');
                return setVerifyingTarget(null);
            }

            // If API not configured or failed, switch to CAPTCHA flow
            const captchaData = await invoiceApi.getCaptcha();
            if (captchaData.error) {
                toast.error(captchaData.error);
            } else {
                setCaptchaDialog({
                    sessionId: captchaData.sessionId,
                    image: captchaData.image,
                    input: '',
                    loading: false,
                    target: target
                });
            }
        } catch {
            toast.error('Verification failed. Enter details manually.');
        }
        setVerifyingTarget(null);
    };

    const submitCaptcha = async () => {
        if (!captchaDialog?.input) return;
        setCaptchaDialog(prev => ({ ...prev, loading: true }));
        try {
            const gstinToVerify = captchaDialog.target === 'seller' ? seller.gstin : buyer.gstin;
            const result = await invoiceApi.verifyWithCaptcha(captchaDialog.sessionId, gstinToVerify, captchaDialog.input);
            if (result.valid) {
                applyGstResult(captchaDialog.target, result);
                toast.success('GSTIN verified successfully from portal!');
                setCaptchaDialog(null);
            } else {
                toast.error(result.error || 'Invalid CAPTCHA');
                setCaptchaDialog(null);
            }
        } catch {
            toast.error('Verification failed');
            setCaptchaDialog(null);
        }
    };

    const applyGstResult = (target, result) => {
        const updateFn = target === 'seller' ? setSeller : setBuyer;
        updateFn(prev => ({
            ...prev,
            name: result.name || prev.name,
            address: result.address || prev.address,
            stateCode: result.stateCode || prev.stateCode,
            state: INDIAN_STATES.find(s => s.code === result.stateCode)?.name || prev.state,
        }));
    };

    return (
        <div className="space-y-6">
            {/* Invoice Meta & Dispatch */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Invoice & Dispatch Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Basic Meta */}
                    <Field label="Invoice Number *" value={invoiceNumber} onChange={setInvoiceNumber} placeholder="INV-001" required />
                    <Field label="Invoice Date *" value={invoiceDate} onChange={setInvoiceDate} type="date" required />
                    <Field label="e-Way Bill No" value={dispatchInfo.eWayBillNo} onChange={v => updateDispatch('eWayBillNo', v)} placeholder="e-Way Bill No." />

                    {/* References */}
                    <Field label="Reference No & Date" value={dispatchInfo.referenceNo} onChange={v => updateDispatch('referenceNo', v)} placeholder="Ref No / Date" />
                    <Field label="Other References" value={dispatchInfo.otherReferences} onChange={v => updateDispatch('otherReferences', v)} />
                    <Field label="Buyer's Order No" value={dispatchInfo.buyersOrderNo} onChange={v => updateDispatch('buyersOrderNo', v)} />
                    <Field label="Order Date" value={dispatchInfo.buyersOrderDate} onChange={v => updateDispatch('buyersOrderDate', v)} type="date" />

                    {/* Dispatch/Transport */}
                    <Field label="Dispatch Doc No" value={dispatchInfo.dispatchDocNo} onChange={v => updateDispatch('dispatchDocNo', v)} />
                    <Field label="Delivery Note Date" value={dispatchInfo.deliveryNoteDate} onChange={v => updateDispatch('deliveryNoteDate', v)} type="date" />
                    <Field label="Dispatched Through" value={dispatchInfo.dispatchedThrough} onChange={v => updateDispatch('dispatchedThrough', v)} placeholder="eg. Courier, Rail" />
                    <Field label="Destination" value={dispatchInfo.destination} onChange={v => updateDispatch('destination', v)} />
                    <Field label="Bill of Lading / LR-RR No" value={dispatchInfo.billOfLading} onChange={v => updateDispatch('billOfLading', v)} />
                    <Field label="Motor Vehicle No" value={dispatchInfo.motorVehicleNo} onChange={v => updateDispatch('motorVehicleNo', v)} />
                </div>
                <div className="mt-4">
                    <Field label="Terms of Delivery" value={dispatchInfo.termsOfDelivery} onChange={v => updateDispatch('termsOfDelivery', v)} placeholder="Delivery Terms" />
                </div>
            </div>

            {/* Addresses: Seller, Consignee, Buyer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Seller */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Seller Details</h3>
                    <div className="space-y-3">
                        <Field label="Business Name *" value={seller.name} onChange={v => updateSeller('name', v)} required />
                        <Field label="Address" value={seller.address} onChange={v => updateSeller('address', v)} />
                        <div>
                            <label className="form-label">GSTIN *</label>
                            <div className="flex gap-2">
                                <input type="text" value={seller.gstin}
                                    onChange={e => updateSeller('gstin', e.target.value.toUpperCase())}
                                    placeholder="22AAAAA0000A1Z5" className="form-input flex-1" maxLength={15} required />
                                <button type="button" onClick={() => verifyGSTIN('seller')} disabled={verifyingTarget === 'seller'}
                                    className="btn-secondary text-xs whitespace-nowrap">
                                    {verifyingTarget === 'seller' ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Verifying...
                                        </span>
                                    ) : 'Verify'}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label">State</label>
                                <select value={seller.stateCode} onChange={e => handleStateChange(setSeller, e.target.value)} className="form-input">
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                </select>
                            </div>
                            <Field label="Code" value={seller.stateCode} onChange={v => updateSeller('stateCode', v)} />
                        </div>
                    </div>
                </div>

                {/* Consignee (Ship To) */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center justify-between">
                        <span>Consignee (Ship To)</span>
                        <button type="button"
                            onClick={() => setConsignee({ ...buyer })}
                            className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                            Copy Buyer
                        </button>
                    </h3>
                    <div className="space-y-3">
                        <Field label="Business Name" value={consignee.name} onChange={v => updateConsignee('name', v)} />
                        <Field label="Address" value={consignee.address} onChange={v => updateConsignee('address', v)} />
                        <Field label="GSTIN" value={consignee.gstin} onChange={v => updateConsignee('gstin', v)} />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label">State</label>
                                <select value={consignee.stateCode} onChange={e => handleStateChange(setConsignee, e.target.value)} className="form-input">
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                </select>
                            </div>
                            <Field label="Code" value={consignee.stateCode} onChange={v => updateConsignee('stateCode', v)} />
                        </div>
                    </div>
                </div>

                {/* Buyer (Bill To) */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center justify-between">
                        <span>Buyer (Bill To)</span>
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="form-label">GSTIN</label>
                            <div className="flex gap-2">
                                <input type="text" value={buyer.gstin}
                                    onChange={e => updateBuyer('gstin', e.target.value.toUpperCase())}
                                    placeholder="22AAAAA0000A1Z5" className="form-input flex-1" maxLength={15} />
                                <button type="button" onClick={() => verifyGSTIN('buyer')} disabled={verifyingTarget === 'buyer'}
                                    className="btn-secondary text-xs whitespace-nowrap">
                                    {verifyingTarget === 'buyer' ? (
                                        <span className="flex items-center gap-1">
                                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Verifying...
                                        </span>
                                    ) : 'Verify'}
                                </button>
                            </div>
                        </div>
                        <Field label="Business Name *" value={buyer.name} onChange={v => updateBuyer('name', v)}
                            placeholder="Buyer Business Name" required />
                        <Field label="Address" value={buyer.address} onChange={v => updateBuyer('address', v)}
                            placeholder="Full Address" />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label">State</label>
                                <select value={buyer.stateCode} onChange={e => handleStateChange(setBuyer, e.target.value)} className="form-input">
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                </select>
                            </div>
                            <Field label="Code" value={buyer.stateCode} onChange={v => updateBuyer('stateCode', v)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* CAPTCHA Modal overlay */}
            {captchaDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
                        <button type="button" onClick={() => setCaptchaDialog(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-lg font-bold text-white mb-2">GST Portal Verification</h3>
                        <p className="text-xs text-gray-400 mb-4">Please solve the CAPTCHA from the GST database.</p>

                        <div className="bg-white p-2 rounded-xl flex justify-center mb-4">
                            {captchaDialog.image ? (
                                <img src={captchaDialog.image} alt="CAPTCHA" className="h-12 w-auto" />
                            ) : (
                                <div className="h-12 w-auto flex items-center justify-center text-gray-500 text-sm">No Image</div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input type="text" value={captchaDialog.input}
                                onChange={e => setCaptchaDialog(prev => ({ ...prev, input: e.target.value }))}
                                placeholder="Enter characters shown"
                                className="form-input flex-1 !text-sm"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && submitCaptcha()}
                            />
                            <button type="button" onClick={submitCaptcha} disabled={captchaDialog.loading || !captchaDialog.input}
                                className="btn-primary !px-4">
                                {captchaDialog.loading ? '...' : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
