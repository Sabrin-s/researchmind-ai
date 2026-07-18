import React, { useState, useEffect, useRef } from 'react';
import { Download, FileDown, Calendar, AlertTriangle, Send, Loader2, Sparkles, User, ShieldAlert, Award } from 'lucide-react';

export default function ReportViewer({ projectId, report, sources, initialMessages = [] }) {
  const [activeTab, setActiveTab] = useState('report'); // report, timeline, qa
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setChatMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleDownload = (format) => {
    window.open(`http://localhost:8000/reports/${projectId}/download/${format}`, '_blank');
  };

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = { sender: 'user', message: question, timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setIsSending(true);

    try {
      const response = await fetch(`http://localhost:8000/projects/${projectId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.message })
      });
      if (response.ok) {
        const botMsg = await response.json();
        setChatMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('QA Failed');
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        sender: 'assistant',
        message: 'Could not connect to QA API. Please verify the backend service is active.'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // Safe basic markdown formatter
  const renderFormattedMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-bold text-slate-100 border-b border-slate-800 pb-2 mt-6 mb-4">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-semibold text-slate-200 mt-5 mb-3">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-semibold text-slate-300 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="ml-5 list-disc text-slate-300 text-sm mb-1 leading-relaxed">{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-slate-300 text-sm mb-3 leading-relaxed">{line}</p>;
    });
  };

  // Safe JSON parsers for advanced features
  let timelineData = [];
  try {
    timelineData = report?.timeline_data ? JSON.parse(report.timeline_data) : [];
  } catch (e) {
    timelineData = [];
  }

  let gapsData = [];
  try {
    gapsData = report?.gaps_data ? JSON.parse(report.gaps_data) : [];
  } catch (e) {
    gapsData = [];
  }

  // Count high/medium confidence claims
  const highConfidenceSources = sources.filter(s => s.confidence === 'High').length;
  const totalSources = sources.length;

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header and Tabs */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-950/40 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-base font-bold text-white truncate max-w-md">
            {report?.title || "Research MIND Report"}
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Verified with {totalSources} source materials ({highConfidenceSources} High Evidence Confidence)
          </p>
        </div>

        {/* Action Downloads */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleDownload('docx')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Word</span>
          </button>
          <button
            onClick={() => handleDownload('md')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-800 bg-slate-950/20 px-4">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'report' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Research Report
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'timeline' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Timeline & Research Gaps
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'qa' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Interactive Q&A Chat
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'report' && (
          <div className="prose max-w-none text-slate-300">
            {renderFormattedMarkdown(report?.content)}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Timeline Area */}
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Evolution Timeline
              </h3>
              <div className="relative border-l border-indigo-500/20 ml-3 pl-6 space-y-6">
                {timelineData.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-0 w-3 h-3 bg-indigo-500 rounded-full border border-slate-900 shadow-md shadow-indigo-500/50" />
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {item.year}
                    </span>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {item.event}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps and Confidence */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Research Gaps & Conflicts
                </h3>
                <div className="space-y-3">
                  {gapsData.map((gap, idx) => (
                    <div key={idx} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {gap.topic}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        {gap.conflict_or_question}
                      </p>
                    </div>
                  ))}
                  {gapsData.length === 0 && (
                    <div className="text-xs text-slate-500 italic">No research gaps logged.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Source Evidence Statistics
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-center">
                    <span className="text-xl font-extrabold text-emerald-400">{sources.filter(s=>s.confidence==='High').length}</span>
                    <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">High Conf</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-center">
                    <span className="text-xl font-extrabold text-amber-400">{sources.filter(s=>s.confidence==='Medium').length}</span>
                    <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">Med Conf</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-center">
                    <span className="text-xl font-extrabold text-slate-400">{sources.filter(s=>s.confidence==='Low').length}</span>
                    <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">Low Conf</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="flex flex-col h-[400px] bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden">
            {/* Messages box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <Sparkles className="w-8 h-8 text-indigo-400/80 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-400">Ask the Research Knowledge Base</p>
                  <p className="text-[10px] text-slate-600 mt-1 max-w-xs">
                    Submit questions about verified claims, specific pages of local papers, or general findings.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={index} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`p-2 rounded-lg flex-shrink-0 ${isUser ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-300 rounded-tl-none border border-slate-800/80'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              {isSending && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0 animate-spin">
                    <Loader2 className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-slate-900 text-slate-500 text-xs italic rounded-2xl rounded-tl-none border border-slate-800/80 animate-pulse">
                    Retrieving matching chunks from vector database and compiling answer...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleSendQuestion} className="flex gap-2 p-3 bg-slate-950/60 border-t border-slate-850">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about details, methodologies, or gaps..."
                disabled={isSending}
                className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
              <button
                type="submit"
                disabled={isSending || !question.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:bg-slate-850 disabled:text-slate-600 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
