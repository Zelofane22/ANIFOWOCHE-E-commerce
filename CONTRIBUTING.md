# Contribuer à ANIFOWOCHE

Merci de contribuer ! Pour que les versions sémantiques soient générées automatiquement
(`release-please` sur `main`), chaque commit de votre branche doit suivre la
**[Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/)**.

## Format des messages de commit

```
<type>(<portée>): <description>
```

- Les commits de **feat** (`feat:`) déclenchent un bump **MINOR** (`x.y.0`).
- Les commits de **fix** (`fix:`) déclenchent un bump **PATCH** (`x.0.z`).
- Les autres types (`chore:`, `docs:`, `refactor:`, `test:`, `style:`, `build:`, `ci:`, `perf:`) ne génèrent **pas** de version.
- Un **`BREAKING CHANGE:`** dans le footer du commit (ou un `!` après le type) déclenche un bump **MAJOR** (`X.0.0`).

## Types autorisés

| Type        | Effet sur la version | Exemple |
|-------------|----------------------|---------|
| `feat:`     | MINOR                | nouvelle fonctionnalité utilisateur |
| `fix:`      | PATCH                | correction de bug |
| `chore:`    | aucune               | maintenance, dépendances |
| `docs:`     | aucune               | documentation |
| `refactor:` | aucune               | refactoring sans changement de comportement |
| `test:`     | aucune               | tests |
| `ci:`       | aucune               | pipeline CI/CD |

## Exemples concrets tirés du projet

```
feat(seller): ajout du bouton flottant d'ajout de produit
feat(products): arbre de catégories à 3 niveaux
fix(seller-products): permettre la création sans stock et envoyer 0 par défaut
chore(deps): bump les dépendances frontend
docs(readme): documenter la procédure de sauvegarde BDD
```

## Changement cassant (major bump)

Ajoutez un footer `BREAKING CHANGE:` :

```
feat(orders): refonte du flux de paiement

BREAKING CHANGE: l'endpoint /api/orders/accepte désormais un format de payload différent.
```

## Workflow

1. Créez votre branche depuis `develop`.
2. Commitez avec des messages Conventional Commits (les *squash merge* sur GitHub sont encouragés pour garder l'historique de `main` propre).
3. Ouvrez une PR vers `develop`, puis `develop` → `main`.

Lors du merge d'une PR sur `main`, `release-please` ouvre/met à jour une PR
`chore(main): release vX.Y.Z`. Sa fusion crée le tag Git et la GitHub Release.
