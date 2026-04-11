
import React, { useState, useEffect } from 'react';
import { Bookmark, History, Highlighter, Plus, Trash2, X, ChevronRight, UploadCloud, ChevronLeft, MessageSquare, Clock, Scroll, Save, Download, CheckCircle, Loader2, Book } from 'lucide-react';
import { Note, Highlight, HistoryEntry, ConfessionItem, ConfessionHighlight } from '../types';
import { getStoredNotes, getStoredHighlights, getStoredHistory, deleteNote, deleteHighlight, saveNote, saveConfessions, getStoredConfessions, getStoredConfessionHighlights, deleteConfessionHighlight } from '../services/db';
import ImportBibleModal from './ImportBibleModal';
import { MOCK_CONFESSIONS } from '../constants';

type ViewMode = 'main' | 'notes' | 'highlights' | 'history' | 'saved_confessions';

// Fix: The component was truncated and lacked a return statement, causing a 'void' return type error.
// Added proper return logic based on the 'view' state and a default export to fix the App.tsx import error.
const Library: React.FC = () => {
  const [view, setView] = useState<ViewMode>('main');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [isInstallingDefaults, setIsInstallingDefaults] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [confessionHighlights, setConfessionHighlights] = useState<ConfessionHighlight[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', reference: '' });

  const loadData = async () => {
    const [n, hl, chl, h] = await Promise.all([
      getStoredNotes(), 
      getStoredHighlights(), 
      getStoredConfessionHighlights(),
      getStoredHistory()
    ]);
    setNotes(n.sort((a, b) => b.createdAt - a.createdAt));
    setHighlights(hl.sort((a, b) => b.createdAt - a.createdAt));
    setConfessionHighlights(chl.sort((a, b) => b.createdAt - a.createdAt));
    setHistory(h.sort((a, b) => b.timestamp - a.timestamp));
  };

  useEffect(() => { loadData(); }, [view]);

  const handleInstallDefaults = async () => {
    setIsInstallingDefaults(true);
    try {
      await saveConfessions(MOCK_CONFESSIONS as ConfessionItem[]);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
      loadData();
    } catch (e) { console.error(e); } finally { setIsInstallingDefaults(false); }
  };

  const handleSaveNote = async () => {
    if (!newNote.title || !newNote.content) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      reference: newNote.reference || 'Geral',
      createdAt: Date.now()
    };
    await saveNote(note);
    setNewNote({ title: '', content: '', reference: '' });
    setShowAddNoteModal(false);
    loadData();
  };

  const renderMain = () => (
    <div className="space-y-6 p-6">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-black text-petrol-900 dark:text-white mb-2">Biblioteca</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Seus registros, marcações e ferramentas de estudo.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {[
          { id: 'notes', label: 'Minhas Anotações', icon: MessageSquare, color: 'bg-blue-50 text-blue-600', count: notes.length },
          { id: 'highlights', label: 'Favoritos', icon: Highlighter, color: 'bg-gold-50 text-gold-600', count: highlights.length + confessionHighlights.length },
          { id: 'history', label: 'Histórico', icon: Clock, color: 'bg-gray-50 text-gray-600', count: history.length },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewMode)}
            className="flex items-center justify-between p-5 bg-white dark:bg-navy-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm active-ripple hover:border-petrol-200"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${item.color} dark:bg-opacity-10`}>
                <item.icon size={24} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-gray-900 dark:text-white">{item.label}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{item.count} registros</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        ))}
      </div>

      <div className="pt-10 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Ferramentas de Dados</h2>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex flex-col items-center gap-3 p-6 bg-petrol-600 rounded-3xl text-white shadow-xl active:scale-95 transition-transform"
          >
            <UploadCloud size={28} />
            <span className="text-[10px] font-black uppercase tracking-wider">Importar</span>
          </button>
          <button 
            onClick={handleInstallDefaults}
            disabled={isInstallingDefaults}
            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-dashed transition-all active:scale-95
              ${installSuccess ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white dark:bg-navy-800 border-gray-200 dark:border-gray-700 text-gray-400'}
            `}
          >
            {isInstallingDefaults ? <Loader2 size={28} className="animate-spin" /> : installSuccess ? <CheckCircle size={28} /> : <Save size={28} />}
            <span className="text-[10px] font-black uppercase tracking-wider">{installSuccess ? 'Pronto!' : 'Resetar Padrões'}</span>
          </button>
        </div>
      </div>
      
      {showImportModal && <ImportBibleModal onClose={() => setShowImportModal(false)} onSuccess={() => loadData()} />}
    </div>
  );

  const renderNotes = () => (
    <div className="animate-fade-in flex flex-col h-full bg-paper-50 dark:bg-navy-900 p-6">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setView('main')} className="p-3 bg-white dark:bg-navy-800 rounded-full shadow-md text-gray-600 active-ripple"><ChevronLeft size={20} /></button>
        <h2 className="font-serif text-2xl font-black text-petrol-900 dark:text-white">Anotações</h2>
        <button onClick={() => setShowAddNoteModal(true)} className="bg-petrol-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 active-ripple transition-transform"><Plus size={24} /></button>
      </div>

      {showAddNoteModal && (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-3xl border border-petrol-500/30 mb-6 shadow-xl animate-fade-in">
          <input 
            type="text" 
            placeholder="Título" 
            className="w-full bg-gray-50 dark:bg-navy-900 border-none rounded-xl mb-3 p-3 text-sm font-bold"
            value={newNote.title}
            onChange={e => setNewNote({...newNote, title: e.target.value})}
          />
          <input 
            type="text" 
            placeholder="Referência (ex: Romanos 8:1)" 
            className="w-full bg-gray-50 dark:bg-navy-900 border-none rounded-xl mb-3 p-3 text-[10px] font-bold uppercase tracking-widest"
            value={newNote.reference}
            onChange={e => setNewNote({...newNote, reference: e.target.value})}
          />
          <textarea 
            placeholder="Conteúdo da anotação..." 
            className="w-full bg-gray-50 dark:bg-navy-900 border-none rounded-xl mb-4 p-3 text-sm min-h-[120px]"
            value={newNote.content}
            onChange={e => setNewNote({...newNote, content: e.target.value})}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveNote} className="flex-1 bg-petrol-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Salvar</button>
            <button onClick={() => setShowAddNoteModal(false)} className="px-5 py-3 bg-gray-100 dark:bg-navy-700 text-gray-500 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4 pb-20">
        {notes.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma anotação registrada.</div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-white dark:bg-navy-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative group">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-petrol-600 bg-petrol-50 dark:bg-petrol-900/30 px-3 py-1 rounded-xl">{note.reference}</span>
                <button onClick={() => deleteNote(note.id).then(loadData)} className="text-gray-300 hover:text-red-500 active:scale-90 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{note.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-4 italic">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderHighlights = () => (
    <div className="animate-fade-in flex flex-col h-full bg-paper-50 dark:bg-navy-900 p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('main')} className="p-3 bg-white dark:bg-navy-800 rounded-full shadow-md text-gray-600 active-ripple"><ChevronLeft size={20} /></button>
        <h2 className="font-serif text-2xl font-black text-petrol-900 dark:text-white">Favoritos</h2>
      </div>
      <div className="space-y-4 pb-20">
        {highlights.map(hl => (
          <div key={hl.id} className="bg-white dark:bg-navy-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative group">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gold-600 bg-gold-50 dark:bg-gold-900/20 px-3 py-1 rounded-xl">{hl.reference}</span>
                <button onClick={() => deleteHighlight(hl.id).then(loadData)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
             </div>
             <p className="font-serif italic text-gray-800 dark:text-gray-200 leading-relaxed text-lg">"{hl.text}"</p>
          </div>
        ))}
        {confessionHighlights.map(ch => (
          <div key={ch.id} className="bg-white dark:bg-navy-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm border-l-4 border-l-petrol-500 relative group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-petrol-600 bg-petrol-50 dark:bg-petrol-900/30 px-3 py-1 rounded-xl">{ch.source} - {ch.reference}</span>
              <button onClick={() => deleteConfessionHighlight(ch.id).then(loadData)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
            </div>
            <h4 className="font-bold text-sm mb-2 text-gray-900 dark:text-white leading-tight">{ch.question}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-3 leading-relaxed">{ch.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-fade-in flex flex-col h-full bg-paper-50 dark:bg-navy-900 p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('main')} className="p-3 bg-white dark:bg-navy-800 rounded-full shadow-md text-gray-600 active-ripple"><ChevronLeft size={20} /></button>
        <h2 className="font-serif text-2xl font-black text-petrol-900 dark:text-white">Histórico</h2>
      </div>
      <div className="space-y-3 pb-20">
        {history.map(entry => (
          <div key={entry.id} className="flex items-center justify-between p-5 bg-white dark:bg-navy-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-50 dark:bg-navy-900 rounded-xl text-gray-400">
                {entry.type === 'bible' ? <Book size={18}/> : <Scroll size={18}/>}
              </div>
              <div>
                <span className="block font-bold text-gray-900 dark:text-white">{entry.reference}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{new Date(entry.timestamp).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Return the appropriate view based on the state
  switch (view) {
    case 'notes': return renderNotes();
    case 'highlights':
    case 'saved_confessions': return renderHighlights();
    case 'history': return renderHistory();
    default: return renderMain();
  }
};

export default Library;
