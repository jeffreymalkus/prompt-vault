import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AIPrompt, DEFAULT_CATEGORIES, ViewMode } from '../types';
import { PromptCard } from '../components/PromptCard';
import { PromptModal } from '../components/PromptModal';
import { 
  Search, 
  Plus, 
  Grid, 
  Table as TableIcon,
  Vault, 
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
  Upload
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
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and seed
  useEffect(() => {
    const savedPrompts = localStorage.getItem('prompt_vault_data_v2');
    const savedFolders = localStorage.getItem('prompt_vault_folders');
    
    if (savedPrompts) {
      try {
        const parsed = JSON.parse(savedPrompts);
        setPrompts(parsed);
      } catch (e) {
        console.error('Failed to load prompts', e);
      }
    } else {
      const now = Date.now();
      const initial: AIPrompt[] = [
        {
          id: '1',
          title: 'Expert Persona Framework',
          content: 'Act as an expert [ROLE] with 20 years of experience in [INDUSTRY]. Your goal is to [GOAL]. Use professional language and provide deep, nuanced insights.',
          description: 'The standard for high-quality persona generation.',
          notes: 'Uses persona adoption and industry anchoring to reduce generic responses.',
          category: 'Analysis',
          tags: ['persona', 'expert'],
          folder: 'Core Frameworks',
          type: 'system',
          version: 1,
          createdAt: now - 1000,
          lastUsedAt: now,
          usageCount: 15,
          isPinned: true,
          variables: ['ROLE', 'INDUSTRY', 'GOAL']
        },
        {
          id: '2',
          title: 'Step-by-Step Reasoning (CoT)',
          content: 'Solve the following: [PROBLEM]. Before answering, think through the solution step-by-step. Show your logical work for each transition.',
          description: 'Uses Chain-of-Thought to increase accuracy.',
          notes: 'Critical for mathematical or complex logic tasks. Forcing internal monologue reduces hallucination.',
          category: 'Analysis',
          tags: ['logic', 'reasoning'],
          folder: 'Core Frameworks',
          type: 'user',
          version: 1,
          createdAt: now - 2000,
          lastUsedAt: now,
          usageCount: 8,
          isPinned: false,
          variables: ['PROBLEM']
        }
      ];
      setPrompts(initial);
      localStorage.setItem('prompt_vault_data_v2', JSON.stringify(initial));
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
  }, []);

  useEffect(() => {
    localStorage.setItem('prompt_vault_data_v2', JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem('prompt_vault_folders', JSON.stringify(customFolders));
  }, [customFolders]);

  const uniqueFolders = useMemo(() => {
    const fromPrompts = prompts.map(p => p.folder);
    const combined = Array.from(new Set(['All', ...customFolders, ...fromPrompts]));
    return combined;
  }, [prompts, customFolders]);

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
            id: Math.random().toString(36).substring(2, 9),
            title: p.title || 'Untitled',
            content: p.content || '',
            description: p.description || '',
            notes: p.notes || '',
            category: p.category || 'Creative',
            folder: p.folder || 'General',
            type: p.type || 'user',
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
      const existingIds = new Set(prev.map(p => p.id));
      const filtered = newPrompts.filter(p => !existingIds.has(p.id));
      const newFolders = Array.from(new Set(newPrompts.map(p => p.folder)));
      setCustomFolders(prevFolders => Array.from(new Set([...prevFolders, ...newFolders])));
      
      if (filtered.length === 0) {
        alert('All prompts in the file already exist in your notebook.');
        return prev;
      }
      
      alert(`Successfully imported ${filtered.length} new prompts.`);
      return [...filtered, ...prev];
    });
  };

  const handleSavePrompt = (data: Partial<AIPrompt>, saveAsNewVersion: boolean) => {
    if (editingPrompt && !saveAsNewVersion) {
      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, ...data } as AIPrompt : p));
    } else {
      const newPrompt: AIPrompt = {
        id: Math.random().toString(36).substring(2, 9),
        title: data.title || 'Untitled',
        content: data.content || '',
        description: data.description || '',
        notes: data.notes || '',
        category: data.category || 'Creative',
        folder: data.folder || 'General',
        type: data.type || 'user',
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
    if (confirm('Delete this version?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleEdit = (prompt: AIPrompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  const openManualUpload = () => {
    setEditingPrompt(undefined);
    setIsModalOpen(true);
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
      if (activeFolder === oldName) setActiveFolder(trimmed);
    }
  };

  const handleDeleteFolder = (name: string) => {
    if (name === 'All') return;
    const count = prompts.filter(p => p.folder === name).length;
    if (count > 0) {
      if (!confirm(`Folder "${name}" contains ${count} prompts. Move them to "General"?`)) return;
      setPrompts(prev => prev.map(p => p.folder === name ? { ...p, folder: 'General' } : p));
    }
    setCustomFolders(prev => prev.filter(f => f !== name));
    if (activeFolder === name) setActiveFolder('All');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <aside className="w-72 bg-card border-r border-border flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0">
              <Layers className="text-accent-foreground" size={22} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-none text-nowrap">Prompt Notebook</h1>
          </div>
          
          <nav className="space-y-10">
            <div className="space-y-3">
              <button 
                onClick={openManualUpload}
                className="w-full flex items-center gap-3 px-5 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              >
                <Plus size={18} />
                NEW PROMPT
              </button>
            </div>

            {frequentlyUsed.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-primary" /> Frequently Used
                </h3>
                <div className="space-y-1">
                  {frequentlyUsed.map(p => (
                    <div key={p.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all">
                      <button 
                        onClick={() => handleEdit(p)}
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
                      onClick={() => setActiveFolder(folder)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeFolder === folder ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:bg-muted/50'}`}
                    >
                      <span className="flex items-center gap-2.5 overflow-hidden">
                        <ChevronRight size={14} className={activeFolder === folder ? 'rotate-90 text-primary transition-transform' : 'transition-transform opacity-50'} />
                        <span className="truncate">{folder}</span>
                      </span>
                      <span className="text-xs font-medium opacity-50 flex-shrink-0 ml-2">
                        {prompts.filter(p => folder === 'All' || p.folder === folder).length}
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

            <div>
              <h3 className="text-xs font-bold text-foreground/60 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Layers size={14} /> Categories
              </h3>
              <div className="space-y-1">
                {DEFAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? 'bg-primary/15 text-primary' : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-18 border-b border-border flex items-center justify-between px-8 bg-card sticky top-0 z-30">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search library and notes..."
              className="w-full bg-background border border-border rounded-full py-2.5 pl-12 pr-5 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm text-foreground placeholder:text-foreground/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileImport} 
               accept=".json,.csv" 
               className="hidden" 
             />
             <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 rounded-lg text-sm font-bold text-secondary-foreground transition-all"
              >
                <Upload size={16} />
                IMPORT
              </button>

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
             
             <div className="flex items-center gap-1 bg-muted p-1.5 rounded-lg">
              <button onClick={() => setViewMode(ViewMode.GRID)} className={`p-2 rounded-md transition-all ${viewMode === ViewMode.GRID ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:text-foreground'}`}><Grid size={18} /></button>
              <button onClick={() => setViewMode(ViewMode.TABLE)} className={`p-2 rounded-md transition-all ${viewMode === ViewMode.TABLE ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:text-foreground'}`}><TableIcon size={18} /></button>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Zap className="text-primary" size={16} />
              <span className="text-sm font-semibold text-foreground/60">{prompts.length} Prompts</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-4">
                  {activeFolder === 'All' ? 'All Prompts' : activeFolder}
                  <span className="px-3 py-1 text-xs bg-primary/15 text-primary rounded-full font-semibold">
                    {activeCategory}
                  </span>
                </h2>
                <p className="text-foreground/60 text-base mt-2">Organize and manage your library.</p>
              </div>
            </div>

            {filteredPrompts.length > 0 ? (
              <>
                {viewMode === ViewMode.TABLE ? (
                  <div className="overflow-hidden bg-card rounded-2xl shadow-soft">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="p-5 text-xs font-bold text-foreground/60 uppercase tracking-wide">Type</th>
                          <th className="p-5 text-xs font-bold text-foreground/60 uppercase tracking-wide">Name</th>
                          <th className="p-5 text-xs font-bold text-foreground/60 uppercase tracking-wide text-center">Pin</th>
                          <th className="p-5 text-xs font-bold text-foreground/60 uppercase tracking-wide text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredPrompts.map(prompt => (
                          <tr key={prompt.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="p-5">
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md ${
                                prompt.type === 'system' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                              }`}>
                                {prompt.type}
                              </span>
                            </td>
                            <td className="p-5">
                              <div className="flex flex-col gap-1">
                                <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{prompt.title}</span>
                                <span className="text-sm text-foreground/60">v{prompt.version} • {prompt.description}</span>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <button 
                                onClick={() => togglePin(prompt.id)}
                                className={`p-2.5 rounded-lg transition-all ${prompt.isPinned ? 'text-amber bg-amber/10' : 'text-foreground/40 hover:text-foreground'}`}
                              >
                                <Star size={16} fill={prompt.isPinned ? 'currentColor' : 'none'} />
                              </button>
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleCopy(prompt)} className={`p-2.5 rounded-lg transition-all ${lastCopiedId === prompt.id ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground/60 hover:text-foreground'}`}><Check size={16} className={lastCopiedId === prompt.id ? 'block' : 'hidden'} /><Copy size={16} className={lastCopiedId === prompt.id ? 'hidden' : 'block'} /></button>
                                <button onClick={() => handleEdit(prompt)} className="p-2.5 bg-muted text-foreground/60 hover:text-foreground rounded-lg transition-all"><Edit3 size={16} /></button>
                                <button onClick={() => handleDelete(prompt.id)} className="p-2.5 bg-muted text-foreground/60 hover:text-destructive rounded-lg transition-all"><Trash2 size={16} /></button>
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
                        isCopied={lastCopiedId === prompt.id}
                        versionCount={groupedPrompts.get(prompt.parentId || prompt.id)?.length}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-card border border-border border-dashed rounded-3xl text-center">
                <Search size={48} className="text-foreground/20 mb-6" />
                <h3 className="text-2xl font-bold mb-2 text-foreground">No prompts found</h3>
                <p className="text-foreground/60 text-base">Refine your search or try adding a new workflow.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <PromptModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPrompt(undefined); }}
        onSave={handleSavePrompt}
        prompt={editingPrompt}
        availableFolders={customFolders}
      />
    </div>
  );
};

export default Index;
