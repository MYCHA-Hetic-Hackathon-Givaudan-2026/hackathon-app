import type { Signal } from './signaux';

/** Audiences brief métier (maquette Forecastro). */
export const BRIEF_AUDS = [
  {
    id: 'sales',
    label: 'Commerciaux',
    desc: 'Arguments et clients à démarcher',
  },
  { id: 'mgmt', label: 'Managers', desc: 'Décision, enjeux et risques' },
  { id: 'supply', label: 'Supply', desc: 'Matières premières et prix' },
  {
    id: 'lab',
    label: 'Laboratoires',
    desc: 'Profil à reproduire et formulation',
  },
  {
    id: 'crea',
    label: 'Équipes créatives',
    desc: 'Univers, ambiance, concepts',
  },
] as const;

export type BriefAudId = (typeof BRIEF_AUDS)[number]['id'];

export type BriefSection = {
  h: string;
  items: { t: string }[];
};

const TARGETS: Record<string, string> = {
  Desserts: 'pâtisserie industrielle, boulangerie, glaces',
  Boissons: 'boissons sans alcool, sodas, boissons prêtes à boire',
  Olfactif: 'parfumerie fine, soin, hygiène',
  Épices: 'plats préparés, sauces, snacking salé',
  'Fruits tropicaux': 'boissons, glaces, produits laitiers',
  'Noix & graines': 'barres, céréales, snacking',
  'Arômes & sucre': 'boissons allégées, confiserie sans sucre',
};

const MOOD: Record<string, string> = {
  Desserts: 'gourmand, réconfort, partage',
  Boissons: 'fraîcheur, pétillant, convivial',
  Olfactif: 'sensoriel, enveloppant, signature',
  Épices: 'intense, authentique, voyage',
  'Fruits tropicaux': 'exotique, solaire, vitalité',
  'Noix & graines': 'naturel, croquant, terroir',
  'Arômes & sucre': 'léger, malin, moderne',
};

const SEASONAL = /chestnut|Thekua|Chirote|Crisp|Brown Betty/i;

function hsh(x: string): number {
  let h = 7;
  for (const ch of x) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}

function fmtM(ym: string): string {
  const mois = [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ];
  if (!/^\d{6}$/.test(ym)) return ym;
  const m = Number(ym.slice(4)) - 1;
  if (m < 0 || m > 11) return ym;
  return `${mois[m]} ${ym.slice(0, 4)}`;
}

/** Raisons simulées du verdict (maquette) — à remplacer par `top_raisons` Data. */
export function reasonsOf(s: Signal): string[] {
  const h = hsh(s.nom);
  const conf = s.confiance_pct;
  if (s.profil === 'durable') {
    return [
      `4 mois après le décollage, l’intérêt reste ×${(1.6 + (conf - 50) / 22 + (h % 5) / 10).toFixed(1).replace('.', ',')} au-dessus de son niveau habituel`,
      'La hausse est régulière, sans pic isolé',
      h % 2
        ? `L’intérêt progresse encore depuis le décollage (+${8 + (h % 30)} %)`
        : 'Pas d’effet de saison : l’intérêt ne retombe pas d’un mois à l’autre',
    ];
  }
  return [
    `Pic brutal au décollage : ×${(2.5 + (h % 40) / 10).toFixed(1).replace('.', ',')} en un seul mois`,
    `Déjà ${35 + (h % 40)} % sous le pic, 4 mois après`,
    SEASONAL.test(s.nom)
      ? 'Intérêt saisonnier : il revient puis retombe chaque année'
      : 'Intérêt irrégulier, porté par un événement ponctuel',
  ];
}

export type MatiereTension = {
  name: string;
  lvl: 0 | 1 | 2;
  label: string;
  color: string;
  bg: string;
};

/** Tension prix estimée (démo) sur les matières. */
export function mpOf(s: Signal): MatiereTension[] {
  return s.matieres.map((m) => {
    const common =
      /^(Farine|Sucre|Beurre|Lait|Œuf|Crème|Sel|Eau|Amidon|Fécule|Riz|Pâtes|Chapelure|Levain|Soda)/i.test(
        m,
      );
    const sc = common
      ? 0
      : (s.profil === 'durable' ? s.confiance_pct : s.confiance_pct * 0.55) +
        (hsh(m) % 30);
    const lvl: 0 | 1 | 2 = sc > 100 ? 2 : sc > 80 ? 1 : 0;
    return {
      name: m,
      lvl,
      label: (['Stable', 'À surveiller', 'Hausse probable'] as const)[lvl],
      color: (['#B4B3A8', '#F09978', '#EC7E7E'] as const)[lvl],
      bg: (
        [
          'rgba(225,224,217,0.07)',
          'rgba(240,153,120,0.13)',
          'rgba(236,126,126,0.14)',
        ] as const
      )[lvl],
    };
  });
}

function sec(h: string, items: (string | null | undefined)[]): BriefSection {
  return {
    h,
    items: items.filter((t): t is string => Boolean(t)).map((t) => ({ t })),
  };
}

/** Brief métier simulé (maquette Forecastro). */
export function briefOf(s: Signal, aud: BriefAudId): BriefSection[] {
  const T = s.profil === 'durable';
  const country = s.pays;
  const mps = mpOf(s);
  const rs = reasonsOf(s);
  const hot = mps.filter((m) => m.lvl === 2).map((m) => m.name);
  const watch = mps.filter((m) => m.lvl === 1).map((m) => m.name);
  const target = TARGETS[s.famille] || 'clients agroalimentaires';
  const first = s.veille_resume.split('. ')[0]?.replace(/\.$/, '') + '.';
  const conf = s.confiance_pct;

  if (aud === 'sales') {
    return [
      sec('Message clé', [
        `${s.nom} : ${T ? 'une tendance durable à proposer dès maintenant' : 'un buzz à exploiter vite, sans engagement long'} (${conf} % de confiance).`,
      ]),
      sec('Arguments pour le client', [
        `Ce qui plaît : ${s.ce_qui_plait.charAt(0).toLowerCase()}${s.ce_qui_plait.slice(1)}.`,
        `Signal parti de ${country} en ${fmtM(s.decollage)}.`,
        T
          ? 'Le modèle prévoit que l’intérêt tiendra au moins 2 ans.'
          : 'Fenêtre courte : l’intérêt devrait baisser dans les prochains mois.',
      ]),
      sec('Clients à cibler', [
        `Secteurs : ${target}.`,
        `Priorité aux clients présents en ${country} et pays voisins.`,
      ]),
      sec('Prochaine étape', [
        T
          ? `Proposer un échantillon ${s.nom} au prochain rendez-vous client.`
          : 'Proposer une édition limitée, livrable rapidement.',
      ]),
    ];
  }

  if (aud === 'mgmt') {
    return [
      sec('Décision proposée', [
        T
          ? conf >= 80
            ? 'Investir : lancer un projet de développement.'
            : 'Préparer : suivre le signal 3 mois avant d’investir.'
          : 'Ne pas investir sur le long terme. Option : édition limitée.',
      ]),
      sec(
        'Pourquoi',
        rs.map((x) => `${x}.`),
      ),
      sec('Enjeux', [
        `Division : ${s.domaine === 'Parfum' ? 'Fragrance & Beauty' : 'Taste & Wellbeing'}.`,
        `Marché d’origine : ${country}.`,
        `Résultat vérifiable en ${fmtM(s.verifiable_en)}.`,
      ]),
      sec('Risques', [
        `Marge d’erreur du modèle : ${100 - conf} %.`,
        hot.length
          ? `Coût : hausse de prix probable sur ${hot.join(', ')}.`
          : 'Pas de tension prix majeure attendue sur les matières.',
      ]),
    ];
  }

  if (aud === 'supply') {
    return [
      sec(
        'Matières premières concernées',
        mps.map((m) => `${m.name} : ${m.label.toLowerCase()}`),
      ),
      sec('Risque de hausse de prix', [
        hot.length
          ? `Hausse probable sur ${hot.join(', ')} si la demande se confirme.`
          : null,
        watch.length ? `À surveiller : ${watch.join(', ')}.` : null,
        !hot.length && !watch.length ? 'Aucune tension attendue.' : null,
        T
          ? `Demande attendue en hausse durable à partir de ${fmtM(s.predit_en)}.`
          : 'Demande attendue en baisse : pas de tension durable.',
      ]),
      sec(
        'Actions recommandées',
        T
          ? [
              `Sécuriser des contrats sur 12 à 24 mois${hot.length ? ` pour ${hot.join(', ')}` : ''}.`,
              'Identifier un second fournisseur.',
              `Vérifier les stocks disponibles avant ${fmtM(s.verifiable_en)}.`,
            ]
          : [
              'Acheter au coup par coup, sans contrat long.',
              'Éviter le surstock.',
            ],
      ),
      sec('Origine du signal', [
        `${country} : vérifier la disponibilité locale des matières.`,
      ]),
    ];
  }

  if (aud === 'lab') {
    return [
      sec('Profil à reproduire', [`${s.ce_qui_plait}.`]),
      sec('Matières de départ', [`${mps.map((m) => m.name).join(', ')}.`]),
      sec(
        'Pistes de formulation',
        s.domaine === 'Parfum'
          ? [
              `Construire un accord autour de : ${s.matieres[0] ?? s.nom}.`,
              'Tester une version naturelle et une version de synthèse, moins chère.',
            ]
          : [
              `Développer un arôme ${s.nom} en version naturelle.`,
              `Tester en application : ${target.split(', ')[0]}.`,
            ],
      ),
      sec('Points de vigilance', [
        hot.length
          ? `Prix en hausse sur ${hot.join(', ')} : prévoir une alternative.`
          : null,
        'Vérifier la tenue du profil en application.',
        T ? null : 'Projet court : privilégier des matières déjà en stock.',
      ]),
    ];
  }

  return [
    sec('L’univers', [first]),
    sec('Ambiance', [
      `Mots-clés : ${MOOD[s.famille] || 'sensoriel'}, ${country}.`,
      `Ce qui plaît : ${s.ce_qui_plait.charAt(0).toLowerCase()}${s.ce_qui_plait.slice(1)}.`,
    ]),
    sec('Idées de concept', [
      T
        ? `Gamme permanente « ${s.nom} revisité ».`
        : `Édition limitée « ${s.nom} », effet découverte.`,
      `Associations à tester : ${s.matieres.slice(0, 2).join(' et ')}.`,
    ]),
    sec('À éviter', [
      T
        ? 'Une identité trop liée à la mode du moment.'
        : 'Une identité long terme : la vague devrait vite retomber.',
    ]),
  ];
}
