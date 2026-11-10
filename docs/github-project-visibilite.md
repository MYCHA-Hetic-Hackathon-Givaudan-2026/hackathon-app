# Rendre le tableau lisible par la team `evaluation`

Le jalon `m1` échoue si la team `evaluation` ne peut pas lire le Project, même si le dépôt est public. Un Project a **ses propres droits**, distincts de ceux du dépôt.

Source cours : [Évaluation](https://learn.glassworks.tech/fullstack-setup/hackathon/evaluation) et [Le tableau](https://learn.glassworks.tech/fullstack-setup/hackathon/tableau). Source GitHub : [Managing visibility of your projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects).

## 1. Lier le tableau au dépôt

1. Sur `hackathon-app` : onglet **Projects** → **Link a project**.
2. Choisir le Project `Hackathon` de l'organisation.
3. Dans le Project : **⋯** → **Settings** → **Default repository** : `hackathon-app`.

En CLI, `tickets.sh` fait déjà `gh project link`.

## 2. Inviter la team `evaluation` (obligatoire pour le barème)

C'est le critère écrit du cours. Ne pas s'en tenir à « le dépôt est public ».

1. Ouvrir le Project `Hackathon`.
2. En haut à droite : **⋯** → **Settings**.
3. **Manage access** → **Invite collaborators**.
4. Inviter les teams, avec ces rôles :

   | Équipe       | Rôle  |
   | ------------ | ----- |
   | `tech-leads` | Admin |
   | `data`       | Write |
   | `product`    | Write |
   | `evaluation` | Read  |

5. **Base role** : laisser **No access**. L'accès au tableau passe par les teams.
6. Vérifier que la team `evaluation` existe dans l'organisation et contient bien le compte demandé par le cours (`glassworks`), rôle Admin sur le **dépôt** (déjà exigé pour `m0`).

## 3. Visibilité Public (option de renfort, pas un substitut)

Dans les Settings du Project, zone **Danger zone** → **Visibility** : on peut passer de Private à **Public**. Tout Internet peut alors _voir_ le tableau ; pour _voir une carte_, il faut aussi le droit de lire le dépôt (ici le dépôt est déjà public).

En CLI : `gh project edit <n> --owner MYCHA-Hetic-Hackathon-Givaudan-2026 --visibility PUBLIC`.

Le cours autorise un dépôt public et un tableau privé : l'invitation de `evaluation` en Read reste donc le geste qui compte pour la relève. La visibilité Public est un filet de sécurité, pas un remplacement.

## 4. Colonnes et champ Size (si le script n'a créé qu'un board vide)

**⋯** → **Settings** → champ **Status**, dans cet ordre :

- Backlog (à trier)
- Ready (prêt à commencer)
- In progress (quelqu'un code)
- In review (pull request ouverte)
- Done (fusionné)

Ajouter un champ **Size** (single select) : `S` (½ jour), `M` (1 jour), `L` (2 jours). Au-delà de L, on découpe.

## 5. Vérification rapide

- Dépôt → onglet **Projects** : le tableau `Hackathon` apparaît.
- Un compte de la team `evaluation` ouvre le tableau et voit au moins 3 tickets.
- Les tickets existent toujours à la relève (le tag `m1` ne les contient pas : ne pas les fermer ni détacher le Project juste après le tag).
