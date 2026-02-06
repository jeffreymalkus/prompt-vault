import React from 'react';
import { ActiveSection, NavigationView } from '../types/index';
import { FileText, Zap, GitBranch, Bot, History, LayoutGrid, Layers } from 'lucide-react';

interface NavigationTabsProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  navigationView: NavigationView;
  onViewChange: (view: NavigationView) => void;
  counts: {
    prompts: number;
    skills: number;
    workflows: number;
    agents: number;
  };
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeSection,
  onSectionChange,
  navigationView,
  onViewChange,
  counts
}) => {
  const objectTabs: { id: ActiveSection; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'prompts', label: 'Prompts', icon: <FileText size={16} />, count: counts.prompts },
    { id: 'skills', label: 'Skills', icon: <Zap size={16} />, count: counts.skills },
    { id: 'workflows', label: 'Workflows', icon: <GitBranch size={16} />, count: counts.workflows },
    { id: 'agents', label: 'Agents', icon: <Bot size={16} />, count: counts.agents },
    { id: 'history', label: 'History', icon: <History size={16} />, count: 0 },
  ];

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">View:</span>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => onViewChange('object')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              navigationView === 'object'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid size={14} />
            Object View
          </button>
          <button
            onClick={() => onViewChange('capability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              navigationView === 'capability'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={14} />
            Capability View
          </button>
        </div>
      </div>

      {/* Object Tabs */}
      {navigationView === 'object' && (
        <div className="flex flex-wrap gap-2">
          {objectTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeSection === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  activeSection === tab.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-foreground/10 text-foreground/60'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
