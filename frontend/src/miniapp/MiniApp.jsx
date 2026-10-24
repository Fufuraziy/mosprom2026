// Оболочка VK Mini App: разделы на нижней панели (Epic + Tabbar), в каждом — стек экранов (View),
// модальные окна, попауты (Alert), уведомления (Snackbar). Навигация — vk-mini-apps-router (hash).
import { useEffect, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Epic,
  ModalCard,
  ModalPage,
  ModalPageHeader,
  ModalRoot,
  Panel,
  PanelHeader,
  SplitCol,
  SplitLayout,
  Tabbar,
  TabbarItem,
  usePlatform,
  useSnackbarManager,
  View,
} from '@vkontakte/vkui'
import { useActiveVkuiLocation, useFirstPageCheck, usePopout, useRouteNavigator } from '@vkontakte/vk-mini-apps-router'
import { Icon28GameOutline, Icon28PlaceOutline, Icon28GiftOutline, Icon28MessageOutline, Icon28UserCircleOutline, Icon28ViewOutline, Icon24CoinsOutline, Icon24TicketOutline, Icon24InfoCircleOutline, Icon56UserCircleOutline } from '@vkontakte/icons'
import bridge from '@vkontakte/vk-bridge'
import { navigation, useGame } from '../state/GameContext.jsx'
import { isInsideVK, haptic } from '../services/vk.js'
import { MODAL, NO_TABBAR, PANEL, PATH, pathForScreen, router, VIEW, VIEW_PANELS } from './routes.js'
import { PANELS } from './panels.jsx'
import { StoryShareContent } from '../components/StoryShare.jsx'
import { InviteFriendModalContent } from '../components/InviteFriend.jsx'

const TABS = [
  { view: VIEW.QUEST, label: 'Квест', Icon: Icon28GameOutline, root: PATH[PANEL.HOME] },
  { view: VIEW.MAP, label: 'Карта', Icon: Icon28PlaceOutline, root: PATH[PANEL.MAP] },
  { view: VIEW.REWARDS, label: 'Награды', Icon: Icon28GiftOutline, root: PATH[PANEL.VERDICT] },
  { view: VIEW.MASCOT, label: 'Крафти', Icon: Icon28MessageOutline, root: PATH[PANEL.CHAT] },
  { view: VIEW.PROFILE, label: 'Профиль', Icon: Icon28UserCircleOutline, root: PATH[PANEL.ME] },
  { view: VIEW.JURY, label: 'Жюри', Icon: Icon28ViewOutline, root: PATH[PANEL.JURY_HOME], jury: true },
]

const ROOT_PANEL = { [VIEW.QUEST]: PANEL.HOME, [VIEW.MAP]: PANEL.MAP, [VIEW.REWARDS]: PANEL.VERDICT, [VIEW.MASCOT]: PANEL.CHAT, [VIEW.PROFILE]: PANEL.ME, [VIEW.JURY]: PANEL.JURY_HOME }

export default function MiniApp() {
  const { state, actions, toasts } = useGame()
  const navigator = useRouteNavigator()
  const popout = usePopout()
  const platform = usePlatform()
  const isFirst = useFirstPageCheck()
  const { view = VIEW.QUEST, panel = PANEL.HOME, modal, panelsHistory } = useActiveVkuiLocation()
  const [snackbar, snackbarHolder] = useSnackbarManager()

  // Последний открытый экран каждого раздела: тап по вкладке возвращает туда, где человек был.
  const lastPanel = useRef({ ...ROOT_PANEL })
  const lastPath = useRef(Object.fromEntries(TABS.map((t) => [t.view, t.root])))
  if (VIEW_PANELS[view]?.includes(panel)) {
    lastPanel.current[view] = panel
    lastPath.current[view] = router.state.location.pathname || '/'
  }

  // actions.go(screen, id) из экранов игры → переход роутера.
  const stateRef = useRef(state)
  stateRef.current = state
  const here = useRef({ panel, panelsHistory })
  here.current = { panel, panelsHistory }
  useEffect(() => {
    navigation.go = (screen, stationId) => {
      const to = pathForScreen(screen, stationId, stateRef.current)
      const { panel: cur, panelsHistory: hist } = here.current
      const target = Object.keys(PATH).find((p) => PATH[p] === to) || (to.startsWith('/station/') ? PANEL.STATION : null)
      if (cur === PANEL.STATION && target === PANEL.STATION) return navigator.replace(to) // следующая станция
      if (hist.length > 1 && hist[hist.length - 2] === target && target !== PANEL.STATION) return navigator.back() // туда, откуда пришли
      if (cur === PANEL.LOCKER && target === PANEL.HUB) return navigator.replace(to) // допуск получен — раздевалка больше не нужна в истории
      return navigator.push(to)
    }
    return () => {
      navigation.go = null
    }
  }, [navigator])

  // Свайп «закрыть мини-приложение» — только на первом экране истории (iOS; на остальных платформах метод игнорируется).
  useEffect(() => {
    if (!isInsideVK) return
    bridge.send('VKWebAppSetSwipeSettings', { history: isFirst }).catch(() => {})
  }, [isFirst])

  // Ссылка для экспертов: …#/ ?jury=1 сразу включает «Режим жюри».
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('jury') && !state.juryMode) actions.setJury(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Предупреждение 18+ при первом запуске (правило ВК 2.1.5).
  useEffect(() => {
    if (!state.ageOk) {
      const t = setTimeout(() => navigator.showModal(MODAL.AGE), 300)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Тосты игры («+100 Крафт-баллов…») → нативный Snackbar.
  const shown = useRef(new Set())
  useEffect(() => {
    for (const t of toasts) {
      if (shown.current.has(t.id)) continue
      shown.current.add(t.id)
      const Icon = t.kind === 'ticket' ? Icon24TicketOutline : t.kind === 'points' ? Icon24CoinsOutline : Icon24InfoCircleOutline
      snackbar.open({ children: t.msg, before: <Icon fill="var(--vkui--color_icon_accent)" />, duration: 2600, placement: 'top' })
    }
  }, [toasts, snackbar])

  const showTabbar = !NO_TABBAR.has(panel)
  const history = modal || popout ? [] : panelsHistory
  const rewardsNew = state.capsuleOpened && !state.candidate

  const [underageView, setUnderageView] = useState(false)

  const confirmAge = () => {
    actions.ageOk()
    navigator.hideModal()
  }

  const modals = (
    <ModalRoot activeModal={modal} onClose={() => (modal === MODAL.AGE ? undefined : navigator.hideModal())}>
      <ModalCard
        id={MODAL.AGE}
        icon={<Icon56UserCircleOutline />}
        title={underageView ? 'Ждём тебя в команде Очаково после 18-летия!' : 'Игра для тех, кому есть 18'}
        description={
          underageView ? (
            <div className="space-y-3 text-left text-xs leading-relaxed">
              <p>
                По трудовому законодательству РФ и нормам охраны труда пищевого комбината работа на автоматизированных линиях и в цехах допускается <b>строго с 18 лет</b>.
              </p>
              <div className="rounded-lg border border-brand/20 bg-cream/70 p-3 text-ink">
                <div className="font-extrabold uppercase text-brand tracking-wider">🏛️ Экскурсии в Музей «Очаково»:</div>
                Посетить наш уникальный <b>Музей традиционных русских напитков</b> и осмотреть варочные порядки и линии розлива можно в любом возрасте!
                <br />
                📍 Москва, ул. Рябиновая, 44 · Запись: 8 800 100 77 77 доб. 1155.
              </div>
            </div>
          ) : (
            'Практика, стажировки и работа на заводе ОЧАКОВО — строго с 18 лет. Результаты игры увидит HR, только если ты сам(а) отправишь анкету.'
          )
        }
        actions={
          underageView ? (
            <Button size="l" mode="primary" stretched onClick={() => setUnderageView(false)}>
              Я ошибся(лась), мне уже есть 18 лет
            </Button>
          ) : (
            <div className="w-full space-y-2">
              <Button size="l" mode="primary" stretched onClick={confirmAge}>
                Мне есть 18, начинаем
              </Button>
              <Button size="l" mode="secondary" stretched onClick={() => setUnderageView(true)}>
                Мне меньше 18 лет
              </Button>
            </div>
          )
        }
      />
      <ModalPage id={MODAL.STORY_SHARE} header={<ModalPageHeader>История ВКонтакте</ModalPageHeader>} onClose={() => navigator.hideModal()} title="История ВКонтакте">
        <StoryShareContent />
      </ModalPage>
      <ModalPage id={MODAL.INVITE_FRIEND} header={<ModalPageHeader>Пригласи друга</ModalPageHeader>} onClose={() => navigator.hideModal()} title="Пригласи друга">
        <InviteFriendModalContent />
      </ModalPage>
    </ModalRoot>
  )

  const tabbar = showTabbar && (
    <Tabbar>
      {TABS.filter((t) => !t.jury || state.juryMode || view === VIEW.JURY).map(({ view: v, label, Icon, root }) => (
        <TabbarItem
          key={v}
          label={label}
          selected={view === v}
          indicator={v === VIEW.REWARDS && rewardsNew && view !== v ? <Badge mode="prominent">Новое</Badge> : null}
          onClick={() => {
            haptic('light')
            if (view === v) {
              if (panel !== ROOT_PANEL[v]) navigator.push(root)
              return
            }
            navigator.push(lastPath.current[v] || root)
          }}
        >
          <Icon />
        </TabbarItem>
      ))}
    </Tabbar>
  )

  return (
    <SplitLayout header={platform !== 'vkcom' && <PanelHeader delimiter="none" />} center modal={modals} popout={popout}>
      <SplitCol stretchedOnMobile autoSpaced maxWidth={720}>
        <Epic activeStory={view} tabbar={tabbar}>
          {Object.entries(VIEW_PANELS).map(([v, panels]) => {
            const isCurrentView = view === v
            const activeP = isCurrentView ? panel : lastPanel.current[v]
            return (
              <View
                key={v}
                nav={v}
                activePanel={activeP}
                history={isCurrentView ? history : [activeP]}
                onSwipeBack={() => navigator.back()}
              >
                {panels.map((p) => {
                  // Оптимизация: рендерим только активный экран и экраны в анимации перехода
                  const isVisible = p === activeP || (isCurrentView && history.includes(p))
                  if (!isVisible) {
                    return <Panel key={p} id={p} nav={p} />
                  }
                  const P = PANELS[p]
                  return <P key={p} nav={p} />
                })}
              </View>
            )
          })}
        </Epic>
      </SplitCol>
      {snackbarHolder}
    </SplitLayout>
  )
}
