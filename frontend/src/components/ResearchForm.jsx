import React, { useState } from 'react';
import { Sparkles, FileText, Upload, X, Loader2 } from 'lucide-react';

export default function ResearchForm({ onCreateProject, isLoading }) {
  const [topic, setTopic] = useState('');
  const [citationStyle, setCitationStyle] = useState('IEEE');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      setAttachedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
      setAttachedFiles(prev => [...prev, ...files]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onCreateProject({ topic, citationStyle, files: attachedFiles });
    // Reset form fields
    setTopic('');
    setAttachedFiles([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="topic" className="block text-sm font-semibold text-slate-300 mb-2">
          Research Topic / Question
        </label>
        <div className="relative">
          <input
            id="topic"
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Agentic AI in Healthcare, Decentralized Autonomous Organizations"
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="citation" className="block text-sm font-semibold text-slate-300 mb-2">
            Citation Style
          </label>
          <select
            id="citation"
            value={citationStyle}
            onChange={(e) => setCitationStyle(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
          >
            <option value="IEEE">IEEE Reference style</option>
            <option value="APA">APA Reference style (7th ed.)</option>
            <option value="MLA">MLA Citation style</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Reference Materials (Optional PDFs)
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/5'
              : 'border-slate-800 bg-slate-950/20 hover:border-slate-700 hover:bg-slate-900/10'
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="flex flex-col items-center cursor-pointer">
            <Upload className="w-8 h-8 text-indigo-400 mb-2" />
            <span className="text-sm font-medium text-slate-300">
              Drag & drop files or <span className="text-indigo-400 underline">browse</span>
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Only PDF formats are parsed by the PDF Reader Agent
            </span>
          </label>
        </div>

        {attachedFiles.length > 0 && (
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 text-slate-300 truncate">
                  <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !topic.trim()}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Initializing Multi-Agent Workflow...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Launch Autonomous Research
          </>
        )}
      </button>
    </form>
  );
}
