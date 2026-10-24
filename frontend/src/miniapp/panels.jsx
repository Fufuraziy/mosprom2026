// Экраны мини-приложения. Каждый — Panel с собственной шапкой PanelHeader (правило ВК 3.3.1).
// Содержимое игры (станции, финал, анкета) — прежние брендовые компоненты; каркас — VKUI.
import { useMemo, lazy, Suspense } from 'react'
import {
  Alert,
  Button,
  Cell,
  Div,
  Footer,
  Group,
  Header,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  PanelHeaderButton,
  PanelHeaderContent,
  Placeholder,
  SimpleCell,
  Spacing,
  Switch,
} from '@vkontakte/vkui'
import { useFirstPageCheck, useParams, useRouteNavigator } from '@vkontakte/vk-mini-apps-router'
import {
  Icon28ArticleOutline,
  Icon28ChatsOutline,
  Icon28StatisticsOutline,
  Icon28ViewOutline,
  Icon28DeleteOutline,
  Icon28DocumentTextOutline,
  Icon28GameOutline,
  Icon28GiftOutline,
  Icon28HelpOutline,
  Icon28HistoryBackwardOutline,
  Icon28InfoCircleOutline,
  Icon28LikeOutline,
  Icon28LockOutline,
  Icon28Replay,
  Icon28TicketOutline,
  Icon28Users3Outline,
  Icon56GiftOutline,
  Icon56LockOutline,
  Icon56UserCircleOutline,
} from '@vkontakte/icons'
import { useGame } from '../state/GameContext.jsx'
import { STATIONS } from '../data/content.js'
import { buildRecommendation } from '../services/localEngine.js'
import { api } from '../services/api.js'
import { BrandEssence, BrandsMarquee, BrandValues, CapsuleTeaser, HomeHero, Timeline, WhyCards } from '../screens/Home.jsx'
import Locker from '../screens/Locker.jsx'
import Hub from '../screens/Hub.jsx'
import LabStation from '../screens/stations/LabStation.jsx'
import EngineeringStation from '../screens/stations/EngineeringStation.jsx'
import LineStation from '../screens/stations/LineStation.jsx'
import DesignStation from '../screens/stations/DesignStation.jsx'
import Capsule from '../screens/finale/Capsule.jsx'
import { AIVerdict, SalaryCalculator } from '../screens/finale/Verdict.jsx'
import MerchShop from '../screens/finale/MerchShop.jsx'
import CandidateForm, { Submitted } from '../screens/finale/CandidateForm.jsx'
import FirstDayGuide from '../screens/finale/FirstDayGuide.jsx'
import { StoryShareButton } from '../components/StoryShare.jsx'
import MascotChatPanel from '../screens/mascot/MascotChatPanel.jsx'

const MapView = lazy(() => import('../screens/map/MapView.jsx'))
const HRPanel = lazy(() => import('../screens/hr/HRPanel.jsx'))
const BotScreen = lazy(() => import('../screens/bot/BotScreen.jsx'))
import { MODAL, PANEL, PATH, stationPath } from './routes.js'

const STATION_SCREENS = { lab: LabStation, engineering: EngineeringStation, line: LineStation, design: DesignStation }

/** Строка состояния под заголовком: собранные цифры кода и баланс. */
function useStatus() {
  const { state, balance } = useGame()
  return `Код ${state.digits.map((d) => d ?? '•').join(' ')} · ${balance.toLocaleString('ru-RU')} баллов`
}

/**
 * Обёртка экрана: Panel + PanelHeader с кнопкой «Назад».
 * parent — куда вести «Назад», если экран открыт по прямой ссылке и истории нет.
 * onBack — свой обработчик (например, подтверждение выхода со станции).
 */
export function Screen({ nav, title, subtitle, parent, onBack, before, children }) {
  const navigator = useRouteNavigator()
  const isFirst = useFirstPageCheck()
  const back = () => (isFirst ? navigator.replace(parent || '/') : navigator.back())
  return (
    <Panel nav={nav}>
      <PanelHeader before={parent !== undefined ? <PanelHeaderBack onClick={onBack ? () => onBack(back) : back} /> : before}>
        {subtitle ? <PanelHeaderContent subtitle={subtitle}>{title}</PanelHeaderContent> : title}
      </PanelHeader>
      {children}
    </Panel>
  )
}

/* ------------------------------------------------------------------ ЖЮРИ */

/**
 * Кнопка «👁 Режим жюри» в левом углу шапки главного экрана (правый угол занят капсулой ВК).
 * Включает вкладку «Жюри» с Панелью HR и симулятором ВК-бота — в том числе внутри ВКонтакте.
 */
function JuryButton() {
  const { state, actions, isHrAuthenticated } = useGame()
  const navigator = useRouteNavigator()
  const open = () => {
    if (!isHrAuthenticated) {
      actions.openHrAuth('jury')
      return
    }
    if (state.juryMode) return navigator.push(PATH[PANEL.JURY_HOME])
    actions.setJury(true)
    navigator.push(PATH[PANEL.JURY_HOME])
  }
  return (
    <PanelHeaderButton onClick={open} label="Режим жюри" aria-label="Режим жюри">
      <Icon28ViewOutline />
    </PanelHeaderButton>
  )
}

export function JuryHomePanel({ nav }) {
  const { actions } = useGame()
  const navigator = useRouteNavigator()
  return (
    <Screen nav={nav} title="Режим жюри" subtitle="Экосистема: игра + ВК-бот + HR">
      <Group>
        <Div className="space-y-2 text-sm leading-relaxed text-ink-soft">
          <p>
            Мини-приложение — это витрина для студента. Ниже то, что видит команда ОЧАКОВО: <b className="text-ink">Панель HR</b> с воронкой, ИИ-досье и приглашениями и{' '}
            <b className="text-ink">ВК-бот</b> сообщества, который возвращает студентов в игру.
          </p>
          <p>Отправь анкету в игре — она сразу появится в Панели HR с меткой «новый». Приглашение из досье придёт во вкладку «ВК-бот».</p>
        </Div>
      </Group>
      <Group>
        <Cell before={<Icon28StatisticsOutline />} subtitle="Воронка, кандидаты, ИИ-досье, CSV" chevron="always" onClick={() => navigator.push(PATH[PANEL.JURY_HR])}>
          Панель HR
        </Cell>
        <Cell before={<Icon28ChatsOutline />} subtitle="Сообщения сообщества и сценарии пушей" chevron="always" onClick={() => navigator.push(PATH[PANEL.JURY_BOT])}>
          ВК-бот ОЧАКОВО
        </Cell>
        <Cell
          before={<Icon28LockOutline />}
          subtitle="Завершить сессию HR и вернуться в режим студента"
          onClick={() => {
            actions.logoutHr()
            navigator.replace(PATH[PANEL.HOME])
          }}
        >
          🔓 Выйти из сессии HR (студент)
        </Cell>
        <Cell
          before={<Icon28ViewOutline />}
          onClick={() => {
            actions.setJury(false)
            navigator.replace(PATH[PANEL.HOME])
          }}
        >
          Скрыть вкладку режима жюри
        </Cell>
      </Group>
    </Screen>
  )
}

export function JuryHRPanel({ nav }) {
  return (
    <Screen nav={nav} title="Панель HR" subtitle="Режим жюри" parent={PATH[PANEL.JURY_HOME]}>
      <div className="w-full min-w-0 overflow-x-hidden">
        <HRPanel />
      </div>
    </Screen>
  )
}

export function JuryBotPanel({ nav }) {
  return (
    <Screen nav={nav} title="ВК-бот ОЧАКОВО" subtitle="Режим жюри" parent={PATH[PANEL.JURY_HOME]}>
      <Suspense fallback={<Div className="p-8 text-center text-xs font-bold text-ink-mute">Загрузка диалогов бота…</Div>}><BotScreen /></Suspense>
    </Screen>
  )
}

/* ------------------------------------------------------------------ КВЕСТ */

export function HomePanel({ nav }) {
  const { state, actions } = useGame()
  const navigator = useRouteNavigator()
  const status = useStatus()
  const viewed = state.telemetry.why_ochakovo_cards_viewed.length
  const done = Object.keys(state.telemetry.stations).length
  const started = state.ppeDone || done > 0
  return (
    <Screen nav={nav} title="Секретный код 1978" subtitle={started ? status : 'ОЧАКОВО · практика и стажировки 18+'} before={<JuryButton />}>
      <HomeHero onWhy={() => navigator.push(PATH[PANEL.WHY])} />
      <Group header={<Header>Материалы дела</Header>}>
        <Cell before={<Icon28HistoryBackwardOutline />} subtitle="1978–2000+ и призвание бренда" chevron="always" onClick={() => navigator.push(PATH[PANEL.STORY])}>
          История первых
        </Cell>
        <Cell before={<Icon28LikeOutline />} subtitle="+20 баллов за каждую карточку" indicator={`${viewed}/5`} chevron="always" onClick={() => navigator.push(PATH[PANEL.WHY])}>
          5 причин выбрать ОЧАКОВО
        </Cell>
        <Cell before={<Icon28Users3Outline />} subtitle="Ценности и характер бренда" chevron="always" onClick={() => navigator.push(PATH[PANEL.VALUES])}>
          С кем ты будешь работать
        </Cell>
        <Cell
          before={<Icon28GameOutline />}
          subtitle={state.ppeDone ? 'Карта станций' : 'Сначала — допуск по технике безопасности'}
          indicator={`${done}/4`}
          chevron="always"
          onClick={() => actions.go(state.ppeDone ? 'hub' : 'locker')}
        >
          Маршрут: 4 станции
        </Cell>
      </Group>
      <BrandsMarquee />
    </Screen>
  )
}

export function StoryPanel({ nav }) {
  return (
    <Screen nav={nav} title="История первых" parent={PATH[PANEL.HOME]}>
      <BrandEssence />
      <Timeline />
      <CapsuleTeaser />
    </Screen>
  )
}

export function WhyPanel({ nav }) {
  const { state } = useGame()
  return (
    <Screen nav={nav} title="5 причин" subtitle={`Открыто ${state.telemetry.why_ochakovo_cards_viewed.length} из 5`} parent={PATH[PANEL.HOME]}>
      <WhyCards />
    </Screen>
  )
}

export function ValuesPanel({ nav }) {
  return (
    <Screen nav={nav} title="Ценности бренда" parent={PATH[PANEL.HOME]}>
      <BrandValues />
    </Screen>
  )
}

export function LockerPanel({ nav }) {
  return (
    <Screen nav={nav} title="Раздевалка" subtitle="Этап 0 · допуск к смене" parent={PATH[PANEL.HOME]}>
      <Locker />
    </Screen>
  )
}

export function HubPanel({ nav }) {
  const status = useStatus()
  return (
    <Screen nav={nav} title="Карта станций" subtitle={status} parent={PATH[PANEL.HOME]}>
      <Hub />
    </Screen>
  )
}

export function StationPanel({ nav }) {
  const { state } = useGame()
  const navigator = useRouteNavigator()
  const { id } = useParams({ panel: nav }) ?? {}
  const s = STATIONS.find((x) => x.id === id)
  const S = STATION_SCREENS[id]
  const status = useStatus()
  if (!s || !S) {
    return (
      <Screen nav={nav} title="Станция" parent={PATH[PANEL.HUB]}>
        <Placeholder icon={<Icon56LockOutline />} title="Такой станции нет" action={<Button size="l" onClick={() => navigator.replace(PATH[PANEL.HUB])}>К карте станций</Button>}>
          Проверь ссылку или выбери станцию на карте.
        </Placeholder>
      </Screen>
    )
  }
  const passed = !!state.telemetry.stations[id]
  // Уход со станции посреди мини-игры: результат не сохранится — спрашиваем (вместо window.confirm — Alert ВК).
  const confirmLeave = (back) => {
    if (passed) return back()
    navigator.showPopout(
      <Alert
        title="Выйти со станции?"
        description="Результат мини-игры не сохранится — станцию придётся пройти заново."
        actions={[
          { title: 'Остаться', mode: 'cancel' },
          { title: 'Выйти', mode: 'destructive', action: back },
        ]}
        onClosed={() => navigator.hidePopout()}
      />,
    )
  }
  return (
    <Screen nav={nav} title={`Станция ${s.n} из 4`} subtitle={status} parent={PATH[PANEL.HUB]} onBack={confirmLeave}>
      <S key={id} />
    </Screen>
  )
}

export function CapsulePanel({ nav }) {
  const { state, actions } = useGame()
  const navigator = useRouteNavigator()
  const done = Object.keys(state.telemetry.stations).length
  return (
    <Screen nav={nav} title="Капсула 1978" parent={PATH[PANEL.HUB]}>
      {done < 4 ? (
        <Placeholder
          stretched
          icon={<Icon56LockOutline />}
          title="Капсула пока закрыта"
          action={
            <Button size="l" onClick={() => actions.go('hub')}>
              К карте станций
            </Button>
          }
        >
          Собери все 4 цифры на станциях: осталось {4 - done}.
        </Placeholder>
      ) : (
        <Capsule onContinue={() => navigator.push(PATH[PANEL.VERDICT])} />
      )}
    </Screen>
  )
}

/* ---------------------------------------------------------------- НАГРАДЫ */

/** До открытия капсулы раздел «Награды» показывает заглушку с прогрессом (правило ВК 3.5.1). */
function RewardsGate({ children }) {
  const { state, actions } = useGame()
  const done = Object.keys(state.telemetry.stations).length
  if (state.capsuleOpened) return children
  return (
    <Placeholder
      stretched
      icon={<Icon56GiftOutline />}
      title="Награды откроются после капсулы"
      action={
        <Button size="l" onClick={() => actions.go(done >= 4 ? 'finale' : state.ppeDone ? 'hub' : 'locker')}>
          {done >= 4 ? 'Открыть капсулу' : 'Продолжить расследование'}
        </Button>
      }
    >
      Пройди 4 станции ({done}/4), собери код и открой капсулу 1978 — здесь появятся ИИ-вердикт, расчёт дохода, мерч и анкета.
    </Placeholder>
  )
}

function NextButton({ children, onClick }) {
  return (
    <Div>
      <Button size="l" stretched onClick={onClick}>
        {children}
      </Button>
    </Div>
  )
}

export function VerdictPanel({ nav }) {
  const navigator = useRouteNavigator()
  return (
    <Screen nav={nav} title="ИИ-вердикт">
      <RewardsGate>
        <div className="px-4 py-5">
          <AIVerdict />
        </div>
        <NextButton onClick={() => navigator.push(PATH[PANEL.SALARY])}>Дальше: доход и график</NextButton>
        <Div>
          <StoryShareButton onOpen={() => navigator.showModal(MODAL.STORY_SHARE)} />
        </Div>
        <Spacing size={16} />
      </RewardsGate>
    </Screen>
  )
}

export function SalaryPanel({ nav }) {
  const navigator = useRouteNavigator()
  return (
    <Screen nav={nav} title="Доход и график" parent={PATH[PANEL.VERDICT]}>
      <RewardsGate>
        <div className="px-4 py-5">
          <SalaryCalculator />
        </div>
        <NextButton onClick={() => navigator.push(PATH[PANEL.MERCH])}>Дальше: розыгрыш мерча</NextButton>
        <Spacing size={16} />
      </RewardsGate>
    </Screen>
  )
}

export function MerchPanel({ nav }) {
  const { state } = useGame()
  const navigator = useRouteNavigator()
  return (
    <Screen nav={nav} title="Мерч за баллы" parent={PATH[PANEL.VERDICT]}>
      <RewardsGate>
        <div className="px-4 py-5">
          <MerchShop onForm={() => navigator.push(state.candidate ? PATH[PANEL.APPLIED] : PATH[PANEL.APPLY])} />
        </div>
      </RewardsGate>
    </Screen>
  )
}

export function ApplyPanel({ nav }) {
  const { state } = useGame()
  const navigator = useRouteNavigator()
  const suggested = useMemo(() => buildRecommendation(state.telemetry).matches[0]?.title, [state.telemetry])
  return (
    <Screen nav={nav} title="Анкета 18+" parent={PATH[PANEL.VERDICT]}>
      <RewardsGate>
        <div className="px-4 py-5">
          {state.candidate ? (
            <Submitted candidate={state.candidate} />
          ) : (
            // после отправки — replace: «Назад» не должен возвращать в заполненную форму
            <CandidateForm suggestedVacancy={suggested} onSubmitted={() => navigator.replace(PATH[PANEL.APPLIED])} />
          )}
        </div>
      </RewardsGate>
    </Screen>
  )
}

export function AppliedPanel({ nav }) {
  const { state } = useGame()
  const navigator = useRouteNavigator()
  return (
    <Screen nav={nav} title="Первый день" parent={PATH[PANEL.VERDICT]}>
      <RewardsGate>
        {state.candidate ? (
          <div className="space-y-8 px-4 py-5">
            <Submitted candidate={state.candidate} />
            <FirstDayGuide />
          </div>
        ) : (
          <Placeholder
            stretched
            icon={<Icon56UserCircleOutline />}
            title="Анкета ещё не отправлена"
            action={
              <Button size="l" onClick={() => navigator.replace(PATH[PANEL.APPLY])}>
                Заполнить анкету
              </Button>
            }
          >
            После анкеты здесь появится интерактивный справочник первого дня: маршрут по заводу, что взять с собой и кому звонить.
          </Placeholder>
        )}
      </RewardsGate>
    </Screen>
  )
}

/* ----------------------------------------------------------------- КРАФТИ */

export function ChatPanel({ nav }) {
  return (
    <Panel nav={nav}>
      <PanelHeader>
        <PanelHeaderContent subtitle="ИИ-наставник · отвечает 24/7">Крафти</PanelHeaderContent>
      </PanelHeader>
      <MascotChatPanel />
    </Panel>
  )
}

/* ---------------------------------------------------------------- ПРОФИЛЬ */

export function MePanel({ nav }) {
  const { state, balance, actions } = useGame()
  const navigator = useRouteNavigator()
  const done = Object.keys(state.telemetry.stations).length
  const tickets = Object.values(state.tickets).reduce((a, b) => a + b, 0)
  const rec = useMemo(() => (state.capsuleOpened ? buildRecommendation(state.telemetry) : null), [state.capsuleOpened, state.telemetry])

  const askReset = () =>
    navigator.showPopout(
      <Alert
        title="Начать игру заново?"
        description="Баллы, цифры кода и билеты на этом устройстве сбросятся. Отправленная анкета останется у HR."
        actions={[
          { title: 'Отмена', mode: 'cancel' },
          {
            title: 'Сбросить',
            mode: 'destructive',
            action: () => {
              actions.reset()
              navigator.replace(PATH[PANEL.HOME])
            },
          },
        ]}
        onClosed={() => navigator.hidePopout()}
      />,
    )

  return (
    <Screen nav={nav} title="Профиль">
      <Group header={<Header>Расследование</Header>}>
        <SimpleCell before={<Icon28GameOutline />} indicator={`${done}/4`}>
          Станции пройдены
        </SimpleCell>
        <SimpleCell before={<Icon28LockOutline />} indicator={state.digits.map((d) => d ?? '•').join(' ')}>
          Код капсулы
        </SimpleCell>
        <SimpleCell before={<Icon28GiftOutline />} indicator={balance.toLocaleString('ru-RU')}>
          Крафт-баллы
        </SimpleCell>
        <SimpleCell before={<Icon28TicketOutline />} indicator={tickets}>
          Билеты на розыгрыш
        </SimpleCell>
        {rec && (
          <SimpleCell before={<Icon28ArticleOutline />} subtitle={rec.archetype.tagline} onClick={() => navigator.push(PATH[PANEL.VERDICT])} chevron="always">
            {rec.archetype.name}
          </SimpleCell>
        )}
        <SimpleCell
          before={<Icon28DocumentTextOutline />}
          indicator={state.candidate ? 'отправлена' : 'нет'}
          chevron="always"
          onClick={() => navigator.push(state.candidate ? PATH[PANEL.APPLIED] : PATH[PANEL.APPLY])}
        >
          Анкета
        </SimpleCell>
      </Group>

      {state.capsuleOpened && (
        <Group header={<Header>Поделиться</Header>}>
          <Div>
            <StoryShareButton onOpen={() => navigator.showModal(MODAL.STORY_SHARE)} />
          </Div>
        </Group>
      )}

      <Group>
        <SimpleCell Component="label" after={<Switch checked={state.demoFast} onChange={(e) => actions.setDemo(e.target.checked)} />} subtitle="Кнопка «Пропустить мини-игру» на станциях">
          Демо-ускорение для жюри
        </SimpleCell>
        <SimpleCell
          Component="label"
          before={<Icon28ViewOutline />}
          after={<Switch checked={state.juryMode} onChange={(e) => actions.setJury(e.target.checked)} />}
          subtitle="Вкладка с Панелью HR и ВК-ботом"
        >
          Режим жюри
        </SimpleCell>
        <SimpleCell before={<Icon28InfoCircleOutline />} chevron="always" onClick={() => navigator.push(PATH[PANEL.ABOUT])}>
          О приложении
        </SimpleCell>
        <SimpleCell before={<Icon28Replay />} onClick={askReset}>
          Пройти заново
        </SimpleCell>
      </Group>
    </Screen>
  )
}

export function AboutPanel({ nav }) {
  const { state, actions, apiStatus } = useGame()
  const navigator = useRouteNavigator()

  const askDelete = () =>
    navigator.showPopout(
      <Alert
        title="Удалить мои данные?"
        description="Удалим анкету и результаты игры у HR ОЧАКОВО и на этом устройстве. Действие нельзя отменить."
        actions={[
          { title: 'Отмена', mode: 'cancel' },
          {
            title: 'Удалить',
            mode: 'destructive',
            action: async () => {
              await api.deleteMe(state.sessionId, state.candidate?.id)
              actions.reset()
              navigator.replace(PATH[PANEL.HOME])
            },
          },
        ]}
        onClosed={() => navigator.hidePopout()}
      />,
    )

  return (
    <Screen nav={nav} title="О приложении" parent={PATH[PANEL.ME]}>
      <Group header={<Header>Секретный код 1978</Header>}>
        <Div className="space-y-3 text-sm leading-relaxed text-ink-soft">
          <p>Игра-квест о профессиях, практике и стажировках в АО МПБК «ОЧАКОВО». Прототип для хакатона «Открой#Моспром» 2026.</p>
          <p>
            <b className="text-ink">18+.</b> Работа, практика и стажировки на производстве — только с 18 лет. Суммы дохода указаны до вычета НДФЛ и носят справочный характер.
          </p>
          <p>Результаты мини-игр видит HR только после того, как ты сам(а) отправишь анкету с согласием на обработку персональных данных (152-ФЗ).</p>
        </Div>
      </Group>
      <Group header={<Header>Документы и поддержка</Header>}>
        <SimpleCell before={<Icon28DocumentTextOutline />} subtitle="Указывается в настройках приложения ВК" disabled>
          Пользовательское соглашение
        </SimpleCell>
        <SimpleCell before={<Icon28DocumentTextOutline />} subtitle="Указывается в настройках приложения ВК" disabled>
          Политика конфиденциальности
        </SimpleCell>
        <SimpleCell before={<Icon28HelpOutline />} subtitle="Ответим в течение 7 дней" href="https://vk.com/ochakovo" target="_blank" chevron="always">
          Написать в сообщество ОЧАКОВО
        </SimpleCell>
        <SimpleCell before={<Icon28DeleteOutline />} onClick={askDelete}>
          <span className="text-brand">Удалить мои данные</span>
        </SimpleCell>
      </Group>
      <Footer>{apiStatus.online ? `Сервер: ${apiStatus.url}` : 'Автономный режим: встроенный движок'}</Footer>
    </Screen>
  )
}

export function MapPanel({ nav }) {
  const navigator = useRouteNavigator()
  return (
    <Panel id={nav}>
      <PanelHeader delimiter="separator">Карта «Очаково»</PanelHeader>
      <MapView onNavigateToApply={() => navigator.push(PATH[PANEL.APPLY])} />
    </Panel>
  )
}

export const PANELS = {
  [PANEL.HOME]: HomePanel,
  [PANEL.MAP]: MapPanel,
  [PANEL.STORY]: StoryPanel,
  [PANEL.WHY]: WhyPanel,
  [PANEL.VALUES]: ValuesPanel,
  [PANEL.LOCKER]: LockerPanel,
  [PANEL.HUB]: HubPanel,
  [PANEL.STATION]: StationPanel,
  [PANEL.CAPSULE]: CapsulePanel,
  [PANEL.VERDICT]: VerdictPanel,
  [PANEL.SALARY]: SalaryPanel,
  [PANEL.MERCH]: MerchPanel,
  [PANEL.APPLY]: ApplyPanel,
  [PANEL.APPLIED]: AppliedPanel,
  [PANEL.CHAT]: ChatPanel,
  [PANEL.ME]: MePanel,
  [PANEL.ABOUT]: AboutPanel,
  [PANEL.JURY_HOME]: JuryHomePanel,
  [PANEL.JURY_HR]: JuryHRPanel,
  [PANEL.JURY_BOT]: JuryBotPanel,
}

export { stationPath }
