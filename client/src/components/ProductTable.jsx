import { useState } from 'react';
import toast from 'react-hot-toast';
import { invoiceApi } from '../api/invoiceApi';

const UNITS = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'NOS', 'PAIR', 'BAG'];
const TAX_RATES = [0, 5, 12, 18, 28];

const emptyProduct = { name: '', description: '', hsnCode: '', quantity: 1, unit: 'PCS', rate: 0, taxPercent: 18 };

export default function ProductTable({ products, setProducts }) {
    const addRow = () => setProducts([...products, { ...emptyProduct }]);

    const removeRow = (i) => {
        if (products.length <= 1) return toast.error('At least one product is required');
        setProducts(products.filter((_, idx) => idx !== i));
    };

    const update = (i, field, value) => {
        const updated = [...products];
        updated[i] = { ...updated[i], [field]: value };
        setProducts(updated);
    };

    return (
        <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Products
                </h3>
                <button type="button" onClick={addRow} className="btn-secondary text-xs flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full invoice-table">
                    <thead>
                        <tr>
                            <th className="w-8">#</th>
                            <th className="min-w-[220px]">Product Name</th>
                            <th className="w-28 text-center">HSN Code</th>
                            <th className="w-24 text-center">Qty</th>
                            <th className="w-28 text-center">Unit</th>
                            <th className="w-32 text-center">Rate (₹)</th>
                            <th className="w-24 text-center">Tax %</th>
                            <th className="w-32 text-right">Amount</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => {
                            const amount = ((parseFloat(p.quantity) || 0) * (parseFloat(p.rate) || 0)).toFixed(2);
                            return (
                                <tr key={i} className="group">
                                    <td className="text-center text-gray-500">{i + 1}</td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            <input
                                                type="text"
                                                value={p.name}
                                                onChange={(e) => update(i, 'name', e.target.value)}
                                                placeholder="Product name"
                                                className="form-input !py-2 !text-sm"
                                                required
                                            />
                                            <input
                                                type="text"
                                                value={p.description || ''}
                                                onChange={(e) => update(i, 'description', e.target.value)}
                                                placeholder="Description (e.g. 500 KG (10 bags))"
                                                className="form-input !py-1.5 !text-xs bg-transparent border-dashed text-gray-400 placeholder:text-gray-600 focus:bg-[#1a1642] transition-colors"
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={p.hsnCode}
                                            onChange={(e) => update(i, 'hsnCode', e.target.value)}
                                            placeholder="HSN"
                                            className="form-input !py-2 !text-sm text-center"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={p.quantity}
                                            onChange={(e) => update(i, 'quantity', e.target.value)}
                                            className="form-input !py-2 !text-sm text-center"
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={p.unit}
                                            onChange={(e) => update(i, 'unit', e.target.value)}
                                            className="form-input !py-2 !text-sm cursor-pointer"
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={p.rate}
                                            onChange={(e) => update(i, 'rate', e.target.value)}
                                            className="form-input !py-2 !text-sm text-right"
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={p.taxPercent}
                                            onChange={(e) => update(i, 'taxPercent', e.target.value)}
                                            className="form-input !py-2 !text-sm cursor-pointer"
                                        >
                                            {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                                        </select>
                                    </td>
                                    <td className="text-right font-mono text-primary-300 text-sm font-semibold">₹{amount}</td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => removeRow(i)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1 rounded-lg hover:bg-red-500/10"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
