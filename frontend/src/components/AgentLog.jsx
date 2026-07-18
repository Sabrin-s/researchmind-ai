import React, { useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, Loader2, Play, AlertCircle } from 'lucide-react';

export default function AgentLog({ logs, status }) {
  const consoleEndRef = useRef(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // List of agents in sequence
  const agents = [
    { name: 'Planner Agent', desc: 'Structures outline and creates queries' },
    { name: 'Web Research Agent', desc: 'Crawls and scores authoritative web pages' },
    { name: 'PDF Reader Agent', desc: 'Parses local PDFs and indexes vector DB' },
    { name: 'Fact Checker Agent', desc: 'Validates facts and extracts research gaps' },
    { name: 'Citation Verifier Agent', desc: 'Applies styling and checks hyperlinks' },
    { name: 'Report Writer Agent', desc: 'Drafts report and compiles Word/PDF formats' }
  ];

  // Helper to determine status of a specific agent
  const getAgentStatus = (agentName) => {
    const agentLogs = logs.filter(l => l.agent_name === agentName);
    if (agentLogs.length === 0) return 'pending';
    
    const hasError = agentLogs.some(l => l.status === 'error');
    if (hasError) return 'failed';
    
    const isCompleted = agentLogs.some(l => l.status === 'completed');
    if (isCompleted) return 'completed';
    
    return 'running';
  };

  const getAgentColorClass = (agentStatus) => {
    switch (agentStatus) {
      case 'completed': return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400';
      case 'failed': return 'border-rose-500/30 bg-rose-500/5 text-rose-400';
      case 'running': return 'border-sky-500/40 bg-sky-500/5 text-sky-400 glow-active';
      default: return 'border-slate-800 bg-slate-900/10 text-slate-500';
    }
  };

  const renderStatusBadge = (agentStatus) => {
    switch (agentStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />;
      default:
        return <Play className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Agent Workflow Sequence */}
      <div className="lg:col-span-1 space-y-3 overflow-y-auto pr-1">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">
          Agent Execution Pipeline
        </h3>
        
        {agents.map((agent) => {
          const agentStatus = getAgentStatus(agent.name);
          return (
            <div
              key={agent.name}
              className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${getAgentColorClass(
                agentStatus
              )}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg ${
                  agentStatus === 'completed' ? 'bg-emerald-500/10' :
                  agentStatus === 'failed' ? 'bg-rose-500/10' :
                  agentStatus === 'running' ? 'bg-sky-500/10' : 'bg-slate-900/40'
                }`}>
                  {renderStatusBadge(agentStatus)}
                </div>
                <div className="overflow-hidden">
                  <h4 className={`text-xs font-semibold ${agentStatus !== 'pending' ? 'text-slate-100' : 'text-slate-500'}`}>
                    {agent.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {agent.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Log Console */}
      <div className="lg:col-span-2 flex flex-col h-full bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border-b border-slate-800 text-xs font-semibold text-slate-400">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>Real-Time Orchestrator Logs</span>
          {status === 'researching' || status === 'writing' ? (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 animate-pulse">
              Active Workflow
            </span>
          ) : null}
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Waiting for workflow to initialize...</div>
          ) : (
            logs.map((log, index) => {
              let statusColor = 'text-slate-500';
              if (log.status === 'completed') statusColor = 'text-emerald-400';
              if (log.status === 'error') statusColor = 'text-rose-400';
              if (log.status === 'running') statusColor = 'text-sky-400';

              return (
                <div key={log.id || index} className="border-b border-slate-900/30 pb-2">
                  <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}] </span>
                  <span className={`font-semibold ${statusColor}`}>
                    [{log.agent_name} &gt; {log.step_name}]
                  </span>
                  <p className="text-slate-300 mt-1 pl-4 break-words leading-relaxed">
                    {log.log_message}
                  </p>
                </div>
              );
            })
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
}
