import React, { useState, useCallback } from 'react';
import { AIPrompt, Skill, DEFAULT_CATEGORIES, detectVariables, generateId, scanSkillInputs, parseTextToSkillFields } from '../types';
import { Wand2, X, Eye, Sparkles, Tag, ChevronDown, Zap, FileText } from 'lucide-react';

type ImportMode = 'prompt' | 'skill';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (prompt: AIPrompt) => void;
  onImportSkill?: (prefill: Partial<Skill>) => void;
  availableFolders: string[];
  defaultMode?: ImportMode;
}

interface ParsedPrompt {
  title: string;
  body: string;
  variables: string[];
  description: string;
}

interface ParsedSkill {
  name: string;
  expertPersona: string;
  rulesGuardrails: string;
  outputFormat: string;
  procedure: string;
  inputsRequired: string[];
}

function smartParse(raw: string): ParsedPrompt {
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { title: '', body: '', variables: [], description: '' };

  let title = '';
  let bodyStartIndex = 0;

  const titlePatterns = [
    /^(?:prompt|name|title)\s*[:：]\s*(.+)/i,
    /^#+\s+(.+)/,
  ];

  for (const pattern of titlePatterns) {
    const match = lines[0].match(pattern);
    if (match) {
      title = match[1].trim();
      bodyStartIndex = 1;
      break;
    }
  }

  if (!title) {
    title = lines[0].replace(/^[-*•]\s*/, '').trim();
    bodyStartIndex = 1;
  }

  const body = lines.length > 1 
    ? lines.slice(bodyStartIndex).join('\n').trim() 
    : lines[0].trim();

  const variables = detectVariables(raw);

  const description = body.length > 120 
    ? body.substring(0, 120).replace(/\s+\S*$/, '') + '…' 
    : body;

  return {
    title: title.length > 80 ? title.substring(0, 80) : title,
    body,
    variables,
    description,
  };
}

function smartParseSkill(raw: string): ParsedSkill {
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
  let name = '';
  
  // Try extract a name from first line
  const nameMatch = lines[0]?.match(/^(?:skill|name|title)\s*[:：]\s*(.+)/i) || lines[0]?.match(/^#+\s+(.+)/);
  if (nameMatch) {
    name = nameMatch[1].trim();
  } else {
    name = lines[0]?.replace(/^[-*•]\s*/, '').trim().substring(0, 60) || '';
  }

  const fields = parseTextToSkillFields(raw);
  const scanned = scanSkillInputs(fields.procedure);
  
  return {
    name,
    expertPersona: fields.expertPersona,
    rulesGuardrails: fields.rulesGuardrails,
    outputFormat: fields.outputFormat,
    procedure: fields.procedure,
    inputsRequired: scanned,
  };
}

type Step = 'paste' | 'preview';

export const SmartImportModal: React.FC<SmartImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onImportSkill,
  availableFolders,
  defaultMode = 'prompt',
}) => {
  const [step, setStep] = useState<Step>('paste');
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedPrompt | null>(null);
  const [parsedSkill, setParsedSkill] = useState<ParsedSkill | null>(null);
  
  // Prompt fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Creative');
  const [folder, setFolder] = useState('General');
  const [tags, setTags] = useState('');

  // Skill fields
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('Creative');
  const [skillFolder, setSkillFolder] = useState('General');

  const reset = useCallback(() => {
    setStep('paste');
    setRawText('');
    setParsed(null);
    setParsedSkill(null);
    setTitle('');
    setDescription('');
    setCategory('Creative');
    setFolder('General');
    setTags('');
    setSkillName('');
    setSkillCategory('Creative');
    setSkillFolder('General');
  }, []);

  // Sync default mode when prop changes
  React.useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    
    if (mode === 'prompt') {
      const result = smartParse(rawText);
      setParsed(result);
      setTitle(result.title);
      setDescription(result.description);
      setTags(result.variables.join(', '));
      setStep('preview');
    } else {
      const result = smartParseSkill(rawText);
      setParsedSkill(result);
      setSkillName(result.name);
      setStep('preview');
    }
  };

  const handleImportPrompt = () => {
    if (!parsed) return;
    
    const newPrompt: AIPrompt = {
      id: generateId(),
      title: title || 'Imported Prompt',
      content: parsed.body,
      description,
      notes: '',
      category,
      folder,
      type: 'user',
      version: 1,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      usageCount: 0,
      isPinned: false,
      variables: parsed.variables,
    };

    onImport(newPrompt);
    handleClose();
  };

  const handleImportAsSkill = () => {
    if (!parsedSkill || !onImportSkill) return;
    
    const prefill: Partial<Skill> = {
      name: skillName || 'Imported Skill',
      description: '',
      category: skillCategory,
      folder: skillFolder,
      tags: [],
      inputsRequired: parsedSkill.inputsRequired,
      outputFormat: parsedSkill.outputFormat,
      expertPersona: parsedSkill.expertPersona,
      rulesGuardrails: parsedSkill.rulesGuardrails,
      procedure: parsedSkill.procedure,
      status: 'draft',
      embeddedPromptIds: [],
      toolsUsed: [],
    };

    onImportSkill(prefill);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent/15 rounded-lg flex items-center justify-center">
              <Wand2 size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {step === 'paste' ? 'Magic Import' : 'Confirm Import'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 'paste' 
                  ? 'Paste any text — we\'ll organize it automatically.' 
                  : 'Review and edit the extracted details before saving.'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Paste */}
        {step === 'paste' && (
          <div className="p-6 space-y-4">
            {/* Mode Switch */}
            <div className="flex items-center gap-2 p-1 bg-muted rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setMode('prompt')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === 'prompt' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText size={14} />
                Import as Prompt
              </button>
              <button
                type="button"
                onClick={() => setMode('skill')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === 'skill' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap size={14} />
                Import as Skill
              </button>
            </div>

            <div className="relative">
              <textarea
                autoFocus
                placeholder={mode === 'prompt' 
                  ? "Paste a prompt from the web here...\n\nExample:\nPrompt: Expert Marketing Strategist\n\nAct as a {{role}} specializing in {{industry}}..."
                  : "Paste a full skill/prompt template here...\n\nExample:\nRole: Expert Marketing Strategist\n\nRules:\n- Do not use jargon\n- Always cite sources\n\nAnalyze [TOPIC] for [AUDIENCE]...\n\nOutput Format:\nMarkdown report with sections..."
                }
                className="w-full h-56 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-accent/50 outline-none resize-none font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              {rawText.trim() && (
                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-1 text-[10px] font-bold bg-accent/15 text-accent rounded-md">
                    {rawText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleClose} className="px-5 py-2.5 bg-muted hover:bg-muted/80 rounded-xl text-sm font-bold text-muted-foreground transition-colors">
                CANCEL
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles size={16} />
                ANALYZE & PREVIEW
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview - Prompt Mode */}
        {step === 'preview' && mode === 'prompt' && parsed && (
          <div className="p-6 space-y-5">
            {parsed.variables.length > 0 && (
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={14} className="text-accent" />
                  <span className="text-xs font-bold text-accent uppercase tracking-wide">
                    {parsed.variables.length} Variable{parsed.variables.length !== 1 ? 's' : ''} Detected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsed.variables.map(v => (
                    <span key={v} className="px-3 py-1.5 bg-accent/15 text-accent text-xs font-mono font-bold rounded-lg border border-accent/20">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Title</label>
                <input className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-accent/50 outline-none text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Category</label>
                <div className="relative">
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-accent/50 outline-none appearance-none cursor-pointer text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {DEFAULT_CATEGORIES.filter(c => c !== 'All').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Description</label>
              <input className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-accent/50 outline-none text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Folder</label>
                <div className="relative">
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-accent/50 outline-none appearance-none cursor-pointer text-sm" value={folder} onChange={(e) => setFolder(e.target.value)}>
                    {availableFolders.map(f => (<option key={f} value={f}>{f}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Tags</label>
                <input className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-accent/50 outline-none text-sm" placeholder="comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Eye size={14} /> Prompt Body Preview
              </label>
              <div className="bg-background border border-border rounded-xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
                <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">{parsed.body}</pre>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex gap-3">
              <button onClick={() => setStep('paste')} className="px-5 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm text-muted-foreground transition-colors">← BACK</button>
              <button onClick={handleImportPrompt} className="flex-1 py-3 px-4 bg-accent hover:bg-accent/90 rounded-xl font-bold text-sm text-accent-foreground transition-all active:scale-95">SAVE TO VAULT</button>
            </div>
          </div>
        )}

        {/* Step 2: Preview - Skill Mode */}
        {step === 'preview' && mode === 'skill' && parsedSkill && (
          <div className="p-6 space-y-5">
            {/* Detected Inputs */}
            {parsedSkill.inputsRequired.length > 0 && (
              <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-secondary" />
                  <span className="text-xs font-bold text-secondary uppercase tracking-wide">
                    {parsedSkill.inputsRequired.length} Input{parsedSkill.inputsRequired.length !== 1 ? 's' : ''} Detected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedSkill.inputsRequired.map(v => (
                    <span key={v} className="px-3 py-1.5 bg-secondary/15 text-secondary text-xs font-mono font-bold rounded-lg border border-secondary/20">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Skill Name</label>
                <input className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-secondary/50 outline-none text-sm" value={skillName} onChange={(e) => setSkillName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Category</label>
                <div className="relative">
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-secondary/50 outline-none appearance-none cursor-pointer text-sm" value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)}>
                    {DEFAULT_CATEGORIES.filter(c => c !== 'All').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Folder</label>
              <div className="relative">
                <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-secondary/50 outline-none appearance-none cursor-pointer text-sm" value={skillFolder} onChange={(e) => setSkillFolder(e.target.value)}>
                  {availableFolders.map(f => (<option key={f} value={f}>{f}</option>))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
              </div>
            </div>

            {/* Parsed Sections Preview */}
            <div className="space-y-3">
              {parsedSkill.expertPersona && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Expert Persona</label>
                  <div className="bg-background border border-border rounded-xl p-3 max-h-24 overflow-y-auto">
                    <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{parsedSkill.expertPersona}</pre>
                  </div>
                </div>
              )}
              {parsedSkill.rulesGuardrails && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Rules / Guardrails</label>
                  <div className="bg-background border border-border rounded-xl p-3 max-h-24 overflow-y-auto">
                    <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{parsedSkill.rulesGuardrails}</pre>
                  </div>
                </div>
              )}
              {parsedSkill.procedure && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Procedure</label>
                  <div className="bg-background border border-border rounded-xl p-3 max-h-32 overflow-y-auto">
                    <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{parsedSkill.procedure}</pre>
                  </div>
                </div>
              )}
              {parsedSkill.outputFormat && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wide">Output Format</label>
                  <div className="bg-background border border-border rounded-xl p-3 max-h-20 overflow-y-auto">
                    <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{parsedSkill.outputFormat}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex gap-3">
              <button onClick={() => setStep('paste')} className="px-5 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm text-muted-foreground transition-colors">← BACK</button>
              <button 
                onClick={handleImportAsSkill} 
                disabled={!onImportSkill}
                className="flex-1 py-3 px-4 bg-secondary hover:bg-secondary/90 rounded-xl font-bold text-sm text-secondary-foreground transition-all active:scale-95 disabled:opacity-50"
              >
                OPEN IN SKILL EDITOR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
