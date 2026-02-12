import React, { useState, useRef } from 'react';
import { X, Download, Upload, Trash2, ShieldAlert, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { validateBackup, mergeBackupData, BackupData, RestoreReport } from '../utils/backup';

interface SystemSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportBackup: () => void;
    onImportBackup: (data: BackupData, mode: 'replace' | 'merge') => void;
    onClearAllData: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
    isOpen,
    onClose,
    onExportBackup,
    onImportBackup,
    onClearAllData,
}) => {
    const [activeTab, setActiveTab] = useState<'data' | 'about'>('data');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
    const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportError(null);
        setImportSuccess(null);
        setPendingImport(null);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const content = ev.target?.result as string;
                const data = validateBackup(content);
                setPendingImport(data);
                setImportSuccess(`Valid backup found! Contains ${data.prompts.length} prompts, ${data.skills.length} skills, ${data.snapshots.length} versions.`);
            } catch (err: any) {
                setImportError(err.message || 'Failed to parse backup file');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const confirmImport = () => {
        if (pendingImport) {
            const warning = importMode === 'replace'
                ? 'WARNING: This will overwrite your entire library with the backup contents. Are you sure?'
                : 'This will merge the backup into your library. Matching IDs will be updated, new items will be added. Continue?';
            if (confirm(warning)) {
                onImportBackup(pendingImport, importMode);
                setPendingImport(null);
                setImportSuccess(null);
                onClose();
            }
        }
    };

    const handleClear = () => {
        if (confirm('DANGER: This will permanently delete ALL data. This cannot be undone. Are you sure?')) {
            onClearAllData();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-popover border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">System Settings</h2>
                            <p className="text-xs text-muted-foreground">Manage your data and application preferences.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border px-6">
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'data'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-foreground/60 hover:text-foreground'
                            }`}
                    >
                        Data Management
                    </button>
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'about'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-foreground/60 hover:text-foreground'
                            }`}
                    >
                        About
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[300px]">
                    {activeTab === 'data' && (
                        <div className="space-y-8">

                            {/* Backup & Restore Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/60">Backup & Restore</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Export */}
                                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
                                        <div className="flex items-center gap-3 text-foreground">
                                            <Download className="text-primary" size={20} />
                                            <span className="font-semibold">Export Backup</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Download a secure JSON file containing all your prompts, skills, and history.
                                        </p>
                                        <button
                                            onClick={onExportBackup}
                                            className="w-full py-2 bg-background border border-border hover:bg-accent hover:text-accent-foreground rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Download .json
                                        </button>
                                    </div>

                                    {/* Import */}
                                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
                                        <div className="flex items-center gap-3 text-foreground">
                                            <Upload className="text-secondary-foreground" size={20} />
                                            <span className="font-semibold">Import Backup</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Restore your library from a backup file.
                                        </p>
                                        {/* Import mode toggle */}
                                        <div className="flex rounded-lg border border-border overflow-hidden">
                                            <button
                                                onClick={() => setImportMode('merge')}
                                                className={`flex-1 py-1.5 text-xs font-bold transition-colors ${importMode === 'merge' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground/60 hover:text-foreground'}`}
                                            >
                                                Merge
                                            </button>
                                            <button
                                                onClick={() => setImportMode('replace')}
                                                className={`flex-1 py-1.5 text-xs font-bold transition-colors ${importMode === 'replace' ? 'bg-destructive text-destructive-foreground' : 'bg-background text-foreground/60 hover:text-foreground'}`}
                                            >
                                                Replace All
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-snug">
                                            {importMode === 'merge'
                                                ? 'Adds new items and updates existing ones by ID. Keeps local items not in the backup.'
                                                : 'Overwrites your entire library with the backup contents.'}
                                        </p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept=".json"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-2 bg-background border border-border hover:bg-accent hover:text-accent-foreground rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Select File...
                                        </button>
                                    </div>
                                </div>

                                {/* Import Status Feedback */}
                                {importError && (
                                    <div className="flex items-center gap-3 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                                        <ShieldAlert size={18} />
                                        <span className="text-sm font-medium">{importError}</span>
                                    </div>
                                )}

                                {importSuccess && (
                                    <div className="space-y-3 p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg border border-green-500/20 animate-in fade-in slide-in-from-top-1">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle size={18} />
                                            <span className="text-sm font-medium">{importSuccess}</span>
                                        </div>
                                        {pendingImport && (
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    onClick={confirmImport}
                                                    className={`px-4 py-2 text-white rounded-md text-xs font-bold transition-colors shadow-sm ${importMode === 'merge' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                                                >
                                                    {importMode === 'merge' ? 'CONFIRM MERGE' : 'CONFIRM REPLACE'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-6 border-t border-border space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-destructive">Danger Zone</h3>
                                <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                                    <div className="space-y-1">
                                        <span className="text-sm font-semibold text-foreground">Clear All Data</span>
                                        <p className="text-xs text-muted-foreground">Permanently delete everything and reset factory defaults.</p>
                                    </div>
                                    <button
                                        onClick={handleClear}
                                        className="px-4 py-2 bg-background border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg text-xs font-bold transition-all shadow-sm"
                                    >
                                        CLEAR DATA
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="flex flex-col items-center justify-center h-full py-10 space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <ShieldAlert size={32} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-foreground">Prompt Vault v1.0</h3>
                                <p className="text-sm text-foreground/60 max-w-xs mx-auto mt-2">
                                    Local-first AI asset management. <br />
                                    Secure, private, and organized.
                                </p>
                            </div>
                            <div className="pt-6 text-xs text-muted-foreground text-center">
                                <p>Designed by Antigravity</p>
                                <p>Built with React + Tailwind</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
