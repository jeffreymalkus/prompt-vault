import React, { useState } from 'react';
import { Skill, AIPrompt, ExecutionRun, generateId, PLACEHOLDER_REGEX, canonicalKey } from '../types/index';
import { X, Play, Zap, ArrowRight, Copy, Check, Layers } from 'lucide-react';

interface RunSkillModalProps {
  skill: Skill;
  prompts: AIPrompt[];
  isOpen: boolean;
  onClose: () => void;
  onRunComplete: (run: ExecutionRun) => void;
}

export const RunSkillModal: React.FC<RunSkillModalProps> = ({
  skill,
  prompts,
  isOpen,
  onClose,
  onRunComplete
}) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const embeddedPrompts = skill.embeddedPromptIds
    .map(id => prompts.find(p => p.id === id))
    .filter(Boolean) as AIPrompt[];

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const substituteVariables = (content: string): string => {
    // Use PLACEHOLDER_REGEX so both [KEY] and [KEY:hint] forms are replaced.
    // Prompts may contain default-hint syntax like [TOPIC:your subject here].
    return content.replace(PLACEHOLDER_REGEX, (full, rawKey) => {
      const key = canonicalKey(rawKey);
      return inputs[key.toUpperCase()] ?? full;
    });
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);

    // Simulate execution by assembling prompts with substituted variables
    const assembledOutput: string[] = [];
    
    assembledOutput.push(`=== SKILL: ${skill.name} ===\n`);
    assembledOutput.push(`Inputs provided:`);
    Object.entries(inputs).forEach(([key, value]) => {
      assembledOutput.push(`  ${key}: ${value}`);
    });
    assembledOutput.push('\n---\n');

    embeddedPrompts.forEach((prompt, index) => {
      const substituted = substituteVariables(prompt.content);
      assembledOutput.push(`[Step ${index + 1}] ${prompt.title} (${prompt.type})`);
      assembledOutput.push(substituted);
      assembledOutput.push('\n---\n');
    });

    assembledOutput.push(`Output Format: ${skill.outputFormat || 'Not specified'}`);

    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 800));

    const finalOutput = assembledOutput.join('\n');
    setOutput(finalOutput);
    setIsRunning(false);

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

  const handleClose = () => {
    setInputs({});
    setOutput(null);
    setIsRunning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Play size={20} className="text-secondary" />
              Run: {skill.name}
            </h2>
            <p className="text-xs text-muted-foreground">Provide inputs and execute this skill.</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Skill Info */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-secondary" />
              <span className="text-sm font-semibold text-foreground">{skill.name}</span>
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                <Layers size={10} />
                {embeddedPrompts.length} prompts
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{skill.description}</p>
          </div>

          {/* Prompts Preview */}
          <div>
            <h3 className="text-sm font-semibold text-foreground/80 mb-3">Execution Flow</h3>
            <div className="flex flex-wrap items-center gap-2">
              {embeddedPrompts.map((prompt, index) => (
                <React.Fragment key={prompt.id}>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    prompt.type === 'system' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'
                  }`}>
                    {prompt.title}
                  </div>
                  {index < embeddedPrompts.length - 1 && (
                    <ArrowRight size={14} className="text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Input Fields */}
          {skill.inputsRequired.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80">Required Inputs</h3>
              {skill.inputsRequired.map(inputName => (
                <div key={inputName} className="space-y-2">
                  <label className="text-sm font-medium text-foreground/70 uppercase tracking-wide">
                    {inputName}
                  </label>
                  <input
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder={`Enter ${inputName.toLowerCase()}...`}
                    value={inputs[inputName.toUpperCase()] || ''}
                    onChange={(e) => handleInputChange(inputName.toUpperCase(), e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Run Button */}
          {!output && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full py-3.5 px-4 bg-secondary hover:bg-secondary/90 rounded-xl font-bold text-sm text-secondary-foreground transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} />
                  RUN SKILL
                </>
              )}
            </button>
          )}

          {/* Output */}
          {output && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/80">Output</h3>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    copied
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 bg-background border border-border rounded-xl text-sm text-foreground/80 overflow-x-auto whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                {output}
              </pre>
              <p className="text-xs text-muted-foreground">
                This is a simulated output. Copy and paste into your preferred AI tool to execute.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
