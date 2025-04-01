// Configuration des tables
const TABLES_CONFIG = {
    totalTables: 12,
    layout: {
        rows: 3,
        cols: 4
    }
};

// Icône SVG de table
const TABLE_ICON = `
<svg viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M4 6C4 5.44772 4.44772 5 5 5H19C19.5523 5 20 5.44772 20 6V8C20 8.55228 19.5523 9 19 9H5C4.44772 9 4 8.55228 4 8V6Z"/>
    <path fill="currentColor" d="M6.5 9L5 19H7L8.5 9"/>
    <path fill="currentColor" d="M17.5 9L19 19H17L15.5 9"/>
</svg>`;

// État des tables (à remplacer par les données de l'API)
let tablesState = [];

// Fonction pour charger l'état des tables depuis l'API
async function loadTablesState() {
    try {
        const response = await fetch('/api/tables');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des tables');
        }
        const data = await response.json();
        tablesState = data;
        renderTables();
    } catch (error) {
        console.error('Erreur:', error);
        // En cas d'erreur, on utilise des données de test
        tablesState = Array.from({ length: TABLES_CONFIG.totalTables }, (_, index) => ({
            id: index + 1,
            isReserved: Math.random() > 0.5
        }));
        renderTables();
    }
}

// Fonction pour générer la grille des tables
function renderTables() {
    const tablesGrid = document.querySelector('.tables-grid');
    tablesGrid.innerHTML = '';

    tablesState.forEach(table => {
        const tableElement = document.createElement('div');
        tableElement.className = `table ${table.isReserved ? 'reserved' : 'free'}`;
        tableElement.dataset.tableId = table.id;
        tableElement.innerHTML = `
            ${TABLE_ICON}
            <span>Table ${table.id}</span>
        `;

        if (!table.isReserved) {
            tableElement.addEventListener('click', () => showConfirmationModal(table));
        }

        tablesGrid.appendChild(tableElement);
    });
}

// Gestion des modales
const tablesModal = document.getElementById('tablesModal');
const confirmationModal = document.getElementById('confirmationModal');
const openTablesBtn = document.getElementById('openTablesBtn');
const closeButtons = document.querySelectorAll('.close-modal, .modal-close-btn');

function showTablesModal() {
    tablesModal.classList.add('active');
    loadTablesState();
}

function showConfirmationModal(table) {
    confirmationModal.classList.add('active');
    
    // Animation de la table sélectionnée
    const tableElement = document.querySelector(`[data-table-id="${table.id}"]`);
    tableElement.style.animation = 'none';
    tableElement.offsetHeight; // Force reflow
    tableElement.style.animation = null;
}

function closeModals() {
    tablesModal.classList.remove('active');
    confirmationModal.classList.remove('active');
}

// Event listeners
openTablesBtn.addEventListener('click', showTablesModal);

closeButtons.forEach(button => {
    button.addEventListener('click', closeModals);
});

[tablesModal, confirmationModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModals();
        }
    });
});

// Fermer les modales avec la touche Echap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModals();
    }
});

// Charger les tables au chargement de la page
document.addEventListener('DOMContentLoaded', loadTablesState); 