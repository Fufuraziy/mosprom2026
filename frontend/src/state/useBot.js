import { useCallback } from 'react'
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

  /** Сообщение от HR кандидату. Свой живой кандидат попадает в диалог «Вы». */
  const hrSend = useCallback(
    (candidate, text, keyboard) => {
      const own = candidate.session_id && candidate.session_id === state.sessionId
      const threadId = own ? 'me' : `cand:${candidate.id}`
      actions.botPush(threadId, [{ from: 'hr', kind: 'invite', text, keyboard }], {
        name: own ? 'Вы (демо-кандидат)' : candidate.fio,
        candidateId: candidate.id,
        markUnread: true,
      })
      return threadId
    },
    [state.sessionId, actions],
  )

  return { ctx, userSend, push, hrSend }
}
