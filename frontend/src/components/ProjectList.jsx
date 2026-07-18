import React from 'react';
import { Folder, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function ProjectList({ projects, selectedProjectId, onSelectProject, onDeleteProject }) {
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'researching':
      case 'writing':
        return <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />;
      default:
        return <Loader2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'researching':
      case 'writing': return 'bg-sky-500/10 text-sky-400 border-sky-500/20 glow-active';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
        Recent Projects
      </h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No projects found. Create one to begin.
          </div>
        ) : (
          projects.map((project) => {
            const isSelected = project.id === selectedProjectId;
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-slate-900/30 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-medium text-slate-200 truncate group-hover:text-white">
                      {project.topic}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusClass(project.status)}`}>
                        {project.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ID: #{project.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  {getStatusIcon(project.status)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
