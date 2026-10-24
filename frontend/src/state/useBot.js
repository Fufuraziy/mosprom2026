import { useCallback, useRef } from 'react'
import { useGame } from './GameContext.jsx'
import { api } from '../services/api.js'
import { pushMessage } from '../services/botEngine.js'

/** Доставка сообщений в симулятор ВК-бота: ответы бота, пуши рассылки, сообщения от HR. */
export function useBot() {
  const { state, actions, toast } = useGame()

  const ctx = {
    stationsDone: Object.keys(state.telemetry.stations).length,
    points: state.points - state.spent,
    capsuleOpened: state.capsuleOpened,
    hasCandidate: !!state.candidate,
    tickets: Object.values(state.tickets).reduce((a, b) => a + b, 0),
  }
  const isWatching = (threadId) => state.mode === 'bot' && state.bot.active === threadId

  const userSend = useCallback(
    async (threadId, { text, payload, label }) => {
      actions.botPush(threadId, [{ from: 'user', text: label || text }])
      api.track(state.sessionId, 'bot_message', { thread: threadId, payload: payload || null })
      const r = await api.botMessage(state.sessionId, { text, payload }, ctx)
      setTimeout(() => {
        actions.botPush(threadId, r.messages, { markUnread: !isWatching(threadId) })
        r.messages.forEach((m) => m.topic && threadId === 'me' && actions.topic(m.topic))
      }, 450)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.sessionId, state.mode, state.bot.active, ctx.stationsDone, ctx.points, ctx.capsuleOpened],
  )

  const push = useCallback(
    (scenarioId) => {
      actions.botPush('me', [pushMessage(scenarioId, ctx)], { markUnread: !isWatching('me') })
      toast('ВКонтакте · ОЧАКОВО: новое сообщение', 'info')
      api.track(state.sessionId, 'bot_push', { scenario: scenarioId })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.sessionId, state.mode, state.bot.active, ctx.stationsDone, ctx.capsuleOpened, ctx.tickets],
  )

  /** Сообщение от HR кандидату. Свой живой кандидат попадает в диалог «Вы». serverId — id из POST /api/bot/send (защита от дубля при опросе inbox). */
  const hrSend = useCallback(
    (candidate, text, keyboard, serverId) => {
      const own = candidate.session_id && candidate.session_id === state.sessionId
      const threadId = own ? 'me' : `cand:${candidate.id}`
      actions.botPush(threadId, [{ ...(serverId ? { id: serverId } : {}), from: 'hr', kind: 'invite', text, keyboard }], {
        name: own ? 'Вы (демо-кандидат)' : candidate.fio,
        candidateId: candidate.id,
        markUnread: true,
      })
      // Сохраняем в localStorage для надежной синхронизации между вкладками и перезагрузками
      try {
        const stored = JSON.parse(window.localStorage.getItem('ochakovo_hr_sent_messages') || '[]')
        stored.push({
          candidate_id: candidate.id,
          candidate_fio: candidate.fio,
          thread_id: threadId,
          text,
          keyboard,
          sent_at: new Date().toISOString(),
        })
        window.localStorage.setItem('ochakovo_hr_sent_messages', JSON.stringify(stored))
      } catch {
        /* ignore */
      }
      return threadId
    },
    [state.sessionId, actions],
  )

  /**
   * Подтянуть с сервера приглашения HR (GET /api/bot/inbox), отправленные с другого устройства — например, HR
   * написал из Панели HR на ноутбуке, а вкладку «ВК-бот» смотрят на телефоне. Опрашиваем только новые (since).
   */
  const since = useRef(null)
  const syncInbox = useCallback(async () => {
    const r = await api.botInbox({ since: since.current || undefined, limit: 50 })
    if (r.source !== 'remote') return 0
    if (r.server_time) since.current = r.items.length ? r.items[r.items.length - 1].created_at : since.current || null
    let added = 0
    for (const m of r.items) {
      if (!m.is_from_hr) continue
      const own = m.session_id && m.session_id === state.sessionId
      const threadId = own ? 'me' : `cand:${m.candidate_id || m.session_id}`
      actions.botPush(threadId, [{ id: m.id, ts: m.created_at, from: 'hr', kind: 'invite', text: m.text }], {
        name: own ? 'Вы (демо-кандидат)' : m.candidate_name || 'Кандидат',
        candidateId: m.candidate_id || null,
        markUnread: !isWatching(threadId),
      })
      added++
    }
    return added
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId, state.mode, state.bot.active])

  return { ctx, userSend, push, hrSend, syncInbox }
}
