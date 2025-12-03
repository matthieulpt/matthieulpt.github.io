let projects = [];
let previews = [];
const projectList = document.getElementById('project-list');
const projectDetail = document.getElementById('project-detail');
const filterButtons = document.getElementById('filter-buttons');
const backToListButton = document.getElementById('back-to-list');
const detailTitle = document.getElementById('detail-title');
const detailDescription = document.getElementById('detail-description');
const projectsHeading = document.getElementById('projects-heading');
const mainContent = document.querySelector('main');
const FADE_DURATION = 200;
let activePreview = null;
let currentProjectIndex = -1; // -1 = état vide
let isDetailMode = false;
let activeFilter = null; // null = tous les projets, 'photo', 'video', 'graphic'
let projectsData = []; // Données des projets depuis le JSON
let imageCarousel = null; // Conteneur du carrousel d'images
let imageToProjectMap = new Map(); // Mapping image -> projet

function fadeIn(element) {
  if (!element) return;
  if (!element.classList.contains('hidden')) return;
  element.classList.remove('hidden');
  element.classList.add('opacity-0');
  requestAnimationFrame(() => {
    element.classList.remove('opacity-0');
  });
}

function fadeOut(element) {
  if (!element) return;
  if (element.classList.contains('hidden')) return;
  element.classList.add('opacity-0');
  setTimeout(() => {
    element.classList.add('hidden');
  }, FADE_DURATION);
}

// Fonction pour obtenir les projets visibles (non filtrés)
function getVisibleProjects() {
  return Array.from(projects).filter(project => {
    if (activeFilter === null) return true;
    return project.dataset.category === activeFilter;
  });
}

// Fonction pour obtenir l'index réel d'un projet dans la liste complète
function getRealIndex(visibleIndex) {
  const visibleProjects = getVisibleProjects();
  if (visibleIndex < 0 || visibleIndex >= visibleProjects.length) return -1;
  const project = visibleProjects[visibleIndex];
  return Array.from(projects).indexOf(project);
}

// Fonction pour obtenir l'index visible d'un projet réel
function getVisibleIndex(realIndex) {
  const visibleProjects = getVisibleProjects();
  const project = projects[realIndex];
  return visibleProjects.indexOf(project);
}

// Fonction pour filtrer les projets
function filterProjects(category) {
  activeFilter = category;
  
  // Mettre à jour l'état actif des boutons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (category === null) {
      // Si aucun filtre, tous les boutons à 100% d'opacité
      btn.classList.add('opacity-100');
      btn.classList.remove('opacity-50');
    } else if (btn.dataset.filter === category) {
      // Bouton actif à 100%
      btn.classList.add('opacity-100');
      btn.classList.remove('opacity-50');
    } else {
      // Boutons inactifs à 50%
      btn.classList.add('opacity-50');
      btn.classList.remove('opacity-100');
    }
  });
  
  // Afficher/masquer les projets
  projects.forEach(project => {
    if (category === null || project.dataset.category === category) {
      project.classList.remove('hidden');
    } else {
      project.classList.add('hidden');
    }
  });
  
  // Régénérer le carrousel d'images avec le nouveau filtre
  generateImageCarousel();
  
  // Réinitialiser l'état
  showBlank();
}

// Fonction pour afficher l'état vide
function showBlank() {
  currentProjectIndex = -1;

  // Retirer la classe active de tous les projets
  projects.forEach(p => p.classList.remove('project-active'));

  // Cacher tous les previews
  previews.forEach(preview => {
    preview.classList.add('opacity-0', 'pointer-events-none');
    preview.classList.remove('opacity-100');
  });
  
  // Afficher le carrousel d'images
  if (imageCarousel) {
    imageCarousel.classList.remove('hidden');
  }

  activePreview = null;
}

// Fonction pour afficher un projet (index dans les projets visibles)
function showProject(visibleIndex) {
  const visibleProjects = getVisibleProjects();
  
  if (visibleIndex < 0 || visibleIndex >= visibleProjects.length) {
    showBlank();
    return;
  }
  
  const project = visibleProjects[visibleIndex];
  const realIndex = Array.from(projects).indexOf(project);
  const targetId = project.dataset.target;
  const targetPreview = document.getElementById(targetId);

  if (!targetPreview) return;

  // Mettre à jour l'index actif (index visible)
  currentProjectIndex = visibleIndex;

  // Retirer la classe active de tous les projets
  projects.forEach(p => p.classList.remove('project-active'));
  
  // Ajouter la classe active au projet courant
  project.classList.add('project-active');

  // Cacher le carrousel d'images
  if (imageCarousel) {
    imageCarousel.classList.add('hidden');
  }
  
  // Afficher le preview correspondant
  previews.forEach(preview => {
    if (preview === targetPreview) {
      preview.classList.remove('opacity-0', 'pointer-events-none');
      preview.classList.add('opacity-100');
      activePreview = preview;
    } else {
      preview.classList.add('opacity-0', 'pointer-events-none');
      preview.classList.remove('opacity-100');
    }
  });
}

// Mode détail
function enterDetailMode(project) {
  if (!project) return;

  const title = project.dataset.title || project.textContent.trim();
  const description = project.dataset.description || '';

  detailTitle.textContent = title;
  detailDescription.textContent = description;
  if (description.trim()) {
    detailDescription.classList.remove('hidden');
  } else {
    detailDescription.classList.add('hidden');
  }

  isDetailMode = true;
  projectList.classList.add('hidden');
  projectsHeading.classList.add('hidden');
  if (filterButtons) {
    filterButtons.classList.add('hidden');
  }
  
  // Cacher le carrousel d'images
  if (imageCarousel) {
    imageCarousel.classList.add('hidden');
  }
  
  fadeIn(projectDetail);
}

function exitDetailMode() {
  isDetailMode = false;
  fadeOut(projectDetail);
  fadeIn(projectsHeading);
  fadeIn(projectList);
  if (filterButtons) {
    filterButtons.classList.remove('hidden');
  }

  detailTitle.textContent = '';
  detailDescription.textContent = '';

  showBlank();
}

// Navigation au clavier
document.addEventListener('keydown', (e) => {
  if (isDetailMode) {
    return;
  }

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    
    const visibleProjects = getVisibleProjects();
    
    if (currentProjectIndex === -1) {
      // Si on est dans l'état vide
      if (e.key === 'ArrowDown') {
        // Aller au premier projet visible
        if (visibleProjects.length > 0) {
          showProject(0);
        }
      } else {
        // Aller au dernier projet visible
        if (visibleProjects.length > 0) {
          showProject(visibleProjects.length - 1);
        }
      }
    } else {
      // Naviguer entre les projets visibles
      if (e.key === 'ArrowDown') {
        if (currentProjectIndex === visibleProjects.length - 1) {
          // Si on est au dernier, aller à l'état vide
          showBlank();
        } else {
          // Sinon, aller au projet suivant
          showProject(currentProjectIndex + 1);
        }
      } else {
        // Flèche haut
        if (currentProjectIndex === 0) {
          // Si on est au premier, aller à l'état vide
          showBlank();
        } else {
          // Sinon, aller au projet précédent
          showProject(currentProjectIndex - 1);
        }
      }
    }
  }
});

// Les événements sont maintenant attachés dans attachProjectEvents()

if (backToListButton) {
  backToListButton.addEventListener('click', () => {
    exitDetailMode();
  });
}

// Gestion des filtres
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    if (activeFilter === filter) {
      // Si on clique sur le filtre actif, désactiver le filtre
      filterProjects(null);
    } else {
      // Sinon, activer le nouveau filtre
      filterProjects(filter);
    }
  });
});

// Fonction pour charger les projets depuis le JSON
async function loadProjects() {
  try {
    const response = await fetch('projects.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('Format JSON invalide: projects array manquant');
    }
    
    projectsData = data.projects;
    console.log(`${projectsData.length} projets chargés`);
    
    // Générer les projets dans la liste
    generateProjectList();
    
    // Générer les previews (pour le mode détail)
    generatePreviews();
    
    // Générer le carrousel d'images
    generateImageCarousel();
    
    // Réinitialiser les références
    projects = Array.from(document.querySelectorAll('.project'));
    previews = Array.from(document.querySelectorAll('.preview-content'));
    
    console.log(`${projects.length} projets générés, ${previews.length} previews générés`);
    
    // Attacher les événements
    attachProjectEvents();
    
    // Initialiser l'état des boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.add('opacity-100');
      btn.classList.remove('opacity-50');
    });
    
    // Cliquer sur "PROJETS" pour réinitialiser le filtre
    if (projectsHeading) {
      projectsHeading.addEventListener('click', () => {
        if (!isDetailMode) {
          filterProjects(null);
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des projets:', error);
    // Afficher un message d'erreur dans la liste des projets
    if (projectList) {
      projectList.innerHTML = `<div class="text-red-500">Erreur: ${error.message}</div>`;
    }
  }
}

// Fonction pour générer la liste des projets
function generateProjectList() {
  if (!projectList) {
    console.error('projectList non trouvé');
    return;
  }
  
  projectList.innerHTML = '';
  
  if (!projectsData || projectsData.length === 0) {
    console.error('Aucune donnée de projet disponible');
    return;
  }
  
  projectsData.forEach(project => {
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project text-3xl font-roc-thin tracking-tight cursor-pointer transition-transform duration-75 ease-out hover:translate-x-2 break-words';
    projectDiv.setAttribute('data-target', project.id);
    projectDiv.setAttribute('data-category', project.category);
    projectDiv.setAttribute('data-title', project.title);
    projectDiv.setAttribute('data-description', project.description);
    projectDiv.setAttribute('tabindex', '0');
    
    projectDiv.innerHTML = `
      <svg class="project-arrow w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5l7 7-7 7" />
      </svg>
      <span>${project.title}</span>
    `;
    
    projectList.appendChild(projectDiv);
  });
  
  console.log(`Liste générée: ${projectsData.length} projets ajoutés`);
}

// Fonction pour générer les previews
function generatePreviews() {
  if (!mainContent) {
    console.error('mainContent non trouvé');
    return;
  }
  
  // Supprimer les anciens previews
  const oldPreviews = mainContent.querySelectorAll('.preview-content');
  oldPreviews.forEach(preview => preview.remove());
  
  if (!projectsData || projectsData.length === 0) {
    console.error('Aucune donnée de projet pour générer les previews');
    return;
  }
  
  projectsData.forEach(project => {
    const previewDiv = document.createElement('div');
    previewDiv.id = project.id;
    previewDiv.className = 'preview-content absolute inset-0 flex items-start justify-center overflow-y-auto p-8 opacity-0 pointer-events-none transition-opacity duration-200';
    
    // Déterminer le layout selon le nombre d'images
    let gridClass = 'grid grid-cols-1 gap-8';
    if (project.images.length === 2) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-8';
    } else if (project.images.length >= 3) {
      gridClass = 'grid grid-cols-1 md:grid-cols-3 gap-8';
    }
    
    const container = document.createElement('div');
    container.className = `w-full max-w-5xl ${gridClass}`;
    
    // Ajouter les images
    project.images.forEach((imagePath, index) => {
      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = `${project.title} - Image ${index + 1}`;
      img.className = 'w-full h-auto object-contain shadow-lg';
      img.loading = 'lazy';
      container.appendChild(img);
    });
    
    previewDiv.appendChild(container);
    mainContent.appendChild(previewDiv);
  });
  
  console.log(`Previews générés: ${projectsData.length} previews créés`);
}

// Fonction pour créer le mapping image -> projet
function buildImageToProjectMap() {
  imageToProjectMap.clear();
  projectsData.forEach(project => {
    project.images.forEach(imagePath => {
      // Normaliser le chemin pour gérer les variations (avec/sans extension, etc.)
      const normalizedPath = imagePath.toLowerCase();
      imageToProjectMap.set(normalizedPath, project);
      // Aussi mapper le nom de fichier seul
      const fileName = imagePath.split('/').pop().toLowerCase();
      imageToProjectMap.set(fileName, project);
    });
  });
}

// Fonction pour obtenir toutes les images de test
function getAllTestImages() {
  const allImages = [];
  projectsData.forEach(project => {
    project.images.forEach(imagePath => {
      allImages.push({
        path: imagePath,
        project: project
      });
    });
  });
  return allImages;
}

// Fonction pour mélanger un tableau (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Fonction pour générer le carrousel d'images
function generateImageCarousel() {
  if (!mainContent) {
    console.error('mainContent non trouvé');
    return;
  }
  
  // Supprimer l'ancien carrousel s'il existe
  if (imageCarousel) {
    imageCarousel.remove();
  }
  
  // Construire le mapping image -> projet
  buildImageToProjectMap();
  
  // Obtenir toutes les images selon le filtre
  let imagesToShow = getAllTestImages();
  
  // Filtrer selon activeFilter
  if (activeFilter) {
    imagesToShow = imagesToShow.filter(img => img.project.category === activeFilter);
  }
  
  if (imagesToShow.length === 0) {
    return;
  }
  
  // Mélanger les images
  const shuffledImages = shuffleArray(imagesToShow);
  
  // Créer le conteneur du carrousel
  imageCarousel = document.createElement('div');
  imageCarousel.id = 'image-carousel';
  imageCarousel.className = 'absolute inset-0 overflow-y-auto overflow-x-hidden p-8';
  
  // Créer le conteneur du carrousel d'abord
  imageCarousel.appendChild(document.createElement('div')); // Placeholder temporaire
  
  // Attendre que le DOM soit prêt pour calculer les dimensions
  setTimeout(() => {
    // Calculer le nombre optimal de colonnes et lignes pour afficher toutes les images
    const totalImages = shuffledImages.length;
    const padding = 32; // 8 * 4 (p-8 = 2rem = 32px)
    const gap = 16; // gap-4 = 1rem = 16px
    
    // Obtenir les dimensions disponibles (en tenant compte du header et de la colonne gauche)
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const aside = document.querySelector('aside');
    const asideWidth = aside ? aside.offsetWidth : 0;
    
    const availableWidth = window.innerWidth - asideWidth - (padding * 2);
    const availableHeight = window.innerHeight - headerHeight - (padding * 2);
    
    // Calculer le nombre optimal de colonnes pour un layout masonry
    // On essaie différentes configurations pour trouver celle qui s'adapte le mieux
    let bestCols = 5;
    let bestScale = 0;
    
    for (let cols = 4; cols <= 8; cols++) {
      const cellWidth = (availableWidth - (gap * (cols - 1))) / cols;
      // Estimer la hauteur moyenne nécessaire avec cette largeur
      const estimatedHeight = (availableHeight / Math.ceil(totalImages / cols)) * 0.8;
      const scale = Math.min(cellWidth / 200, estimatedHeight / 200); // 200px comme référence
      
      if (scale > bestScale) {
        bestScale = scale;
        bestCols = cols;
      }
    }
    
    // La taille optimale sera calculée après le chargement de toutes les images
    
    // Vider le conteneur
    imageCarousel.innerHTML = '';
    
    // Créer un conteneur avec positionnement absolu pour le layout Tetris
    const container = document.createElement('div');
    container.className = 'relative w-full';
    container.style.height = `${availableHeight}px`;
    container.style.overflow = 'hidden';
    
    // Tableau pour tracker la hauteur de chaque colonne
    const columnHeights = new Array(bestCols).fill(0);
    const columnWidth = (availableWidth - (gap * (bestCols - 1))) / bestCols;
    
    // Grille pour tracker les positions occupées (pour éviter les chevauchements)
    const grid = [];
    const cellSize = 10; // Taille des cellules de la grille en pixels
    const gridCols = Math.ceil(availableWidth / cellSize);
    const gridRows = Math.ceil(availableHeight / cellSize);
    
    // Initialiser la grille
    for (let r = 0; r < gridRows; r++) {
      grid[r] = new Array(gridCols).fill(false);
    }
    
    // Fonction pour vérifier si une zone est libre
    function isAreaFree(x, y, width, height) {
      const startCol = Math.floor(x / cellSize);
      const endCol = Math.ceil((x + width) / cellSize);
      const startRow = Math.floor(y / cellSize);
      const endRow = Math.ceil((y + height) / cellSize);
      
      if (endCol > gridCols || endRow > gridRows) return false;
      
      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          if (grid[r] && grid[r][c]) return false;
        }
      }
      return true;
    }
    
    // Fonction pour marquer une zone comme occupée
    function markAreaOccupied(x, y, width, height) {
      const startCol = Math.floor(x / cellSize);
      const endCol = Math.ceil((x + width) / cellSize);
      const startRow = Math.floor(y / cellSize);
      const endRow = Math.ceil((y + height) / cellSize);
      
      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          if (grid[r]) grid[r][c] = true;
        }
      }
    }
    
    // Fonction pour trouver la meilleure position (la plus basse, mais aussi la plus à gauche)
    function findBestPosition(width, height) {
      let bestX = 0;
      let bestY = Infinity;
      
      // Essayer différentes positions en commençant par le haut
      for (let y = 0; y <= availableHeight - height; y += cellSize) {
        for (let x = 0; x <= availableWidth - width; x += cellSize) {
          if (isAreaFree(x, y, width, height)) {
            // Préférer les positions plus basses (pour remplir de bas en haut)
            if (y < bestY || (y === bestY && x < bestX)) {
              bestY = y;
              bestX = x;
            }
          }
        }
      }
      
      // Si on n'a pas trouvé de position, essayer de trouver la colonne la plus basse
      if (bestY === Infinity) {
        let minHeight = columnHeights[0];
        let minIndex = 0;
        for (let i = 1; i < columnHeights.length; i++) {
          if (columnHeights[i] < minHeight) {
            minHeight = columnHeights[i];
            minIndex = i;
          }
        }
        bestX = minIndex * (columnWidth + gap);
        bestY = minHeight;
      }
      
      return { x: bestX, y: bestY };
    }
    
    // Charger toutes les images d'abord pour connaître leurs dimensions
    let loadedImages = 0;
    const imageData = [];
    const rawImageData = [];
    
    shuffledImages.forEach(({ path, project }) => {
      const img = new Image();
      img.src = path;
      img.onload = function() {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        rawImageData.push({
          path: path,
          project: project,
          aspectRatio: aspectRatio,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        
        loadedImages++;
        
        // Quand toutes les images sont chargées, calculer la taille optimale et placer
        if (loadedImages === shuffledImages.length) {
          calculateOptimalSize();
        }
      };
    });
    
    function calculateOptimalSize() {
      // Calculer la surface totale nécessaire avec les ratios réels
      let totalRatio = 0;
      rawImageData.forEach(img => {
        totalRatio += 1 / img.aspectRatio; // Somme des hauteurs pour une largeur de 1
      });
      
      // Calculer la largeur optimale pour remplir l'espace disponible
      // On veut que la somme des hauteurs soit proche de availableHeight
      const optimalWidth = Math.sqrt((availableWidth * availableHeight) / (totalRatio * bestCols));
      
      // Ajuster pour mieux remplir (augmenter de 10-20%)
      let testWidth = optimalWidth * 1.15;
      let maxHeight = 0;
      
      // Tester différentes tailles pour trouver la meilleure
      for (let scale = 0.8; scale <= 1.3; scale += 0.05) {
        const testW = optimalWidth * scale;
        const testHeights = rawImageData.map(img => testW / img.aspectRatio);
        const totalTestHeight = testHeights.reduce((sum, h) => sum + h, 0);
        const avgHeight = totalTestHeight / rawImageData.length;
        const estimatedMaxHeight = Math.max(...testHeights) + (avgHeight * (bestCols - 1));
        
        if (estimatedMaxHeight <= availableHeight * 1.1) {
          testWidth = testW;
          maxHeight = estimatedMaxHeight;
        } else {
          break;
        }
      }
      
      // Créer les données d'images avec la taille optimale
      rawImageData.forEach(({ path, project, aspectRatio }) => {
        const imgWidth = testWidth;
        const imgHeight = imgWidth / aspectRatio;
        
        imageData.push({
          path: path,
          project: project,
          width: imgWidth,
          height: imgHeight,
          aspectRatio: aspectRatio
        });
      });
      
      // Placer les images
      placeImages();
    }
    
    function placeImages() {
      // Trier les images par taille (les plus grandes en premier pour mieux remplir)
      imageData.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      
      imageData.forEach(({ path, project, width, height, aspectRatio }) => {
        // Trouver la meilleure position
        const position = findBestPosition(width, height);
        const x = position.x;
        const y = position.y;
        
        // Marquer la zone comme occupée
        markAreaOccupied(x, y, width, height);
        
        // Mettre à jour les hauteurs de colonnes pour les colonnes affectées
        const startCol = Math.floor(x / (columnWidth + gap));
        const endCol = Math.ceil((x + width) / (columnWidth + gap));
        for (let i = startCol; i < endCol && i < columnHeights.length; i++) {
          columnHeights[i] = Math.max(columnHeights[i], y + height + gap);
        }
        
        // Créer le wrapper
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'absolute cursor-pointer group';
        imgWrapper.style.left = `${x}px`;
        imgWrapper.style.top = `${y}px`;
        imgWrapper.style.width = `${width}px`;
        imgWrapper.style.height = `${height}px`;
        imgWrapper.style.overflow = 'hidden';
        
        // Créer l'image
        const img = document.createElement('img');
        img.src = path;
        img.alt = `${project.title} - Image`;
        img.className = 'w-full h-full object-cover transition-opacity duration-200 hover:opacity-80';
        img.style.display = 'block';
        
        // Gérer le clic pour naviguer vers le projet
        imgWrapper.addEventListener('click', () => {
          const projectElement = Array.from(projects).find(p => p.dataset.target === project.id);
          if (projectElement) {
            const visibleProjects = getVisibleProjects();
            const visibleIndex = visibleProjects.indexOf(projectElement);
            if (visibleIndex !== -1) {
              showProject(visibleIndex);
              projectElement.focus();
              enterDetailMode(projectElement);
            }
          }
        });
        
        imgWrapper.appendChild(img);
        container.appendChild(imgWrapper);
      });
      
      imageCarousel.appendChild(container);
    }
      
  }, 0);
  
  // Ajouter le carrousel au DOM immédiatement
  mainContent.appendChild(imageCarousel);
  
  console.log(`Carrousel généré: ${shuffledImages.length} images affichées`);
}

// Fonction pour attacher les événements aux projets
function attachProjectEvents() {
  let mouseLeaveTimeout = null;
  
  projects.forEach((project) => {
    project.addEventListener('mouseenter', () => {
      if (isDetailMode) {
        return;
      }
      
      if (project.classList.contains('hidden')) {
        return;
      }

      if (mouseLeaveTimeout) {
        clearTimeout(mouseLeaveTimeout);
        mouseLeaveTimeout = null;
      }
      
      const visibleProjects = getVisibleProjects();
      const visibleIndex = visibleProjects.indexOf(project);
      if (visibleIndex !== -1) {
        showProject(visibleIndex);
      }
    });
    
    project.addEventListener('mouseleave', (e) => {
      if (isDetailMode) {
        return;
      }

      const relatedTarget = e.relatedTarget;
      const isMovingToAnotherProject = relatedTarget && relatedTarget.closest('.project:not(.hidden)');
      
      if (!isMovingToAnotherProject) {
        mouseLeaveTimeout = setTimeout(() => {
          const visibleProjects = getVisibleProjects();
          const isOnAnyProject = visibleProjects.some(p => p.matches(':hover'));
          if (!isOnAnyProject) {
            showBlank();
          }
        }, 50);
      }
    });
    
    project.addEventListener('click', () => {
      if (project.classList.contains('hidden')) {
        return;
      }
      
      const visibleProjects = getVisibleProjects();
      const visibleIndex = visibleProjects.indexOf(project);
      if (visibleIndex !== -1) {
        showProject(visibleIndex);
        project.focus();
        enterDetailMode(project);
      }
    });
  });
}

// Fonction pour initialiser les références DOM
function initDOMElements() {
  if (!projectList || !mainContent) {
    console.error('Éléments DOM non trouvés:', {
      projectList: !!projectList,
      mainContent: !!mainContent
    });
    return false;
  }
  return true;
}

// Charger les projets au démarrage
function init() {
  if (!initDOMElements()) {
    console.error('Impossible d\'initialiser: éléments DOM manquants');
    return;
  }
  loadProjects();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM déjà chargé
  init();
}

// Initialiser l'état des boutons au chargement (tous actifs par défaut)
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.classList.add('opacity-100');
  btn.classList.remove('opacity-50');
});

