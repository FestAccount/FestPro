// Configuration de la pagination
const ITEMS_PER_PAGE = 5;
const categoryPages = {
    'Entrées': 1,
    'Plats': 1,
    'Desserts': 1,
    'Boissons': 1
};

// Fonction pour normaliser les chaînes (retirer les accents)
function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Fonction pour échapper les caractères spéciaux
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// Fonction pour mettre à jour la pagination
function updatePagination(categorie, items) {
    const normalizedCategorie = normalizeString(categorie);
    const paginationElement = document.getElementById(`${normalizedCategorie}-pagination`);
    if (!paginationElement) return;

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const currentPage = categoryPages[categorie];

    const prevBtn = paginationElement.querySelector('.prev-btn');
    const nextBtn = paginationElement.querySelector('.next-btn');
    const currentPageSpan = paginationElement.querySelector('.current-page');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    currentPageSpan.textContent = currentPage;

    prevBtn.onclick = () => {
        if (currentPage > 1) {
            categoryPages[categorie]--;
            displayCategoryItems(categorie, items);
        }
    };

    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            categoryPages[categorie]++;
            displayCategoryItems(categorie, items);
        }
    };
}

// Fonction pour sauvegarder les modifications d'un champ
async function saveFieldChange(id, field, value, categorie) {
    try {
        // Récupérer d'abord l'item actuel
        const response = await fetch(`/api/menu-items/${id}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        
        const currentData = await response.json();
        const itemData = currentData.data;

        // Préparer les données mises à jour
        const updatedData = {
            nom: itemData.nom,
            description: itemData.description,
            prix: itemData.prix,
            categorie: categorie,
            disponible: itemData.disponible
        };

        // Mettre à jour le champ modifié
        if (field === 'prix') {
            const prix = parseFloat(value.replace(',', '.'));
            if (isNaN(prix) || prix <= 0) {
                throw new Error('Le prix doit être un nombre valide supérieur à 0');
            }
            updatedData[field] = prix;
        } else {
            updatedData[field] = value.trim();
        }

        // Envoyer la requête de mise à jour
        const updateResponse = await fetch(`/api/menu-items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }

        return await updateResponse.json();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        throw error;
    }
}

// Fonction pour afficher les items d'une catégorie
function displayCategoryItems(categorie, items) {
    const normalizedCategorie = normalizeString(categorie);
    const container = document.getElementById(`${normalizedCategorie}-container`);
    if (!container) return;

    const currentPage = categoryPages[categorie];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedItems = items.slice(start, end);

    container.innerHTML = '';
    paginatedItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.dataset.id = item.id;

        // Image section avec bouton d'upload
        const imageSection = document.createElement('div');
        imageSection.className = 'item-image';

        if (item.image_url) {
            const img = document.createElement('img');
            img.src = item.image_url;
            img.alt = item.nom;
            img.loading = 'lazy';
            img.onerror = function() {
                this.parentElement.innerHTML = createNoImagePlaceholder();
            };
            imageSection.appendChild(img);
        } else {
            imageSection.innerHTML = createNoImagePlaceholder();
        }

        // Bouton d'upload d'image
        const imageUpload = document.createElement('label');
        imageUpload.className = 'image-upload';
        imageUpload.innerHTML = `
            <input type="file" accept="image/*" data-id="${item.id}">
            <button class="image-upload-btn">
                <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                </svg>
                <span>Modifier</span>
            </button>
        `;

        // Ajouter un gestionnaire pour l'upload d'image
        const fileInput = imageUpload.querySelector('input[type="file"]');
        fileInput.addEventListener('change', handleImageUpload);

        imageSection.appendChild(imageUpload);
        menuItem.appendChild(imageSection);

        const itemContent = document.createElement('div');
        itemContent.className = 'item-content';

        // En-tête avec nom et prix
        const itemHeader = document.createElement('div');
        itemHeader.className = 'item-header';

        const nameContainer = document.createElement('div');
        nameContainer.className = 'field-container';
        
        const itemName = document.createElement('span');
        itemName.className = 'item-name';
        itemName.textContent = item.nom;

        const editNameBtn = document.createElement('button');
        editNameBtn.className = 'edit-field-btn';
        editNameBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
        editNameBtn.onclick = () => {
            const newName = prompt('Nouveau nom:', item.nom);
            if (newName && newName.trim() !== '') {
                saveFieldChange(item.id, 'nom', newName, item.categorie);
                itemName.textContent = newName;
            }
        };

        nameContainer.appendChild(itemName);
        nameContainer.appendChild(editNameBtn);

        const priceContainer = document.createElement('div');
        priceContainer.className = 'field-container';

        const price = document.createElement('span');
        price.className = 'price';
        price.textContent = `${item.prix}€`;

        const editPriceBtn = document.createElement('button');
        editPriceBtn.className = 'edit-field-btn';
        editPriceBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
        editPriceBtn.onclick = () => {
            const newPrice = prompt('Nouveau prix:', item.prix);
            if (newPrice && !isNaN(parseFloat(newPrice))) {
                saveFieldChange(item.id, 'prix', newPrice, item.categorie);
                price.textContent = `${newPrice}€`;
            }
        };

        priceContainer.appendChild(price);
        priceContainer.appendChild(editPriceBtn);

        itemHeader.appendChild(nameContainer);
        itemHeader.appendChild(priceContainer);

        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'field-container';

        const description = document.createElement('p');
        description.className = 'description';
        description.textContent = item.description || '';

        const editDescBtn = document.createElement('button');
        editDescBtn.className = 'edit-field-btn';
        editDescBtn.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
        editDescBtn.onclick = () => {
            const newDesc = prompt('Nouvelle description:', item.description);
            if (newDesc !== null) {
                saveFieldChange(item.id, 'description', newDesc, item.categorie);
                description.textContent = newDesc;
            }
        };

        descriptionContainer.appendChild(description);
        descriptionContainer.appendChild(editDescBtn);

        const itemActions = document.createElement('div');
        itemActions.className = 'item-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.onclick = () => deleteItem(item.id);

        itemActions.appendChild(deleteBtn);

        itemContent.appendChild(itemHeader);
        itemContent.appendChild(descriptionContainer);
        itemContent.appendChild(itemActions);

        menuItem.appendChild(itemContent);
        container.appendChild(menuItem);
    });

    updatePagination(categorie, items);
}

// Fonction pour créer le placeholder d'image
function createNoImagePlaceholder() {
    return `
        <div class="no-image">
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
        </div>
    `;
}

// Fonction pour gérer l'upload d'image
async function handleImageUpload(event) {
    const file = event.target.files[0];
    const itemId = event.target.dataset.id;
    
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`/api/menu-items/${itemId}/image`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'upload de l\'image');
        }

        const data = await response.json();
        
        // Mettre à jour l'image dans l'interface
        const menuItem = event.target.closest('.menu-item');
        const img = menuItem.querySelector('.item-image img') || document.createElement('img');
        img.src = data.image_url;
        img.alt = 'Image du plat';
        
        const noImage = menuItem.querySelector('.no-image');
        if (noImage) {
            noImage.replaceWith(img);
        }

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
    }
}

// Fonction pour charger les items du menu
async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement du menu');
        }
        const items = await response.json();

        // Initialiser les catégories avec des tableaux vides
        const categories = {
            'Entrées': [],
            'Plats': [],
            'Desserts': [],
            'Boissons': []
        };

        // Trier les items dans leurs catégories respectives
        items.forEach(item => {
            const normalizedCategory = item.categorie.trim();
            if (categories.hasOwnProperty(normalizedCategory)) {
                categories[normalizedCategory].push(item);
            }
        });

        // Trier les items dans chaque catégorie par nom
        Object.keys(categories).forEach(categorie => {
            categories[categorie].sort((a, b) => a.nom.localeCompare(b.nom));
        });

        // Afficher les items pour chaque catégorie
        Object.entries(categories).forEach(([categorie, items]) => {
            const normalizedCategorie = normalizeString(categorie);
            const container = document.getElementById(`${normalizedCategorie}-container`);
            if (container) {
                categoryPages[categorie] = 1;
                displayCategoryItems(categorie, items);
            }
        });

        // Activer le premier tab par défaut
        const firstTab = document.querySelector('.tab-btn');
        if (firstTab) {
            firstTab.click();
        }
    } catch (error) {
        console.error('Erreur lors du chargement du menu:', error);
        alert('Erreur lors du chargement du menu. Veuillez réessayer.');
    }
}

// Fonction pour ajouter un nouvel item
async function addNewItem(category) {
    try {
        const name = prompt('Nom du plat:');
        if (!name) return;

        const description = prompt('Description:');
        if (!description) return;

        const priceStr = prompt('Prix:');
        if (!priceStr) return;

        const price = parseFloat(priceStr.replace(',', '.'));
        if (isNaN(price)) {
            alert('Veuillez entrer un prix valide');
            return;
        }

        const menuItem = {
            nom: name.trim(),
            description: description.trim(),
            prix: price,
            categorie: category,
            disponible: true,
            image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0'
        };

        const response = await fetch('/api/menu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(menuItem)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur serveur:', errorText);
            throw new Error('Erreur lors de l\'ajout');
        }

        await loadMenuItems();
        alert('Item ajouté avec succès !');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout de l\'item');
    }
}

// Fonction pour nettoyer une chaîne de caractères
function cleanString(str) {
    return str.trim()
             .normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '')  // Supprime les accents
             .replace(/[^a-zA-Z0-9\s-]/g, '')  // Garde uniquement les lettres, chiffres, espaces et tirets
             .replace(/\s+/g, ' ');            // Remplace les espaces multiples par un seul espace
}

// Fonction pour récupérer un item spécifique
async function getMenuItem(id) {
    try {
        console.log(`Tentative de récupération de l'item avec l'ID: ${id}`);
        const response = await fetch(`/api/menu-items/${id}`);
        
        console.log('Statut de la réponse:', response.status);
        const responseText = await response.text();
        console.log('Réponse brute:', responseText);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = JSON.parse(responseText);
        console.log('Données parsées:', data);
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'item:', error);
        throw error;
    }
}

// Fonction pour modifier un item
async function editItem(id, currentName, currentDescription, currentPrice, currentCategory) {
    if (!id || !currentCategory) {
        console.error('ID ou catégorie manquant');
        return;
    }

    try {
        // Récupérer d'abord les données actuelles de l'item
        const itemData = await getMenuItem(id);
        console.log('Données actuelles de l\'item:', itemData);

        // Demander les nouvelles valeurs avec les valeurs actuelles comme défaut
        const nom = prompt('Nouveau nom:', currentName || itemData.data.nom || '');
        if (!nom) {
            console.log('Modification annulée: nom vide');
            return;
        }

        const description = prompt('Nouvelle description:', currentDescription || itemData.data.description || '');
        if (!description) {
            console.log('Modification annulée: description vide');
            return;
        }

        const priceStr = prompt('Nouveau prix:', currentPrice || itemData.data.prix || '0');
        if (!priceStr) {
            console.log('Modification annulée: prix vide');
            return;
        }

        // Convertir et valider le prix
        const prix = parseFloat(priceStr.replace(',', '.'));
        if (isNaN(prix) || prix <= 0) {
            alert('Le prix doit être un nombre valide supérieur à 0');
            return;
        }

        // Préparer les données
        const menuItem = {
            nom: nom.trim(),
            description: description.trim(),
            prix: prix,
            categorie: currentCategory,
            disponible: true
        };

        console.log('Données envoyées:', menuItem);

        // Envoyer la requête
        const response = await fetch(`/api/menu-items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(menuItem)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la modification');
        }

        const data = await response.json();
        if (data.success) {
            // Recharger les items et afficher le succès
            await loadMenuItems();
            alert('Item modifié avec succès !');
        } else {
            throw new Error(data.message || 'Erreur lors de la modification');
        }

    } catch (error) {
        console.error('Erreur détaillée:', error);
        alert(`Erreur lors de la modification: ${error.message}`);
    }
}

// Fonction pour supprimer un item
async function deleteItem(id) {
    try {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) return;

        const response = await fetch(`/api/menu/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erreur lors de la suppression');
        await loadMenuItems();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
    }
}

// Gestion des onglets
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const containers = document.querySelectorAll('.category-container');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Cacher tous les conteneurs
            containers.forEach(container => container.style.display = 'none');
            
            // Activer le bouton cliqué
            button.classList.add('active');
            
            // Afficher le conteneur correspondant
            const categorie = button.textContent.trim();
            const normalizedCategorie = normalizeString(categorie);
            const container = document.getElementById(`${normalizedCategorie}-container`);
            if (container) {
                container.style.display = 'block';
            }
        });
    });

    // Activer le premier tab par défaut
    const firstTab = tabButtons[0];
    if (firstTab) {
        firstTab.click();
    }
}

// Fonction pour vérifier et mettre à jour les images manquantes
async function checkMissingImages() {
    try {
        const response = await fetch('/api/check-missing-images');
        const data = await response.json();
        
        if (data.success) {
            console.log(data.message);
            // Recharger les items pour afficher les nouvelles images
            await loadMenuItems();
        } else {
            console.error('Erreur lors de la vérification des images:', data.error);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des images:', error);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await checkMissingImages();
    await loadMenuItems();
    initTabs();
    document.querySelectorAll('.add-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            if (category) addNewItem(category);
        });
    });
}); 