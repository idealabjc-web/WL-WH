import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Trash2, ShieldCheck, AlertCircle, RefreshCw, FileQuestion } from 'lucide-react';
import { fetchAllAbstractFiles, deleteAbstractFile, getAbstractsMap } from '../api/speakersApi';

export default function AbstractAnalysisPage({ speakers, toast }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const loadFiles = async () => {
        setLoading(true);
        const data = await fetchAllAbstractFiles();
        setFiles(data);
        setLoading(false);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    // Extract all actively referenced URLs from the speakers database
    const activeUrls = useMemo(() => {
        const urls = new Set();
        speakers.forEach(s => {
            const map = getAbstractsMap(s.abstractUrl);
            Object.values(map).forEach(url => {
                if (url && typeof url === 'string') {
                    urls.add(url);
                }
            });
        });
        return urls;
    }, [speakers]);

    // Analyze files
    const analyzedFiles = useMemo(() => {
        return files.map(file => {
            // Check if any active URL ends with this file's name
            const isActive = Array.from(activeUrls).some(url => {
                try {
                    const urlObj = new URL(url);
                    const pathParts = urlObj.pathname.split('/');
                    const filenameFromUrl = pathParts[pathParts.length - 1];
                    return filenameFromUrl === file.name || decodeURIComponent(filenameFromUrl) === file.name;
                } catch {
                    return url.endsWith(file.name);
                }
            });
            return { ...file, isActive };
        });
    }, [files, activeUrls]);

    const activeCount = analyzedFiles.filter(f => f.isActive).length;
    const orphanCount = analyzedFiles.filter(f => !f.isActive).length;

    const handleDelete = async (fileName) => {
        if (!window.confirm(`Are you sure you want to delete ${fileName}? This action cannot be undone.`)) return;
        
        setDeletingId(fileName);
        const success = await deleteAbstractFile(fileName);
        if (success) {
            toast(`Deleted ${fileName} successfully.`);
            setFiles(prev => prev.filter(f => f.name !== fileName));
        } else {
            toast(`Failed to delete ${fileName}.`);
        }
        setDeletingId(null);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-4 sm:p-6 sm:max-w-[1200px] mx-auto animate-in fade-in duration-300 pb-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText size={28} className="text-indigo-500" />
                        Storage Abstract Analysis
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Audit physical files in the Supabase Storage Bucket</p>
                </div>
                <button 
                    onClick={loadFiles}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh Files
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-500 mb-1">Total Files in Bucket</div>
                        <div className="text-2xl font-bold text-slate-800">{files.length}</div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-emerald-700 mb-1">Active Files (Linked)</div>
                        <div className="text-2xl font-bold text-emerald-800">{activeCount}</div>
                    </div>
                </div>
                <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/50 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-rose-100 text-rose-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-rose-700 mb-1">Orphaned Files (Unlinked)</div>
                        <div className="text-2xl font-bold text-rose-800">{orphanCount}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-8">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileQuestion size={18} className="text-slate-500" />
                        Storage Audit List
                    </h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading files from storage...</div>
                ) : files.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">No abstract files found in the bucket.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                    <th className="p-4 whitespace-nowrap">File Name</th>
                                    <th className="p-4 whitespace-nowrap">Size</th>
                                    <th className="p-4 whitespace-nowrap">Status</th>
                                    <th className="p-4 whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {analyzedFiles.map(file => (
                                    <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800">{file.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {new Date(file.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500">{formatBytes(file.metadata?.size || 0)}</td>
                                        <td className="p-4">
                                            {file.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <ShieldCheck size={14} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                                                    <AlertCircle size={14} /> Orphaned
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!file.isActive && (
                                                <button
                                                    onClick={() => handleDelete(file.name)}
                                                    disabled={deletingId === file.name}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                    {deletingId === file.name ? 'Deleting...' : 'Delete'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
