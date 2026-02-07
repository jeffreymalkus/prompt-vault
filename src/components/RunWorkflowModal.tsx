import React, { useState, useMemo } from 'react';
import { Workflow, Skill, AIPrompt, ExecutionRun, generateId } from '../types';
import { X, Play, Loader2, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface RunWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow;
  skills: Skill[];
  prompts: AIPrompt[];
  onRunComplete: (run: ExecutionRun) => void;
}

export const RunWorkflowModal: React.FC<RunWorkflowModalProps> = ({
  isOpen,
  onClose,
  workflow,
  skills,
  prompts,
  onRunComplete
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(-1);
  const [output, setOutput] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Get ordered skills
  const orderedSkills = useMemo(() => {
    return workflow.skillIds
      .map(id => skills.find(s => s.id === id))
      .filter(Boolean) as Skill[];
  }, [workflow.skillIds, skills]);

  // Collect all required inputs from all skills
  const allRequiredInputs = useMemo(() => {
    const inputs = new Set<string>();
    orderedSkills.forEach(skill => {
      skill.inputsRequired.forEach(input => inputs.add(input));
    });
    return Array.from(inputs);
  }, [orderedSkills]);

  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleRun = async () => {
    setIsRunning(true);
    setCurrentSkillIndex(0);
    setOutput(null);
    
    const startTime = Date.now();
    let accumulatedOutput = '';
    
    try {
      // Simulate running each skill in sequence
      for (let i = 0; i < orderedSkills.length; i++) {
        setCurrentSkillIndex(i);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const skill = orderedSkills[i];
        const skillPrompts = skill.embeddedPromptIds
          .map(id => prompts.find(p => p.id === id))
          .filter(Boolean) as AIPrompt[];
        
        // Build skill output
        let skillOutput = `\n### Step ${i + 1}: ${skill.name}\n`;
        
        skillPrompts.forEach((prompt, pIndex) => {
          let processedContent = prompt.content;
          Object.entries(inputValues).forEach(([key, value]) => {
            processedContent = processedContent.replace(
              new RegExp(`\\[${key}\\]`, 'g'),
              value || `[${key}]`
            );
          });
          
          skillOutput += `\n**Prompt ${pIndex + 1}:** ${prompt.title}\n`;
          skillOutput += `> ${processedContent.substring(0, 150)}${processedContent.length > 150 ? '...' : ''}\n`;
        });
        
        skillOutput += `\n*Simulated output for "${skill.name}"*\n`;
        accumulatedOutput += skillOutput;
      }
      
      // Final output
      const finalOutput = `# Workflow Execution: ${workflow.name}\n${accumulatedOutput}\n---\n✅ Workflow completed successfully.`;
      setOutput(finalOutput);
      
      // Log execution
      const run: ExecutionRun = {
        id: generateId(),
        objectType: 'workflow',
        objectId: workflow.id,
        objectName: workflow.name,
        inputs: inputValues,
        outputs: finalOutput,
        startedAt: startTime,
        completedAt: Date.now(),
        status: 'completed'
      };
      
      onRunComplete(run);
      
    } catch (error) {
      setOutput(`Error running workflow: ${error}`);
    } finally {
      setIsRunning(false);
      setCurrentSkillIndex(-1);
    }
  };

  const allInputsFilled = allRequiredInputs.every(input => inputValues[input]?.trim());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play size={20} className="text-accent" />
            Run Workflow: {workflow.name}
          </DialogTitle>
          <DialogDescription>
            Execute {orderedSkills.length} skill{orderedSkills.length !== 1 ? 's' : ''} in sequence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workflow Sequence Preview */}
          <div className="p-4 bg-muted/50 rounded-xl">
            <h4 className="text-sm font-semibold text-foreground/80 mb-3">Execution Sequence</h4>
            <div className="flex items-center flex-wrap gap-2">
              {orderedSkills.map((skill, index) => (
                <React.Fragment key={skill.id}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    currentSkillIndex === index 
                      ? 'bg-accent text-accent-foreground' 
                      : currentSkillIndex > index 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentSkillIndex > index && <CheckCircle size={14} />}
                    {currentSkillIndex === index && <Loader2 size={14} className="animate-spin" />}
                    <Zap size={14} />
                    {skill.name}
                  </div>
                  {index < orderedSkills.length - 1 && (
                    <ArrowRight size={16} className="text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Input Collection */}
          {allRequiredInputs.length > 0 && !output && (
            <div>
              <h4 className="text-sm font-semibold text-foreground/80 mb-3">
                Required Inputs ({allRequiredInputs.length})
              </h4>
              <div className="space-y-3">
                {allRequiredInputs.map(input => (
                  <div key={input}>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      [{input}]
                    </label>
                    <Input
                      value={inputValues[input] || ''}
                      onChange={(e) => handleInputChange(input, e.target.value)}
                      placeholder={`Enter value for ${input}`}
                      disabled={isRunning}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Display */}
          {output && (
            <div>
              <h4 className="text-sm font-semibold text-foreground/80 mb-3">Execution Output</h4>
              <div className="bg-background border border-border rounded-xl p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {output}
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              {output ? 'CLOSE' : 'CANCEL'}
            </Button>
            {!output && (
              <Button
                onClick={handleRun}
                disabled={!allInputsFilled || isRunning || orderedSkills.length === 0}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    RUNNING...
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-2" />
                    RUN WORKFLOW
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
