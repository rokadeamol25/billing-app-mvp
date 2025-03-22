import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

const PaymentForm = ({ invoice, onPaymentRecorded, amountPaid = 0 }) => {
    const [formData, setFormData] = useState({
        amount: '',
        payment_method: 'Cash',
        notes: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validate amount doesn't exceed remaining balance
            const remainingBalance = invoice.total_amount - amountPaid;
            if (parseFloat(formData.amount) > remainingBalance) {
                throw new Error(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`);
            }

            const response = await fetch(`http://localhost:5001/api/invoices/${invoice.id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to record payment');
            }
            
            if (data.success) {
                setFormData({
                    amount: '',
                    payment_method: 'Cash',
                    notes: '',
                    payment_date: new Date().toISOString().split('T')[0]
                });
                onPaymentRecorded();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Payment submission error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Amount
                    </label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        required
                        step="0.01"
                        min="0"
                        max={invoice.total_amount - amountPaid}
                        placeholder={`Max: ${formatCurrency(invoice.total_amount - amountPaid)}`}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Remaining balance: {formatCurrency(invoice.total_amount - amountPaid)}
                    </p>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Payment Method
                    </label>
                    <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        required
                    >
                        <option value="Cash">Cash</option>
                        <option value="Credit">Credit Card</option>
                        <option value="Debit">Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Payment Date
                    </label>
                    <input
                        type="date"
                        name="payment_date"
                        value={formData.payment_date}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Notes
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        rows="3"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                >
                    {loading ? 'Recording Payment...' : 'Record Payment'}
                </button>
            </form>
        </div>
    );
};

export default PaymentForm;