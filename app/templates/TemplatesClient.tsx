'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface Template {
    id: number;
    name: string;
    subject: string;
    body: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [templateData, setTemplateData] = useState({ name: '', subject: '', body: '' });

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        setLoading(true);
        const res = await fetch('/api/templates');
        setTemplates(await res.json());
        setLoading(false);
    }

    async function handleSaveTemplate() {
        if (!templateData.name || !templateData.subject || !templateData.body) return alert('All fields required');

        try {
            if (editingTemplate) {
                await fetch(`/api/templates/${editingTemplate.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(templateData)
                });
            } else {
                await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(templateData)
                });
            }
            setEditingTemplate(null);
            setTemplateData({ name: '', subject: '', body: '' });
            loadTemplates();
        } catch (e) {
            alert('Failed to save template');
        }
    }

    async function deleteTemplate(id: number) {
        if (!confirm('Delete this template?')) return;
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        loadTemplates();
    }

    if (loading) return <div className="p-8 text-center text-slate-500 dark:text-zinc-50">Loading templates...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-50">Email Templates</h1>

            <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 dark:border-zinc-800">
                <h2 className="text-lg font-semibold mb-4">{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
                <div className="space-y-4">
                    <input
                        placeholder="Template Name (e.g. Sales Follow-up)"
                        className="w-full p-2 border rounded"
                        value={templateData.name}
                        onChange={e => setTemplateData({ ...templateData, name: e.target.value })}
                    />
                    <input
                        placeholder="Email Subject"
                        className="w-full p-2 border rounded"
                        value={templateData.subject}
                        onChange={e => setTemplateData({ ...templateData, subject: e.target.value })}
                    />
                    <RichTextEditor
                        value={templateData.body}
                        onChange={val => setTemplateData({ ...templateData, body: val })}
                        placeholder="Email Body..."
                    />
                    <div className="flex gap-2">
                        <button onClick={handleSaveTemplate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold flex items-center gap-2">
                            {editingTemplate ? 'Update Template' : <><Plus size={18} /> Create Template</>}
                        </button>
                        {editingTemplate && (
                            <button
                                onClick={() => { setEditingTemplate(null); setTemplateData({ name: '', subject: '', body: '' }) }}
                                className="bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-50 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(t => (
                    <div key={t.id} className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 dark:border-zinc-800 shadow-sm hover:shadow-md transition relative group">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-50">{t.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-50 truncate mb-4">{t.subject}</p>

                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTemplate(t); setTemplateData(t); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded border border-blue-100"><Edit size={16} /></button>
                            <button onClick={() => deleteTemplate(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded border border-red-100"><Trash size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
