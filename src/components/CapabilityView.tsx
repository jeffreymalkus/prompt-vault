import React from 'react';
import { AIPrompt, Skill, Workflow, Agent, DEFAULT_CATEGORIES } from '../types/index';
import { FileText, Zap, GitBranch, Bot, ChevronRight, FolderOpen } from 'lucide-react';

interface CapabilityViewProps {
  prompts: AIPrompt[];
  skills: Skill[];
  workflows: Workflow[];
  agents: Agent[];
  activeCategory: string;
  onCategorySelect: (category: string) => void;
  onPromptClick: (prompt: AIPrompt) => void;
  onSkillClick: (skill: Skill) => void;
  onWorkflowClick: (workflow: Workflow) => void;
  onAgentClick: (agent: Agent) => void;
}

export const CapabilityView: React.FC<CapabilityViewProps> = ({
  prompts,
  skills,
  workflows,
  agents,
  activeCategory,
  onCategorySelect,
  onPromptClick,
  onSkillClick,
  onWorkflowClick,
  onAgentClick
}) => {
  // Filter items by category
  const filteredPrompts = activeCategory === 'All' 
    ? prompts 
    : prompts.filter(p => p.category === activeCategory);
  const filteredSkills = activeCategory === 'All' 
    ? skills 
    : skills.filter(s => s.category === activeCategory);
  const filteredWorkflows = activeCategory === 'All' 
    ? workflows 
    : workflows.filter(w => w.category === activeCategory);
  const filteredAgents = activeCategory === 'All' 
    ? agents 
    : agents.filter(a => a.category === activeCategory);

  const totalCount = filteredPrompts.length + filteredSkills.length + filteredWorkflows.length + filteredAgents.length;

  return (
    <div className="flex gap-8">
      {/* Category Sidebar */}
      <div className="w-56 shrink-0">
        <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wide mb-4 flex items-center gap-2">
          <FolderOpen size={14} /> Categories
        </h3>
        <div className="space-y-1">
          {DEFAULT_CATEGORIES.map(cat => {
            const catPrompts = cat === 'All' ? prompts : prompts.filter(p => p.category === cat);
            const catSkills = cat === 'All' ? skills : skills.filter(s => s.category === cat);
            const catWorkflows = cat === 'All' ? workflows : workflows.filter(w => w.category === cat);
            const catAgents = cat === 'All' ? agents : agents.filter(a => a.category === cat);
            const count = catPrompts.length + catSkills.length + catWorkflows.length + catAgents.length;
            
            return (
              <button
                key={cat}
                onClick={() => onCategorySelect(cat)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat 
                    ? 'bg-primary/15 text-primary' 
                    : 'text-foreground/70 hover:bg-muted/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ChevronRight size={14} className={activeCategory === cat ? 'rotate-90 text-primary transition-transform' : 'transition-transform opacity-50'} />
                  {cat}
                </span>
                <span className="text-xs font-medium opacity-50">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {activeCategory === 'All' ? 'All Capabilities' : activeCategory}
          </h2>
          <p className="text-foreground/60 text-sm mt-1">
            {totalCount} items across all object types
          </p>
        </div>

        {/* Prompts Section */}
        {filteredPrompts.length > 0 && (
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground/80 mb-3">
              <FileText size={16} className="text-primary" />
              Prompts ({filteredPrompts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPrompts.slice(0, 6).map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => onPromptClick(prompt)}
                  className="text-left p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {prompt.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{prompt.description}</p>
                </button>
              ))}
            </div>
            {filteredPrompts.length > 6 && (
              <p className="text-xs text-muted-foreground mt-2">+{filteredPrompts.length - 6} more prompts</p>
            )}
          </div>
        )}

        {/* Skills Section */}
        {filteredSkills.length > 0 && (
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground/80 mb-3">
              <Zap size={16} className="text-secondary" />
              Skills ({filteredSkills.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSkills.slice(0, 6).map(skill => (
                <button
                  key={skill.id}
                  onClick={() => onSkillClick(skill)}
                  className="text-left p-4 bg-card border border-border rounded-xl hover:border-secondary/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-secondary" />
                    <span className="text-sm font-semibold text-foreground group-hover:text-secondary transition-colors truncate">
                      {skill.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{skill.description}</p>
                </button>
              ))}
            </div>
            {filteredSkills.length > 6 && (
              <p className="text-xs text-muted-foreground mt-2">+{filteredSkills.length - 6} more skills</p>
            )}
          </div>
        )}

        {/* Workflows Section */}
        {filteredWorkflows.length > 0 && (
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground/80 mb-3">
              <GitBranch size={16} className="text-accent" />
              Workflows ({filteredWorkflows.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredWorkflows.slice(0, 6).map(workflow => (
                <button
                  key={workflow.id}
                  onClick={() => onWorkflowClick(workflow)}
                  className="text-left p-4 bg-card border border-border rounded-xl hover:border-accent/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch size={14} className="text-accent" />
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                      {workflow.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{workflow.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agents Section */}
        {filteredAgents.length > 0 && (
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground/80 mb-3">
              <Bot size={16} className="text-primary" />
              Agents ({filteredAgents.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAgents.slice(0, 6).map(agent => (
                <button
                  key={agent.id}
                  onClick={() => onAgentClick(agent)}
                  className="text-left p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={14} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {agent.name}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                      agent.status === 'active' ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{agent.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-border border-dashed rounded-2xl">
            <FolderOpen size={48} className="text-foreground/20 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-1">No items in this category</h3>
            <p className="text-foreground/60 text-sm">Create prompts, skills, workflows, or agents in the "{activeCategory}" category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
