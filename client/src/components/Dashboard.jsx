import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceApi } from '../api/invoiceApi';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const data = await invoiceApi.list(params);
            setInvoices(data.invoices);
            setPagination(data.pagination);
        } catch (err) {
            toast.error('Failed to load invoices');
        }
        setLoading(false);
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchInvoices(1);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this invoice?')) return;
        try {
            await invoiceApi.delete(id);
            toast.success('Invoice deleted');
            fetchInvoices(pagination.page);
        } catch {
            toast.error('Failed to delete invoice');
        }
    };

    const handleDownload = async (id, invoiceNumber) => {
        try {
            await invoiceApi.downloadPdf(id, invoiceNumber);
            toast.success('PDF downloaded');
        } catch {
            toast.error('Download failed');
        }
    };

    const shareWhatsApp = (invoice) => {
        const text = `Invoice ${invoice.invoiceNumber} for ₹${invoice.grandTotal.toFixed(2)} from ${invoice.seller.name}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">Invoice Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">{pagination.total} invoices total</p>
                </div>
                <Link to="/create" className="btn-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Invoice
                </Link>
            </div>

            {/* Filters */}
            <form onSubmit={handleSearch} className="glass-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search invoices or customers..." className="form-input md:col-span-2" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input">
                        <option value="">All Statuses</option>
                        <option value="PAID">Paid</option>
                        <option value="UNPAID">Unpaid</option>
                    </select>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="form-input" placeholder="Start Date" />
                    <div className="flex gap-2">
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="form-input flex-1" placeholder="End Date" />
                        <button type="submit" className="btn-primary whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </form>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-gray-500 text-sm">Loading invoices...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-400 mb-1">No invoices found</h3>
                        <p className="text-gray-500 text-sm">Create your first invoice to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full invoice-table">
                            <thead>
                                <tr>
                                    <th>Invoice No.</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th className="text-right">Amount</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv._id}>
                                        <td className="font-mono font-medium text-primary-300">{inv.invoiceNumber}</td>
                                        <td>
                                            <div>
                                                <p className="font-medium text-gray-200">{inv.buyer.name}</p>
                                                <p className="text-xs text-gray-500">{inv.buyer.gstin || 'No GSTIN'}</p>
                                            </div>
                                        </td>
                                        <td className="text-gray-400">
                                            {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="text-right font-mono font-semibold text-gray-200">
                                            ₹{inv.grandTotal.toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${inv.paymentStatus === 'PAID'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                {inv.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => handleDownload(inv._id, inv.invoiceNumber)}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="Download PDF">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => shareWhatsApp(inv)}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-emerald-400 hover:text-emerald-300 transition-colors"
                                                    title="Share on WhatsApp">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                                    </svg>
                                                </button>
                                                <Link to={`/edit/${inv._id}`}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                                    title="Edit">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button onClick={() => handleDelete(inv._id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                                                    title="Delete">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-white/5">
                        <p className="text-xs text-gray-500">
                            Page {pagination.page} of {pagination.pages}
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchInvoices(pagination.page - 1)}
                                disabled={pagination.page <= 1} className="btn-secondary text-xs">Previous</button>
                            <button onClick={() => fetchInvoices(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages} className="btn-secondary text-xs">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
