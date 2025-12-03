# Propositions pour simplifier la gestion des projets

## Option 1 : Fichier JSON unique (⭐ Recommandé - Simple et efficace)

**Avantages :**
- Un seul fichier à modifier
- Format lisible et facile à éditer
- Pas besoin de scripts complexes

**Structure :**
```json
{
  "projects": [
    {
      "id": "p1",
      "title": "Affiche",
      "category": "photo",
      "description": "Affiche promotionnelle réalisée...",
      "images": [
        "images_test/image_test1.jpeg",
        "images_test/image_test2.jpg"
      ]
    },
    {
      "id": "p2",
      "title": "Identité visuelle",
      "category": "graphic",
      "description": "Construction d'une identité...",
      "images": [
        "images_test/image_test3.jpg.webp",
        "images_test/image_test4.jpeg"
      ]
    }
  ]
}
```

**Utilisation :**
1. Ouvrez `projects.json`
2. Ajoutez/modifiez un projet
3. Rechargez la page

---

## Option 2 : Dossiers par projet avec fichier info.json

**Avantages :**
- Organisation claire (un dossier = un projet)
- Images directement dans le dossier du projet
- Facile à gérer visuellement

**Structure :**
```
projects/
  p1/
    info.json          # { "title": "...", "category": "...", "description": "..." }
    image1.jpg
    image2.jpg
  p2/
    info.json
    photo1.png
    photo2.png
```

**Utilisation :**
1. Créez un dossier `projects/p25/`
2. Ajoutez `info.json` avec les infos
3. Déposez vos images dans le dossier
4. Le site charge automatiquement

---

## Option 3 : Formulaire HTML simple (Interface visuelle)

**Avantages :**
- Interface graphique intuitive
- Pas besoin de modifier du code
- Validation automatique

**Fonctionnalités :**
- Formulaire pour ajouter un projet
- Upload d'images par glisser-déposer
- Prévisualisation
- Sauvegarde automatique dans le JSON

---

## Option 4 : Template HTML réutilisable

**Avantages :**
- Copier-coller simple
- Pas de dépendances
- Contrôle total

**Template :**
```html
<div
  class="project text-3xl font-roc-thin tracking-tight cursor-pointer transition-transform duration-75 ease-out hover:translate-x-2 break-words"
  data-target="pXX"
  data-category="photo|video|graphic"
  data-title="Titre du projet"
  data-description="Description du projet..."
>
  <svg class="project-arrow w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5l7 7-7 7" />
  </svg>
  <span>Titre du projet</span>
</div>
```

---

## Recommandation

**Option 1 (JSON)** est la plus simple et efficace :
- ✅ Un seul fichier à éditer
- ✅ Format standard et lisible
- ✅ Facile à versionner (Git)
- ✅ Peut être généré automatiquement plus tard si besoin

Souhaitez-vous que j'implémente l'Option 1 ?

