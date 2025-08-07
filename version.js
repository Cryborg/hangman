// Version du jeu du Pendu
const PENDU_VERSION = '4.1.1';

// Mode développement : utilise timestamp pour forcer le rechargement
const DEV_MODE = true; // Mettre à false en production

// Fonction pour générer la version de cache busting
function getCacheBustingVersion() {
    if (DEV_MODE) {
        // En développement : timestamp pour forcer le rechargement
        return Date.now();
    } else {
        // En production : version stable
        return PENDU_VERSION;
    }
}

// Auto-application de la version aux CSS et JS
document.addEventListener('DOMContentLoaded', function() {
    const version = getCacheBustingVersion();
    
    // Ajouter la version à tous les liens CSS qui n'en ont pas déjà
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]:not([href*="?v="])');
    cssLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('?v=')) {
            link.setAttribute('href', href + '?v=' + version);
            if (DEV_MODE) {
                console.log(`🎨 CSS rechargé: ${href}?v=${version}`);
            }
        }
    });
    
    // Ajouter la version aux scripts JS qui n'en ont pas déjà
    const jsScripts = document.querySelectorAll('script[src]:not([src*="?v="]):not([src*="version.js"])');
    jsScripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && !src.includes('?v=') && !src.includes('version.js')) {
            script.setAttribute('src', src + '?v=' + version);
            if (DEV_MODE) {
                console.log(`📜 JS rechargé: ${src}?v=${version}`);
            }
        }
    });
});

// Raccourci clavier pour rechargement forcé en mode dev
if (DEV_MODE) {
    document.addEventListener('keydown', function(e) {
        // Ctrl+R ou Cmd+R : rechargement forcé avec vidage du cache
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            console.log('🔄 Rechargement forcé avec vidage du cache...');
            location.reload(true);
        }
        
        // Ctrl+Shift+R ou Cmd+Shift+R : rechargement super forcé
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
            console.log('💥 Rechargement SUPER forcé...');
            // Vider complètement le cache du domaine
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            location.reload(true);
        }
    });
}

// Afficher la version dans la console
if (DEV_MODE) {
    console.log(`🔧 Jeu du Pendu v${PENDU_VERSION} - MODE DÉVELOPPEMENT`);
    console.log(`⏰ Cache busting actif - timestamp: ${Date.now()}`);
    console.log(`💡 Raccourcis dev:`);
    console.log(`   • Ctrl+R / Cmd+R : Rechargement forcé`);
    console.log(`   • Ctrl+Shift+R / Cmd+Shift+R : Rechargement SUPER forcé`);
} else {
    console.log(`🎲 Jeu du Pendu v${PENDU_VERSION} - PRODUCTION`);
}