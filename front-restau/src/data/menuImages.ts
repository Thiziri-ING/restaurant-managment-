/**
 * menuImages.ts
 * Dictionnaire centralisé des images pour les articles du menu.
 * Associe le nom (normalisé) ou la catégorie à une URL Unsplash.
 *
 * Usage :
 *   import { getMenuImage } from '@/data/menuImages';
 *   const img = getMenuImage(item.name, item.category.name, item.imageUrl);
 */

// ─── Images par nom de plat ────────────────────────────────────────────────────
const BY_NAME: Record<string, string> = {
  // Entrées
  'salade cesar':          'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80',
  'soupe a l oignon':      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  'bruschetta':            'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80',
  'carpaccio de boeuf':    'https://images.unsplash.com/photo-1544025162-d76538631d78?w=400&q=80',
  'velout de potiron':     'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  'foie gras':             'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  'tartare de saumon':     'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80',

  // Plats
  'entrecote grillee':     'https://images.unsplash.com/photo-1544025162-d76538631d78?w=400&q=80',
  'poulet roti':           'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=400&q=80',
  'saumon grille':         'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
  'tajine':                'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
  'couscous':              'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  'burger':                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'steak':                 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
  'pates':                 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80',
  'lasagnes':              'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80',

  // Pizzas
  'pizza margherita':      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
  'pizza 4 fromages':      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
  'pizza quatre fromages': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
  'pizza pepperoni':       'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&q=80',
  'pizza vegetarienne':    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'calzone':               'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&q=80',

  // Boissons
  'coca cola':             'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80',
  'coca-cola':             'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80',
  'eau minerale':          'https://images.unsplash.com/photo-1616118132534-381148898bba?w=400&q=80',
  'jus d orange':          'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
  'cafe':                  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
  'the':                   'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80',
  'biere':                 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
  'vin':                   'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',
  'limonade':              'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
  'smoothie':              'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&q=80',

  // Desserts
  'tiramisu':              'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80',
  'creme brulee':          'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  'fondant au chocolat':   'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
  'cheesecake':            'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80',
  'glace':                 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
  'tarte tatin':           'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
  'mousse au chocolat':    'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=400&q=80',
  'profiteroles':          'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
  'baklava':               'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&q=80',
};

// ─── Fallback par catégorie ────────────────────────────────────────────────────
const BY_CATEGORY: Record<string, string> = {
  'entrees':   'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80',
  'plats':     'https://images.unsplash.com/photo-1544025162-d76538631d78?w=400&q=80',
  'pizzas':    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
  'boissons':  'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80',
  'desserts':  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80',
  'sandwichs': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'salades':   'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80',
  'soupes':    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  'grillades': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Retourne l URL de l image pour un article du menu.
 * Priorité : imageUrl backend > correspondance exacte par nom > correspondance partielle > catégorie > défaut
 */
export function getMenuImage(
  name: string,
  categoryName: string,
  backendImageUrl?: string | null,
): string {
  if (backendImageUrl) return backendImageUrl;

  const normName = normalize(name);

  // Correspondance exacte
  if (BY_NAME[normName]) return BY_NAME[normName];

  // Correspondance partielle
  const partialKey = Object.keys(BY_NAME).find(
    (key) => normName.includes(key) || key.includes(normName),
  );
  if (partialKey) return BY_NAME[partialKey];

  // Fallback catégorie
  const normCat = normalize(categoryName);
  if (BY_CATEGORY[normCat]) return BY_CATEGORY[normCat];
  const catKey = Object.keys(BY_CATEGORY).find(
    (key) => normCat.includes(key) || key.includes(normCat),
  );
  if (catKey) return BY_CATEGORY[catKey];

  return DEFAULT_IMAGE;
}
