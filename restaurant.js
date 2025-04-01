// Fonction pour charger les informations du restaurant
async function loadRestaurantInfo() {
    try {
        const response = await fetch('/api/restaurant');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des informations');
        }
        const data = await response.json();
        
        // Mettre à jour le titre et la description en haut de la page
        const titleElement = document.getElementById('restaurant-title');
        const subtitleElement = document.getElementById('restaurant-subtitle');
        
        if (titleElement) {
            titleElement.textContent = data.nom || 'Le Repaire';
        }
        if (subtitleElement) {
            subtitleElement.textContent = data.description || 'Gérez votre restaurant en toute simplicité';
        }
        
        // Remplir le formulaire avec les données
        document.getElementById('nom').value = data.nom || '';
        document.getElementById('description').value = data.description || '';
        
        // Remplir les horaires
        if (data.horaires) {
            document.getElementById('midi_debut').value = data.horaires.midi_debut || '11:30';
            document.getElementById('midi_fin').value = data.horaires.midi_fin || '14:30';
            document.getElementById('soir_debut').value = data.horaires.soir_debut || '18:00';
            document.getElementById('soir_fin').value = data.horaires.soir_fin || '22:30';
        }
        
        // Cocher les types de cuisine
        if (data.type_cuisine) {
            const checkboxes = document.querySelectorAll('input[name="type_cuisine"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = data.type_cuisine.includes(checkbox.value);
            });
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Fonction pour sauvegarder les informations du restaurant
async function saveRestaurantInfo(formData) {
    try {
        const typeCuisine = Array.from(document.querySelectorAll('input[name="type_cuisine"]:checked'))
            .map(checkbox => checkbox.value);

        const restaurantData = {
            nom: formData.get('nom'),
            description: formData.get('description'),
            horaires: {
                midi_debut: formData.get('midi_debut'),
                midi_fin: formData.get('midi_fin'),
                soir_debut: formData.get('soir_debut'),
                soir_fin: formData.get('soir_fin')
            },
            type_cuisine: typeCuisine
        };

        const response = await fetch('/api/restaurant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(restaurantData)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        // Mettre à jour le titre et la description en haut de la page
        const titleElement = document.getElementById('restaurant-title');
        const subtitleElement = document.getElementById('restaurant-subtitle');
        
        if (titleElement) {
            titleElement.textContent = restaurantData.nom || 'Le Repaire';
        }
        if (subtitleElement) {
            subtitleElement.textContent = restaurantData.description || 'Gérez votre restaurant en toute simplicité';
        }

        alert('Informations sauvegardées avec succès !');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde des informations: ' + error.message);
    }
}

// Gestionnaire de soumission du formulaire
document.getElementById('restaurantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulaire soumis');
    const formData = new FormData(e.target);
    await saveRestaurantInfo(formData);
});

// Charger les informations au chargement de la page
document.addEventListener('DOMContentLoaded', loadRestaurantInfo); 