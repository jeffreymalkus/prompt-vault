import React, { useState, useMemo, useCallback } from 'react';
import { AIPrompt } from '../types';
import { X, Copy, Check, Variable, Eye, Clock, Save, FilePlus, RotateCcw } from 'lucide-react';

interface PromptDetailModalProps {
  prompt: AIPrompt;
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
  onUpdateCurrent?: (prompt: AIPrompt, varValues: Record<string, string>) => void;
  onSaveNewVersion?: (prompt: AIPrompt, varValues: Record<string, string>, versionName: string) => string | null;
  initialVarValues?: Record<string, string>;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Detects variables from bracketed tokens only: [VAR_NAME] */
function extractAllVariables(content: string): string[] {
  const stoplist = new Set(['OPTIONAL', 'REQUIRED', 'EXAMPLE', 'NOTES', 'RULES', 'STEPS']);
  const regex = /\[(.*?)\]/g;
  const seen = new Set<string>();
  const result: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const normalized = match[1].trim().toUpperCase().replace(/\s+/g, '_');
    if (!normalized || stoplist.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

/** Replace bracketed variable patterns with their values */
function substituteVariables(content: string, values: Record<string, string>): string {
  let result = content;
  for (const [name, value] of Object.entries(values)) {
    if (!value) continue;
    // Match [VAR_NAME] with flexible spacing/casing inside brackets
    result = result.replace(new RegExp(`\\[${escapeRegex(name)}\\]`, 'gi'), value);
  }
  return result;
}

/** Build React nodes with highlighted substitutions */
function buildHighlightedPreview(
  content: string,
  values: Record<string, string>
): React.ReactNode[] {
  const filledEntries = Object.entries(values).filter(([, v]) => v);
  if (filledEntries.length === 0) return [content];

  const patternParts = filledEntries.map(([name]) => {
    const e = escapeRegex(name);
    return `\\[${e}\\]`;
  });
  const combined = new RegExp(`(${patternParts.join('|')})`, 'g');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = combined.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const matched = match[0];
    let replacementValue = matched;
    for (const [name, value] of filledEntries) {
      const e = escapeRegex(name);
      if (new RegExp(`^\\[${e}\\]$`, 'i').test(matched)) {
        replacementValue = value;
        break;
      }
    }
    parts.push(
      <mark key={key++} className="bg-accent/25 text-accent-foreground rounded px-0.5">
        {replacementValue}
      </mark>
    );
    lastIndex = combined.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  return parts;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  prompt,
  isOpen,
  onClose,
  onOpenHistory,
  onUpdateCurrent,
  onSaveNewVersion,
  initialVarValues,
}) => {
  const variables = useMemo(() => extractAllVariables(prompt.content), [prompt.content]);
  const [varValues, setVarValues] = useState<Record<string, string>>(initialVarValues || {});
  const [copied, setCopied] = useState(false);
  const [showVersionNameInput, setShowVersionNameInput] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionError, setVersionError] = useState('');

  // Re-hydrate when initialVarValues changes (version switch)
  React.useEffect(() => {
    if (initialVarValues) {
      setVarValues(initialVarValues);
    }
  }, [initialVarValues]);

  // Reset when prompt changes
  React.useEffect(() => {
    if (!initialVarValues) {
      setVarValues({});
    }
  }, [prompt.id]);

  const liveContent = useMemo(
    () => substituteVariables(prompt.content, varValues),
    [prompt.content, varValues]
  );

  const highlightedContent = useMemo(
    () => buildHighlightedPreview(prompt.content, varValues),
    [prompt.content, varValues]
  );

  const handleVarChange = useCallback((name: string, value: string) => {
    setVarValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(liveContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [liveContent]);

  const handleClearFields = useCallback(() => {
    setVarValues({});
  }, []);

  const handleUpdateCurrent = useCallback(() => {
    onUpdateCurrent?.(prompt, varValues);
  }, [prompt, varValues, onUpdateCurrent]);

  const handleSaveNewVersion = useCallback(() => {
    const name = versionName.trim() || `Version ${(prompt.version || 1) + 1} - ${new Date().toLocaleString()}`;
    const result = onSaveNewVersion?.(prompt, varValues, name);
    if (result === 'duplicate-name') {
      setVersionError('Version name already exists.');
      return;
    }
    if (result === 'duplicate-content') {
      setVersionError('No changes from an existing version.');
      return;
    }
    setVersionError('');
    setShowVersionNameInput(false);
    setVersionName('');
  }, [prompt, varValues, versionName, onSaveNewVersion]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Eye size={18} className="text-primary" />
              {prompt.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{prompt.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
              >
                <Clock size={14} />
                HISTORY
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Dynamic Variable Form */}
          {variables.length > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Variable size={16} className="text-primary" />
                  <span className="text-sm font-bold text-foreground">Fill Variables</span>
                  <span className="text-[10px] px-2 py-0.5 bg-primary/15 text-primary rounded-full font-bold">
                    {variables.length}
                  </span>
                </div>
                <button
                  onClick={handleClearFields}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <RotateCcw size={12} />
                  CLEAR FIELDS
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variables.map(v => (
                  <div key={v} className="space-y-1">
                    <label className="text-xs font-mono font-bold text-primary/80">{v}</label>
                    <input
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                      placeholder={`Enter ${v.toLowerCase()}...`}
                      value={varValues[v] || ''}
                      onChange={(e) => handleVarChange(v, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <Eye size={14} />
              {variables.length > 0 ? 'Live Preview' : 'Prompt Content'}
            </label>
            <div className="bg-background border border-border rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar">
              <pre className="text-sm font-mono text-foreground/85 whitespace-pre-wrap leading-relaxed">
                {highlightedContent}
              </pre>
            </div>
          </div>

          {/* Save New Version Name Input */}
          {showVersionNameInput && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3 animate-in slide-in-from-top-1">
              <label className="text-sm font-semibold text-foreground/80">Version Name</label>
              <input
                autoFocus
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/40 outline-none"
                placeholder={`e.g. Expert Marketing Version`}
                value={versionName}
                onChange={(e) => { setVersionName(e.target.value); setVersionError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNewVersion(); }}
              />
              {versionError && (
                <p className="text-xs text-destructive font-medium">{versionError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNewVersion}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                  SAVE
                </button>
                <button
                  onClick={() => { setShowVersionNameInput(false); setVersionName(''); setVersionError(''); }}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-xs font-bold transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border flex flex-wrap gap-2 justify-end">
            {onUpdateCurrent && (
              <button
                onClick={handleUpdateCurrent}
                className="flex items-center gap-2 px-5 py-3 bg-muted hover:bg-muted/80 border border-border rounded-xl font-bold text-sm transition-all active:scale-95 text-foreground"
              >
                <Save size={16} />
                UPDATE CURRENT
              </button>
            )}
            {onSaveNewVersion && !showVersionNameInput && (
              <button
                onClick={() => setShowVersionNameInput(true)}
                className="flex items-center gap-2 px-5 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded-xl font-bold text-sm transition-all active:scale-95"
              >
                <FilePlus size={16} />
                SAVE NEW VERSION
              </button>
            )}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                copied 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {copied ? <Check size={16} className="animate-scale-in" /> : <Copy size={16} />}
              {copied ? 'COPIED!' : 'COPY TO CLIPBOARD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
