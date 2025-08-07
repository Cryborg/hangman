/* ===== LEVEL-MANAGER.JS - GESTIONNAIRE DES NIVEAUX DE DIFFICULTÉ ===== */

/**
 * Gestionnaire centralisé pour les niveaux de difficulté par catégorie
 * Gère les préférences utilisateur et le filtrage des mots
 */
class LevelManager {
    constructor() {
        this.levels = {
            easy: {
                name: 'Facile',
                description: 'Pour les enfants et débutants',
                color: '#2ed573',
                enabled: true
            },
            medium: {
                name: 'Medium',
                description: 'Niveau normal',
                color: '#f39c12', 
                enabled: true
            },
            hard: {
                name: 'Hard',
                description: 'Niveau expert',
                color: '#e74c3c',
                enabled: true
            }
        };

        this.loadFromLocalStorage();
    }

    /**
     * Charge les préférences utilisateur depuis localStorage
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('pendu_level_preferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                // Merger les préférences sauvegardées avec les valeurs par défaut
                Object.keys(this.levels).forEach(level => {
                    if (preferences.hasOwnProperty(level)) {
                        this.levels[level].enabled = preferences[level];
                    }
                });
            }
        } catch (error) {
            console.warn('Impossible de charger les préférences de niveau:', error);
            this.resetToDefaults();
        }
    }

    /**
     * Sauvegarde les préférences utilisateur dans localStorage
     */
    saveToLocalStorage() {
        try {
            const preferences = {};
            Object.keys(this.levels).forEach(level => {
                preferences[level] = this.levels[level].enabled;
            });
            
            localStorage.setItem('pendu_level_preferences', JSON.stringify(preferences));
            console.log('🎯 Préférences de niveaux sauvegardées:', preferences);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des préférences:', error);
        }
    }

    /**
     * Active/désactive un niveau de difficulté
     */
    setLevelEnabled(level, enabled) {
        if (this.levels.hasOwnProperty(level)) {
            // Si on désactive, vérifier qu'il reste au moins un niveau actif
            if (!enabled) {
                const enabledCount = this.getEnabledLevels().length;
                if (enabledCount === 1 && this.levels[level].enabled) {
                    // C'est le dernier niveau actif, on empêche la désactivation
                    console.warn('⚠️ Impossible de désactiver le dernier niveau');
                    if (window.penduApp?.uiModule) {
                        window.penduApp.uiModule.showToast('⚠️ Au moins un niveau doit rester activé', 'warning', 2000);
                    }
                    return false;
                }
            }
            
            this.levels[level].enabled = enabled;
            this.saveToLocalStorage();
            this.onPreferencesChanged();
            
            // Toast de confirmation
            if (window.penduApp?.uiModule) {
                window.penduApp.uiModule.showToast('✅ Sauvegardé', 'success', 1000);
            }
            
            return true;
        }
        return false;
    }

    /**
     * Vérifie si un niveau est activé
     */
    isLevelEnabled(level) {
        return this.levels[level]?.enabled || false;
    }

    /**
     * Obtient la liste des niveaux activés
     */
    getEnabledLevels() {
        return Object.keys(this.levels).filter(level => this.levels[level].enabled);
    }

    /**
     * Obtient la liste de tous les niveaux avec leurs informations
     */
    getAllLevels() {
        return { ...this.levels };
    }

    /**
     * Obtient les informations d'un niveau spécifique
     */
    getLevelInfo(level) {
        return this.levels[level] ? { ...this.levels[level] } : null;
    }

    /**
     * Remet les préférences par défaut (tous activés)
     */
    resetToDefaults() {
        Object.keys(this.levels).forEach(level => {
            this.levels[level].enabled = true;
        });
        this.saveToLocalStorage();
        this.onPreferencesChanged();
    }

    /**
     * Vérifie qu'au moins un niveau est activé
     */
    hasEnabledLevels() {
        return this.getEnabledLevels().length > 0;
    }

    /**
     * Force l'activation d'au moins un niveau si tous sont désactivés
     */
    ensureAtLeastOneLevel() {
        if (!this.hasEnabledLevels()) {
            console.warn('⚠️ Aucun niveau activé, activation du niveau Medium par défaut');
            this.setLevelEnabled('medium', true);
            return true;
        }
        return false;
    }

    /**
     * Construit la query string pour l'API selon les niveaux activés
     */
    getLevelsQueryParam() {
        const enabledLevels = this.getEnabledLevels();
        return enabledLevels.length > 0 ? enabledLevels.join(',') : 'medium';
    }

    /**
     * Filtre une liste de mots selon les niveaux activés
     * Format attendu: [{word: "MOT", level: "easy"}, ...]
     */
    filterWordsByLevels(words) {
        if (!Array.isArray(words)) {
            return [];
        }

        const enabledLevels = this.getEnabledLevels();
        return words.filter(wordObj => {
            return enabledLevels.includes(wordObj.level || 'medium');
        });
    }

    /**
     * Combine les mots de plusieurs niveaux selon les préférences
     * Format de catégorie: {levels: {easy: {words: []}, medium: {words: []}, hard: {words: []}}}
     */
    getCombinedWordsFromCategory(category) {
        if (!category || !category.levels) {
            return [];
        }

        const enabledLevels = this.getEnabledLevels();
        let allWords = [];

        enabledLevels.forEach(level => {
            if (category.levels[level] && category.levels[level].words) {
                // Ajouter les mots avec leur niveau d'origine pour le tracking
                const wordsWithLevel = category.levels[level].words.map(word => ({
                    word: word,
                    level: level,
                    category: category.name
                }));
                allWords = allWords.concat(wordsWithLevel);
            }
        });

        return allWords;
    }

    /**
     * Obtient le nombre total de mots disponibles selon les niveaux activés
     */
    getTotalWordsCount(categories) {
        if (!Array.isArray(categories)) {
            return 0;
        }

        let totalWords = 0;
        categories.forEach(category => {
            const categoryWords = this.getCombinedWordsFromCategory(category);
            totalWords += categoryWords.length;
        });

        return totalWords;
    }

    /**
     * Crée l'interface utilisateur pour les paramètres de niveaux
     */
    createLevelSettingsUI(containerId) {
        const container = domManager.getById(containerId);
        if (!container) {
            console.error('Conteneur de paramètres de niveaux non trouvé:', containerId);
            return false;
        }

        const html = `
            <div class="level-settings-section">
                <h3>🎯 Niveaux de difficulté</h3>
                
                <div class="level-controls-grid">
                    ${Object.entries(this.levels).map(([levelKey, levelInfo]) => `
                        <div class="level-control-card" data-level="${levelKey}">
                            <div class="level-header">
                                <h4>${levelInfo.name}</h4>
                                <label class="toggle-switch">
                                    <input type="checkbox" 
                                           id="level_${levelKey}" 
                                           ${levelInfo.enabled ? 'checked' : ''}>
                                    <span class="toggle-slider" style="--toggle-color: ${levelInfo.color}"></span>
                                </label>
                            </div>
                            <p class="level-description">${levelInfo.description}</p>
                            <div class="level-indicator" style="background: ${levelInfo.color}"></div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="level-actions">
                    <button class="btn btn-small" id="resetLevelsBtn">🔄 Tout activer</button>
                    <div class="level-summary" id="levelSummary">
                        <span id="enabledLevelsCount">${this.getEnabledLevels().length}</span>/3 niveaux activés
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.setupLevelEventListeners();
        return true;
    }

    /**
     * Configure les event listeners pour les paramètres de niveaux
     */
    setupLevelEventListeners() {
        // Listeners pour les checkboxes de niveaux
        Object.keys(this.levels).forEach(level => {
            domManager.addEventListener(`level_${level}`, 'change', (e) => {
                const enabled = e.target.checked;
                const success = this.setLevelEnabled(level, enabled);
                
                // Si la modification a échoué (dernier niveau), remettre la checkbox
                if (!success && !enabled) {
                    e.target.checked = true;
                }
                
                this.updateLevelSummary();
            });
        });

        // Bouton reset
        domManager.addEventListener('resetLevelsBtn', 'click', () => {
            this.resetToDefaults();
            this.syncLevelCheckboxes();
            this.updateLevelSummary();
            
            if (window.penduApp?.uiModule) {
                window.penduApp.uiModule.showToast('🔄 Tous les niveaux activés', 'info', 1500);
            }
        });

        this.updateLevelSummary();
    }

    /**
     * Synchronise les checkboxes avec l'état interne
     */
    syncLevelCheckboxes() {
        Object.keys(this.levels).forEach(level => {
            const checkbox = domManager.getById(`level_${level}`);
            if (checkbox) {
                checkbox.checked = this.levels[level].enabled;
            }
        });
    }

    /**
     * Met à jour le résumé des niveaux activés
     */
    updateLevelSummary() {
        const enabledCount = this.getEnabledLevels().length;
        domManager.setText('enabledLevelsCount', enabledCount);
        
        // Mettre à jour la couleur selon le nombre de niveaux activés
        const summary = domManager.getById('levelSummary');
        if (summary) {
            summary.className = `level-summary ${enabledCount === 0 ? 'no-levels' : enabledCount === 3 ? 'all-levels' : 'some-levels'}`;
        }
    }

    /**
     * Callback appelé quand les préférences changent
     */
    onPreferencesChanged() {
        // Notifier les autres modules du changement
        if (window.penduApp?.gameManager) {
            window.penduApp.gameManager.onLevelPreferencesChanged();
        }
        
        // Notifier le module des paramètres pour mettre à jour l'affichage
        if (window.penduApp?.settingsModule) {
            console.log('📞 LevelManager appelle settingsModule.onLevelPreferencesChanged()');
            window.penduApp.settingsModule.onLevelPreferencesChanged();
        } else {
            console.log('❌ settingsModule non trouvé dans window.penduApp');
        }

        console.log('🎯 Préférences de niveaux mises à jour:', this.getEnabledLevels());
    }

    /**
     * Debug : affiche l'état actuel des niveaux
     */
    debug() {
        console.log('=== LevelManager Debug ===');
        console.log('Niveaux:', this.levels);
        console.log('Niveaux activés:', this.getEnabledLevels());
        console.log('Query param:', this.getLevelsQueryParam());
    }
}

// Instance globale
window.levelManager = new LevelManager();