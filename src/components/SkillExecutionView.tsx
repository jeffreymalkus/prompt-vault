import React, { useState, useEffect } from 'react';
import { Skill, AIPrompt, ExecutionRun, generateId, PLACEHOLDER_REGEX, canonicalKey } from '../types/index';
import { ArrowLeft, Play, Zap, Edit3, Layers, Settings, Copy, Check, Terminal, FileText, ChevronRight } from 'lucide-react';

interface SkillExecutionViewProps {
    skill: Skill;
    prompts: AIPrompt[];
    onBack: () => void;
    onEdit: () => void;
    onRunComplete: (run: ExecutionRun) => void;
}

export const SkillExecutionView: React.FC<SkillExecutionViewProps> = ({
    skill,
    prompts,
    onBack,
    onEdit,
    onRunComplete
}) => {
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'source' | 'preview'>('source');

    // Identify embedded prompts
    const embeddedPrompts = skill.embeddedPromptIds
        .map(id => prompts.find(p => p.id === id))
        .filter(Boolean) as AIPrompt[];

    // Helpers
    const handleInputChange = (key: string, value: string) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const substituteVariables = (content: string): string => {
        return content.replace(PLACEHOLDER_REGEX, (full, rawKey) => {
            const key = canonicalKey(rawKey);
            return inputs[key.toUpperCase()] ?? full;
        });
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput(null);

        // Simulate execution assembly
        const assembledOutput: string[] = [];

        assembledOutput.push(`=== SKILL: ${skill.name} ===\n`);
        assembledOutput.push(`Inputs provided:`);
        Object.entries(inputs).forEach(([key, value]) => {
            assembledOutput.push(`  ${key}: ${value}`);
        });
        assembledOutput.push('\n---\n');

        // Add source content (either Markdown or Composed prompts)
        if (skill.sourceType === 'collected' && skill.sourceMarkdown) {
            assembledOutput.push(substituteVariables(skill.sourceMarkdown));
        } else {
            embeddedPrompts.forEach((prompt, index) => {
                const substituted = substituteVariables(prompt.content);
                assembledOutput.push(`[Step ${index + 1}] ${prompt.title} (${prompt.type})`);
                assembledOutput.push(substituted);
                assembledOutput.push('\n---\n');
            });
        }

        assembledOutput.push(`\nOutput Format: ${skill.outputFormat || 'Not specified'}`);

        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 600));

        const finalOutput = assembledOutput.join('\n');
        setOutput(finalOutput);
        setIsRunning(false);

        // Copy to clipboard automatically on run? Or let user decide?
        // User request: "Smart Actions: Add a 'Run' button... copies the result to the clipboard"
        // So we should copy automatically or at least make it very easy.
        // Let's copy automatically for "Smart Action" feel.
        navigator.clipboard.writeText(finalOutput).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => console.error('Failed to copy', err));

        // Log the run
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

    const handleCopy = () => {
        if (output) {
            navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* 1. Header Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all group"
                        title="Back to Grid"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="h-6 w-px bg-border mx-1" />

                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${skill.sourceType === 'collected' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-secondary/10 text-secondary'}`}>
                            <Zap size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground leading-none mb-1">{skill.name}</h1>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1">
                                    <Layers size={10} />
                                    {skill.sourceType === 'collected' ? 'Collected Skill' : `${embeddedPrompts.length} Steps`}
                                </span>
                                <span>•</span>
                                <span>{skill.folder}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold transition-all"
                    >
                        <Edit3 size={14} />
                        EDIT SKILL
                    </button>
                </div>
            </div>

            {/* 2. Main Workspace (Split View) */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

                    {/* LEFT PANEL: Source / Instructions */}
                    <div className="flex flex-col h-full overflow-hidden bg-muted/10">
                        <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card/30">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <FileText size={14} /> Source Material
                            </span>
                            {/* Optional View Toggles could go here */}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {skill.sourceType === 'collected' && skill.sourceMarkdown ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80">
                                    <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/50 p-4 rounded-lg border border-border">
                                        {skill.sourceMarkdown}
                                    </pre>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-muted-foreground italic">
                                        This skill mimics the following prompts in sequence:
                                    </p>
                                    <div className="space-y-4">
                                        {embeddedPrompts.map((p, i) => (
                                            <div key={p.id} className="p-4 bg-card border border-border rounded-xl shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                                        {i + 1}
                                                    </span>
                                                    <h4 className="font-semibold text-sm">{p.title}</h4>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-3 pl-7">
                                                    {p.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Runtime / Inputs */}
                    <div className="flex flex-col h-full overflow-hidden bg-background">
                        <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card/30">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Terminal size={14} /> Runtime Configuration
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Input Form */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-foreground">Required Inputs</h3>
                                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md border border-border">
                                        {skill.inputsRequired.length} variables detected
                                    </span>
                                </div>

                                {skill.inputsRequired.length > 0 ? (
                                    <div className="grid gap-4">
                                        {skill.inputsRequired.map(key => (
                                            <div key={key} className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide pl-1">
                                                    {key}
                                                </label>
                                                <textarea
                                                    value={inputs[key.toUpperCase()] || ''}
                                                    onChange={(e) => handleInputChange(key.toUpperCase(), e.target.value)}
                                                    className="w-full bg-muted/30 border border-border focus:border-primary/50 rounded-xl px-4 py-3 text-sm min-h-[80px] focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y"
                                                    placeholder={`Enter value for [${key}]...`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground text-sm">
                                        No variables detected. This skill can be run directly.
                                    </div>
                                )}
                            </div>

                            {/* Action Area */}
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className="w-full py-4 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:grayscale flex items-center justify-center gap-3"
                            >
                                {isRunning ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Running Skill...
                                    </>
                                ) : (
                                    <>
                                        <Play size={20} fill="currentColor" />
                                        RUN SKILL & COPY
                                    </>
                                )}
                            </button>

                            {/* Console Output */}
                            {output && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-foreground/80">Output Console</h3>
                                        <div className="flex items-center gap-2">
                                            {copied && <span className="text-xs font-bold text-green-500 animate-in fade-in">Copied to clipboard!</span>}
                                            <button
                                                onClick={handleCopy}
                                                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                title="Copy again"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <pre className="w-full h-48 p-4 bg-muted/50 border border-border rounded-xl text-xs font-mono overflow-y-auto whitespace-pre-wrap text-foreground/90">
                                            {output}
                                        </pre>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
