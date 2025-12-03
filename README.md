# Portfolio - Guide d'utilisation

## Ajouter un nouveau projet

Pour ajouter un nouveau projet, éditez simplement le fichier `projects.json` :

```json
{
  "projects": [
    {
      "id": "p25",
      "title": "Mon nouveau projet",
      "category": "photo",
      "description": "Description de mon projet...",
      "images": [
        "images_test/image_test1.jpeg",
        "images_test/image_test2.jpg"
      ]
    }
  ]
}
```

### Champs disponibles :

- **id** : Identifiant unique (ex: "p25", "p26", etc.)
- **title** : Titre du projet (affiché dans la liste)
- **category** : Catégorie ("photo", "video", ou "graphic")
- **description** : Description du projet (affichée dans la vue détail)
- **images** : Tableau des chemins vers les images

### Exemple complet :

```json
{
  "id": "p25",
  "title": "Nouveau projet photo",
  "category": "photo",
  "description": "Une description détaillée de mon projet photographique.",
  "images": [
    "images_test/image_test1.jpeg",
    "images_test/image_test2.jpg",
    "images_test/image_test3.jpg.webp"
  ]
}
```

## Modifier un projet existant

1. Ouvrez `projects.json`
2. Trouvez le projet à modifier
3. Modifiez les champs souhaités
4. Rechargez la page dans votre navigateur

## Supprimer un projet

1. Ouvrez `projects.json`
2. Supprimez l'objet du projet dans le tableau `projects`
3. Rechargez la page

## Notes importantes

- Les images sont chargées automatiquement depuis les chemins spécifiés
- Le layout s'adapte automatiquement selon le nombre d'images :
  - 1 image : 1 colonne
  - 2 images : 2 colonnes
  - 3+ images : 3 colonnes
- Les catégories disponibles sont : "photo", "video", "graphic"
- L'ordre des projets dans le JSON détermine l'ordre d'affichage

