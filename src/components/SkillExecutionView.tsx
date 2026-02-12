import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Skill, AIPrompt, ExecutionRun, generateId, SkillPlaybook, SkillArchetype } from '../types/index';
import { Play, Copy, Check, Terminal, Variable, AlertCircle, ExternalLink, Bookmark, FileText, Zap, ListChecks, ArrowLeft, Edit3 } from 'lucide-react';

interface SkillExecutionViewProps {
    skill: Skill;
    prompts?: AIPrompt[];
    onBack?: () => void;
    onEdit?: () => void;
    onRunComplete: (run: ExecutionRun) => void;
}

export const SkillExecutionView: React.FC<SkillExecutionViewProps> = ({ skill, prompts, onBack, onEdit, onRunComplete }) => {
    const [inputs, setInputs] = useState<Record<string, string>>({});

    const [output, setOutput] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [copied, setCopied] = useState(false);

    // Initialize inputs
    useEffect(() => {
        const initialInputs: Record<string, string> = {};
        skill.inputsRequired.forEach(key => {
            initialInputs[key] = '';
        });
        setInputs(initialInputs);
        setOutput(null);
    }, [skill]);

    const handleRun = async () => {
        setIsRunning(true);
        setOutput(null);

        // Simulate execution delay
        await new Promise(resolve => setTimeout(resolve, 800));

        let finalOutput = skill.sourceMarkdown || '';
        if (skill.procedure) {
            finalOutput = skill.procedure;
        }

        // Replace variables
        Object.entries(inputs).forEach(([key, value]) => {
            // Replace [KEY] and [key] case-insensitively
            const regex = new RegExp(`\\[${key}\\]`, 'gi');
            finalOutput = finalOutput.replace(regex, value || `[${key}]`);
        });

        setOutput(finalOutput);
        setIsRunning(false);

        // Auto-copy
        await navigator.clipboard.writeText(finalOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        // Log run
        const run: ExecutionRun = {
            id: generateId(),
            objectType: 'skill',
            objectId: skill.id,
            objectName: skill.name,
            inputs,
            outputs: finalOutput,
            startedAt: Date.now(),
            completedAt: Date.now(),
            status: 'completed'
        };
        onRunComplete(run);
    };

    const handleCopyResource = async () => {
        if (skill.sourceUrl || skill.resourceUrl) {
            await navigator.clipboard.writeText(skill.sourceUrl || skill.resourceUrl || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Derived Label for Resource Playbook
    const getSourceLabel = (archetype: SkillArchetype) => {
        if (archetype.startsWith('GITHUB')) return 'GITHUB';
        if (archetype.startsWith('VERCEL')) return 'VERCEL';
        if (archetype === SkillArchetype.DOCS_RESOURCE) return 'DOCS';
        return 'RESOURCE';
    };

    const playbook = skill.playbook;
    const resourceLabel = getSourceLabel(skill.archetype);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Navigation Header */}
            {(onBack || onEdit) && (
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        )}
                        <span className="text-sm font-semibold text-foreground">{skill.name}</span>
                    </div>
                    {onEdit && (
                        <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-muted text-foreground/70 hover:bg-muted/80 transition-all">
                            <Edit3 size={12} />
                            EDIT SKILL
                        </button>
                    )}
                </div>
            )}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Source / Instructions */}
                <div className="w-1/2 border-r border-border flex flex-col">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-md ${playbook === SkillPlaybook.IMPLEMENTATION_RESOURCE ? 'bg-blue-500/10 text-blue-500' :
                                playbook === SkillPlaybook.RUN_IN_CHAT ? 'bg-purple-500/10 text-purple-500' :
                                    'bg-orange-500/10 text-orange-500'
                                }`}>
                                {playbook === SkillPlaybook.IMPLEMENTATION_RESOURCE && <Bookmark size={14} />}
                                {playbook === SkillPlaybook.RUN_IN_CHAT && <Zap size={14} />}
                                {playbook === SkillPlaybook.RUN_IN_APP && <FileText size={14} />}
                            </span>
                            <h3 className="font-semibold text-sm text-foreground/80">Source Material</h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{skill.sourceMarkdown || '*No content available*'}</ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Action / Runtime */}
                <div className="w-1/2 flex flex-col bg-muted/5">

                    {/* --- IMPLEMENTATION RESOURCE PLAYBOOK --- */}
                    {playbook === SkillPlaybook.IMPLEMENTATION_RESOURCE && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                            <div className="h-24 w-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                <Bookmark size={48} className="text-blue-500" />
                            </div>

                            <div className="space-y-4 max-w-md">
                                <h2 className="text-2xl font-bold">{skill.name}</h2>
                                <p className="text-muted-foreground text-sm">{skill.description}</p>
                            </div>

                            <div className="w-full max-w-xs space-y-4">
                                <a
                                    href={skill.resourceUrl || skill.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 text-lg"
                                >
                                    <ExternalLink size={20} />
                                    OPEN {resourceLabel}
                                </a>

                                <div className="bg-background border border-border rounded-xl p-4 text-left space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <ListChecks size={14} /> Implementation Checklist
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 text-sm text-foreground/80 cursor-pointer">
                                            <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                                            Review Source
                                        </label>
                                        <label className="flex items-center gap-3 text-sm text-foreground/80 cursor-pointer">
                                            <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                                            Integrate
                                        </label>
                                        <label className="flex items-center gap-3 text-sm text-foreground/80 cursor-pointer">
                                            <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                                            Verify
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RUN IN CHAT PLAYBOOK --- */}
                    {playbook === SkillPlaybook.RUN_IN_CHAT && (
                        <div className="flex-1 flex flex-col p-6 space-y-6">
                            <div className="p-4 border-b border-border bg-background flex items-center gap-2">
                                <Zap size={16} className="text-purple-500" />
                                <h3 className="font-semibold text-sm">Chat Prompt</h3>
                            </div>

                            <div className="flex-1 bg-zinc-950 rounded-xl border border-white/10 p-4 overflow-auto relative group">
                                <pre className="text-zinc-300 font-mono text-sm whitespace-pre-wrap">
                                    {skill.sourceMarkdown}
                                </pre>
                            </div>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(skill.sourceMarkdown || '');
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${copied
                                    ? 'bg-green-600 text-white shadow-green-500/20'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-white shadow-xl'
                                    }`}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'COPIED TO CLIPBOARD' : 'COPY TO CLIPBOARD'}
                            </button>
                        </div>
                    )}

                    {/* --- RUN IN APP PLAYBOOK --- */}
                    {playbook === SkillPlaybook.RUN_IN_APP && (
                        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
                            <div className="p-4 border-b border-border bg-background flex items-center gap-2">
                                <Terminal size={16} className="text-primary" />
                                <h3 className="font-semibold text-sm">Execution Console</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6">
                                {/* Inputs Section */}
                                {skill.inputsRequired.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <Variable size={12} />
                                            Required Inputs
                                        </div>
                                        <div className="grid gap-4">
                                            {skill.inputsRequired.map(key => (
                                                <div key={key} className="space-y-1.5">
                                                    <label className="text-xs font-medium text-foreground/70 font-mono text-[10px] bg-muted/50 px-1.5 py-0.5 rounded w-fit block">
                                                        {key}
                                                    </label>
                                                    <textarea
                                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none min-h-[80px] resize-y"
                                                        placeholder={`Enter value for ${key}...`}
                                                        value={inputs[key] || ''}
                                                        onChange={(e) => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-muted/40 rounded-xl border border-dashed border-border text-center">
                                        <p className="text-sm text-muted-foreground">No inputs required for this skill.</p>
                                    </div>
                                )}

                                {/* Output Console */}
                                {output && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</span>
                                            {copied && (
                                                <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                                                    <Check size={12} /> Copied!
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                            <pre className="relative w-full bg-zinc-950 text-zinc-100 rounded-xl p-4 text-sm font-mono overflow-auto max-h-[300px] border border-white/10 shadow-2xl">
                                                {output}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Run Button is footer */}
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 mt-auto ${isRunning
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary to-primary/80 hover:to-primary text-primary-foreground hover:shadow-primary/25'
                                    }`}
                            >
                                {isRunning ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Play size={16} fill="currentColor" />
                                        GENERATE
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
