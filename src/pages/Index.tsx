import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AIPrompt, 
  Skill, 
  Workflow, 
  Agent, 
  ExecutionRun,
  PromptVersionSnapshot,
  DEFAULT_CATEGORIES, 
  ViewMode, 
  ActiveSection, 
  NavigationView,
  generateId 
} from '../types';
import { CANONICAL_SEED_PROMPTS, mergeWithCanonicalSeeds, isCanonicalSeed } from '../data/canonicalSeedPrompts';
import { PromptCard } from '../components/PromptCard';
import { PromptModal } from '../components/PromptModal';
import { SkillCard } from '../components/SkillCard';
import { SkillModal } from '../components/SkillModal';
import { SkillImportModal } from '../components/SkillImportModal';
import { RunSkillModal } from '../components/RunSkillModal';
import { WorkflowCard } from '../components/WorkflowCard';
import { WorkflowModal } from '../components/WorkflowModal';
import { WorkflowImportModal } from '../components/WorkflowImportModal';
import { RunWorkflowModal } from '../components/RunWorkflowModal';
import { AgentCard } from '../components/AgentCard';
import { AgentModal } from '../components/AgentModal';
import { AgentImportModal } from '../components/AgentImportModal';
import { SmartImportModal } from '../components/SmartImportModal';
import { PromptDetailModal } from '../components/PromptDetailModal';
import { VersionHistoryDrawer } from '../components/VersionHistoryDrawer';
import { NavigationTabs } from '../components/NavigationTabs';
import { CapabilityView } from '../components/CapabilityView';
import { ExecutionHistory } from '../components/ExecutionHistory';
import { 
  Search, 
  Plus, 
  Grid, 
  Table as TableIcon,
  Layers,
  Zap,
  Copy,
  Edit3,
  Trash2,
  Check,
  Folder as FolderIcon,
  ChevronRight,
  Star,
  Activity,
  Download,
  FileJson,
  FileSpreadsheet,
  Upload,
  Menu,
  X,
  GitBranch,
  Bot,
  Wand2
} from 'lucide-react';

// Robust CSV line parser that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// 10-column CSV parser as specified
function parseCSV(text: string): Partial<AIPrompt>[] {
  const lines = text.split(/\r?\n/);
  const result: Partial<AIPrompt>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const row = parseCSVLine(lines[i]);
    
    if (row && row.length >= 10) {
      const clean = (t: string | undefined) => t ? t.replace(/^"|"$/g, '').replace(/""/g, '"').trim() : '';
      result.push({
        title: clean(row[1]),
        category: clean(row[2]),
        folder: clean(row[3]),
        type: clean(row[4]) as 'system' | 'user',
        description: clean(row[6]),
        notes: clean(row[7]),
        tags: clean(row[8]) ? clean(row[8]).split(',').map(t => t.trim()) : [],
        content: clean(row[9])
      });
    }
  }
  return result;
}

const Index: React.FC = () => {
  // PROMPTS STATE (existing)
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFolder, setActiveFolder] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | undefined>(undefined);
  const [lastCopiedId, setLastCopiedId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW CAPABILITY LAYERS STATE
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionRun[]>([]);
  
  // NAVIGATION STATE
  const [activeSection, setActiveSection] = useState<ActiveSection>('prompts');
  const [navigationView, setNavigationView] = useState<NavigationView>('object');
  
  // SKILL MODALS
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isSkillImportModalOpen, setIsSkillImportModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>(undefined);
  const [runningSkill, setRunningSkill] = useState<Skill | undefined>(undefined);
  
  // WORKFLOW MODALS
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isWorkflowImportModalOpen, setIsWorkflowImportModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | undefined>(undefined);
  const [runningWorkflow, setRunningWorkflow] = useState<Workflow | undefined>(undefined);
  
  // AGENT MODALS
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAgentImportModalOpen, setIsAgentImportModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>(undefined);
  
  // SMART IMPORT & DETAIL
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartImportDefaultMode, setSmartImportDefaultMode] = useState<'prompt' | 'skill'>('prompt');
  const [detailPrompt, setDetailPrompt] = useState<AIPrompt | undefined>(undefined);
  const [skillPrefill, setSkillPrefill] = useState<Partial<Skill> | undefined>(undefined);
  
  // VERSION HISTORY
  const [versionSnapshots, setVersionSnapshots] = useState<PromptVersionSnapshot[]>([]);
  const [historyPrompt, setHistoryPrompt] = useState<AIPrompt | undefined>(undefined);
  const [detailVarValues, setDetailVarValues] = useState<Record<string, string>>({});

  // Load and seed prompts
  useEffect(() => {
    const savedPrompts = localStorage.getItem('prompt_vault_data_v2');
    const savedFolders = localStorage.getItem('prompt_vault_folders');
    const savedSkills = localStorage.getItem('prompt_vault_skills');
    const savedWorkflows = localStorage.getItem('prompt_vault_workflows');
    const savedAgents = localStorage.getItem('prompt_vault_agents');
    const savedHistory = localStorage.getItem('prompt_vault_execution_history');
    const savedSnapshots = localStorage.getItem('prompt_vault_version_snapshots');
    
    {
      let userPrompts: AIPrompt[] = [];
      if (savedPrompts) {
        try {
          userPrompts = JSON.parse(savedPrompts);
        } catch (e) {
          console.error('Failed to load prompts', e);
        }
      }
      // Always merge canonical seeds with whatever user prompts exist
      setPrompts(mergeWithCanonicalSeeds(userPrompts));
    }

    if (savedFolders) {
      try {
        setCustomFolders(JSON.parse(savedFolders));
      } catch (e) {
        console.error('Failed to load folders', e);
      }
    } else {
      setCustomFolders(['Core Frameworks', 'Development', 'Professional', 'Marketing', 'Education', 'Creative', 'General']);
    }

    // Load skills
    if (savedSkills) {
      try {
        setSkills(JSON.parse(savedSkills));
      } catch (e) {
        console.error('Failed to load skills', e);
      }
    }

    // Load workflows
    if (savedWorkflows) {
      try {
        setWorkflows(JSON.parse(savedWorkflows));
      } catch (e) {
        console.error('Failed to load workflows', e);
      }
    }

    // Load agents
    if (savedAgents) {
      try {
        setAgents(JSON.parse(savedAgents));
      } catch (e) {
        console.error('Failed to load agents', e);
      }
    }

    // Load execution history
    if (savedHistory) {
      try {
        setExecutionHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load execution history', e);
      }
    }

    // Load version snapshots
    if (savedSnapshots) {
      try {
        setVersionSnapshots(JSON.parse(savedSnapshots));
      } catch (e) {
        console.error('Failed to load version snapshots', e);
      }
    }
  }, []);

  // Persist data
  // Persist only user (non-canonical) prompts to localStorage
  useEffect(() => {
    const userOnly = prompts.filter(p => !isCanonicalSeed(p.id));
    localStorage.setItem('prompt_vault_data_v2', JSON.stringify(userOnly));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem('prompt_vault_folders', JSON.stringify(customFolders));
  }, [customFolders]);

  useEffect(() => {
    localStorage.setItem('prompt_vault_skills', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem('prompt_vault_workflows', JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem('prompt_vault_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('prompt_vault_execution_history', JSON.stringify(executionHistory));
  }, [executionHistory]);

  useEffect(() => {
    localStorage.setItem('prompt_vault_version_snapshots', JSON.stringify(versionSnapshots));
  }, [versionSnapshots]);

  const uniqueFolders = useMemo(() => {
    const fromPrompts = prompts.map(p => p.folder);
    const fromSkills = skills.map(s => s.folder);
    const fromWorkflows = workflows.map(w => w.folder);
    const fromAgents = agents.map(a => a.folder);
    const combined = Array.from(new Set(['All', ...customFolders, ...fromPrompts, ...fromSkills, ...fromWorkflows, ...fromAgents]));
    return combined;
  }, [prompts, skills, workflows, agents, customFolders]);

  const groupedPrompts = useMemo(() => {
    const map = new Map<string, AIPrompt[]>();
    prompts.forEach(p => {
      const key = p.parentId || p.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(p);
    });
    return map;
  }, [prompts]);

  const latestPrompts = useMemo(() => {
    const list: AIPrompt[] = [];
    groupedPrompts.forEach(versions => {
      const latest = [...versions].sort((a, b) => b.version - a.version)[0];
      list.push(latest);
    });
    return list;
  }, [groupedPrompts]);

  const frequentlyUsed = useMemo(() => {
    return latestPrompts
      .filter(p => p.isPinned || p.usageCount > 0)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.usageCount - a.usageCount;
      })
      .slice(0, 5);
  }, [latestPrompts]);

  const filteredPrompts = useMemo(() => {
    return latestPrompts.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesFolder = activeFolder === 'All' || p.folder === activeFolder;
      return matchesSearch && matchesCategory && matchesFolder;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [latestPrompts, searchQuery, activeCategory, activeFolder]);

  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
      const matchesFolder = activeFolder === 'All' || s.folder === activeFolder;
      return matchesSearch && matchesCategory && matchesFolder;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [skills, searchQuery, activeCategory, activeFolder]);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(w => {
      const matchesSearch = 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || w.category === activeCategory;
      const matchesFolder = activeFolder === 'All' || w.folder === activeFolder;
      return matchesSearch && matchesCategory && matchesFolder;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [workflows, searchQuery, activeCategory, activeFolder]);

  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      const matchesSearch = 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
      const matchesFolder = activeFolder === 'All' || a.folder === activeFolder;
      return matchesSearch && matchesCategory && matchesFolder;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [agents, searchQuery, activeCategory, activeFolder]);

  // PROMPT HANDLERS
  const handleUpdatePrompt = (updatedPrompt: AIPrompt) => {
    setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `prompt-vault-export-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const headers = ['id', 'title', 'category', 'folder', 'type', 'version', 'description', 'notes', 'tags', 'content'];
    const rows = prompts.map(p => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.category,
      p.folder,
      p.type,
      p.version,
      `"${p.description.replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${p.tags.join(', ')}"`,
      `"${p.content.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prompt-vault-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    setShowExportMenu(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const imported = JSON.parse(content);
          if (Array.isArray(imported)) {
            mergePrompts(imported);
          } else {
            alert('Invalid JSON format. Expected an array of prompts.');
          }
        } catch (err) {
          alert('Error parsing JSON file.');
        }
      } else if (file.name.endsWith('.csv')) {
        try {
          const parsed = parseCSV(content);
          const imported: AIPrompt[] = parsed.map((p, index) => ({
            id: generateId(),
            title: p.title || 'Untitled',
            content: p.content || '',
            description: p.description || '',
            notes: p.notes || '',
            category: p.category || 'Creative',
            folder: p.folder || 'General',
            type: p.type || 'user',
            origin: 'user',
            version: 1,
            tags: p.tags || [],
            createdAt: Date.now() + index,
            lastUsedAt: Date.now(),
            usageCount: 0,
            isPinned: false,
            variables: []
          }));
          mergePrompts(imported);
        } catch (err) {
          alert('Error parsing CSV file.');
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const mergePrompts = (newPrompts: AIPrompt[]) => {
    setPrompts(prev => {
      const existingSignatures = new Set(
        prev.map(p => `${p.type}|${p.folder}|${p.title}|${p.content}`)
      );
      
      const filtered = newPrompts.filter(p => {
        const signature = `${p.type}|${p.folder}|${p.title}|${p.content}`;
        return !existingSignatures.has(signature);
      });
      
      const duplicateCount = newPrompts.length - filtered.length;
      const newFolders = Array.from(new Set(newPrompts.map(p => p.folder)));
      setCustomFolders(prevFolders => Array.from(new Set([...prevFolders, ...newFolders])));
      
      if (filtered.length === 0) {
        alert('All prompts in the file already exist (duplicates were skipped).');
        return prev;
      }
      
      if (duplicateCount > 0) {
        alert(`Imported ${filtered.length} new prompts. ${duplicateCount} duplicate(s) skipped.`);
      } else {
        alert(`Imported ${filtered.length} new prompts.`);
      }
      
      return [...filtered, ...prev];
    });
  };

  const ensureBaselineSnapshot = (prompt: AIPrompt) => {
    const key = prompt.parentId || prompt.id;
    setVersionSnapshots(prev => {
      const existing = prev.filter(s => s.promptId === key);
      if (existing.length > 0) return prev;
      const baseline: PromptVersionSnapshot = {
        id: generateId(),
        promptId: key,
        content: prompt.content,
        title: prompt.title,
        description: prompt.description,
        tags: [...prompt.tags],
        category: prompt.category,
        folder: prompt.folder,
        commitMessage: 'Initial Version',
        createdAt: Date.now() - 1,
        version: 1,
        variableValues: {},
      };
      return [...prev, baseline];
    });
  };

  const createVersionSnapshot = (prompt: AIPrompt, commitMessage: string = '') => {
    const snapshot: PromptVersionSnapshot = {
      id: generateId(),
      promptId: prompt.parentId || prompt.id,
      content: prompt.content,
      title: prompt.title,
      description: prompt.description,
      tags: [...prompt.tags],
      category: prompt.category,
      folder: prompt.folder,
      commitMessage,
      createdAt: Date.now(),
      version: prompt.version,
    };
    setVersionSnapshots(prev => [snapshot, ...prev]);
  };

  const handleSavePrompt = (data: Partial<AIPrompt>, saveAsNewVersion: boolean, commitMessage?: string) => {
    if (editingPrompt && !saveAsNewVersion) {
      // Snapshot current state before overwriting
    createVersionSnapshot(editingPrompt, commitMessage || 'Updated prompt');
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, ...data } as AIPrompt : p));
    } else {
      if (editingPrompt) {
        // Snapshot old version before creating new
        createVersionSnapshot(editingPrompt, commitMessage || 'Previous version');
      }
      const newPrompt: AIPrompt = {
        id: generateId(),
        title: data.title || 'Untitled',
        content: data.content || '',
        description: data.description || '',
        notes: data.notes || '',
        category: data.category || 'Creative',
        folder: data.folder || 'General',
        type: data.type || 'user',
        origin: 'user',
        version: data.version || 1,
        tags: data.tags || [],
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        usageCount: data.usageCount || 0,
        isPinned: data.isPinned || false,
        variables: data.variables || [],
        parentId: data.parentId
      };
      setPrompts(prev => [newPrompt, ...prev]);
      
      if (data.folder && !customFolders.includes(data.folder) && data.folder !== 'General') {
        setCustomFolders(prev => [...prev, data.folder!]);
      }
    }
    setIsModalOpen(false);
    setEditingPrompt(undefined);
  };

  const handleRestoreVersion = (snapshot: PromptVersionSnapshot) => {
    const currentPrompt = prompts.find(p => (p.parentId || p.id) === snapshot.promptId);
    if (!currentPrompt) return;
    
    // RESTORE ONLY: update editor state, do NOT create any snapshot
    setPrompts(prev => prev.map(p => 
      p.id === currentPrompt.id 
        ? { ...p, content: snapshot.content, title: snapshot.title, description: snapshot.description, tags: [...snapshot.tags], category: snapshot.category, folder: snapshot.folder }
        : p
    ));
    
    // Update detail view if open
    const updated = { ...currentPrompt, content: snapshot.content, title: snapshot.title, description: snapshot.description, tags: [...snapshot.tags], category: snapshot.category, folder: snapshot.folder };
    if (detailPrompt?.id === currentPrompt.id) {
      setDetailPrompt(updated);
    }
    // Hydrate variable values from snapshot
    setDetailVarValues(snapshot.variableValues || {});
    setHistoryPrompt(undefined);
  };

  const getVersionsForPrompt = (prompt: AIPrompt): PromptVersionSnapshot[] => {
    const key = prompt.parentId || prompt.id;
    return versionSnapshots.filter(s => s.promptId === key);
  };

  const handleDeleteVersion = (snapshotId: string) => {
    setVersionSnapshots(prev => prev.filter(s => s.id !== snapshotId));
  };

  const handleSelectVersion = (snapshot: PromptVersionSnapshot) => {
    // Just hydrate variable values — no version creation
    setDetailVarValues(snapshot.variableValues || {});
  };

  const handleUpdateCurrent = (promptObj: AIPrompt, varValues: Record<string, string>) => {
    ensureBaselineSnapshot(promptObj);
    const snapshot: PromptVersionSnapshot = {
      id: generateId(),
      promptId: promptObj.parentId || promptObj.id,
      content: promptObj.content,
      title: promptObj.title,
      description: promptObj.description,
      tags: [...promptObj.tags],
      category: promptObj.category,
      folder: promptObj.folder,
      commitMessage: 'Updated current',
      createdAt: Date.now(),
      version: promptObj.version,
      variableValues: { ...varValues },
    };
    setVersionSnapshots(prev => [snapshot, ...prev]);
  };

  const handleSaveNewVersion = (promptObj: AIPrompt, varValues: Record<string, string>, versionName: string): string | null => {
    ensureBaselineSnapshot(promptObj);
    const promptKey = promptObj.parentId || promptObj.id;

    // Check duplicate name (case-insensitive, trimmed)
    const trimmedName = versionName.trim();
    const nameExists = versionSnapshots
      .filter(s => s.promptId === promptKey)
      .some(v => (v.versionName || '').trim().toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      return 'duplicate-name';
    }

    const snapshot: PromptVersionSnapshot = {
      id: generateId(),
      promptId: promptKey,
      content: promptObj.content,
      title: promptObj.title,
      description: promptObj.description,
      tags: [...promptObj.tags],
      category: promptObj.category,
      folder: promptObj.folder,
      commitMessage: trimmedName,
      versionName: trimmedName,
      createdAt: Date.now(),
      version: promptObj.version + 1,
      variableValues: { ...varValues },
    };
    setVersionSnapshots(prev => [snapshot, ...prev]);
    
    // Increment prompt version
    setPrompts(prev => prev.map(p => 
      p.id === promptObj.id ? { ...p, version: p.version + 1 } : p
    ));
    if (detailPrompt?.id === promptObj.id) {
      setDetailPrompt(prev => prev ? { ...prev, version: prev.version + 1 } : prev);
    }
    return null;
  };

  const handleCopy = (prompt: AIPrompt) => {
    navigator.clipboard.writeText(prompt.content);
    setLastCopiedId(prompt.id);
    
    setPrompts(prev => prev.map(p => 
      p.id === prompt.id 
        ? { ...p, usageCount: p.usageCount + 1, lastUsedAt: Date.now() } 
        : p
    ));
    
    setTimeout(() => setLastCopiedId(null), 2000);
  };

  const togglePin = (id: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === id ? { ...p, isPinned: !p.isPinned } : p
    ));
  };

  const handleDelete = (id: string) => {
    if (isCanonicalSeed(id)) {
      alert('Canonical seed prompts cannot be deleted.');
      return;
    }
    if (confirm('Delete this version?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleEdit = (prompt: AIPrompt) => {
    if (isCanonicalSeed(prompt.id)) {
      // Create a user-owned copy for editing instead of mutating canonical
      const copy: AIPrompt = {
        ...prompt,
        id: generateId(),
        parentId: prompt.id,
        origin: 'user',
        version: 1,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        usageCount: 0,
        isPinned: false,
      };
      setEditingPrompt(copy);
    } else {
      setEditingPrompt(prompt);
    }
    setIsModalOpen(true);
  };

  const openManualUpload = () => {
    setEditingPrompt(undefined);
    setIsModalOpen(true);
  };

  const handleSmartImport = (prompt: AIPrompt) => {
    setPrompts(prev => [prompt, ...prev]);
    if (prompt.folder && !customFolders.includes(prompt.folder) && prompt.folder !== 'General') {
      setCustomFolders(prev => [...prev, prompt.folder]);
    }
  };

  const handleSmartImportSkill = (prefill: Partial<Skill>) => {
    setSkillPrefill(prefill);
    setIsSmartImportOpen(false);
    setEditingSkill(undefined);
    setIsSkillModalOpen(true);
  };

  const handlePromptDetailClick = (prompt: AIPrompt) => {
    ensureBaselineSnapshot(prompt);
    setDetailPrompt(prompt);
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter new folder name:');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!customFolders.includes(trimmed)) {
        setCustomFolders(prev => [...prev, trimmed]);
      }
    }
  };

  const handleRenameFolder = (oldName: string) => {
    if (oldName === 'All') return;
    const newName = prompt(`Rename folder "${oldName}" to:`, oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
      const trimmed = newName.trim();
      setCustomFolders(prev => prev.map(f => f === oldName ? trimmed : f));
      setPrompts(prev => prev.map(p => p.folder === oldName ? { ...p, folder: trimmed } : p));
      setSkills(prev => prev.map(s => s.folder === oldName ? { ...s, folder: trimmed } : s));
      if (activeFolder === oldName) setActiveFolder(trimmed);
    }
  };

  const handleDeleteFolder = (name: string) => {
    if (name === 'All') return;
    const promptCount = prompts.filter(p => p.folder === name).length;
    const skillCount = skills.filter(s => s.folder === name).length;
    const totalCount = promptCount + skillCount;
    if (totalCount > 0) {
      if (!confirm(`Folder "${name}" contains ${totalCount} items. Move them to "General"?`)) return;
      setPrompts(prev => prev.map(p => p.folder === name ? { ...p, folder: 'General' } : p));
      setSkills(prev => prev.map(s => s.folder === name ? { ...s, folder: 'General' } : s));
    }
    setCustomFolders(prev => prev.filter(f => f !== name));
    if (activeFolder === name) setActiveFolder('All');
  };

  // SKILL HANDLERS
  const handleSaveSkill = (skill: Skill) => {
    setSkills(prev => {
      const existing = prev.find(s => s.id === skill.id);
      if (existing) {
        return prev.map(s => s.id === skill.id ? skill : s);
      }
      return [skill, ...prev];
    });
    
    if (skill.folder && !customFolders.includes(skill.folder) && skill.folder !== 'General') {
      setCustomFolders(prev => [...prev, skill.folder]);
    }
    
    setIsSkillModalOpen(false);
    setEditingSkill(undefined);
  };

  const handleImportSkill = (skill: Skill, newPrompts: AIPrompt[]) => {
    // Add new prompts first
    if (newPrompts.length > 0) {
      setPrompts(prev => [...newPrompts, ...prev]);
    }
    
    // Add the skill
    setSkills(prev => [skill, ...prev]);
    
    // Add folder if new
    if (skill.folder && !customFolders.includes(skill.folder) && skill.folder !== 'General') {
      setCustomFolders(prev => [...prev, skill.folder]);
    }
    
    const newPromptsCount = newPrompts.length;
    const linkedCount = skill.embeddedPromptIds.length - newPromptsCount;
    
    if (linkedCount > 0 && newPromptsCount > 0) {
      alert(`Skill "${skill.name}" imported with ${newPromptsCount} new prompt(s) and ${linkedCount} existing prompt(s) linked.`);
    } else if (linkedCount > 0) {
      alert(`Skill "${skill.name}" imported with ${linkedCount} existing prompt(s) linked.`);
    } else {
      alert(`Skill "${skill.name}" imported with ${newPromptsCount} new prompt(s).`);
    }
  };

  const handleDeleteSkill = (id: string) => {
    if (confirm('Delete this skill?')) {
      setSkills(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setIsSkillModalOpen(true);
  };

  const handleRunSkill = (skill: Skill) => {
    setRunningSkill(skill);
  };

  const handleRunComplete = (run: ExecutionRun) => {
    setExecutionHistory(prev => [run, ...prev]);
    if (run.objectType === 'skill') {
      setSkills(prev => prev.map(s => 
        s.id === run.objectId ? { ...s, usageCount: s.usageCount + 1, updatedAt: Date.now() } : s
      ));
    } else if (run.objectType === 'workflow') {
      setWorkflows(prev => prev.map(w => 
        w.id === run.objectId ? { ...w, usageCount: w.usageCount + 1, updatedAt: Date.now() } : w
      ));
    }
  };

  const toggleSkillPin = (id: string) => {
    setSkills(prev => prev.map(s => 
      s.id === id ? { ...s, isPinned: !s.isPinned } : s
    ));
  };

  const handleClearHistory = () => {
    if (confirm('Clear all execution history?')) {
      setExecutionHistory([]);
    }
  };

  // WORKFLOW HANDLERS
  const handleSaveWorkflow = (workflow: Workflow) => {
    setWorkflows(prev => {
      const existing = prev.find(w => w.id === workflow.id);
      if (existing) {
        return prev.map(w => w.id === workflow.id ? workflow : w);
      }
      return [workflow, ...prev];
    });
    
    if (workflow.folder && !customFolders.includes(workflow.folder) && workflow.folder !== 'General') {
      setCustomFolders(prev => [...prev, workflow.folder]);
    }
    
    setIsWorkflowModalOpen(false);
    setEditingWorkflow(undefined);
  };

  const handleImportWorkflow = (workflow: Workflow, matchedSkillIds: string[]) => {
    setWorkflows(prev => [workflow, ...prev]);
    
    if (workflow.folder && !customFolders.includes(workflow.folder) && workflow.folder !== 'General') {
      setCustomFolders(prev => [...prev, workflow.folder]);
    }
    
    alert(`Workflow "${workflow.name}" imported with ${matchedSkillIds.length} skill(s) linked.`);
  };

  const handleDeleteWorkflow = (id: string) => {
    if (confirm('Delete this workflow?')) {
      setWorkflows(prev => prev.filter(w => w.id !== id));
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsWorkflowModalOpen(true);
  };

  const handleRunWorkflow = (workflow: Workflow) => {
    setRunningWorkflow(workflow);
  };

  const toggleWorkflowPin = (id: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, isPinned: !w.isPinned } : w
    ));
  };

  const openNewWorkflow = () => {
    setEditingWorkflow(undefined);
    setIsWorkflowModalOpen(true);
  };

  // AGENT HANDLERS
  const handleSaveAgent = (agent: Agent) => {
    setAgents(prev => {
      const existing = prev.find(a => a.id === agent.id);
      if (existing) {
        return prev.map(a => a.id === agent.id ? agent : a);
      }
      return [agent, ...prev];
    });
    
    if (agent.folder && !customFolders.includes(agent.folder) && agent.folder !== 'General') {
      setCustomFolders(prev => [...prev, agent.folder]);
    }
    
    setIsAgentModalOpen(false);
    setEditingAgent(undefined);
  };

  const handleImportAgent = (agent: Agent) => {
    setAgents(prev => [agent, ...prev]);
    
    if (agent.folder && !customFolders.includes(agent.folder) && agent.folder !== 'General') {
      setCustomFolders(prev => [...prev, agent.folder]);
    }
    
    alert(`Agent "${agent.name}" imported successfully.`);
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm('Delete this agent?')) {
      setAgents(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsAgentModalOpen(true);
  };

  const handleToggleAgentStatus = (agent: Agent) => {
    setAgents(prev => prev.map(a => 
      a.id === agent.id 
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active', updatedAt: Date.now() } 
        : a
    ));
  };

  const toggleAgentPin = (id: string) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, isPinned: !a.isPinned } : a
    ));
  };

  const openNewAgent = () => {
    setEditingAgent(undefined);
    setIsAgentModalOpen(true);
  };

  // Navigation handlers
  const handleFolderSelect = (folder: string) => {
    setActiveFolder(folder);
    setMobileSidebarOpen(false);
  };

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    setMobileSidebarOpen(false);
  };

  const openNewSkill = () => {
    setEditingSkill(undefined);
    setSkillPrefill(undefined);
    setIsSkillModalOpen(true);
  };

  // Get counts for navigation
  const counts = {
    prompts: latestPrompts.length,
    skills: skills.length,
    workflows: workflows.length,
    agents: agents.length
  };

  // Get current section title
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'prompts': return activeFolder === 'All' ? 'All Prompts' : activeFolder;
      case 'skills': return activeFolder === 'All' ? 'All Skills' : activeFolder;
      case 'workflows': return 'Workflows';
      case 'agents': return 'Agents';
      case 'history': return 'Execution History';
    }
  };

  // Sidebar content
  const sidebarContent = (
    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0">
          <Layers className="text-accent-foreground" size={22} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground leading-none text-nowrap">Prompt Notebook</h1>
      </div>
      
      <nav className="space-y-10">
        {/* Create Buttons */}
        <div className="space-y-2">
          <button 
            onClick={() => { openManualUpload(); setMobileSidebarOpen(false); setActiveSection('prompts'); }}
            className="w-full flex items-center gap-3 px-5 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            NEW PROMPT
          </button>
          <button 
            onClick={() => { openNewSkill(); setMobileSidebarOpen(false); setActiveSection('skills'); }}
            className="w-full flex items-center gap-3 px-5 py-3.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          >
            <Zap size={18} />
            NEW SKILL
          </button>
          <button 
            onClick={() => { openNewWorkflow(); setMobileSidebarOpen(false); setActiveSection('workflows'); }}
            className="w-full flex items-center gap-3 px-5 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          >
            <GitBranch size={18} />
            NEW WORKFLOW
          </button>
          <button 
            onClick={() => { openNewAgent(); setMobileSidebarOpen(false); setActiveSection('agents'); }}
            className="w-full flex items-center gap-3 px-5 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          >
            <Bot size={18} />
            NEW AGENT
          </button>
        </div>

        {/* Quick Access */}
        {frequentlyUsed.length > 0 && activeSection === 'prompts' && (
          <div>
            <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Activity size={14} className="text-primary" /> Frequently Used
            </h3>
            <div className="space-y-1">
              {frequentlyUsed.map(p => (
                <div key={p.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all">
                  <button 
                    onClick={() => { handleEdit(p); setMobileSidebarOpen(false); }}
                    className="flex-1 text-left text-sm font-medium text-foreground/70 group-hover:text-foreground truncate pr-2"
                  >
                    {p.title}
                  </button>
                  <button 
                    onClick={() => handleCopy(p)}
                    className={`p-2 rounded-md transition-all ${lastCopiedId === p.id ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:text-primary hover:bg-primary/10'}`}
                    title="Quick Copy"
                  >
                    {lastCopiedId === p.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folders */}
        <div>
          <div className="flex items-center justify-between mb-4 group/header">
            <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wide flex items-center gap-2">
              <FolderIcon size={14} /> Folders / Clients
            </h3>
            <button 
              onClick={handleCreateFolder}
              className="p-1.5 hover:bg-muted rounded-md text-foreground/50 hover:text-foreground transition-colors"
              title="Create Folder"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {uniqueFolders.map(folder => (
              <div key={folder} className="group relative">
                <button
                  onClick={() => handleFolderSelect(folder)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeFolder === folder ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-muted/50'}`}
                >
                  <span className="flex items-center gap-2.5 overflow-hidden">
                    <ChevronRight size={14} className={activeFolder === folder ? 'rotate-90 text-primary transition-transform' : 'transition-transform opacity-50'} />
                    <span className="truncate">{folder}</span>
                  </span>
                  <span className="text-xs font-medium opacity-50 flex-shrink-0 ml-2">
                    {folder === 'All' 
                      ? (activeSection === 'skills' ? skills.length : prompts.length)
                      : (activeSection === 'skills' 
                          ? skills.filter(s => s.folder === folder).length 
                          : prompts.filter(p => p.folder === folder).length)}
                  </span>
                </button>
                {folder !== 'All' && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent">
                    <button onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder); }} className="p-1.5 hover:text-primary text-foreground/40 transition-colors"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }} className="p-1.5 hover:text-destructive text-foreground/40 transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Layers size={14} /> Categories
          </h3>
          <div className="space-y-1">
            {DEFAULT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Mobile sidebar drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-card border-r border-border flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-end p-4 border-b border-border">
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 hover:bg-muted rounded-lg text-foreground/60 hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="w-72 bg-card border-r border-border flex-col hidden lg:flex shrink-0">
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-18 border-b border-border flex items-center justify-between px-4 lg:px-8 bg-card sticky top-0 z-30 gap-3">
          {/* Mobile hamburger menu */}
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg text-foreground/60 hover:text-foreground transition-colors lg:hidden"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search library..."
              className="w-full bg-background border border-border rounded-full py-2.5 pl-12 pr-5 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm text-foreground placeholder:text-foreground/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {(activeSection === 'prompts' || activeSection === 'skills') && (
              <>
                {activeSection === 'prompts' && (
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileImport} 
                    accept=".json,.csv" 
                    className="hidden" 
                  />
                )}
                <button 
                  onClick={() => { 
                    setSmartImportDefaultMode(activeSection === 'skills' ? 'skill' : 'prompt');
                    setIsSmartImportOpen(true); 
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 rounded-lg text-sm font-bold text-accent-foreground transition-all"
                >
                  <Wand2 size={16} />
                  MAGIC IMPORT
                </button>
                {activeSection === 'prompts' && (
                  <button 
                    onClick={handleImportClick}
                    className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 rounded-lg text-sm font-bold text-secondary-foreground transition-all"
                  >
                    <Upload size={16} />
                    IMPORT
                  </button>
                )}

                {activeSection === 'prompts' && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 rounded-lg text-sm font-bold text-secondary-foreground transition-all"
                    >
                      <Download size={16} />
                      EXPORT
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-card-hover z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <button 
                          onClick={handleExportJSON}
                          className="w-full flex items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted transition-colors border-b border-border"
                        >
                          <FileJson size={16} className="text-primary" />
                          Export as JSON
                        </button>
                        <button 
                          onClick={handleExportCSV}
                          className="w-full flex items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <FileSpreadsheet size={16} className="text-accent" />
                          Export as CSV
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'skills' && (
                  <button 
                    onClick={() => setIsSkillImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 rounded-lg text-sm font-bold text-secondary-foreground transition-all"
                  >
                    <Upload size={16} />
                    JSON IMPORT
                  </button>
                )}
              </>
            )}

            {activeSection === 'workflows' && (
              <button 
                onClick={() => setIsWorkflowImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 rounded-lg text-sm font-bold text-secondary-foreground transition-all"
              >
                <Upload size={16} />
                IMPORT
              </button>
            )}

            {activeSection === 'agents' && (
              <button 
                onClick={() => setIsAgentImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 rounded-lg text-sm font-bold text-secondary-foreground transition-all"
              >
                <Upload size={16} />
                IMPORT
              </button>
            )}
             
            <div className="flex items-center gap-1 bg-muted p-1.5 rounded-lg">
              <button onClick={() => setViewMode(ViewMode.GRID)} className={`p-2 rounded-md transition-all ${viewMode === ViewMode.GRID ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:text-foreground'}`}><Grid size={18} /></button>
              <button onClick={() => setViewMode(ViewMode.TABLE)} className={`p-2 rounded-md transition-all ${viewMode === ViewMode.TABLE ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:text-foreground'}`}><TableIcon size={18} /></button>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Zap className="text-primary" size={16} />
              <span className="text-sm font-semibold text-foreground/60">
                {activeSection === 'prompts' && `${filteredPrompts.length} Prompts`}
                {activeSection === 'skills' && `${filteredSkills.length} Skills`}
                {activeSection === 'workflows' && `${filteredWorkflows.length} Workflows`}
                {activeSection === 'agents' && `${filteredAgents.length} Agents`}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Navigation Tabs */}
            <NavigationTabs
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              navigationView={navigationView}
              onViewChange={setNavigationView}
              counts={counts}
            />

            {/* Capability View */}
            {navigationView === 'capability' && (
              <CapabilityView
                prompts={latestPrompts}
                skills={skills}
                workflows={workflows}
                agents={agents}
                activeCategory={activeCategory}
                onCategorySelect={handleCategorySelect}
                onPromptClick={handleEdit}
                onSkillClick={handleEditSkill}
                onWorkflowClick={() => {}}
                onAgentClick={() => {}}
              />
            )}

            {/* Object View Content */}
            {navigationView === 'object' && (
              <>
                {/* Section Header */}
                {activeSection !== 'history' && (
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground flex items-center gap-4">
                        {getSectionTitle()}
                        <span className="px-3 py-1 text-xs bg-primary/15 text-primary rounded-full font-semibold">
                          {activeCategory}
                        </span>
                      </h2>
                      <p className="text-foreground/60 text-base mt-2">
                        {activeSection === 'prompts' && 'Organize and manage your prompt library.'}
                        {activeSection === 'skills' && 'Bundle prompts into reusable AI capabilities.'}
                        {activeSection === 'workflows' && 'Chain skills into automated sequences.'}
                        {activeSection === 'agents' && 'Deploy automated workflow executors.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* PROMPTS SECTION */}
                {activeSection === 'prompts' && (
                  <>
                    {filteredPrompts.length > 0 ? (
                      <>
                        {viewMode === ViewMode.TABLE ? (
                          <div className="overflow-hidden bg-card rounded-2xl shadow-soft">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                  <th className="p-5 text-xs font-bold text-foreground/60 uppercase tracking-wide">Name</th>
                                  <th className="p-5 text-xs font-bold text-foreground/60 uppercase tracking-wide text-center">Pin</th>
                                  <th className="p-5 text-xs font-bold text-foreground/60 uppercase tracking-wide text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {filteredPrompts.map(prompt => (
                                  <tr 
                                    key={prompt.id} 
                                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                    onClick={() => handlePromptDetailClick(prompt)}
                                  >
                                    <td className="p-5">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{prompt.title}</span>
                                        <span className="text-sm text-foreground/60">{prompt.description}</span>
                                      </div>
                                    </td>
                                    <td className="p-5 text-center">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); togglePin(prompt.id); }}
                                        className={`p-2.5 rounded-lg transition-all ${prompt.isPinned ? 'text-amber bg-amber/10' : 'text-foreground/40 hover:text-foreground'}`}
                                      >
                                        <Star size={16} fill={prompt.isPinned ? 'currentColor' : 'none'} />
                                      </button>
                                    </td>
                                    <td className="p-5 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleCopy(prompt); }} className={`p-2.5 rounded-lg transition-all ${lastCopiedId === prompt.id ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground/60 hover:text-foreground'}`}><Check size={16} className={lastCopiedId === prompt.id ? 'block' : 'hidden'} /><Copy size={16} className={lastCopiedId === prompt.id ? 'hidden' : 'block'} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(prompt); }} className="p-2.5 bg-muted text-foreground/60 hover:text-foreground rounded-lg transition-all"><Edit3 size={16} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(prompt.id); }} className="p-2.5 bg-muted text-foreground/60 hover:text-destructive rounded-lg transition-all"><Trash2 size={16} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPrompts.map(prompt => (
                              <PromptCard
                                key={prompt.id}
                                prompt={prompt}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onCopy={() => handleCopy(prompt)}
                                onTogglePin={() => togglePin(prompt.id)}
                                onUpdatePrompt={handleUpdatePrompt}
                                isCopied={lastCopiedId === prompt.id}
                                versionCount={groupedPrompts.get(prompt.parentId || prompt.id)?.length}
                                onClick={() => handlePromptDetailClick(prompt)}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-32 bg-card border border-border border-dashed rounded-3xl text-center">
                        <Search size={48} className="text-foreground/20 mb-6" />
                        <h3 className="text-2xl font-bold mb-2 text-foreground">No prompts found</h3>
                        <p className="text-foreground/60 text-base">Refine your search or add a new prompt.</p>
                      </div>
                    )}
                  </>
                )}

                {/* SKILLS SECTION */}
                {activeSection === 'skills' && (
                  <>
                    {filteredSkills.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSkills.map(skill => (
                          <SkillCard
                            key={skill.id}
                            skill={skill}
                            promptCount={skill.embeddedPromptIds.length}
                            onEdit={handleEditSkill}
                            onDelete={handleDeleteSkill}
                            onRun={handleRunSkill}
                            onTogglePin={() => toggleSkillPin(skill.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-32 bg-card border border-border border-dashed rounded-3xl text-center">
                        <Zap size={48} className="text-foreground/20 mb-6" />
                        <h3 className="text-2xl font-bold mb-2 text-foreground">No skills yet</h3>
                        <p className="text-foreground/60 text-base mb-6">Create your first skill to bundle prompts into a reusable capability.</p>
                        <button 
                          onClick={openNewSkill}
                          className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl text-sm font-bold transition-all"
                        >
                          <Plus size={18} />
                          CREATE SKILL
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* WORKFLOWS SECTION */}
                {activeSection === 'workflows' && (
                  <>
                    {filteredWorkflows.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredWorkflows.map(workflow => (
                          <WorkflowCard
                            key={workflow.id}
                            workflow={workflow}
                            skillCount={workflow.skillIds.length}
                            onEdit={handleEditWorkflow}
                            onDelete={handleDeleteWorkflow}
                            onRun={handleRunWorkflow}
                            onTogglePin={() => toggleWorkflowPin(workflow.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-32 bg-card border border-border border-dashed rounded-3xl text-center">
                        <GitBranch size={48} className="text-foreground/20 mb-6" />
                        <h3 className="text-2xl font-bold mb-2 text-foreground">No workflows yet</h3>
                        <p className="text-foreground/60 text-base mb-6">Chain skills into automated sequences.</p>
                        <button 
                          onClick={openNewWorkflow}
                          className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl text-sm font-bold transition-all"
                        >
                          <Plus size={18} />
                          CREATE WORKFLOW
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* AGENTS SECTION */}
                {activeSection === 'agents' && (
                  <>
                    {filteredAgents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredAgents.map(agent => (
                          <AgentCard
                            key={agent.id}
                            agent={agent}
                            workflowName={workflows.find(w => w.id === agent.linkedWorkflowId)?.name}
                            onEdit={handleEditAgent}
                            onDelete={handleDeleteAgent}
                            onToggleStatus={handleToggleAgentStatus}
                            onTogglePin={() => toggleAgentPin(agent.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-32 bg-card border border-border border-dashed rounded-3xl text-center">
                        <Bot size={48} className="text-foreground/20 mb-6" />
                        <h3 className="text-2xl font-bold mb-2 text-foreground">No agents yet</h3>
                        <p className="text-foreground/60 text-base mb-6">Deploy automated workflow executors.</p>
                        <button 
                          onClick={openNewAgent}
                          className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl text-sm font-bold transition-all"
                        >
                          <Plus size={18} />
                          CREATE AGENT
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* HISTORY SECTION */}
                {activeSection === 'history' && (
                  <ExecutionHistory
                    runs={executionHistory}
                    onClearHistory={handleClearHistory}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <PromptModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPrompt(undefined); }}
        onSave={handleSavePrompt}
        prompt={editingPrompt}
        availableFolders={customFolders}
        onOpenHistory={editingPrompt ? () => setHistoryPrompt(editingPrompt) : undefined}
      />

      <SkillModal
        isOpen={isSkillModalOpen}
        onClose={() => { setIsSkillModalOpen(false); setEditingSkill(undefined); setSkillPrefill(undefined); }}
        onSave={handleSaveSkill}
        skill={editingSkill}
        availableFolders={customFolders}
        availablePrompts={latestPrompts}
        prefill={skillPrefill}
      />

      {runningSkill && (
        <RunSkillModal
          isOpen={!!runningSkill}
          onClose={() => setRunningSkill(undefined)}
          skill={runningSkill}
          prompts={latestPrompts}
          onRunComplete={handleRunComplete}
        />
      )}

      <SkillImportModal
        isOpen={isSkillImportModalOpen}
        onClose={() => setIsSkillImportModalOpen(false)}
        onImport={handleImportSkill}
        existingPrompts={latestPrompts}
      />

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => { setIsWorkflowModalOpen(false); setEditingWorkflow(undefined); }}
        onSave={handleSaveWorkflow}
        workflow={editingWorkflow}
        availableFolders={customFolders}
        availableSkills={skills}
      />

      {runningWorkflow && (
        <RunWorkflowModal
          isOpen={!!runningWorkflow}
          onClose={() => setRunningWorkflow(undefined)}
          workflow={runningWorkflow}
          skills={skills}
          prompts={latestPrompts}
          onRunComplete={handleRunComplete}
        />
      )}

      <WorkflowImportModal
        isOpen={isWorkflowImportModalOpen}
        onClose={() => setIsWorkflowImportModalOpen(false)}
        onImport={handleImportWorkflow}
        existingSkills={skills}
      />

      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => { setIsAgentModalOpen(false); setEditingAgent(undefined); }}
        onSave={handleSaveAgent}
        agent={editingAgent}
        availableFolders={customFolders}
        availableWorkflows={workflows}
      />

      <AgentImportModal
        isOpen={isAgentImportModalOpen}
        onClose={() => setIsAgentImportModalOpen(false)}
        onImport={handleImportAgent}
        existingWorkflows={workflows}
      />

      <SmartImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        onImport={handleSmartImport}
        onImportSkill={handleSmartImportSkill}
        availableFolders={customFolders}
        defaultMode={smartImportDefaultMode}
      />

      {detailPrompt && (
        <PromptDetailModal
          isOpen={!!detailPrompt}
          onClose={() => { setDetailPrompt(undefined); setDetailVarValues({}); }}
          prompt={detailPrompt}
          onOpenHistory={() => setHistoryPrompt(detailPrompt)}
          onUpdateCurrent={handleUpdateCurrent}
          onSaveNewVersion={handleSaveNewVersion}
          initialVarValues={detailVarValues}
        />
      )}

      {historyPrompt && (
        <VersionHistoryDrawer
          isOpen={!!historyPrompt}
          prompt={historyPrompt}
          versions={getVersionsForPrompt(historyPrompt)}
          onClose={() => setHistoryPrompt(undefined)}
          onRestore={handleRestoreVersion}
          onDeleteVersion={handleDeleteVersion}
          onSelectVersion={handleSelectVersion}
        />
      )}
    </div>
  );
};

export default Index;
