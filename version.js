// Version du jeu du Pendu
const PENDU_VERSION = '1.0.2';

// Auto-application de la version aux CSS du pendu
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter la version à tous les liens CSS qui n'en ont pas déjà
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]:not([href*="?v="])');
    cssLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('?v=')) {
            link.setAttribute('href', href + '?v=' + PENDU_VERSION);
        }
    });
});

// Afficher la version dans la console
console.log(`🎲 Jeu du Pendu v${PENDU_VERSION}`);