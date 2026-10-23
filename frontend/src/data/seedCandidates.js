// 12 демо-кандидатов для панели HR (вымышленные люди, контакты не настоящие).
// Структура совпадает с тем, что сохраняет игра после отправки анкеты.

const T = (o) => ({
  why_ochakovo_cards_viewed: o.why ?? ['giant', 'noprobation', 'money'],
  ppe_attempts: o.ppe ?? 1,
  ppe_wrong_picks: o.wrong ?? [],
  stations: o.stations,
  quiz: o.quiz ?? { correct: 6, total: 7 },
  capsule_attempts: 1,
  calculator: o.calc ?? { interactions: 0 },
  asked_topics: o.topics ?? {},
  skipped: o.skipped ?? [],
  duration_s: o.dur ?? 900,
})

const lab = (acc, brix) => ({ titration_accuracy: acc, brix_correct: brix, brix_total: 4, tasting_done: true })
const eng = (stab, ms, insp) => ({ pressure_stability: stab, mea_reaction_ms: ms, inspections_correct: insp, inspections_total: 3 })
const line = (c, m, f, ttn) => ({ defects_caught: c, defects_missed: m, false_rejects: f, ttn_correct: ttn })
const des = (pan, mira) => ({ pantone_match: pan, mirapolis_correct: mira, mirapolis_total: 4 })

export const SEED_CANDIDATES = [
  {
    id: 'seed_01', fio: 'Смирнова Алина Олеговна', phone: '+7 916 000-11-21', telegram: '@alina_chem', email: 'alina.s@example.ru',
    birth_date: '2004-03-14', vacancy: 'Химик-лаборант', readiness: 'К началу сезона (март–апрель)', university: 'РХТУ им. Д. И. Менделеева', study_level: '4 курс', specialty: 'Химическая технология',
    points: 1180, created_at: '2026-10-22T10:12:00+03:00',
    telemetry: T({ why: ['giant', 'noprobation', 'money', 'dorm', 'mentors'], stations: { lab: lab(96, 4), engineering: eng(78, 2100, 3), line: line(9, 2, 0, 3), design: des(81, 4) }, calc: { interactions: 6, night_ok: false, last: { dept: 'lab', nights: 0 } }, topics: { session: 2, schedule: 1 } }),
  },
  {
    id: 'seed_02', fio: 'Ковалёв Денис Андреевич', phone: '+7 925 000-32-10', telegram: '@den_kip', email: '',
    birth_date: '2003-07-02', vacancy: 'Наладчик / специалист по автоматизации', readiness: 'Готов(а) выйти сразу', university: 'МГТУ им. Н. Э. Баумана', study_level: 'Выпускник', specialty: 'Автоматизация технологических процессов',
    points: 1240, created_at: '2026-10-22T13:40:00+03:00',
    telemetry: T({ stations: { lab: lab(71, 3), engineering: eng(94, 1200, 3), line: line(12, 1, 1, 3), design: des(64, 4) }, calc: { interactions: 4, night_ok: true, last: { dept: 'tech', nights: 7 } }, topics: { salary: 1, military: 1 } }),
  },
  {
    id: 'seed_03', fio: 'Ибрагимов Тимур Рустамович', phone: '+7 987 000-45-67', telegram: '', email: 'timur.i@example.ru',
    birth_date: '2006-01-19', vacancy: 'Оператор линии розлива', readiness: 'Готов(а) выйти сразу', university: 'Колледж автоматизации и информационных технологий № 20', study_level: 'Колледж / СПО', specialty: 'Монтаж и эксплуатация оборудования',
    points: 1010, created_at: '2026-10-23T09:05:00+03:00',
    telemetry: T({ ppe: 2, wrong: ['headphones'], stations: { lab: lab(52, 2), engineering: eng(70, 2900, 2), line: line(14, 1, 0, 3), design: des(55, 2) }, calc: { interactions: 9, night_ok: true, last: { dept: 'bottling', nights: 8 } }, topics: { dorm: 3, salary: 2, military: 1, transport: 1 }, quiz: { correct: 5, total: 7 } }),
  },
  {
    id: 'seed_04', fio: 'Лебедева Полина Игоревна', phone: '+7 903 000-77-08', telegram: '@polina_food', email: 'p.lebedeva@example.ru',
    birth_date: '2004-11-30', vacancy: 'Технолог пищевого производства', readiness: 'После сессии / летом', university: 'Росбиотех (МГУПП)', study_level: '4 курс', specialty: 'Технология продуктов брожения',
    points: 1150, created_at: '2026-10-21T18:22:00+03:00',
    telemetry: T({ why: ['giant', 'mentors', 'noprobation'], stations: { lab: lab(88, 4), engineering: eng(85, 1800, 3), line: line(8, 3, 1, 2), design: des(77, 3) }, calc: { interactions: 3, night_ok: false, last: { dept: 'tech', nights: 0 } }, topics: { session: 1, brands: 2, mentor: 1 } }),
  },
  {
    id: 'seed_05', fio: 'Орлов Максим Сергеевич', phone: '+7 977 000-19-44', telegram: '@orlov_mx', email: '',
    birth_date: '2005-05-08', vacancy: 'Оператор склада / кладовщик', readiness: 'Через 2 недели', university: 'Пензенский государственный университет', study_level: '3 курс', specialty: 'Логистика',
    points: 890, created_at: '2026-10-23T11:31:00+03:00',
    telemetry: T({ why: ['money', 'dorm'], stations: { lab: lab(60, 2), engineering: eng(66, 3400, 2), line: line(11, 2, 2, 3), design: des(50, 3) }, calc: { interactions: 5, night_ok: true, last: { dept: 'warehouse', nights: 4 } }, topics: { dorm: 2, food: 1, transport: 2 }, quiz: { correct: 4, total: 7 } }),
  },
  {
    id: 'seed_06', fio: 'Ким Виктория Александровна', phone: '+7 926 000-55-31', telegram: '@vika_design', email: 'v.kim@example.ru',
    birth_date: '2003-09-21', vacancy: 'Практика: дизайн, IT, оцифровка линии', readiness: 'Пока присматриваюсь', university: 'Университет ИТМО', study_level: 'Магистратура', specialty: 'Цифровой дизайн',
    points: 1060, created_at: '2026-10-20T16:05:00+03:00',
    telemetry: T({ why: ['giant', 'mentors'], stations: { lab: lab(63, 3), engineering: eng(61, 2600, 2), line: line(7, 4, 1, 2), design: des(97, 4) }, topics: { practice_docs: 2, brands: 1 } }),
  },
  {
    id: 'seed_07', fio: 'Петров Артём Владимирович', phone: '+7 915 000-62-90', telegram: '', email: 'artem.p@example.ru',
    birth_date: '2002-12-12', vacancy: 'Машинист технологических установок', readiness: 'Готов(а) выйти сразу', university: 'НИУ МЭИ', study_level: 'Выпускник', specialty: 'Теплоэнергетика',
    points: 1120, created_at: '2026-10-22T20:48:00+03:00',
    telemetry: T({ why: ['giant', 'noprobation', 'money', 'mentors'], stations: { lab: lab(68, 3), engineering: eng(91, 1400, 3), line: line(10, 2, 0, 3), design: des(60, 3) }, calc: { interactions: 7, night_ok: true, last: { dept: 'tech', nights: 7 } }, topics: { schedule: 2, salary: 1 } }),
  },
  {
    id: 'seed_08', fio: 'Захарова Дарья Михайловна', phone: '+7 999 000-08-17', telegram: '@dasha_z', email: '',
    birth_date: '2005-02-27', vacancy: 'Химик-лаборант', readiness: 'К началу сезона (март–апрель)', university: 'КубГТУ', study_level: '3 курс', specialty: 'Биотехнология',
    points: 980, created_at: '2026-10-23T08:14:00+03:00',
    telemetry: T({ ppe: 2, wrong: ['scarf'], stations: { lab: lab(84, 3), engineering: eng(72, 2400, 2), line: line(9, 3, 1, 2), design: des(70, 3) }, calc: { interactions: 2, night_ok: false, last: { dept: 'lab', nights: 0 } }, topics: { dorm: 2, session: 1, military: 0 } }),
  },
  {
    id: 'seed_09', fio: 'Сидоренко Илья Павлович', phone: '+7 950 000-23-56', telegram: '@ilya_line', email: '',
    birth_date: '2006-06-03', vacancy: 'Оператор линии розлива', readiness: 'Через 2 недели', university: 'Тюменский индустриальный университет', study_level: '1–2 курс', specialty: 'Машиностроение',
    points: 760, created_at: '2026-10-21T12:00:00+03:00',
    telemetry: T({ ppe: 3, wrong: ['slippers', 'hoodie'], why: ['money'], stations: { lab: lab(45, 2), engineering: eng(58, null, 1), line: line(10, 4, 3, 2), design: des(48, 2) }, calc: { interactions: 1, night_ok: true, last: { dept: 'bottling', nights: 6 } }, topics: { dorm: 1, military: 2, salary: 1 }, quiz: { correct: 3, total: 7 }, skipped: [] }),
  },
  {
    id: 'seed_10', fio: 'Николаева Софья Дмитриевна', phone: '+7 916 000-90-12', telegram: '', email: 's.nikolaeva@example.ru',
    birth_date: '2004-08-16', vacancy: 'Технолог пищевого производства', readiness: 'Готов(а) выйти сразу', university: 'Росбиотех (МГУПП)', study_level: 'Выпускник', specialty: 'Технология безалкогольных напитков',
    points: 1210, created_at: '2026-10-23T14:26:00+03:00',
    telemetry: T({ why: ['giant', 'noprobation', 'money', 'dorm', 'mentors'], stations: { lab: lab(92, 4), engineering: eng(88, 1600, 3), line: line(11, 1, 0, 3), design: des(74, 4) }, calc: { interactions: 5, night_ok: true, last: { dept: 'tech', nights: 5 } }, topics: { brands: 1, mentor: 1 } }),
  },
  {
    id: 'seed_11', fio: 'Гусев Роман Евгеньевич', phone: '+7 985 000-44-02', telegram: '@roma_auto', email: '',
    birth_date: '2003-04-25', vacancy: 'Наладчик / специалист по автоматизации', readiness: 'После сессии / летом', university: 'Московский Политех', study_level: '4 курс', specialty: 'Мехатроника и робототехника',
    points: 1090, created_at: '2026-10-22T08:58:00+03:00',
    telemetry: T({ stations: { lab: lab(58, 2), engineering: eng(89, 1700, 3), line: line(13, 2, 1, 3), design: des(79, 4) }, calc: { interactions: 3, night_ok: false, last: { dept: 'tech', nights: 0 } }, topics: { session: 2, practice_docs: 1 } }),
  },
  {
    id: 'seed_12', fio: 'Мельникова Ксения Романовна', phone: '+7 903 000-31-75', telegram: '@ksu_mirea', email: 'ksenia.m@example.ru',
    birth_date: '2005-10-09', vacancy: 'Оператор склада / кладовщик', readiness: 'Пока присматриваюсь', university: 'МИРЭА — Российский технологический университет', study_level: '3 курс', specialty: 'Информационные системы',
    points: 840, created_at: '2026-10-20T19:37:00+03:00',
    telemetry: T({ why: ['money', 'dorm', 'noprobation'], stations: { lab: lab(66, 3), engineering: eng(63, 3100, 2), line: line(9, 3, 1, 2), design: des(83, 4) }, topics: { schedule: 1, food: 1, contract: 1 } }),
  },
]
