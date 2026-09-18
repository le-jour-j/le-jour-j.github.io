// Tronçons — Tour de Phrance
// Reconstruits le 12/09/2026 à partir des ordres de tournée régionaux vérifiés.
// Les ids v1 sont réutilisés quand le trajet correspond, pour que les
// commentaires de la tournée n°1 restent rattachés. Le premier arrêt d'un
// tronçon est le dernier du précédent (relais). Les lieux retired sont exclus.
// Le détour corse s'insère entre Marseille et Toulon.

export const RAW_ITINERARIES = [
  {
    "id": "troncon-1",
    "name": "De Gratens à Albi",
    "stops": [
      "start-0",
      "occitanie-25",
      "occitanie-28",
      "occitanie-31",
      "occitanie-32",
      "occitanie-29",
      "occitanie-30",
      "occitanie-24",
      "occitanie-22"
    ]
  },
  {
    "id": "troncon-2",
    "name": "De Albi à Sigean",
    "stops": [
      "occitanie-22",
      "occitanie-23",
      "occitanie-17",
      "occitanie-35",
      "occitanie-36",
      "occitanie-18",
      "occitanie-16"
    ]
  },
  {
    "id": "troncon-3",
    "name": "De Sigean à Montpellier",
    "stops": [
      "occitanie-16",
      "occitanie-20",
      "occitanie-21",
      "occitanie-15",
      "occitanie-13",
      "occitanie-14",
      "occitanie-34",
      "occitanie-5"
    ]
  },
  {
    "id": "troncon-2026-01",
    "name": "De Montpellier à Nîmes",
    "stops": [
      "occitanie-5",
      "occitanie-6",
      "occitanie-7",
      "occitanie-9",
      "occitanie-11",
      "occitanie-33",
      "occitanie-1"
    ]
  },
  {
    "id": "troncon-4",
    "name": "De Nîmes à Arles",
    "stops": [
      "occitanie-1",
      "occitanie-2",
      "occitanie-3",
      "occitanie-4",
      "paca-22",
      "paca-32",
      "paca-26"
    ]
  },
  {
    "id": "troncon-2026-02",
    "name": "De Arles à Aix-en-Provence",
    "stops": [
      "paca-26",
      "paca-13",
      "paca-14",
      "paca-12",
      "paca-15",
      "paca-33"
    ]
  },
  {
    "id": "troncon-5",
    "name": "De Aix-en-Provence à Marseille",
    "stops": [
      "paca-33",
      "paca-1",
      "paca-2",
      "paca-29",
      "paca-31",
      "paca-7",
      "paca-8",
      "paca-9",
      "paca-27",
      "paca-6",
      "paca-30",
      "paca-10"
    ]
  },
  {
    "id": "troncon-6",
    "name": "De Marseille à Porto-Vecchio",
    "stops": [
      "paca-10",
      "paca-28",
      "corse-14",
      "corse-15",
      "corse-24",
      "corse-25"
    ]
  },
  {
    "id": "troncon-7",
    "name": "De Porto-Vecchio à Belgodère (Lozari)",
    "stops": [
      "corse-25",
      "corse-1",
      "corse-23",
      "corse-16",
      "corse-7",
      "corse-18",
      "corse-26"
    ]
  },
  {
    "id": "troncon-10",
    "name": "De Belgodère (Lozari) à Grenoble",
    "stops": [
      "corse-26",
      "corse-27",
      "paca-24",
      "paca-23",
      "paca-17",
      "paca-20",
      "paca-16",
      "auvergne-rhone-alpes-17"
    ]
  },
  {
    "id": "troncon-11",
    "name": "De Grenoble à Fontaine",
    "stops": [
      "auvergne-rhone-alpes-17",
      "auvergne-rhone-alpes-21",
      "auvergne-rhone-alpes-20",
      "auvergne-rhone-alpes-18",
      "auvergne-rhone-alpes-16",
      "auvergne-rhone-alpes-34",
      "auvergne-rhone-alpes-35"
    ]
  },
  {
    "id": "troncon-2026-03",
    "name": "De Fontaine à Lyon",
    "stops": [
      "auvergne-rhone-alpes-35",
      "auvergne-rhone-alpes-43",
      "auvergne-rhone-alpes-44",
      "auvergne-rhone-alpes-31",
      "auvergne-rhone-alpes-32",
      "auvergne-rhone-alpes-30",
      "auvergne-rhone-alpes-5",
      "auvergne-rhone-alpes-27",
      "auvergne-rhone-alpes-3",
      "auvergne-rhone-alpes-2",
      "auvergne-rhone-alpes-29",
      "auvergne-rhone-alpes-8"
    ]
  },
  {
    "id": "troncon-12",
    "name": "De Lyon à Valence",
    "stops": [
      "auvergne-rhone-alpes-8",
      "auvergne-rhone-alpes-6",
      "auvergne-rhone-alpes-7",
      "auvergne-rhone-alpes-9",
      "auvergne-rhone-alpes-33",
      "auvergne-rhone-alpes-24",
      "auvergne-rhone-alpes-4",
      "auvergne-rhone-alpes-28",
      "auvergne-rhone-alpes-42"
    ]
  },
  {
    "id": "troncon-12b",
    "name": "De Valence à Saint-Priest-en-Jarez",
    "stops": [
      "auvergne-rhone-alpes-42",
      "auvergne-rhone-alpes-15",
      "auvergne-rhone-alpes-14",
      "auvergne-rhone-alpes-36",
      "auvergne-rhone-alpes-37",
      "auvergne-rhone-alpes-38",
      "auvergne-rhone-alpes-11",
      "auvergne-rhone-alpes-12"
    ]
  },
  {
    "id": "troncon-2026-04",
    "name": "De Saint-Priest-en-Jarez à Nevers",
    "stops": [
      "auvergne-rhone-alpes-12",
      "auvergne-rhone-alpes-26",
      "auvergne-rhone-alpes-41",
      "auvergne-rhone-alpes-23",
      "auvergne-rhone-alpes-39",
      "auvergne-rhone-alpes-40",
      "bourgogne-franche-comte-28"
    ]
  },
  {
    "id": "troncon-14",
    "name": "De Nevers à Tonnerre",
    "stops": [
      "bourgogne-franche-comte-28",
      "bourgogne-franche-comte-29",
      "bourgogne-franche-comte-31",
      "bourgogne-franche-comte-30",
      "bourgogne-franche-comte-43",
      "bourgogne-franche-comte-44"
    ]
  },
  {
    "id": "troncon-13",
    "name": "De Tonnerre à Dijon",
    "stops": [
      "bourgogne-franche-comte-44",
      "bourgogne-franche-comte-1",
      "bourgogne-franche-comte-2",
      "bourgogne-franche-comte-4",
      "bourgogne-franche-comte-3",
      "bourgogne-franche-comte-46",
      "bourgogne-franche-comte-7",
      "bourgogne-franche-comte-8",
      "bourgogne-franche-comte-32",
      "bourgogne-franche-comte-9",
      "bourgogne-franche-comte-10",
      "bourgogne-franche-comte-11"
    ]
  },
  {
    "id": "troncon-2026-05",
    "name": "De Dijon à Quetigny",
    "stops": [
      "bourgogne-franche-comte-11",
      "bourgogne-franche-comte-12",
      "bourgogne-franche-comte-34",
      "bourgogne-franche-comte-33",
      "bourgogne-franche-comte-13",
      "bourgogne-franche-comte-14",
      "bourgogne-franche-comte-5",
      "bourgogne-franche-comte-6"
    ]
  },
  {
    "id": "troncon-12c",
    "name": "De Quetigny à Mâcon",
    "stops": [
      "bourgogne-franche-comte-6",
      "bourgogne-franche-comte-23",
      "bourgogne-franche-comte-24",
      "bourgogne-franche-comte-25",
      "bourgogne-franche-comte-45",
      "bourgogne-franche-comte-26"
    ]
  },
  {
    "id": "troncon-2026-06",
    "name": "De Mâcon à Besançon",
    "stops": [
      "bourgogne-franche-comte-26",
      "bourgogne-franche-comte-27",
      "bourgogne-franche-comte-42",
      "bourgogne-franche-comte-48",
      "bourgogne-franche-comte-15",
      "bourgogne-franche-comte-19",
      "bourgogne-franche-comte-18",
      "bourgogne-franche-comte-39",
      "bourgogne-franche-comte-35",
      "bourgogne-franche-comte-38",
      "bourgogne-franche-comte-36",
      "bourgogne-franche-comte-37"
    ]
  },
  {
    "id": "troncon-2026-07",
    "name": "De Besançon à Montbéliard",
    "stops": [
      "bourgogne-franche-comte-37",
      "bourgogne-franche-comte-40",
      "bourgogne-franche-comte-41",
      "bourgogne-franche-comte-16",
      "bourgogne-franche-comte-17",
      "bourgogne-franche-comte-20"
    ]
  },
  {
    "id": "troncon-15",
    "name": "De Montbéliard à Sélestat",
    "stops": [
      "bourgogne-franche-comte-20",
      "bourgogne-franche-comte-21",
      "bourgogne-franche-comte-22",
      "bourgogne-franche-comte-47",
      "grand-est-28",
      "grand-est-3"
    ]
  },
  {
    "id": "troncon-2026-08",
    "name": "De Sélestat à Strasbourg",
    "stops": [
      "grand-est-3",
      "grand-est-25",
      "grand-est-22",
      "grand-est-5",
      "grand-est-17",
      "grand-est-21",
      "grand-est-20",
      "grand-est-16",
      "grand-est-15",
      "grand-est-4",
      "grand-est-9",
      "grand-est-19"
    ]
  },
  {
    "id": "troncon-2026-09",
    "name": "De Strasbourg à Delme",
    "stops": [
      "grand-est-19",
      "grand-est-24",
      "grand-est-23",
      "grand-est-18",
      "grand-est-7",
      "grand-est-14"
    ]
  },
  {
    "id": "troncon-16",
    "name": "De Delme à Chaumont",
    "stops": [
      "grand-est-14",
      "grand-est-12",
      "grand-est-26",
      "grand-est-2",
      "grand-est-11",
      "grand-est-27",
      "grand-est-29"
    ]
  },
  {
    "id": "troncon-2026-10",
    "name": "De Chaumont à Saint-Mandé",
    "stops": [
      "grand-est-29",
      "grand-est-13",
      "grand-est-1",
      "ile-de-france-8",
      "ile-de-france-7",
      "ile-de-france-21"
    ]
  },
  {
    "id": "troncon-27",
    "name": "De Saint-Mandé à Noisy-le-Sec",
    "stops": [
      "ile-de-france-21",
      "ile-de-france-9",
      "ile-de-france-5",
      "ile-de-france-19",
      "ile-de-france-18",
      "ile-de-france-17",
      "ile-de-france-36",
      "ile-de-france-4"
    ]
  },
  {
    "id": "troncon-paris",
    "name": "De Noisy-le-Sec à Paris",
    "stops": [
      "ile-de-france-4",
      "ile-de-france-24",
      "ile-de-france-11",
      "ile-de-france-29",
      "ile-de-france-28",
      "ile-de-france-37",
      "ile-de-france-31",
      "ile-de-france-33",
      "ile-de-france-35",
      "ile-de-france-34",
      "ile-de-france-27",
      "ile-de-france-30"
    ]
  },
  {
    "id": "troncon-28",
    "name": "De Paris à Brétigny-sur-Orge",
    "stops": [
      "ile-de-france-30",
      "ile-de-france-38",
      "ile-de-france-20",
      "ile-de-france-3",
      "ile-de-france-1",
      "ile-de-france-6"
    ]
  },
  {
    "id": "troncon-2026-11",
    "name": "De Brétigny-sur-Orge à Aubervilliers",
    "stops": [
      "ile-de-france-6",
      "ile-de-france-22",
      "ile-de-france-16",
      "ile-de-france-39",
      "ile-de-france-32",
      "ile-de-france-26",
      "ile-de-france-10"
    ]
  },
  {
    "id": "troncon-26",
    "name": "De Aubervilliers à Amiens",
    "stops": [
      "ile-de-france-10",
      "ile-de-france-23",
      "ile-de-france-2",
      "ile-de-france-12",
      "ile-de-france-25",
      "hauts-de-france-22"
    ]
  },
  {
    "id": "troncon-17",
    "name": "De Amiens à Lens",
    "stops": [
      "hauts-de-france-22",
      "hauts-de-france-23",
      "hauts-de-france-24",
      "hauts-de-france-21",
      "hauts-de-france-19",
      "hauts-de-france-20",
      "hauts-de-france-18",
      "hauts-de-france-8"
    ]
  },
  {
    "id": "troncon-2026-12",
    "name": "De Lens à Lille",
    "stops": [
      "hauts-de-france-8",
      "hauts-de-france-29",
      "hauts-de-france-27",
      "hauts-de-france-10",
      "hauts-de-france-25",
      "hauts-de-france-30",
      "hauts-de-france-32",
      "hauts-de-france-11",
      "hauts-de-france-26",
      "hauts-de-france-28",
      "hauts-de-france-35",
      "hauts-de-france-6"
    ]
  },
  {
    "id": "troncon-18",
    "name": "De Lille à Villeneuve-d'Ascq",
    "stops": [
      "hauts-de-france-6",
      "hauts-de-france-14",
      "hauts-de-france-13",
      "hauts-de-france-34",
      "hauts-de-france-33",
      "hauts-de-france-9",
      "hauts-de-france-31",
      "hauts-de-france-3"
    ]
  },
  {
    "id": "troncon-19",
    "name": "De Villeneuve-d'Ascq à Dieppe",
    "stops": [
      "hauts-de-france-3",
      "hauts-de-france-7",
      "hauts-de-france-17",
      "hauts-de-france-1",
      "hauts-de-france-2",
      "normandie-15"
    ]
  },
  {
    "id": "troncon-2026-13",
    "name": "De Dieppe à Sotteville-lès-Rouen",
    "stops": [
      "normandie-15",
      "normandie-2",
      "normandie-17",
      "normandie-3",
      "normandie-4",
      "normandie-16",
      "normandie-1"
    ]
  },
  {
    "id": "troncon-2026-14",
    "name": "De Sotteville-lès-Rouen à Honfleur",
    "stops": [
      "normandie-1",
      "normandie-6",
      "normandie-5",
      "normandie-8",
      "normandie-18",
      "normandie-26"
    ]
  },
  {
    "id": "troncon-20",
    "name": "De Honfleur à Bayeux",
    "stops": [
      "normandie-26",
      "normandie-10",
      "normandie-9",
      "normandie-19",
      "normandie-20",
      "normandie-14",
      "normandie-13",
      "normandie-12",
      "normandie-21"
    ]
  },
  {
    "id": "troncon-21",
    "name": "De Bayeux à Rennes",
    "stops": [
      "normandie-21",
      "normandie-22",
      "normandie-23",
      "normandie-24",
      "bretagne-26",
      "bretagne-47",
      "bretagne-25",
      "bretagne-27",
      "bretagne-1"
    ]
  },
  {
    "id": "troncon-2026-15",
    "name": "De Rennes à Saint-Brieuc",
    "stops": [
      "bretagne-1",
      "bretagne-28",
      "bretagne-6",
      "bretagne-29",
      "bretagne-2",
      "bretagne-3",
      "bretagne-4",
      "bretagne-32",
      "bretagne-31",
      "bretagne-30",
      "bretagne-23"
    ]
  },
  {
    "id": "troncon-2026-16",
    "name": "De Saint-Brieuc à Lannion",
    "stops": [
      "bretagne-23",
      "bretagne-34",
      "bretagne-35",
      "bretagne-36",
      "bretagne-37",
      "bretagne-38"
    ]
  },
  {
    "id": "troncon-2026-17",
    "name": "De Lannion à Landerneau",
    "stops": [
      "bretagne-38",
      "bretagne-39",
      "bretagne-21",
      "bretagne-22",
      "bretagne-40",
      "bretagne-41"
    ]
  },
  {
    "id": "troncon-2026-18",
    "name": "De Landerneau à Douarnenez",
    "stops": [
      "bretagne-41",
      "bretagne-8",
      "bretagne-42",
      "bretagne-10",
      "bretagne-11",
      "bretagne-43"
    ]
  },
  {
    "id": "troncon-22",
    "name": "De Douarnenez à Lorient",
    "stops": [
      "bretagne-43",
      "bretagne-44",
      "bretagne-16",
      "bretagne-15",
      "bretagne-17",
      "bretagne-14"
    ]
  },
  {
    "id": "troncon-23",
    "name": "De Lorient à Redon",
    "stops": [
      "bretagne-14",
      "bretagne-45",
      "bretagne-20",
      "bretagne-18",
      "bretagne-19",
      "bretagne-46",
      "bretagne-33"
    ]
  },
  {
    "id": "troncon-24",
    "name": "De Redon à Nantes",
    "stops": [
      "bretagne-33",
      "pays-de-la-loire-6",
      "pays-de-la-loire-7",
      "pays-de-la-loire-5",
      "pays-de-la-loire-15",
      "pays-de-la-loire-2",
      "pays-de-la-loire-18",
      "pays-de-la-loire-16",
      "pays-de-la-loire-17",
      "pays-de-la-loire-24",
      "pays-de-la-loire-25",
      "pays-de-la-loire-26"
    ]
  },
  {
    "id": "troncon-2026-19",
    "name": "De Nantes à Carquefou",
    "stops": [
      "pays-de-la-loire-26",
      "pays-de-la-loire-22",
      "pays-de-la-loire-23",
      "pays-de-la-loire-21",
      "pays-de-la-loire-27",
      "pays-de-la-loire-3",
      "pays-de-la-loire-4",
      "pays-de-la-loire-1"
    ]
  },
  {
    "id": "troncon-25",
    "name": "De Carquefou à Vendôme",
    "stops": [
      "pays-de-la-loire-1",
      "pays-de-la-loire-8",
      "pays-de-la-loire-11",
      "pays-de-la-loire-9",
      "pays-de-la-loire-12",
      "pays-de-la-loire-13",
      "pays-de-la-loire-19",
      "pays-de-la-loire-14",
      "centre-val-de-loire-30"
    ]
  },
  {
    "id": "troncon-29",
    "name": "De Vendôme à Orléans",
    "stops": [
      "centre-val-de-loire-30",
      "centre-val-de-loire-31",
      "centre-val-de-loire-14",
      "centre-val-de-loire-15",
      "centre-val-de-loire-16",
      "centre-val-de-loire-17",
      "centre-val-de-loire-19",
      "centre-val-de-loire-18",
      "centre-val-de-loire-28",
      "centre-val-de-loire-27",
      "centre-val-de-loire-12",
      "centre-val-de-loire-13"
    ]
  },
  {
    "id": "troncon-lemans-orleans",
    "name": "De Orléans à Blois",
    "stops": [
      "centre-val-de-loire-13",
      "centre-val-de-loire-20",
      "centre-val-de-loire-21",
      "centre-val-de-loire-26",
      "centre-val-de-loire-25",
      "centre-val-de-loire-23",
      "centre-val-de-loire-24",
      "centre-val-de-loire-8"
    ]
  },
  {
    "id": "troncon-30",
    "name": "De Blois à Poitiers",
    "stops": [
      "centre-val-de-loire-8",
      "centre-val-de-loire-11",
      "centre-val-de-loire-29",
      "centre-val-de-loire-7",
      "centre-val-de-loire-2",
      "centre-val-de-loire-10",
      "centre-val-de-loire-9",
      "centre-val-de-loire-4",
      "centre-val-de-loire-1",
      "nouvelle-aquitaine-9"
    ]
  },
  {
    "id": "troncon-31",
    "name": "De Poitiers à Limoges",
    "stops": [
      "nouvelle-aquitaine-9",
      "nouvelle-aquitaine-10",
      "nouvelle-aquitaine-32",
      "nouvelle-aquitaine-31",
      "nouvelle-aquitaine-25",
      "nouvelle-aquitaine-13"
    ]
  },
  {
    "id": "troncon-32",
    "name": "De Limoges à Meymac",
    "stops": [
      "nouvelle-aquitaine-13",
      "nouvelle-aquitaine-14",
      "nouvelle-aquitaine-15",
      "nouvelle-aquitaine-35",
      "nouvelle-aquitaine-36",
      "nouvelle-aquitaine-37",
      "nouvelle-aquitaine-26",
      "nouvelle-aquitaine-27",
      "nouvelle-aquitaine-23"
    ]
  },
  {
    "id": "troncon-2026-20",
    "name": "De Meymac à Angoulême",
    "stops": [
      "nouvelle-aquitaine-23",
      "nouvelle-aquitaine-24",
      "nouvelle-aquitaine-12",
      "nouvelle-aquitaine-21",
      "nouvelle-aquitaine-38",
      "nouvelle-aquitaine-7"
    ]
  },
  {
    "id": "troncon-33",
    "name": "De Angoulême à Bayonne",
    "stops": [
      "nouvelle-aquitaine-7",
      "nouvelle-aquitaine-8",
      "nouvelle-aquitaine-34",
      "nouvelle-aquitaine-30",
      "nouvelle-aquitaine-5",
      "nouvelle-aquitaine-33",
      "nouvelle-aquitaine-3",
      "nouvelle-aquitaine-2",
      "nouvelle-aquitaine-1",
      "nouvelle-aquitaine-4",
      "nouvelle-aquitaine-28"
    ]
  },
  {
    "id": "troncon-2026-21",
    "name": "De Bayonne à Anglet",
    "stops": [
      "nouvelle-aquitaine-28",
      "nouvelle-aquitaine-20",
      "nouvelle-aquitaine-18",
      "nouvelle-aquitaine-39",
      "nouvelle-aquitaine-40",
      "nouvelle-aquitaine-41",
      "nouvelle-aquitaine-42",
      "nouvelle-aquitaine-43",
      "nouvelle-aquitaine-17"
    ]
  },
  {
    "id": "troncon-34",
    "name": "Retour au KM 0 — de Anglet à Gratens",
    "stops": [
      "nouvelle-aquitaine-17",
      "nouvelle-aquitaine-19",
      "nouvelle-aquitaine-29",
      "nouvelle-aquitaine-45",
      "nouvelle-aquitaine-44",
      "nouvelle-aquitaine-46",
      "nouvelle-aquitaine-16",
      "start-0"
    ]
  }
];
