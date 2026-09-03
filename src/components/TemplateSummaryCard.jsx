import TargetingBars from './TargetingBars'
import { muscleLoad } from '../lib/exercises'

/**
 * Shared card for a workout template (user-made or pre-made): name, optional
 * theme, exercise/set counts and a muscle-targeting mini chart.
 * `actions` renders top-right (icons); `footer` renders below the bars.
 */
export default function TemplateSummaryCard({
  template,
  exercises,
  onClick,
  actions,
  footer,
  compact = false,
}) {
  const load = muscleLoad(template.exercises, exercises)
  const totalSets = template.exercises.reduce((s, e) => s + (Number(e.targetSets) || 0), 0)
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <div className="bg-surface-800 rounded-2xl border border-white/5 overflow-hidden">
      <Wrapper
        {...(onClick ? { onClick, type: 'button' } : {})}
        className={`w-full text-left p-4 ${onClick ? 'tap active:bg-white/5 transition-colors' : ''}`}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <div className="font-bold text-lg truncate">{template.name}</div>
            <div className="text-gray-500 text-xs mt-0.5">
              {template.theme ? `${template.theme} · ` : ''}
              {template.exercises.length} exercises · {totalSets} sets
            </div>
          </div>
          {actions && <div className="flex gap-1 flex-shrink-0">{actions}</div>}
        </div>
        {!compact && (
          <div className="mt-3">
            <TargetingBars items={load} limit={5} labelWidth="w-16" />
          </div>
        )}
      </Wrapper>
      {footer && <div className="px-4 pb-4 pt-1">{footer}</div>}
    </div>
  )
}
