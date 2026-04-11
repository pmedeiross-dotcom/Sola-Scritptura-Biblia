
import React, { useState, useRef } from 'react';
import { Upload, X, FileType, CheckCircle, AlertCircle, Loader2, Book, Scroll, LibraryBig } from 'lucide-react';
import { processFile } from '../services/importer';
import { saveBibleVersion, saveConfessions, saveDictionaries } from '../services/db';

interface ImportBibleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ImportBibleModal: React.FC<ImportBibleModalProps> = ({ onClose, onSuccess }) => {
  const [importType, setImportType] = useState<'bible' | 'confession' | 'dictionary'>('bible');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<{ count: number, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const startImport = async () => {
    if (!file) return;
    try {
      setErrorMessage('');
      setStatus('processing');
      const result = await processFile(file, importType);
      
      if (!result.data || result.data.length === 0) {
        throw new Error("O arquivo foi lido, mas nenhum dado válido foi encontrado.");
      }

      setStats({ count: result.data.length, name: result.meta?.name || file.name });
      setStatus('saving');
      
      if (importType === 'bible') {
        await saveBibleVersion(result.meta, result.data);
      } else if (importType === 'confession') {
        await saveConfessions(result.data);
      } else {
        await saveDictionaries(result.data);
      }
      
      setStatus('success');
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err: any) {
      console.error("Erro na importação:", err);
      setStatus('error');
      setErrorMessage(err.message || "Falha na importação do arquivo.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white dark:bg-navy-800 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">Importar Recurso</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Processamento Local</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-navy-700 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {status === 'idle' || status === 'error' ? (
            <div className="space-y-6">
              <div className="flex bg-gray-100 dark:bg-navy-900 p-1 rounded-2xl">
                <button 
                  onClick={() => { setImportType('bible'); setFile(null); }}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-tighter ${importType === 'bible' ? 'bg-white dark:bg-navy-700 shadow-sm text-petrol-600 dark:text-petrol-400' : 'text-gray-400'}`}
                >
                  <Book size={16} /> Bíblia
                </button>
                <button 
                  onClick={() => { setImportType('confession'); setFile(null); }}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-tighter ${importType === 'confession' ? 'bg-white dark:bg-navy-700 shadow-sm text-petrol-600 dark:text-petrol-400' : 'text-gray-400'}`}
                >
                  <Scroll size={16} /> Confissão
                </button>
                <button 
                  onClick={() => { setImportType('dictionary'); setFile(null); }}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-tighter ${importType === 'dictionary' ? 'bg-white dark:bg-navy-700 shadow-sm text-petrol-600 dark:text-petrol-400' : 'text-gray-400'}`}
                >
                  <LibraryBig size={16} /> Dicionário
                </button>
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all
                  ${dragActive ? 'border-petrol-500 bg-petrol-50 dark:bg-petrol-900/20' : 'border-gray-300 dark:border-gray-600'}
                  ${file ? 'border-petrol-500 bg-petrol-50/50' : ''}`}
                onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileType size={40} className="text-petrol-600" />
                    <span className="font-bold text-gray-800 dark:text-gray-100 text-sm break-all">{file.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full active-ripple">Trocar Arquivo</button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Arraste ou selecione o JSON</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{importType === 'bible' ? '.json, .sqlite, .zip' : '.json'}</p>
                    <input ref={fileInputRef} type="file" className="hidden" accept={importType === 'bible' ? ".json,.sqlite,.sqlite3,.zip" : ".json"} onChange={handleChange} />
                  </>
                )}
              </div>

              {status === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-start gap-3 text-red-600 border border-red-100 dark:border-red-900/30 animate-fade-in">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Falha na Importação</p>
                    <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
              {status === 'success' ? (
                <>
                  <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-full mb-6">
                    <CheckCircle size={48} className="text-green-500 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Importação Concluída!</h3>
                  <p className="text-sm text-gray-500 mt-2">{stats?.count.toLocaleString()} registros foram salvos com sucesso no seu dispositivo.</p>
                </>
              ) : (
                <>
                  <Loader2 size={48} className="text-petrol-600 animate-spin mb-6" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{status === 'processing' ? 'Lendo Arquivo...' : 'Salvando no Banco Local...'}</h3>
                  <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns segundos dependendo do tamanho do arquivo.</p>
                </>
              )}
            </div>
          )}
        </div>

        {(status === 'idle' || status === 'error') && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-navy-900/50 rounded-b-3xl">
            <button 
              onClick={startImport} 
              disabled={!file} 
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${file ? 'bg-petrol-600 text-white shadow-xl active:scale-95 active-ripple' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Iniciar Importação
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportBibleModal;
