import React from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  Wrench
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { runSecurityAndArchitectureAudit } from '../../engine/securityLinter';

export const SecurityAuditModal: React.FC = () => {
  const { services, activeModal, setActiveModal, autoFixIssue } = useDockerStore();

  if (activeModal !== 'security') return null;

  const issues = runSecurityAndArchitectureAudit(services);
  const criticalCount = issues.filter(i => i.level === 'critical').length;
  const warningCount = issues.filter(i => i.level === 'warning').length;
  const infoCount = issues.filter(i => i.level === 'info').length;

  let score = 100 - (criticalCount * 35 + warningCount * 15);
  score = Math.max(0, Math.min(100, score));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Security & Architecture Diagnostics</h2>
              <p className="text-xs text-theme-muted">Static analysis of your container network & storage topology</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Banner */}
        <div className="p-6 border-b border-theme-border bg-theme-bg/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Stack Health Score</span>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-3xl font-extrabold px-3 py-1 rounded-xl border ${
                score >= 90 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' :
                score >= 70 ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' :
                'text-red-400 border-red-500/40 bg-red-500/10'
              }`}>
                {score}%
              </span>
              <div className="text-xs text-theme-muted">
                <div>{criticalCount} Critical issues &bull; {warningCount} Warnings &bull; {infoCount} Best Practices</div>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar text-xs">
          {issues.map((issue) => {
            const isCritical = issue.level === 'critical';
            const isWarning = issue.level === 'warning';
            const isSuccess = issue.level === 'success';

            const borderStyle = 
              isCritical ? 'border-red-500/40 bg-red-500/5' :
              isWarning ? 'border-amber-500/40 bg-amber-500/5' :
              isSuccess ? 'border-emerald-500/40 bg-emerald-500/5' :
              'border-blue-500/30 bg-blue-500/5';

            const Icon = 
              isCritical ? AlertOctagon :
              isWarning ? AlertTriangle :
              isSuccess ? CheckCircle2 : Info;

            const iconColor = 
              isCritical ? 'text-red-400' :
              isWarning ? 'text-amber-400' :
              isSuccess ? 'text-emerald-400' : 'text-blue-400';

            return (
              <div key={issue.id} className={`p-4 rounded-xl border ${borderStyle} space-y-2`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
                    <div>
                      <h4 className="font-bold text-theme-text text-sm">{issue.title}</h4>
                      <p className="text-theme-muted mt-1 leading-relaxed">{issue.message}</p>
                    </div>
                  </div>

                  {issue.autoFixable && (
                    <button
                      onClick={() => autoFixIssue(issue.id, issue.serviceId)}
                      className="px-3 py-1.5 bg-theme-accent text-white rounded-lg font-medium text-xs flex items-center space-x-1.5 shrink-0 shadow"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Auto Fix</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
