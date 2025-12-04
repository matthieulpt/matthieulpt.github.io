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
let activeFilter = null; // null = tous les projets, 'photo', 'video', 'graphic'

const projectList = document.getElementById('project-list');
const projectDetail = document.getElementById('project-detail');
const filterButtons = document.getElementById('filter-buttons');
const backToListButton = document.getElementById('back-to-list');
const detailTitle = document.getElementById('detail-title');
const detailDescription = document.getElementById('detail-description');
const projectsHeading = document.getElementById('projects-heading');
const mainContent = document.querySelector('main');

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
  currentProjectIndex = -1;
  projects.forEach(p => p.classList.remove('project-active'));
  
  previews.forEach(preview => {
    preview.classList.add('opacity-0', 'pointer-events-none');
    preview.classList.remove('opacity-100');
  });
  
  if (imageCarousel) {
    // Fade-in du carrousel avec animation
    fadeIn(imageCarousel);
  }
  
  activePreview = null;
}

function showProject(visibleIndex) {
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
    projectData.images.forEach((imagePath, index) => {
      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = `${title} - Image ${index + 1}`;
      img.className = 'w-full h-auto object-contain';
      img.loading = 'lazy';
      detailImagesContainer.appendChild(img);
    });
  }
  
  isDetailMode = true;
  projectList.classList.add('hidden');
  projectsHeading.classList.add('hidden');
  if (filterButtons) filterButtons.classList.add('hidden');
  if (imageCarousel) {
    fadeOut(imageCarousel);
  }
  
  fadeIn(projectDetail);
}

function exitDetailMode() {
  isDetailMode = false;
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
  
  showBlank();
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
    
    let gridClass = 'grid grid-cols-1 gap-8';
    if (project.images.length === 2) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-8';
    } else if (project.images.length >= 3) {
      gridClass = 'grid grid-cols-1 md:grid-cols-3 gap-8';
    }
    
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
    return;
  }
  
  const shuffledImages = shuffleArray(imagesToShow);
  
  imageCarousel = document.createElement('div');
  imageCarousel.id = 'image-carousel';
  imageCarousel.className = 'absolute inset-0 overflow-y-auto overflow-x-hidden p-8';
  
  // Le masquage sur mobile est géré par CSS media query
  // Le masquage sur desktop est géré par showProject() et enterDetailMode()
  
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
    const imageData = [];
    
    shuffledImages.forEach(({ path, project }) => {
      const img = new Image();
      img.src = path;
      img.onload = function() {
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
        
        if (loadedImages === shuffledImages.length) {
          placeImages();
        }
      };
    });
    
    function placeImages() {
      const totalArea = availableWidth * availableHeight;
      let totalImageArea = 0;
      imageData.forEach(img => {
        totalImageArea += img.width * img.height;
      });
      
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
      
      // Masquer l'indicateur de chargement
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
      
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
  backToListButton.addEventListener('click', exitDetailMode);
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
  loadProjects();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
