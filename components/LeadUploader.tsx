'use client';
import { useState } from 'react';
import { Upload, Loader2, FileText, CheckCircle, XCircle, Download } from 'lucide-react';

export default function LeadUploader() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{ valid: number, invalid: number, skipped: number } | null>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;

        setLoading(true);
        setStats(null);

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/leads/verify', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.summary) {
                setStats(data.summary);
            } else {
                alert(data.error || 'Upload failed');
            }

            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    }

    async function downloadInvalid() {
        window.location.href = '/api/leads/invalid-export';
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Upload size={20} className="text-emerald-600" /> Upload & Verify CSV
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Columns: name, email, website, company, lead_type (client/agency)
                    </p>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
                        <p className="text-2xl font-bold text-green-700">{stats.valid}</p>
                        <p className="text-xs text-green-600">Valid</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                        <XCircle className="mx-auto mb-2 text-red-600" size={24} />
                        <p className="text-2xl font-bold text-red-700">{stats.invalid}</p>
                        <p className="text-xs text-red-600">Invalid</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <FileText className="mx-auto mb-2 text-gray-600" size={24} />
                        <p className="text-2xl font-bold text-gray-700">{stats.skipped}</p>
                        <p className="text-xs text-gray-600">Skipped</p>
                    </div>
                </div>
            )}

            {stats && stats.invalid > 0 && (
                <button onClick={downloadInvalid} className="mb-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2">
                    <Download size={14} /> Download Invalid Emails
                </button>
            )}

            <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg 
         transition-colors flex items-center justify-center gap-2 shadow-sm ${loading ? 'opacity-70 pointer-events-none' : ''} w-full`}>
                {loading ? <><Loader2 className="animate-spin" size={18} /> Verifying...</> : <><FileText size={18} /> Select CSV File</>}
                <input type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={loading} />
            </label>

            <p className="text-xs text-gray-400 mt-3">
                ✓ Regex validation • ✓ MX record check • ✓ Disposable email filter
            </p>
        </div>
    );
}
