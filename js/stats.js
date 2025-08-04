/* ===== STATS.JS - GESTION DES STATISTIQUES ET ACHIEVEMENTS ===== */

class PenduStats {
    constructor(app) {
        this.app = app;
        this.stats = {
            foundWords: 0,
            totalWords: 0,
            currentStreak: 0,
            bestStreak: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            unlockedAchievements: 0
        };
        
        this.achievements = [
            {
                id: 'first_win',
                title: 'Premier Succès',
                description: 'Trouvez votre premier mot',
                icon: '🎯',
                condition: (stats) => stats.gamesWon >= 1,
                unlocked: false
            },
            {
                id: 'streak_5',
                title: 'En feu !',
                description: 'Série de 5 victoires consécutives',
                icon: '🔥',
                condition: (stats) => stats.currentStreak >= 5,
                unlocked: false
            },
            {
                id: 'words_10',
                title: 'Collectionneur',
                description: 'Trouvez 10 mots différents',
                icon: '📚',
                condition: (stats) => stats.foundWords >= 10,
                unlocked: false
            },
            {
                id: 'words_50',
                title: 'Érudit',
                description: 'Trouvez 50 mots différents',
                icon: '🎓',
                condition: (stats) => stats.foundWords >= 50,
                unlocked: false
            },
            {
                id: 'words_100',
                title: 'Maître des Mots',
                description: 'Trouvez 100 mots différents',
                icon: '👑',
                condition: (stats) => stats.foundWords >= 100,
                unlocked: false
            },
            {
                id: 'streak_10',
                title: 'Inarrêtable',
                description: 'Série de 10 victoires consécutives',
                icon: '⚡',
                condition: (stats) => stats.currentStreak >= 10,
                unlocked: false
            },
            {
                id: 'games_50',
                title: 'Persévérant',
                description: 'Jouez 50 parties',
                icon: '💪',
                condition: (stats) => stats.gamesPlayed >= 50,
                unlocked: false
            },
            {
                id: 'eighties_master',
                title: 'Maître des 80s',
                description: 'Trouvez 10 mots des catégories rétro',
                icon: '📼',
                condition: () => this.countEightiesWords() >= 10,
                unlocked: false
            },
            {
                id: 'perfectionist',
                title: 'Perfectionniste',
                description: 'Gagnez 5 parties sans erreur',
                icon: '💎',
                condition: (stats) => (stats.perfectGames || 0) >= 5,
                unlocked: false
            },
            {
                id: 'completionist',
                title: 'Complétiste',
                description: 'Trouvez tous les mots d\'une catégorie',
                icon: '🏆',
                condition: () => this.hasCompletedCategory(),
                unlocked: false
            }
        ];
        
        this.eightiesCategories = ['Dessins Animés', 'Séries TV', 'Films Cultes', 'Jeux Vidéo'];
    }
    
    init() {
        this.loadStats();
        this.checkAchievements();
    }
    
    loadStats() {
        // Charger les statistiques depuis localStorage
        const savedStats = localStorage.getItem('pendu_stats');
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
        
        // Charger les achievements
        const savedAchievements = localStorage.getItem('pendu_achievements');
        if (savedAchievements) {
            const savedData = JSON.parse(savedAchievements);
            this.achievements.forEach(achievement => {
                const saved = savedData.find(a => a.id === achievement.id);
                if (saved) {
                    achievement.unlocked = saved.unlocked;
                }
            });
        }
        
        // Calculer les mots trouvés depuis l'ancien système
        const foundWords = localStorage.getItem('pendu_foundWords');
        if (foundWords) {
            const wordsSet = new Set(JSON.parse(foundWords));
            this.stats.foundWords = wordsSet.size;
        }
        
        // Le nombre total de mots sera mis à jour par le module game
        // après le chargement des catégories
        
        this.updateAchievementCount();
        this.saveStats();
    }
    
    saveStats() {
        localStorage.setItem('pendu_stats', JSON.stringify(this.stats));
        localStorage.setItem('pendu_achievements', JSON.stringify(this.achievements));
    }
    
    // Méthodes pour mettre à jour les stats
    onGameStart() {
        this.stats.gamesPlayed++;
        this.saveStats();
    }
    
    onGameWin(word, category, errorsCount = 0) {
        this.stats.gamesWon++;
        this.stats.currentStreak++;
        
        // Mettre à jour la meilleure série
        if (this.stats.currentStreak > this.stats.bestStreak) {
            this.stats.bestStreak = this.stats.currentStreak;
        }
        
        // Jeu parfait (sans erreur)
        if (errorsCount === 0) {
            this.stats.perfectGames = (this.stats.perfectGames || 0) + 1;
        }
        
        // Ajouter le mot aux mots trouvés (s'il n'y était pas déjà)
        const foundWords = localStorage.getItem('pendu_foundWords');
        const wordsSet = foundWords ? new Set(JSON.parse(foundWords)) : new Set();
        
        if (!wordsSet.has(word)) {
            wordsSet.add(word);
            localStorage.setItem('pendu_foundWords', JSON.stringify([...wordsSet]));
            this.stats.foundWords = wordsSet.size;
        }
        
        // Suivre les mots des années 80
        if (this.eightiesCategories.includes(category)) {
            const eightiesWords = localStorage.getItem('pendu_eighties_words');
            const eightiesSet = eightiesWords ? new Set(JSON.parse(eightiesWords)) : new Set();
            
            if (!eightiesSet.has(word)) {
                eightiesSet.add(word);
                localStorage.setItem('pendu_eighties_words', JSON.stringify([...eightiesSet]));
            }
        }
        
        this.checkAchievements();
        this.saveStats();
        
        // Retourner les nouveaux achievements débloqués
        return this.getNewlyUnlockedAchievements();
    }
    
    onGameLoss() {
        this.stats.currentStreak = 0;
        this.saveStats();
    }
    
    checkAchievements() {
        const newAchievements = [];
        
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.condition(this.stats)) {
                achievement.unlocked = true;
                newAchievements.push(achievement);
            }
        });
        
        this.updateAchievementCount();
        
        if (newAchievements.length > 0) {
            this.saveStats();
            return newAchievements;
        }
        
        return [];
    }
    
    getNewlyUnlockedAchievements() {
        return this.checkAchievements();
    }
    
    updateAchievementCount() {
        this.stats.unlockedAchievements = this.achievements.filter(a => a.unlocked).length;
    }
    
    // Méthodes utilitaires pour les conditions d'achievements
    countEightiesWords() {
        const eightiesWords = localStorage.getItem('pendu_eighties_words');
        if (!eightiesWords) return 0;
        return JSON.parse(eightiesWords).length;
    }
    
    hasCompletedCategory() {
        // Obtenir les catégories depuis le module game
        if (!this.app || !this.app.getGameModule()) return false;
        
        const gameModule = this.app.getGameModule();
        const categories = gameModule.categories;
        
        if (!categories || categories.length === 0) return false;
        
        const foundWords = localStorage.getItem('pendu_foundWords');
        if (!foundWords) return false;
        
        const wordsSet = new Set(JSON.parse(foundWords));
        
        // Vérifier si une catégorie est complète
        return categories.some(category => {
            return category.mots.every(word => wordsSet.has(word));
        });
    }
    
    // Méthode pour mettre à jour le total de mots
    setTotalWords(total) {
        this.stats.totalWords = total;
        this.saveStats();
    }
    
    // Méthodes pour l'affichage
    updateStatsDisplay() {
        this.updateStatsOverview();
        this.updateAchievementsDisplay();
    }
    
    updateStatsOverview() {
        const statsFoundWords = document.getElementById('statsFoundWords');
        const statsTotalWords = document.getElementById('statsTotalWords');
        const statsBestStreak = document.getElementById('statsBestStreak');
        const statsCurrentStreak = document.getElementById('statsCurrentStreak');
        
        if (statsFoundWords) {
            statsFoundWords.textContent = this.stats.foundWords;
        }
        
        if (statsTotalWords) {
            statsTotalWords.textContent = this.stats.totalWords;
        }
        
        if (statsBestStreak) {
            statsBestStreak.textContent = this.stats.bestStreak;
        }
        
        if (statsCurrentStreak) {
            statsCurrentStreak.textContent = this.stats.currentStreak;
        }
    }
    
    updateAchievementsDisplay() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) return;
        
        achievementsGrid.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            
            achievementCard.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            `;
            
            achievementsGrid.appendChild(achievementCard);
        });
    }
    
    // Méthodes publiques pour les autres modules
    getStats() {
        return { ...this.stats };
    }
    
    getAchievements() {
        return [...this.achievements];
    }
    
    getUnlockedAchievements() {
        return this.achievements.filter(a => a.unlocked);
    }
    
    // Méthode pour afficher les toasts d'achievements
    showAchievementToast(achievement) {
        if (!this.app.getUIModule()) return;
        
        const message = `${achievement.title} débloqué !`;
        this.app.getUIModule().showToast(message, 'achievement', 4000);
    }
    
    // Reset des stats (pour debug/test)
    resetStats() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos statistiques ?')) {
            localStorage.removeItem('pendu_stats');
            localStorage.removeItem('pendu_achievements');
            localStorage.removeItem('pendu_foundWords');
            localStorage.removeItem('pendu_eighties_words');
            
            this.stats = {
                foundWords: 0,
                totalWords: 0,
                currentStreak: 0,
                bestStreak: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                unlockedAchievements: 0
            };
            
            this.achievements.forEach(achievement => {
                achievement.unlocked = false;
            });
            
            this.init();
            this.updateStatsDisplay();
        }
    }
}