import { useState, useEffect } from 'react';
import { businessApi, invoiceApi } from '../api/invoiceApi';
import toast from 'react-hot-toast';

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

const emptyBusiness = { name: '', address: '', gstin: '', state: '', stateCode: '' };

export default function Settings() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ ...emptyBusiness });
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [captchaDialog, setCaptchaDialog] = useState(null);

    const fetchBusinesses = async () => {
        try {
            const data = await businessApi.list();
            setBusinesses(data);
        } catch {
            toast.error('Failed to load businesses');
        }
        setLoading(false);
    };

    useEffect(() => { fetchBusinesses(); }, []);

    const handleStateChange = (code) => {
        const state = INDIAN_STATES.find(s => s.code === code);
        if (state) setForm(prev => ({ ...prev, state: state.name, stateCode: code }));
    };

    const applyGstResult = (result) => {
        setForm(prev => ({
            ...prev,
            name: result.name || prev.name,
            address: result.address || prev.address,
            stateCode: result.stateCode || prev.stateCode,
            state: INDIAN_STATES.find(s => s.code === result.stateCode)?.name || prev.state,
        }));
    };

    const verifyGSTIN = async () => {
        if (!form.gstin || form.gstin.length !== 15) {
            return toast.error('Enter a valid 15-digit GSTIN');
        }
        setVerifying(true);
        try {
            const result = await invoiceApi.verifyGst(form.gstin);
            if (result.valid) {
                applyGstResult(result);
                toast.success('GSTIN verified!');
                setVerifying(false);
                return;
            }

            // Fallback to CAPTCHA flow
            const captchaData = await invoiceApi.getCaptcha();
            if (captchaData.error) {
                toast.error(captchaData.error);
            } else {
                setCaptchaDialog({
                    sessionId: captchaData.sessionId,
                    image: captchaData.image,
                    input: '',
                    loading: false,
                });
            }
        } catch {
            toast.error('Verification failed. Enter details manually.');
        }
        setVerifying(false);
    };

    const submitCaptcha = async () => {
        if (!captchaDialog?.input) return;
        setCaptchaDialog(prev => ({ ...prev, loading: true }));
        try {
            const result = await invoiceApi.verifyWithCaptcha(captchaDialog.sessionId, form.gstin, captchaDialog.input);
            if (result.valid) {
                applyGstResult(result);
                toast.success('GSTIN verified from GST portal!');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Business name is required');
        setSaving(true);
        try {
            if (editId) {
                await businessApi.update(editId, form);
                toast.success('Business updated');
            } else {
                await businessApi.create(form);
                toast.success('Business added');
            }
            setForm({ ...emptyBusiness });
            setEditId(null);
            setShowForm(false);
            fetchBusinesses();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save');
        }
        setSaving(false);
    };

    const startEdit = (b) => {
        setForm({ name: b.name, address: b.address, gstin: b.gstin, state: b.state, stateCode: b.stateCode });
        setEditId(b._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this business?')) return;
        try {
            await businessApi.delete(id);
            toast.success('Business deleted');
            fetchBusinesses();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await businessApi.setDefault(id);
            toast.success('Default business updated');
            fetchBusinesses();
        } catch {
            toast.error('Failed to set default');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your businesses</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...emptyBusiness }); }}
                    className="btn-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Business
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">
                        {editId ? 'Edit Business' : 'Add New Business'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">GSTIN</label>
                            <div className="flex gap-2">
                                <input type="text" value={form.gstin}
                                    onChange={e => setForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                                    placeholder="22AAAAA0000A1Z5" className="form-input flex-1" maxLength={15} />
                                <button type="button" onClick={verifyGSTIN} disabled={verifying}
                                    className="btn-secondary text-xs whitespace-nowrap">
                                    {verifying ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Business Name *</label>
                            <input type="text" value={form.name}
                                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Your Business Name" className="form-input" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">Address</label>
                            <input type="text" value={form.address}
                                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Full Address" className="form-input" />
                        </div>
                        <div>
                            <label className="form-label">State</label>
                            <select value={form.stateCode} onChange={e => handleStateChange(e.target.value)}
                                className="form-input">
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">State Code</label>
                            <input type="text" value={form.stateCode}
                                onChange={e => setForm(prev => ({ ...prev, stateCode: e.target.value }))}
                                className="form-input" readOnly />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" disabled={saving} className="btn-success">
                            {saving ? 'Saving...' : editId ? 'Update Business' : 'Add Business'}
                        </button>
                        <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                            className="btn-secondary">Cancel</button>
                    </div>
                </form>
            )}

            {/* Business List */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-gray-500 text-sm">Loading businesses...</p>
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-400 mb-1">No businesses added</h3>
                        <p className="text-gray-500 text-sm">Add your first business to auto-fill seller details on invoices.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {businesses.map(b => (
                            <div key={b._id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <button onClick={() => handleSetDefault(b._id)}
                                        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${b.isDefault ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                                        title={b.isDefault ? 'Default business' : 'Set as default'}>
                                        <svg className="w-5 h-5" fill={b.isDefault ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </button>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-200 truncate">{b.name}</p>
                                            {b.isDefault && (
                                                <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-md">DEFAULT</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{b.address || 'No address'}</p>
                                        <p className="text-xs text-gray-500">
                                            GSTIN: <span className="font-mono text-gray-400">{b.gstin || 'N/A'}</span>
                                            {b.state && <> &middot; {b.state} ({b.stateCode})</>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                                    <button onClick={() => startEdit(b)}
                                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                        title="Edit">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(b._id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                                        title="Delete">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CAPTCHA Modal */}
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
                                <div className="h-12 flex items-center justify-center text-gray-500 text-sm">No Image</div>
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
