/**
 * Adaptadores entre o schema do banco de dados (Supabase/PostgreSQL)
 * e o formato interno usado pelos componentes React do Respiro.
 *
 * DB  →  App:  dbToActivity / dbToLog
 * App →  DB:   activityToDb / logToDb
 * Helpers:     getNextScheduledDay
 */

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/**
 * Retorna o label (ex: "Seg") do próximo dia agendado após hoje.
 * Se todos os dias já passaram na semana, retorna o primeiro da lista (próxima semana).
 *
 * @param {number[]} days - Array de IDs de dia (0=Dom, 6=Sáb)
 * @returns {string | null}
 */
export function getNextScheduledDay(days) {
  if (!days?.length) return null
  const today = new Date().getDay()
  const sorted = [...days].sort((a, b) => a - b)
  const next = sorted.find(d => d > today) ?? sorted[0]
  return DAY_LABELS[next]
}

/**
 * Converte uma linha da tabela `activities` para o formato dos componentes.
 *
 * @param {Object} row - Linha retornada pelo Supabase
 * @returns {{
 *   id: string,
 *   name: string,
 *   type: 'TIMER' | 'CHECK',
 *   days: number[],
 *   startTime: string,
 *   endTime: string,
 *   duration: number | null
 * }}
 */
export function dbToActivity(row) {
  return {
    id: row.id,
    name: row.title,
    type: row.type ?? 'TIMER',
    days: row.days,
    startTime: row.time_window_start?.slice(0, 5) ?? '', // 'HH:MM:SS' → 'HH:MM'
    endTime: row.time_window_end?.slice(0, 5) ?? '',
    duration: row.duration ?? null,
  }
}

/**
 * Converte o objeto de atividade dos componentes para o payload de INSERT/UPDATE.
 * Não inclui `user_id` — deve ser injetado no call site via supabase.auth.getUser().
 *
 * @param {{
 *   name: string,
 *   type: 'TIMER' | 'CHECK',
 *   days: number[],
 *   startTime: string,
 *   endTime: string,
 *   duration: number | null
 * }} activity
 * @returns {Object}
 */
export function activityToDb(activity) {
  return {
    title: activity.name,
    type: activity.type,
    days: activity.days,
    time_window_start: activity.startTime,
    time_window_end: activity.endTime,
    duration: activity.type === 'CHECK' ? null : (activity.duration ?? null),
  }
}

/**
 * Converte uma linha da tabela `history_logs` para o formato dos componentes.
 *
 * @param {Object} row - Linha retornada pelo Supabase
 * @returns {{
 *   id: string,
 *   activityId: string | null,
 *   activityName: string,
 *   type: 'TIMER' | 'CHECK',
 *   date: string,
 *   status: 'COMPLETED' | 'DONE' | 'MISSED',
 *   duration: number | null
 * }}
 */
export function dbToLog(row) {
  return {
    id: row.id,
    activityId: row.activity_id ?? null,
    activityName: row.title_snapshot,
    type: row.type_snapshot ?? 'TIMER',
    date: row.executed_at,
    status: row.status,
    duration: row.duration ?? null,
  }
}

/**
 * Converte o objeto de log dos componentes para o payload de INSERT.
 * Não inclui `user_id` — deve ser injetado no call site via supabase.auth.getUser().
 *
 * @param {{
 *   activityId: string | null,
 *   activityName: string,
 *   type: 'TIMER' | 'CHECK',
 *   date: string,
 *   status: 'COMPLETED' | 'DONE' | 'MISSED',
 *   duration: number | null
 * }} log
 * @returns {Object}
 */
export function logToDb(log) {
  return {
    activity_id: log.activityId ?? null,
    title_snapshot: log.activityName,
    type_snapshot: log.type,
    status: log.status,
    executed_at: log.date,
    duration: log.duration ?? null,
  }
}
