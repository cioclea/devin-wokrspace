import type { LessonDefinition } from "./lesson";

export interface ModuleDef {
  id: string;
  title: string;
  lessons: LessonDefinition[];
}

const COMPONENTS_PARTS: LessonDefinition["parts"] = [
  { id: "frame", name: "Rama", desc: "Rama (waku) ține totul împreună. Sorobanul se ține orizontal, pe masă." },
  { id: "beam", name: "Bara de calcul", desc: "Bara centrală (hari) desparte bilele. Doar bilele care ating bara se numără." },
  { id: "rod", name: "Tijele", desc: "Fiecare tijă (keta) este o poziție zecimală: Unități, Zeci, Sute, Mii…" },
  { id: "upper", name: "Bila superioară = 5", desc: "Bila de sus („bila cerului”) valorează 5 când coboară la bară." },
  { id: "lower", name: "Bile inferioare = 1", desc: "Cele 4 bile de jos („bilele pământului”) valorează câte 1 când urcă la bară." },
  { id: "dot", name: "Punctele", desc: "Punctele de pe bară marchează tija Unităților și te ajută să citești numerele mari." },
];

const DISCOVERY_MISSIONS: LessonDefinition["missions"] = [
  { text: "Atinge o bilă inferioară de pe tija Unităților.", target: 1, icon: "👆" },
  { text: "Formează cifra 3 pe tija Unităților.", target: 3, icon: "🔢" },
  { text: "Formează cifra 5 folosind o singură bilă.", target: 5, icon: "✋" },
  { text: "Formează cifra 7.", target: 7, icon: "🌟" },
  { text: "Formează cifra 9 – cea mai mare cifră de pe o tijă.", target: 9, icon: "🚀" },
  { text: "Formează numărul 24 (2 zeci și 4 unități).", target: 24, icon: "🧩" },
  { text: "Formează numărul 507.", target: 507, icon: "🏆" },
];

const M1_L1_MISSIONS: LessonDefinition["missions"] = DISCOVERY_MISSIONS.map((m, i) =>
  i === 0 ? { ...m, text: "Descoperă componentele abacului și află cum funcționează fiecare.", icon: "🔍" } : m,
);

const DISCOVERY_GOALS: LessonDefinition["goals"] = [
  { text: "Cunosc părțile Sorobanului", needsParts: true },
  { text: "Știu valoarea bilelor (1 și 5)", afterMission: 2 },
  { text: "Formez cifrele de la 0 la 9", afterMission: 4 },
  { text: "Citesc numere cu mai multe cifre", afterMission: 6 },
];

export const MODULES: ModuleDef[] = [
  {
    id: "modul-1",
    title: "Modulul 1",
    lessons: [
      {
        id: "m1-l1",
        moduleId: "modul-1",
        number: 1,
        title: "Descoperă componentele abacului",
        subtitle: "Explorează un abac japonez, află rolul fiecărei piese și încearcă să le identifici singur.",
        missionLabel: "Misiunea",
        missionClassName: "green",
        missions: M1_L1_MISSIONS,
        parts: COMPONENTS_PARTS,
        goals: DISCOVERY_GOALS,
      },
      {
        id: "m1-l2",
        moduleId: "modul-1",
        number: 2,
        title: "Lecție nouă",
        missions: [],
        parts: [],
        goals: [],
        comingSoon: true,
      },
    ],
  },
  {
    id: "modul-2",
    title: "Modulul 2",
    lessons: [
      {
        id: "m2-l1",
        moduleId: "modul-2",
        number: 1,
        title: "Descoperă Sorobanul",
        subtitle: "Învață să calculezi folosind tehnica japoneză",
        missions: DISCOVERY_MISSIONS,
        parts: COMPONENTS_PARTS,
        goals: DISCOVERY_GOALS,
      },
    ],
  },
];

export const getLesson = (id: string): LessonDefinition | undefined =>
  MODULES.flatMap((m) => m.lessons).find((l) => l.id === id);

export const getModule = (id: string): ModuleDef | undefined => MODULES.find((m) => m.id === id);

/** Per-lesson persistence key so progress in different lessons never collides. */
export const lessonStorageKey = (lesson: LessonDefinition): string =>
  `soroban-lesson-v1:${lesson.moduleId}:${lesson.id}`;
