import React, { useState, useMemo, useCallback } from 'react';
import { AIPrompt } from '../types';
import { X, Copy, Check, Variable, Eye } from 'lucide-react';

interface PromptDetailModalProps {
  prompt: AIPrompt;
  isOpen: boolean;
  onClose: () => void;
}

/** Detects all variable patterns: {{curly}}, [SQUARE], <angle> */
function extractAllVariables(content: string): string[] {
  const vars = new Set<string>();
  const patterns = [
    /\{\{([^}]+)\}\}/g,
    /\[([A-Z_][A-Z_0-9]*)\]/g,
    /<([a-zA-Z_][a-zA-Z_0-9]*)>/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(content)) !== null) {
      vars.add(m[1].trim());
    }
  }
  return Array.from(vars);
}

/** Replace all variable patterns with their values */
function substituteVariables(content: string, values: Record<string, string>): string {
  let result = content;
  for (const [name, value] of Object.entries(values)) {
    if (!value) continue;
    // Replace {{name}}, [NAME], <name>
    result = result.replace(new RegExp(`\\{\\{${escapeRegex(name)}\\}\\}`, 'g'), value);
    result = result.replace(new RegExp(`\\[${escapeRegex(name)}\\]`, 'g'), value);
    result = result.replace(new RegExp(`<${escapeRegex(name)}>`, 'g'), value);
  }
  return result;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  prompt,
  isOpen,
  onClose,
}) => {
  const variables = useMemo(() => extractAllVariables(prompt.content), [prompt.content]);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const liveContent = useMemo(
    () => substituteVariables(prompt.content, varValues),
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
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Dynamic Variable Form */}
          {variables.length > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <Variable size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Fill Variables</span>
                <span className="text-[10px] px-2 py-0.5 bg-primary/15 text-primary rounded-full font-bold">
                  {variables.length}
                </span>
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
                {liveContent}
              </pre>
            </div>
          </div>

          {/* Copy Button */}
          <div className="pt-4 border-t border-border flex justify-end">
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
