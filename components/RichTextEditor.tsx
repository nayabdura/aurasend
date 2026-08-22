'use client';
import dynamic from 'next/dynamic';
import React, { useMemo, useRef, useState, useEffect } from 'react';

// Jodit is an excellent WYSIWYG editor that uses inline styles and semantic HTML,
// which is exactly what we want for email templates with strong copy-paste support.
const JoditEditor = dynamic(() => import('jodit-react'), {
    ssr: false,
    loading: () => <div className="p-8 text-slate-400 text-center border rounded-xl animate-pulse">Loading Email Editor...</div>
});

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: string;
    minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, height = '450px', minHeight = 400 }: RichTextEditorProps) {
    const editorRef = useRef<any>(null);

    // We build the config via useMemo to avoid re-initializing Jodit on re-renders
    const config = useMemo(() => ({
        readonly: false,
        placeholder: placeholder || 'Type your email here (or paste from Gmail)...',
        height: height,
        minHeight: minHeight,
        toolbarSticky: false,
        // Crucial for email formatting: Prevents the editor from stripping complex styles/tables.
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: 'insert_as_html',
        // Crucial for email spacing: Use 'div' or 'br' instead of massive 'p' margins
        enter: 'div',
        useSplitMode: true,
        // Full toolbar for Gmail parity:
        buttons: [
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', '|',
            'align', 'ul', 'ol', 'outdent', 'indent', '|',
            'undo', 'redo', '|',
            'hr', 'eraser', 'copyformat', '|',
            'table', 'link', 'image', 'video', '|',
            'symbol', 'fullsize', 'source'
        ],
        uploader: {
            // Send files securely through our own Next.js /api backend
            insertImageAsBase64URI: false,
            url: '/api/admin/upload',
            format: 'json',
            method: 'POST',
            filesVariableName: 'image',
            isSuccess: function (resp: any) {
                return !resp.error;
            },
            process: function (resp: any) {
                return {
                    files: resp.url ? [resp.url] : [],
                    path: resp.url,
                    baseurl: resp.url,
                    error: resp.error ? 1 : 0,
                    msg: resp.error || ''
                };
            },
            defaultHandlerSuccess: function (data: any, resp: any) {
                const url = resp.url || (data.files && data.files[0]);
                if (url) {
                    // @ts-expect-error Jodit types are incomplete
                    this.s.insertImage(url, null, 400); // insert at width=400 by default
                }
            },
            defaultHandlerError: function (err: any) {
                console.error('Jodit image upload error:', err);
                alert('Image upload failed.');
            }
        },
        style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#222',
            background: '#fff'
        }
    }) as any, [placeholder, height, minHeight]);

    return (
        <div className="bg-white dark:bg-zinc-900/60 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden text-slate-800 dark:text-zinc-200">
            <JoditEditor
                ref={editorRef}
                value={value}
                config={config}
                // Update parent state asynchronously to prevent cursor jumping!
                onChange={(newContent) => {
                    onChange(newContent);
                }}
            />
        </div>
    );
}
