document.addEventListener('DOMContentLoaded', () => {
    // Configuration Unsplash
    const UNSPLASH_ACCESS_KEY = '1CgQiDr2_o1zQHDqbkdhCzcwCYvEpcKtlJ65Nl8Kmew';
    const imageQueries = {
        'Entrées': 'gourmet appetizer',
        'Plats': 'main course dish restaurant',
        'Desserts': 'gourmet dessert'
    };

    // Fonction pour charger une image depuis Unsplash
    async function loadUnsplashImage(query, imageElement) {
        try {
            const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`, {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors du chargement de l\'image');
            }

            const data = await response.json();
            imageElement.src = data.urls.regular;
            imageElement.alt = data.alt_description || query;

            // Ajouter l'attribution Unsplash
            const attribution = document.createElement('a');
            attribution.href = data.user.links.html;
            attribution.className = 'unsplash-attribution';
            attribution.textContent = `Photo by ${data.user.name}`;
            attribution.target = '_blank';
            imageElement.parentElement.appendChild(attribution);
        } catch (error) {
            console.error('Erreur Unsplash:', error);
            // Image de fallback en cas d'erreur
            imageElement.src = `/images/default-${query.split(' ')[0].toLowerCase()}.jpg`;
        }
    }

    // Fonction pour mettre à jour les statistiques
    function updateStats() {
        // Simulation de données dynamiques
        const stats = {
            couverts: Math.floor(Math.random() * 20) + 70, // Entre 70 et 90 couverts
            revenu: Math.floor(Math.random() * 1000) + 2500, // Entre 2500€ et 3500€
            reservations: Math.floor(Math.random() * 10) + 15 // Entre 15 et 25 réservations
        };

        // Mise à jour des valeurs affichées
        const couvertsElement = document.querySelector('.stat-card.today .stat-value');
        const revenueElement = document.querySelector('.stat-card.revenue .stat-value');
        const reservationsElement = document.querySelector('.stat-card.reservations .stat-value');

        if (couvertsElement) {
            couvertsElement.textContent = stats.couverts;
        }
        if (revenueElement) {
            revenueElement.textContent = `${stats.revenu}€`;
        }
        if (reservationsElement) {
            reservationsElement.textContent = stats.reservations;
        }
    }

    // Animation des tuiles d'action
    const actionTiles = document.querySelectorAll('.action-tile');
    actionTiles.forEach(tile => {
        tile.addEventListener('mouseenter', () => {
            tile.style.transform = 'translateY(-5px)';
            tile.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        tile.addEventListener('mouseleave', () => {
            tile.style.transform = 'translateY(0)';
            tile.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
    });

    // Mise à jour initiale des statistiques
    updateStats();

    // Mise à jour périodique des statistiques (toutes les 5 minutes)
    setInterval(updateStats, 300000);

    // Animation du texte de bienvenue
    const welcomeText = document.querySelector('.banner-content h1');
    if (welcomeText) {
        welcomeText.style.opacity = '0';
        welcomeText.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            welcomeText.style.transition = 'all 0.8s ease';
            welcomeText.style.opacity = '1';
            welcomeText.style.transform = 'translateY(0)';
        }, 300);
    }

    // Fonction pour sauvegarder les modifications
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

    // Fonction pour créer un bouton de modification
    function createEditButton() {
        const button = document.createElement('button');
        button.className = 'edit-field-btn';
        button.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
        return button;
    }

    // Fonction pour charger les données du menu et des images
    async function loadMenuHighlights() {
        try {
            const response = await fetch('/api/menu');
            const menuItems = await response.json();

            const categories = {
                'Entrées': [],
                'Plats': [],
                'Desserts': []
            };

            menuItems.forEach(item => {
                if (categories[item.categorie]) {
                    categories[item.categorie].push(item);
                }
            });

            Object.entries(categories).forEach(([categorie, items]) => {
                const card = document.querySelector(`.highlight-card[data-category="${categorie}"]`);
                if (card) {
                    const countElement = card.querySelector('.item-count');
                    if (countElement) {
                        countElement.textContent = `${items.length} plats`;
                    }

                    if (items.length > 0) {
                        const selectedItem = items[Math.floor(Math.random() * items.length)];
                        
                        // Créer le conteneur pour l'image
                        const imageContainer = document.createElement('div');
                        imageContainer.className = 'dish-image';
                        
                        const img = document.createElement('img');
                        img.alt = selectedItem.nom;
                        img.loading = 'lazy';
                        
                        imageContainer.appendChild(img);
                        
                        // Créer le conteneur pour les informations
                        const infoContainer = document.createElement('div');
                        infoContainer.className = 'featured-item';
                        
                        // Conteneur pour le nom et le bouton d'édition
                        const nameContainer = document.createElement('div');
                        nameContainer.className = 'field-container';
                        
                        const nameElement = document.createElement('span');
                        nameElement.className = 'item-name';
                        nameElement.textContent = selectedItem.nom;
                        
                        const editNameBtn = createEditButton();
                        editNameBtn.onclick = async () => {
                            const newName = prompt('Nouveau nom:', selectedItem.nom);
                            if (newName && newName.trim() !== '') {
                                try {
                                    await saveFieldChange(selectedItem.id, 'nom', newName, selectedItem.categorie);
                                    nameElement.textContent = newName;
                                } catch (error) {
                                    alert(error.message);
                                }
                            }
                        };
                        
                        nameContainer.appendChild(nameElement);
                        nameContainer.appendChild(editNameBtn);

                        // Conteneur pour le prix et le bouton d'édition
                        const priceContainer = document.createElement('div');
                        priceContainer.className = 'field-container';
                        
                        const priceElement = document.createElement('span');
                        priceElement.className = 'item-price';
                        priceElement.textContent = `${selectedItem.prix}€`;
                        
                        const editPriceBtn = createEditButton();
                        editPriceBtn.onclick = async () => {
                            const newPrice = prompt('Nouveau prix:', selectedItem.prix);
                            if (newPrice && !isNaN(parseFloat(newPrice))) {
                                try {
                                    await saveFieldChange(selectedItem.id, 'prix', newPrice, selectedItem.categorie);
                                    priceElement.textContent = `${newPrice}€`;
                                } catch (error) {
                                    alert(error.message);
                                }
                            }
                        };
                        
                        priceContainer.appendChild(priceElement);
                        priceContainer.appendChild(editPriceBtn);

                        // Ajouter les conteneurs à la carte
                        infoContainer.appendChild(nameContainer);
                        infoContainer.appendChild(priceContainer);

                        // Vider et remplir la carte
                        card.innerHTML = `
                            <div class="card-header">
                                <h3>${categorie}</h3>
                                <span class="item-count">${items.length} plats</span>
                            </div>
                        `;
                        card.appendChild(imageContainer);
                        card.appendChild(infoContainer);

                        // Charger l'image
                        loadUnsplashImage(imageQueries[categorie], img);
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors du chargement du menu:', error);
        }
    }

    // Charger les données du menu au démarrage
    loadMenuHighlights();

    // Fonction pour charger les informations du restaurant
    async function loadRestaurantInfo() {
        try {
            const response = await fetch('/api/restaurant');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des informations');
            }
            const data = await response.json();
            
            // Mettre à jour le nom du restaurant
            const restaurantNameElement = document.querySelector('.restaurant-name h2');
            if (restaurantNameElement) {
                restaurantNameElement.textContent = data.nom || 'L\'Escalette';
            }
            
            // Mettre à jour la description
            const descriptionElement = document.querySelector('.banner-content p');
            if (descriptionElement) {
                descriptionElement.textContent = data.description || 'Gérez votre restaurant en toute simplicité';
            }
        } catch (error) {
            console.error('Erreur:', error);
            // En cas d'erreur, afficher quand même la valeur par défaut
            const restaurantNameElement = document.querySelector('.restaurant-name h2');
            if (restaurantNameElement) {
                restaurantNameElement.textContent = 'L\'Escalette';
            }
        }
    }

    // Fonction pour sauvegarder les informations du restaurant
    async function saveRestaurantInfo(nom, description) {
        try {
            // Récupérer d'abord les informations actuelles
            const response = await fetch('/api/restaurant');
            const currentData = await response.json();

            // Préparer les données à envoyer
            const restaurantData = {
                ...currentData,
                nom: nom || currentData.nom,
                description: description || currentData.description
            };

            // Envoyer la requête de mise à jour
            const saveResponse = await fetch('/api/restaurant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(restaurantData)
            });

            if (!saveResponse.ok) {
                throw new Error('Erreur lors de la sauvegarde');
            }

            // Recharger les informations
            await loadRestaurantInfo();
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la sauvegarde des informations: ' + error.message);
        }
    }

    // Gestionnaire du clic sur le bouton d'édition du nom
    document.querySelector('.edit-name-btn').addEventListener('click', async () => {
        const currentName = document.querySelector('.restaurant-name h2').textContent;
        const newName = prompt('Nouveau nom du restaurant:', currentName);
        
        if (newName && newName.trim() !== '') {
            await saveRestaurantInfo(newName, null);
        }
    });

    // Gestionnaire du clic sur la description pour l'éditer
    document.querySelector('.banner-content p').addEventListener('click', async () => {
        const currentDescription = document.querySelector('.banner-content p').textContent;
        const newDescription = prompt('Nouvelle description:', currentDescription);
        
        if (newDescription && newDescription.trim() !== '') {
            await saveRestaurantInfo(null, newDescription);
        }
    });

    // Charger les informations au chargement de la page
    loadRestaurantInfo();

    // Gestion de l'édition de l'image de profil
    const editImageBtn = document.querySelector('.edit-image-btn');
    const profileImage = document.querySelector('.profile-image');
    
    if (editImageBtn && profileImage) {
        editImageBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    try {
                        // Créer une URL temporaire pour l'aperçu
                        const imageUrl = URL.createObjectURL(file);
                        profileImage.src = imageUrl;
                        
                        // TODO: Ajouter l'appel API pour uploader l'image
                        // const formData = new FormData();
                        // formData.append('image', file);
                        // Appel API ici
                        
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour de l\'image:', error);
                        alert('Une erreur est survenue lors de la mise à jour de l\'image.');
                    }
                }
            });
            
            input.click();
        });
    }
}); 