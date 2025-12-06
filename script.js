// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let projects = [];
let previews = [];
let projectsData = [];
let imageCarousel = null;
let imageCarouselFadeTimeout = null;

let activePreview = null;
let currentProjectIndex = -1; // -1 = état vide
let isDetailMode = false;
let isAboutMode = false;
let activeFilter = null; // null = tous les projets, 'photo', 'video', 'graphic'

const projectList = document.getElementById('project-list');
const projectDetail = document.getElementById('project-detail');
const filterButtons = document.getElementById('filter-buttons');
const backToListButton = document.getElementById('back-to-list');
const detailTitle = document.getElementById('detail-title');
const detailDescription = document.getElementById('detail-description');
const projectsHeading = document.getElementById('projects-heading');
const mainContent = document.querySelector('main');
const aboutView = document.getElementById('about-view');
const aboutTitle = document.getElementById('about-title');
const aboutDescription = document.getElementById('about-description');

const FADE_DURATION = 200;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function fadeIn(element) {
  if (!element) return;
  
  // Annuler toute animation fadeOut en cours
  if (imageCarouselFadeTimeout) {
    clearTimeout(imageCarouselFadeTimeout);
    imageCarouselFadeTimeout = null;
  }
  
  // Si l'élément est déjà visible et n'a pas opacity-0, ne rien faire
  if (!element.classList.contains('hidden') && !element.classList.contains('opacity-0')) {
    return;
  }
  
  // Retirer hidden (même si en cours de fadeOut)
  element.classList.remove('hidden');
  
  // Si l'élément a déjà opacity-0 (en cours de fadeOut), on peut directement l'animer
  if (element.classList.contains('opacity-0')) {
    requestAnimationFrame(() => {
      element.classList.remove('opacity-0');
    });
  } else {
    // Sinon, faire l'animation complète
    element.classList.add('opacity-0');
    requestAnimationFrame(() => {
      element.classList.remove('opacity-0');
    });
  }
}

function fadeOut(element) {
  if (!element) return;
  
  // Annuler toute animation fadeIn en cours
  if (imageCarouselFadeTimeout) {
    clearTimeout(imageCarouselFadeTimeout);
    imageCarouselFadeTimeout = null;
  }
  
  // Si l'élément est déjà caché, ne rien faire
  if (element.classList.contains('hidden')) {
    return;
  }
  
  element.classList.add('opacity-0');
  imageCarouselFadeTimeout = setTimeout(() => {
    element.classList.add('hidden');
    imageCarouselFadeTimeout = null;
  }, FADE_DURATION);
}

function getVisibleProjects() {
  return Array.from(projects).filter(project => {
    if (activeFilter === null) return true;
    return project.dataset.category === activeFilter;
  });
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// GESTION DES PROJETS
// ============================================================================

function filterProjects(category) {
  activeFilter = category;
  
  // Changer la couleur de fond selon la catégorie
  const body = document.body;
  const aside = document.querySelector('aside');
  const main = document.querySelector('main');
  const categoryColors = {
    'photo': 'bg-red-50',
    'video': 'bg-green-50',
    'graphic': 'bg-blue-50'
  };
  const gradientClasses = {
    'photo': 'gradient-photo',
    'video': 'gradient-video',
    'graphic': 'gradient-graphic'
  };
  
  // Retirer toutes les classes de couleur de fond
  [body, aside, main].forEach(el => {
    if (el) {
      el.classList.remove('bg-red-50', 'bg-green-50', 'bg-blue-50');
    }
  });
  
  // Retirer toutes les classes de dégradé
  body.classList.remove('gradient-photo', 'gradient-video', 'gradient-graphic');
  
  if (category && categoryColors[category]) {
    [body, aside, main].forEach(el => {
      if (el) {
        el.classList.add(categoryColors[category]);
      }
    });
    
    // Ajouter la classe de dégradé correspondante
    if (gradientClasses[category]) {
      body.classList.add(gradientClasses[category]);
    }
  }
  
  // Mettre à jour l'état actif des boutons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (category === null) {
      btn.classList.add('opacity-100');
      btn.classList.remove('opacity-30', 'opacity-50');
    } else if (btn.dataset.filter === category) {
      btn.classList.add('opacity-100');
      btn.classList.remove('opacity-30', 'opacity-50');
    } else {
      btn.classList.add('opacity-30');
      btn.classList.remove('opacity-100', 'opacity-50');
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

function showBlank() {
  // Masquer la vue "à propos" si elle est ouverte
  if (isAboutMode) {
    hideAboutView();
  }
  
  currentProjectIndex = -1;
  projects.forEach(p => p.classList.remove('project-active'));
  
  previews.forEach(preview => {
    preview.classList.add('opacity-0', 'pointer-events-none');
    preview.classList.remove('opacity-100');
  });
  
  // Ne pas afficher le carrousel si on est en mode "À propos"
  if (imageCarousel && !isAboutMode) {
    // Fade-in du carrousel avec animation
    fadeIn(imageCarousel);
  } else if (imageCarousel && isAboutMode) {
    // S'assurer que le carrousel est bien masqué en mode "À propos"
    fadeOut(imageCarousel);
    imageCarousel.classList.add('hidden');
  }
  
  // Masquer les images de détail desktop si elles existent
  if (mainContent) {
    const detailImagesDesktop = mainContent.querySelector('#detail-images-desktop');
    if (detailImagesDesktop) {
      detailImagesDesktop.style.display = 'none';
    }
  }
  
  activePreview = null;
}

function showProject(visibleIndex) {
  // Masquer la vue "à propos" si elle est ouverte
  if (isAboutMode) {
    hideAboutView();
  }
  
  const visibleProjects = getVisibleProjects();
  
  if (visibleIndex < 0 || visibleIndex >= visibleProjects.length) {
    showBlank();
    return;
  }
  
  const project = visibleProjects[visibleIndex];
  const targetId = project.dataset.target;
  const targetPreview = document.getElementById(targetId);
  
  if (!targetPreview) return;
  
  currentProjectIndex = visibleIndex;
  projects.forEach(p => p.classList.remove('project-active'));
  project.classList.add('project-active');
  
  if (imageCarousel) {
    // Fade-out du carrousel avec animation
    fadeOut(imageCarousel);
  }
  
  // Masquer les images de détail desktop si elles existent
  if (mainContent) {
    const detailImagesDesktop = mainContent.querySelector('#detail-images-desktop');
    if (detailImagesDesktop) {
      detailImagesDesktop.style.display = 'none';
    }
  }
  
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

function enterDetailMode(project) {
  if (!project) return;
  
  const title = project.dataset.title || project.textContent.trim();
  const description = project.dataset.description || '';
  const projectId = project.dataset.target;
  
  // Trouver le projet dans projectsData
  const projectData = projectsData.find(p => p.id === projectId);
  
  detailTitle.textContent = title;
  detailDescription.textContent = description;
  detailDescription.classList.toggle('hidden', !description.trim());
  
  // Ajouter les images pour mobile (en dessous de la description)
  const detailImagesContainer = document.getElementById('detail-images-mobile');
  if (detailImagesContainer && projectData && projectData.images) {
    // Vider le conteneur d'images
    while (detailImagesContainer.firstChild) {
      detailImagesContainer.removeChild(detailImagesContainer.firstChild);
    }
    // Layout avec maximum 2 colonnes pour mobile
    const container = document.createElement('div');
    container.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
    projectData.images.forEach((imagePath, index) => {
      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = `${title} - Image ${index + 1}`;
      img.className = 'w-full h-auto object-contain';
      img.loading = 'lazy';
      container.appendChild(img);
    });
    detailImagesContainer.appendChild(container);
  }
  
  // Ajouter les images pour desktop (dans main à droite)
  if (mainContent && projectData && projectData.images) {
    // Supprimer les anciennes images de détail
    const oldDetailImages = mainContent.querySelector('#detail-images-desktop');
    if (oldDetailImages) {
      oldDetailImages.remove();
    }
    
    // Créer le conteneur pour les images de détail desktop
    const detailImagesDesktop = document.createElement('div');
    detailImagesDesktop.id = 'detail-images-desktop';
    detailImagesDesktop.className = 'absolute inset-0 flex items-start justify-center overflow-y-auto p-8';
    
    // Layout avec maximum 2 colonnes
    const container = document.createElement('div');
    container.className = 'grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl';
    
    projectData.images.forEach((imagePath, index) => {
      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = `${title} - Image ${index + 1}`;
      img.className = 'w-full h-auto object-contain shadow-lg';
      img.loading = 'lazy';
      container.appendChild(img);
    });
    
    detailImagesDesktop.appendChild(container);
    mainContent.appendChild(detailImagesDesktop);
    
    // Masquer toutes les previews en mode détail
    previews.forEach(preview => {
      preview.classList.add('opacity-0', 'pointer-events-none');
      preview.classList.remove('opacity-100');
    });
  }
  
  isDetailMode = true;
  
  // Ajouter la classe detail-mode au body pour masquer le header en mobile
  document.body.classList.add('detail-mode');
  
  projectList.classList.add('hidden');
  projectsHeading.classList.add('hidden');
  if (filterButtons) filterButtons.classList.add('hidden');
  if (imageCarousel) {
    fadeOut(imageCarousel);
  }
  
  // Configurer le scroll pour le bouton retour en mode mobile
  setupBackButtonScroll();
  
  fadeIn(projectDetail);
}

// ============================================================================
// GESTION DE LA VUE "À PROPOS"
// ============================================================================

function showAboutView() {
  // Ne pas afficher si on est encore en mode détail (la sortie doit être gérée par handleAboutClick)
  if (isDetailMode) {
    return;
  }
  
  isAboutMode = true;
  
  // Vérifier si on est en mode mobile portrait
  const isMobilePortrait = window.innerWidth <= 768 && window.matchMedia('(orientation: portrait)').matches;
  
  if (isMobilePortrait) {
    // Mode mobile : utiliser la même structure que les projets (project-detail)
    if (!projectDetail || !detailTitle || !detailDescription) return;
    
    // Masquer les projets et le titre
    projectList.classList.add('hidden');
    projectsHeading.classList.add('hidden');
    if (filterButtons) filterButtons.classList.add('hidden');
    
    // Ajouter la classe detail-mode au body pour masquer le header en mobile
    document.body.classList.add('detail-mode');
    
    // Définir le titre et la description
    detailTitle.textContent = 'À propos';
    detailDescription.textContent = 'Description à personnaliser. Vous pouvez ajouter ici une présentation de votre travail, votre parcours, ou toute autre information pertinente.';
    detailDescription.classList.remove('hidden');
    
    // Masquer les images mobiles (pas d'images pour "À propos")
    const detailImagesContainer = document.getElementById('detail-images-mobile');
    if (detailImagesContainer) {
      while (detailImagesContainer.firstChild) {
        detailImagesContainer.removeChild(detailImagesContainer.firstChild);
      }
    }
    
    // Configurer le scroll pour le bouton retour en mode mobile
    setupBackButtonScroll();
    
    // Afficher la vue détail (comme pour un projet)
    projectDetail.classList.remove('hidden');
    fadeIn(projectDetail);
  } else {
    // Mode desktop : utiliser aboutView dans main
    if (!aboutView || !aboutTitle || !aboutDescription) return;
    
    // Masquer les autres contenus
    if (imageCarousel) {
      fadeOut(imageCarousel);
      // S'assurer que le carrousel est bien masqué
      if (imageCarousel) {
        imageCarousel.classList.add('hidden');
      }
    }
    previews.forEach(preview => {
      preview.classList.add('opacity-0', 'pointer-events-none');
      preview.classList.remove('opacity-100');
    });
    if (mainContent) {
      const detailImagesDesktop = mainContent.querySelector('#detail-images-desktop');
      if (detailImagesDesktop) {
        detailImagesDesktop.style.display = 'none';
      }
    }
    
    // Définir le titre et la description
    aboutTitle.textContent = 'À propos';
    aboutDescription.textContent = 'Description à personnaliser. Vous pouvez ajouter ici une présentation de votre travail, votre parcours, ou toute autre information pertinente.';
    
    // Afficher la vue
    aboutView.classList.remove('hidden');
    fadeIn(aboutView);
  }
}

function hideAboutView() {
  isAboutMode = false;
  
  // Vérifier si on est en mode mobile portrait
  const isMobilePortrait = window.innerWidth <= 768 && window.matchMedia('(orientation: portrait)').matches;
  
  if (isMobilePortrait) {
    // Mode mobile : utiliser la même structure que les projets
    if (!projectDetail) return;
    
    // Retirer la classe detail-mode du body pour réafficher le header
    document.body.classList.remove('detail-mode');
    
    // Nettoyer le listener de scroll
    cleanupBackButtonScroll();
    
    fadeOut(projectDetail);
    
    // Réafficher les projets après la transition
    setTimeout(() => {
      projectDetail.classList.add('hidden');
      fadeIn(projectsHeading);
      fadeIn(projectList);
      if (filterButtons) filterButtons.classList.remove('hidden');
      
      // Remettre en haut de la liste de projets
      const aside = document.querySelector('aside');
      if (aside) {
        aside.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, FADE_DURATION);
  } else {
    // Mode desktop : utiliser aboutView
    if (!aboutView) return;
    
    fadeOut(aboutView);
    
    // Réafficher le contenu par défaut après la transition
    setTimeout(() => {
      aboutView.classList.add('hidden');
      if (currentProjectIndex === -1 && !isDetailMode) {
        if (imageCarousel) {
          fadeIn(imageCarousel);
        }
      }
    }, FADE_DURATION);
  }
}

function exitDetailMode(skipShowBlank = false) {
  isDetailMode = false;
  
  // Masquer la vue "à propos" si elle est ouverte
  if (isAboutMode) {
    hideAboutView();
  }
  
  // Retirer la classe detail-mode du body pour réafficher le header
  document.body.classList.remove('detail-mode');
  
  // Nettoyer le listener de scroll
  cleanupBackButtonScroll();
  
  fadeOut(projectDetail);
  fadeIn(projectsHeading);
  fadeIn(projectList);
  if (filterButtons) filterButtons.classList.remove('hidden');
  
  detailTitle.textContent = '';
  detailDescription.textContent = '';
  
  // Nettoyer les images mobiles
  const detailImagesContainer = document.getElementById('detail-images-mobile');
  if (detailImagesContainer) {
    // Vider le conteneur d'images
    while (detailImagesContainer.firstChild) {
      detailImagesContainer.removeChild(detailImagesContainer.firstChild);
    }
  }
  
  // Nettoyer les images desktop
  if (mainContent) {
    const detailImagesDesktop = mainContent.querySelector('#detail-images-desktop');
    if (detailImagesDesktop) {
      detailImagesDesktop.remove();
    }
  }
  
  // Remettre en haut de la liste de projets
  const aside = document.querySelector('aside');
  if (aside) {
    aside.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Ne pas appeler showBlank si on passe directement à "À propos"
  if (!skipShowBlank) {
    showBlank();
  } else {
    // Masquer le carrousel immédiatement pour éviter qu'il apparaisse
    if (imageCarousel) {
      imageCarousel.classList.add('hidden');
      fadeOut(imageCarousel);
    }
  }
}

// ============================================================================
// GESTION DU SCROLL POUR LE BOUTON RETOUR
// ============================================================================

let lastScrollTop = 0;
let scrollTimeout = null;

function setupBackButtonScroll() {
  if (!backToListButton) return;
  
  // Réinitialiser l'état
  lastScrollTop = 0;
  backToListButton.classList.remove('hidden-scroll');
  
  // Écouter le scroll sur l'aside (colonne de gauche)
  const aside = document.querySelector('aside');
  if (!aside) return;
  
  aside.addEventListener('scroll', handleBackButtonScroll);
}

function cleanupBackButtonScroll() {
  if (!backToListButton) return;
  
  const aside = document.querySelector('aside');
  if (!aside) return;
  
  aside.removeEventListener('scroll', handleBackButtonScroll);
  backToListButton.classList.remove('hidden-scroll');
}

function handleBackButtonScroll() {
  if (!backToListButton || !isDetailMode) return;
  
  const aside = document.querySelector('aside');
  if (!aside) return;
  
  const currentScrollTop = aside.scrollTop;
  
  // Annuler le timeout précédent
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  // Si on scroll vers le bas (plus de 50px)
  if (currentScrollTop > lastScrollTop && currentScrollTop > 50) {
    backToListButton.classList.add('hidden-scroll');
  } 
  // Si on scroll vers le haut
  else if (currentScrollTop < lastScrollTop) {
    backToListButton.classList.remove('hidden-scroll');
  }
  // Si on est tout en haut
  else if (currentScrollTop <= 50) {
    backToListButton.classList.remove('hidden-scroll');
  }
  
  lastScrollTop = currentScrollTop;
}

// ============================================================================
// GÉNÉRATION DU CONTENU
// ============================================================================

function generateProjectList() {
  if (!projectList || !projectsData || projectsData.length === 0) return;
  
  projectList.innerHTML = '';
  
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
}

function generatePreviews() {
  if (!mainContent || !projectsData || projectsData.length === 0) return;
  
  const oldPreviews = mainContent.querySelectorAll('.preview-content');
  oldPreviews.forEach(preview => preview.remove());
  
  projectsData.forEach(project => {
    const previewDiv = document.createElement('div');
    previewDiv.id = project.id;
    previewDiv.className = 'preview-content absolute inset-0 flex items-start justify-center overflow-y-auto p-8 opacity-0 pointer-events-none transition-opacity duration-200';
    
    // Maximum 2 colonnes, le reste scrollable
    let gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-8';
    
    const container = document.createElement('div');
    container.className = `w-full max-w-5xl ${gridClass}`;
    
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
}

function generateImageCarousel() {
  if (!mainContent) return;
  
  // Ne pas recréer le carrousel si on est en mode détail ou si un projet est sélectionné
  if (isDetailMode || currentProjectIndex !== -1) {
    return;
  }
  
  if (imageCarousel) {
    imageCarousel.remove();
    imageCarousel = null;
  }
  
  // Supprimer l'ancien indicateur de chargement s'il existe
  const oldLoadingIndicator = document.getElementById('loading-indicator');
  if (oldLoadingIndicator) {
    oldLoadingIndicator.remove();
  }
  
  // Afficher un indicateur de chargement
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.className = 'absolute inset-0 flex items-center justify-center bg-neutral-100 z-20';
  loadingIndicator.innerHTML = `
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
      <p class="text-sm font-roc-thin text-neutral-600">Chargement des images...</p>
    </div>
  `;
  mainContent.appendChild(loadingIndicator);
  
  // Obtenir toutes les images selon le filtre
  let imagesToShow = [];
  projectsData.forEach(project => {
    if (!activeFilter || project.category === activeFilter) {
      project.images.forEach(imagePath => {
        imagesToShow.push({ path: imagePath, project: project });
      });
    }
  });
  
  if (imagesToShow.length === 0) {
    loadingIndicator.remove();
    if (imageCarousel) {
      imageCarousel.remove();
      imageCarousel = null;
    }
    return;
  }
  
  const shuffledImages = shuffleArray(imagesToShow);
  
  imageCarousel = document.createElement('div');
  imageCarousel.id = 'image-carousel';
  imageCarousel.className = 'absolute inset-0 overflow-y-auto overflow-x-hidden p-8';
  
  // Le masquage sur mobile est géré par CSS media query
  // Le masquage sur desktop est géré par showProject() et enterDetailMode()
  
  // Constantes de timeout
  const MAX_LOAD_TIME = 5000; // 5 secondes maximum par image
  const GLOBAL_TIMEOUT = 15000; // 15 secondes maximum au total
  
  // Protection supplémentaire : s'assurer que l'indicateur est masqué même en cas d'erreur
  const safetyTimeout = setTimeout(() => {
    const loadingIndicatorCheck = document.getElementById('loading-indicator');
    if (loadingIndicatorCheck) {
      console.warn('Timeout de sécurité : masquage forcé de l\'indicateur de chargement');
      loadingIndicatorCheck.remove();
    }
  }, GLOBAL_TIMEOUT + 2000); // 2 secondes après le timeout global
  
  setTimeout(() => {
    const padding = 32;
    const gap = 16;
    
    const header = document.querySelector('header');
    const aside = document.querySelector('aside');
    const availableWidth = window.innerWidth - (aside ? aside.offsetWidth : 0) - (padding * 2);
    const availableHeight = window.innerHeight - (header ? header.offsetHeight : 0) - (padding * 2);
    
    // Taille de base pour les images (sera ajustée dynamiquement)
    const imageBaseWidth = Math.min(availableWidth * 0.25, 280);
    
    imageCarousel.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'relative';
    container.style.width = `${availableWidth}px`;
    container.style.height = `${availableHeight}px`;
    container.style.margin = '0 auto';
    container.style.overflow = 'visible';
    
    let loadedImages = 0;
    let failedImages = 0;
    const imageData = [];
    let loadTimeout = null;
    let allTimeouts = []; // Stocker tous les timeouts individuels
    
    // Fonction pour vérifier si toutes les images ont été traitées (chargées ou échouées)
    function checkAllImagesProcessed() {
      if (loadedImages + failedImages === shuffledImages.length) {
        // Nettoyer tous les timeouts
        if (loadTimeout) {
          clearTimeout(loadTimeout);
          loadTimeout = null;
        }
        allTimeouts.forEach(timeout => clearTimeout(timeout));
        allTimeouts = [];
        // Nettoyer le timeout de sécurité
        clearTimeout(safetyTimeout);
        placeImages();
      }
    }
    
    // Timeout global pour éviter une attente infinie - plus agressif
    loadTimeout = setTimeout(() => {
      console.warn('Timeout global lors du chargement des images. Affichage des images chargées.');
      // Nettoyer tous les timeouts individuels
      allTimeouts.forEach(timeout => clearTimeout(timeout));
      allTimeouts = [];
      // Nettoyer le timeout de sécurité
      clearTimeout(safetyTimeout);
      placeImages();
    }, GLOBAL_TIMEOUT);
    
    shuffledImages.forEach(({ path, project }) => {
      const img = new Image();
      let imageProcessed = false;
      
      // Timeout individuel pour chaque image
      const imageTimeout = setTimeout(() => {
        if (!imageProcessed) {
          imageProcessed = true;
          failedImages++;
          console.warn(`Timeout pour l'image: ${path}`);
          checkAllImagesProcessed();
        }
      }, MAX_LOAD_TIME);
      allTimeouts.push(imageTimeout);
      
      img.onload = function() {
        if (imageProcessed) return; // Éviter les doubles appels
        imageProcessed = true;
        clearTimeout(imageTimeout);
        // Retirer de la liste des timeouts
        const index = allTimeouts.indexOf(imageTimeout);
        if (index > -1) {
          allTimeouts.splice(index, 1);
        }
        
        // Vérifier que l'image a bien des dimensions valides
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          failedImages++;
          console.warn(`Image invalide (dimensions nulles): ${path}`);
          checkAllImagesProcessed();
          return;
        }
        
        const originalAspectRatio = img.naturalWidth / img.naturalHeight;
        const isLandscape = originalAspectRatio >= 1;
        const normalizedAspectRatio = isLandscape ? 16/9 : 9/16;
        
        let imgWidth = imageBaseWidth;
        if (isLandscape) {
          imgWidth = imageBaseWidth * (1.1 + Math.random() * 0.3);
        } else {
          imgWidth = imageBaseWidth * (0.7 + Math.random() * 0.3);
        }
        
        const imgHeight = imgWidth / normalizedAspectRatio;
        
        imageData.push({
          path: path,
          project: project,
          width: imgWidth,
          height: imgHeight,
          aspectRatio: normalizedAspectRatio
        });
        
        loadedImages++;
        checkAllImagesProcessed();
      };
      
      img.onerror = function() {
        if (imageProcessed) return; // Éviter les doubles appels
        imageProcessed = true;
        clearTimeout(imageTimeout);
        // Retirer de la liste des timeouts
        const index = allTimeouts.indexOf(imageTimeout);
        if (index > -1) {
          allTimeouts.splice(index, 1);
        }
        
        failedImages++;
        console.warn(`Erreur de chargement pour l'image: ${path}`);
        checkAllImagesProcessed();
      };
      
      // Définir src après avoir configuré les handlers
      img.src = path;
    });
    
    function placeImages() {
      // Si aucune image n'a été chargée, masquer l'indicateur et retourner
      if (imageData.length === 0) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
        if (imageCarousel) {
          imageCarousel.remove();
          imageCarousel = null;
        }
        // Nettoyer le timeout de sécurité
        clearTimeout(safetyTimeout);
        return;
      }
      
      const totalArea = availableWidth * availableHeight;
      let totalImageArea = 0;
      imageData.forEach(img => {
        totalImageArea += img.width * img.height;
      });
      
      // Éviter la division par zéro
      if (totalImageArea === 0) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
        if (imageCarousel) {
          imageCarousel.remove();
          imageCarousel = null;
        }
        // Nettoyer le timeout de sécurité
        clearTimeout(safetyTimeout);
        return;
      }
      
      const scaleFactor = Math.sqrt(totalArea * 0.75 / totalImageArea);
      imageData.forEach(img => {
        img.width *= scaleFactor;
        img.height *= scaleFactor;
      });
      
      // Créer des "noyaux" de nuage - points autour desquels les images se regroupent
      const numClouds = Math.min(3 + Math.floor(imageData.length / 15), 6);
      const clouds = [];
      for (let i = 0; i < numClouds; i++) {
        clouds.push({
          centerX: (0.2 + Math.random() * 0.6) * availableWidth,
          centerY: (0.2 + Math.random() * 0.6) * availableHeight,
          radius: 150 + Math.random() * 200,
          images: []
        });
      }
      
      // Assigner chaque image à un nuage proche
      imageData.forEach((imageItem, index) => {
        // Trouver le nuage le plus proche ou créer un nouveau si trop loin
        let closestCloud = clouds[0];
        let minDist = Infinity;
        
        clouds.forEach(cloud => {
          const dist = Math.sqrt(
            Math.pow(cloud.centerX - (availableWidth / 2), 2) +
            Math.pow(cloud.centerY - (availableHeight / 2), 2)
          );
          if (dist < minDist) {
            minDist = dist;
            closestCloud = cloud;
          }
        });
        
        closestCloud.images.push(imageItem);
      });
      
      // Placer les images dans chaque nuage
      const placedImages = [];
      const minGap = 15;
      
      clouds.forEach((cloud, cloudIndex) => {
        cloud.images.forEach((imageItem, imgIndex) => {
          let attempts = 0;
          let placed = false;
          const maxAttempts = 100;
          
          // Varier la taille pour plus de naturel
          const sizeVariation = 0.75 + Math.random() * 0.5;
          let width = imageItem.width * sizeVariation;
          let height = imageItem.height * sizeVariation;
          
          // Limites de taille
          const maxWidth = availableWidth * 0.35;
          const maxHeight = availableHeight * 0.4;
          if (width > maxWidth) {
            width = maxWidth;
            height = width / imageItem.aspectRatio;
          }
          if (height > maxHeight) {
            height = maxHeight;
            width = height * imageItem.aspectRatio;
          }
          
          while (!placed && attempts < maxAttempts) {
            // Position autour du centre du nuage avec distribution gaussienne
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * cloud.radius * (0.3 + Math.random() * 0.7);
            const x = cloud.centerX + Math.cos(angle) * distance - width / 2;
            const y = cloud.centerY + Math.sin(angle) * distance - height / 2;
            
            // Vérifier les limites
            if (x < 0 || y < 0 || x + width > availableWidth || y + height > availableHeight) {
              attempts++;
              continue;
            }
            
            // Vérifier les collisions
            let collision = false;
            for (const placedImg of placedImages) {
              const distanceX = Math.abs(placedImg.x + placedImg.width/2 - (x + width/2));
              const distanceY = Math.abs(placedImg.y + placedImg.height/2 - (y + height/2));
              const minDistanceX = (placedImg.width + width) / 2 + minGap;
              const minDistanceY = (placedImg.height + height) / 2 + minGap;
              
              if (distanceX < minDistanceX && distanceY < minDistanceY) {
                collision = true;
                break;
              }
            }
            
            if (!collision) {
              // Rotation légère pour effet naturel
              const rotation = (Math.random() - 0.5) * 12;
              
              placedImages.push({
                x,
                y,
                width,
                height,
                rotation,
                imageItem
              });
              placed = true;
            }
            
            attempts++;
          }
        });
      });
      
      // Si certaines images n'ont pas pu être placées, les placer aléatoirement
      const unplacedImages = imageData.filter(img => 
        !placedImages.some(placed => placed.imageItem === img)
      );
      
      unplacedImages.forEach(imageItem => {
        const sizeVariation = 0.75 + Math.random() * 0.5;
        let width = imageItem.width * sizeVariation;
        let height = imageItem.height * sizeVariation;
        
        const maxWidth = availableWidth * 0.3;
        const maxHeight = availableHeight * 0.35;
        if (width > maxWidth) {
          width = maxWidth;
          height = width / imageItem.aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * imageItem.aspectRatio;
        }
        
        const x = Math.random() * (availableWidth - width);
        const y = Math.random() * (availableHeight - height);
        const rotation = (Math.random() - 0.5) * 12;
        
        placedImages.push({ x, y, width, height, rotation, imageItem });
      });
      
      placedImages.forEach(({ x, y, width, height, rotation, imageItem }, index) => {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'absolute cursor-pointer group image-carousel-item';
        imgWrapper.style.left = `${x}px`;
        imgWrapper.style.top = `${y}px`;
        imgWrapper.style.width = `${width}px`;
        imgWrapper.style.height = `${height}px`;
        imgWrapper.style.transform = `rotate(${rotation}deg) scale(0.8)`;
        imgWrapper.style.transformOrigin = 'center center';
        imgWrapper.style.transition = 'transform 0.3s ease-out, z-index 0.3s, opacity 0.4s ease-out';
        imgWrapper.style.overflow = 'hidden';
        imgWrapper.style.opacity = '0';
        
        // Stocker la rotation pour l'utiliser dans les event listeners
        imgWrapper.dataset.rotation = rotation;
        
        const img = document.createElement('img');
        img.src = imageItem.path;
        img.alt = `${imageItem.project.title} - Image`;
        img.className = 'w-full h-full object-cover';
        img.style.display = 'block';
        
        // Effet hover : zoom et passage au premier plan (pas de transparence)
        imgWrapper.addEventListener('mouseenter', () => {
          const currentRotation = imgWrapper.dataset.rotation;
          imgWrapper.style.transform = `rotate(${currentRotation}deg) scale(1.15)`;
          imgWrapper.style.zIndex = '20';
        });
        imgWrapper.addEventListener('mouseleave', () => {
          const currentRotation = imgWrapper.dataset.rotation;
          imgWrapper.style.transform = `rotate(${currentRotation}deg) scale(1)`;
          imgWrapper.style.zIndex = '1';
        });
        
        imgWrapper.addEventListener('click', () => {
          const projectElement = Array.from(projects).find(p => p.dataset.target === imageItem.project.id);
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
        
        // Animation d'apparition avec délai progressif pour effet de cascade
        setTimeout(() => {
          imgWrapper.style.opacity = '1';
          imgWrapper.style.transform = `rotate(${rotation}deg) scale(1)`;
          imgWrapper.classList.add('animate-in');
        }, index * 30); // 30ms de délai entre chaque image
      });
      
      imageCarousel.appendChild(container);
      
      // Masquer l'indicateur de chargement (s'assurer qu'il est bien masqué)
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
      // Nettoyer le timeout de sécurité au cas où
      clearTimeout(safetyTimeout);
      
      // Si un projet est sélectionné ou si on est en mode détail, masquer le carrousel
      if (currentProjectIndex !== -1 || isDetailMode) {
        fadeOut(imageCarousel);
      } else {
        fadeIn(imageCarousel);
      }
    }
  }, 0);
  
  mainContent.appendChild(imageCarousel);
}

// ============================================================================
// ÉVÉNEMENTS
// ============================================================================

function attachProjectEvents() {
  let mouseLeaveTimeout = null;
  
  projects.forEach((project) => {
    project.addEventListener('mouseenter', () => {
      if (isDetailMode || project.classList.contains('hidden')) return;
      
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
      if (isDetailMode) return;
      
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
      if (project.classList.contains('hidden')) return;
      
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

document.addEventListener('keydown', (e) => {
  // Raccourci Escape : revenir à la liste depuis la vue détail
  if (e.key === 'Escape' && isDetailMode) {
    exitDetailMode();
    return;
  }
  
  if (isDetailMode) return;
  
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const visibleProjects = getVisibleProjects();
    
    if (currentProjectIndex === -1) {
      if (e.key === 'ArrowDown' && visibleProjects.length > 0) {
        showProject(0);
      } else if (e.key === 'ArrowUp' && visibleProjects.length > 0) {
        showProject(visibleProjects.length - 1);
      }
    } else {
      if (e.key === 'ArrowDown') {
        if (currentProjectIndex === visibleProjects.length - 1) {
          showBlank();
        } else {
          showProject(currentProjectIndex + 1);
        }
      } else {
        if (currentProjectIndex === 0) {
          showBlank();
        } else {
          showProject(currentProjectIndex - 1);
        }
      }
    }
  }
});

if (backToListButton) {
  backToListButton.addEventListener('click', () => {
    // Si on est en mode "À propos", masquer la vue "À propos"
    if (isAboutMode) {
      hideAboutView();
    } else {
      // Sinon, sortir du mode détail normal
      exitDetailMode();
    }
  });
}

// Gestion des animations de hover sur les boutons de filtre
function setupFilterButtonHovers() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  if (filterButtons.length === 0) {
    console.warn('Aucun bouton de filtre trouvé');
    return;
  }
  
  const buttonsArray = Array.from(filterButtons);
  
  filterButtons.forEach((btn, index) => {
    btn.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      // Ajouter la classe au bouton survolé
      btn.classList.add('btn-hovered');
      
      // Décaler les boutons à droite
      for (let i = index + 1; i < buttonsArray.length; i++) {
        buttonsArray[i].classList.add('btn-shift-right');
        buttonsArray[i].classList.remove('btn-shift-left');
      }
      
      // Décaler les boutons à gauche
      for (let i = 0; i < index; i++) {
        buttonsArray[i].classList.add('btn-shift-left');
        buttonsArray[i].classList.remove('btn-shift-right');
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      // Retirer toutes les classes d'animation
      btn.classList.remove('btn-hovered');
      buttonsArray.forEach(b => {
        b.classList.remove('btn-shift-right', 'btn-shift-left');
      });
    });
    
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterProjects(activeFilter === filter ? null : filter);
    });
  });
}

// Appeler la fonction après le chargement des projets
// (sera appelée dans loadProjects après que les boutons soient dans le DOM)

// ============================================================================
// INITIALISATION
// ============================================================================

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
    
    generateProjectList();
    generatePreviews();
    generateImageCarousel();
    
    projects = Array.from(document.querySelectorAll('.project'));
    previews = Array.from(document.querySelectorAll('.preview-content'));
    
    attachProjectEvents();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.add('opacity-100');
      btn.classList.remove('opacity-30', 'opacity-50');
    });
    
    // Configurer les animations de hover sur les boutons
    setupFilterButtonHovers();
    
    if (projectsHeading) {
      projectsHeading.addEventListener('click', () => {
        if (!isDetailMode) {
          filterProjects(null);
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des projets:', error);
    if (projectList) {
      projectList.innerHTML = `<div class="text-red-500">Erreur: ${error.message}</div>`;
    }
  }
}

function init() {
  if (!projectList || !mainContent) {
    console.error('Éléments DOM non trouvés');
    return;
  }
  
  // Récupérer le bouton "À propos" après le chargement du DOM
  const aboutButton = document.getElementById('about-button');
  
  loadProjects();
  
  // Fonction pour gérer le clic sur "À propos"
  function handleAboutClick(e) {
    e.preventDefault();
    if (isAboutMode) {
      hideAboutView();
    } else {
      // Sortir du mode détail si on y est
      if (isDetailMode) {
        // Masquer le carrousel immédiatement pour éviter qu'il apparaisse
        if (imageCarousel) {
          imageCarousel.classList.add('hidden');
          fadeOut(imageCarousel);
        }
        // Sortir du mode détail sans réafficher le carrousel
        exitDetailMode(true);
        // Attendre que la sortie du mode détail soit terminée avant d'afficher "À propos"
        setTimeout(() => {
          showAboutView();
        }, FADE_DURATION);
      } else {
        // Réinitialiser l'état des projets
        showBlank();
        showAboutView();
      }
    }
  }
  
  // Gérer le clic sur le bouton "À propos" (logo + nom)
  if (aboutButton) {
    aboutButton.addEventListener('click', handleAboutClick);
  } else {
    console.error('Bouton "À propos" non trouvé dans le DOM');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
