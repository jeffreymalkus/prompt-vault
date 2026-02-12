import React, { useState, useEffect, useRef } from 'react';
import { Skill, DEFAULT_CATEGORIES, generateId, DeploymentStatus, SkillEcosystem } from '../types/index';
import { analyzeSkillText, AnalysisResult } from '../utils/skillParser';
import { X, Download, Upload, Copy, Check, ChevronDown, Eye, Edit3, ExternalLink, Wand2, Link2, Key, FolderOpen } from 'lucide-react';

interface CollectSkillModalProps {
  skill?: Skill;
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: Skill) => void;
  onDeploy?: (skill: Skill) => void;
  onExportMd?: (skill: Skill) => void;
  availableFolders: string[];
}

const ECOSYSTEM_OPTIONS: { value: SkillEcosystem; label: string }[] = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: DeploymentStatus; label: string; color: string }[] = [
  { value: 'saved', label: 'Saved', color: 'bg-muted text-muted-foreground' },
  { value: 'testing', label: 'Testing', color: 'bg-yellow-500/15 text-yellow-600' },
  { value: 'deployed', label: 'Deployed', color: 'bg-green-500/15 text-green-600' },
  { value: 'archived', label: 'Archived', color: 'bg-muted text-muted-foreground/60' },
];

export const CollectSkillModal: React.FC<CollectSkillModalProps> = ({
  skill,
  isOpen,
  onClose,
  onSave,
  onDeploy,
  onExportMd,
  availableFolders,
}) => {
  const isEditing = !!skill;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step management (only for new collection)
  const [step, setStep] = useState<'paste' | 'metadata'>(isEditing ? 'metadata' : 'paste');

  // Content
  const [sourceMarkdown, setSourceMarkdown] = useState('');
  const [showRawEdit, setShowRawEdit] = useState(false);

  // Magic Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Creative');
  const [folder, setFolder] = useState('General');
  const [tags, setTags] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceEcosystem, setSourceEcosystem] = useState<SkillEcosystem>('other');
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('saved');
  const [deploymentTarget, setDeploymentTarget] = useState('');
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);

  // Action feedback
  const [copied, setCopied] = useState(false);

  // Run analysis on text change (debounced slightly in real app, here direct)
  useEffect(() => {
    if (step === 'paste' && sourceMarkdown) {
      setAnalysis(analyzeSkillText(sourceMarkdown));
    }
  }, [sourceMarkdown, step]);

  // Reset on open/skill change
  useEffect(() => {
    if (!isOpen) return;
    if (skill) {
      setStep('metadata');
      setSourceMarkdown(skill.sourceMarkdown || '');
      // Run initial analysis to populate vars even in edit mode
      const res = analyzeSkillText(skill.sourceMarkdown || '');
      setAnalysis(res);

      setName(skill.name);
      setDescription(skill.description);
      setCategory(skill.category);
      setFolder(skill.folder);
      setTags(skill.tags.join(', '));
      setSourceUrl(skill.sourceUrl || '');
      setSourceEcosystem(skill.sourceEcosystem || 'other');
      setDeploymentStatus(skill.deploymentStatus || 'saved');
      setDeploymentTarget(skill.deploymentTarget || '');
      setDetectedVars(skill.inputsRequired || []); // Use stored vars or re-detect
      setShowRawEdit(false);
    } else {
      setStep('paste');
      setSourceMarkdown('');
      setAnalysis(null);
      setName('');
      setDescription('');
      setCategory('Creative');
      setFolder('General');
      setTags('');
      setSourceUrl('');
      setSourceEcosystem('other');
      setDeploymentStatus('saved');
      setDeploymentTarget('');
      setDetectedVars([]);
      setShowRawEdit(false);
    }
  }, [isOpen, skill]);

  const handleAnalyze = () => {
    if (!sourceMarkdown.trim()) return;

    // Use the latest analysis result
    const result = analyzeSkillText(sourceMarkdown);

    setName(result.detectedName || '');
    setDescription(result.detectedDescription || '');
    setDetectedVars(result.variables);

    // Auto-fill URL and Ecosystem from first detected link if available
    if (result.urls.length > 0) {
      setSourceUrl(result.urls[0].url);
      // Map ecosystem from parsed result if we tracked it per URL, or use overall result logic
      setSourceEcosystem(result.ecosystem);
    }

    if (result.suggestedCategory) {
      setCategory(result.suggestedCategory);
    }

    setStep('metadata');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSourceMarkdown(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const savedSkill: Skill = {
      id: skill?.id || generateId(),
      name: name || 'Untitled Skill',
      description,
      category,
      folder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      inputsRequired: detectedVars,
      outputFormat: '',
      embeddedPromptIds: skill?.embeddedPromptIds || [],
      toolsUsed: skill?.toolsUsed || [],
      status: skill?.status || 'active',
      createdAt: skill?.createdAt || now,
      updatedAt: now,
      usageCount: skill?.usageCount || 0,
      isPinned: skill?.isPinned || false,
      // Collection fields
      sourceType: 'collected',
      sourceMarkdown,
      sourceUrl: sourceUrl || undefined,
      sourceEcosystem,
      deploymentStatus,
      lastDeployedAt: skill?.lastDeployedAt,
      deploymentTarget: deploymentTarget || undefined,
    };
    onSave(savedSkill);
    onClose();
  };

  const handleCopySkill = async () => {
    if (!sourceMarkdown) return;
    if (onDeploy && skill) {
      onDeploy(skill);
    } else {
      await navigator.clipboard.writeText(sourceMarkdown);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMd = () => {
    if (!sourceMarkdown) return;
    if (onExportMd && skill) {
      onExportMd(skill);
      return;
    }
    const slug = (name || 'skill').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const blob = new Blob([sourceMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__new__') {
      setIsCreatingNewFolder(true);
      setFolder('');
    } else {
      setIsCreatingNewFolder(false);
      setFolder(val);
    }
  };

  const wordCount = sourceMarkdown.trim().split(/\s+/).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Download size={20} className="text-primary" />
              {isEditing ? `Edit: ${skill.name}` : 'Collect Skill'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEditing ? 'View, edit, and deploy this collected skill.' : 'Import a skill markdown file for your library.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && sourceMarkdown && (
              <>
                <button
                  type="button"
                  onClick={handleCopySkill}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${copied
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/15 text-primary hover:bg-primary/25'
                    }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'COPIED!' : 'COPY SKILL'}
                </button>
                <button
                  type="button"
                  onClick={handleExportMd}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-muted text-foreground/70 hover:bg-muted/80 transition-all"
                >
                  <Download size={14} />
                  EXPORT .MD
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Step 1: Paste markdown */}
        {step === 'paste' && (
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Paste Skill Markdown</label>
              <textarea
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                style={{ minHeight: '280px' }}
                placeholder="Paste the full markdown skill file here..."
                value={sourceMarkdown}
                onChange={(e) => setSourceMarkdown(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{wordCount} words</span>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.txt,.markdown"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-muted text-foreground/70 hover:bg-muted/80 transition-all"
                  >
                    <Upload size={14} />
                    IMPORT .MD FILE
                  </button>
                </div>
              </div>
            </div>

            {/* Magic Helper Bar */}
            <div className="px-4 py-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Wand2 size={14} className="text-amber-500" />
                  Magic Analysis
                </span>
                <div className="h-4 w-px bg-border" />

                {/* Status Badges */}
                {analysis && (
                  <>
                    <span className={`flex items-center gap-1.5 ${analysis.urls.length > 0 ? 'text-blue-500' : ''}`}>
                      <Link2 size={14} /> {analysis.urls.length} Links
                    </span>
                    <span className={`flex items-center gap-1.5 ${analysis.variables.length > 0 ? 'text-green-500' : ''}`}>
                      <Key size={14} /> {analysis.variables.length} Vars
                    </span>
                    {analysis.suggestedCategory && (
                      <span className="flex items-center gap-1.5 text-purple-500">
                        <FolderOpen size={14} /> {analysis.suggestedCategory}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-wider">
                {sourceMarkdown.length > 0 ? 'Active' : 'Waiting for input...'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!sourceMarkdown.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <Wand2 size={16} className="group-hover:rotate-12 transition-transform" />
                Analyze & Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Metadata + preview */}
        {step === 'metadata' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Markdown preview/edit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground/80">Skill Content</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowRawEdit(false)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${!showRawEdit ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRawEdit(true)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${showRawEdit ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                </div>
              </div>
              {showRawEdit ? (
                <textarea
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                  style={{ minHeight: '200px' }}
                  value={sourceMarkdown}
                  onChange={(e) => {
                    setSourceMarkdown(e.target.value);
                    const res = analyzeSkillText(e.target.value);
                    setAnalysis(res);
                    setDetectedVars(res.variables);
                  }}
                />
              ) : (
                <pre className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm overflow-auto whitespace-pre-wrap" style={{ maxHeight: '200px' }}>
                  {sourceMarkdown || '(empty)'}
                </pre>
              )}
              <span className="text-xs text-muted-foreground">{wordCount} words</span>
            </div>

            {/* Detected variables */}
            {detectedVars.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Detected Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {detectedVars.map(v => (
                    <span key={v} className="px-2.5 py-1 text-xs font-mono bg-primary/10 text-primary rounded-md">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Skill Name *</label>
                <input
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Auto-detected from heading"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Category</label>
                <div className="relative">
                  <select
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {DEFAULT_CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Description</label>
              <textarea
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                style={{ minHeight: '60px' }}
                placeholder="What does this skill do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Source URL & Ecosystem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Source URL</label>
                <input
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="https://github.com/..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Ecosystem</label>
                <div className="relative">
                  <select
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                    value={sourceEcosystem}
                    onChange={(e) => setSourceEcosystem(e.target.value as SkillEcosystem)}
                  >
                    {ECOSYSTEM_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Folder & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Folder</label>
                {isCreatingNewFolder ? (
                  <input
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="New folder name..."
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <div className="relative">
                    <select
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                      value={folder}
                      onChange={handleFolderChange}
                    >
                      {availableFolders.filter(f => f !== 'All').map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                      <option value="__new__">+ New Folder</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Tags</label>
                <input
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Comma-separated tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            {/* Deployment Status & Target (edit mode only) */}
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Deployment Status</label>
                  <div className="relative">
                    <select
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                      value={deploymentStatus}
                      onChange={(e) => setDeploymentStatus(e.target.value as DeploymentStatus)}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Deployment Target</label>
                  <input
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="Where is this deployed? e.g. Claude Code, my GPT"
                    value={deploymentTarget}
                    onChange={(e) => setDeploymentTarget(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Source URL link (edit mode) */}
            {isEditing && sourceUrl && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ExternalLink size={12} />
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline truncate">
                  {sourceUrl}
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setStep('paste')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to paste
                </button>
              )}
              {isEditing && <div />}
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-all"
              >
                {isEditing ? 'Save Changes' : 'Save Skill'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
