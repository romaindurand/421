# Ajout de Joueurs dans un Groupe

## Fonctionnalité ajoutée

Possibilité d'ajouter de nouveaux joueurs à un groupe existant directement depuis la page du groupe.

## Implémentation

### 1. **Fonction côté base de données** (`/src/lib/database.ts`)

```typescript
export async function addPlayerToGroup(groupId: string, playerName: string): Promise<boolean> {
    // Vérifier que le groupe existe
    // Vérifier que le joueur n'existe pas déjà
    // Ajouter le joueur à la liste
    // Mettre à jour la date de modification
}
```

**Validation** :
- ✅ Groupe doit exister
- ✅ Joueur ne doit pas déjà exister dans le groupe
- ✅ Mise à jour automatique de `updatedAt`

### 2. **Route API** (`/src/routes/api/groups/[id]/players/+server.ts`)

**Endpoint** : `POST /api/groups/[id]/players`

**Authentification** : Respecte la configuration dev/prod (cookie requis si `isPasswordRequired()`)

**Validation** :
- ✅ Nom de joueur requis et non vide
- ✅ Longueur max de 50 caractères
- ✅ Pas de doublons
- ✅ Groupe accessible

**Réponse** :
```json
{
  "success": true,
  "message": "Joueur \"Nouveau\" ajouté avec succès",
  "playerName": "Nouveau"
}
```

### 3. **Interface utilisateur** (`/src/routes/group/[id]/+page.svelte`)

#### Section "Gestion des joueurs"
- **Bouton d'ajout** : Ouvre le formulaire d'ajout
- **Liste des joueurs** : Affichage sous forme de badges avec compteur
- **Formulaire d'ajout** : Animation slide, validation temps réel

#### Fonctionnalités UX
- ✅ **Animation slide** à l'ouverture/fermeture du formulaire
- ✅ **Validation en temps réel** (nom vide, trop long, existant)
- ✅ **Messages d'erreur** contextuels
- ✅ **Feedback visuel** pendant l'ajout
- ✅ **Annulation** facile du processus

#### États du formulaire
```typescript
let newPlayerName = '';          // Nom saisi
let isAddingPlayer = false;      // Loading state
let addPlayerError = '';         // Message d'erreur
let showAddPlayerForm = false;   // Visibilité formulaire
```

### 4. **Validation complète**

#### Côté client
- Nom non vide après trim
- Longueur ≤ 50 caractères  
- Pas de doublon dans la liste actuelle

#### Côté serveur
- Authentification (si requise)
- Validation des paramètres
- Vérification existence groupe
- Prévention des doublons en base

### 5. **Intégration avec l'existant**

- ✅ **Mise à jour automatique** de la liste de sélection pour créer des parties
- ✅ **Réactivité Svelte** : `group.playerNames = [...group.playerNames, newPlayer]`
- ✅ **Messages de succès** cohérents avec le reste de l'app
- ✅ **Respect de la configuration** dev/prod pour l'authentification

### 6. **Cas d'usage**

1. **Utilisateur clique** sur "Ajouter un joueur"
2. **Formulaire s'ouvre** avec animation slide
3. **Utilisateur saisit** le nom (validation temps réel)
4. **Utilisateur confirme** → Appel API
5. **Succès** → Joueur ajouté à la liste + message de confirmation
6. **Échec** → Message d'erreur + formulaire reste ouvert

### 7. **Sécurité**

- ✅ **Authentification** : Même logique que les autres actions protégées
- ✅ **Validation d'entrée** : Côté client ET serveur
- ✅ **Sanitisation** : `trim()` automatique des espaces
- ✅ **Limite de taille** : 50 caractères max

Cette fonctionnalité permet aux utilisateurs d'agrandir dynamiquement leurs groupes sans avoir à recréer un nouveau groupe, améliorant significativement l'expérience utilisateur.
