let categories = [];
let currentWord = '';
let currentCategory = '';
let guessedLetters = [];
let wrongLetters = [];
let remainingTries = 6;
let foundWords = new Set(); // Mots trouvés (progression permanente)
let sessionWords = new Set(); // Mots vus dans cette session
let totalWords = 0;
let gameActive = false;

const wordDisplay = document.getElementById('wordDisplay');
const wrongLettersDisplay = document.getElementById('wrongLetters');
const triesLeftDisplay = document.getElementById('triesLeft');
const progressDisplay = document.getElementById('wordsProgress');
const keyboard = document.getElementById('keyboard');
const newGameBtn = document.getElementById('newGameBtn');
const gameMessage = document.getElementById('gameMessage');
const hangmanParts = document.querySelectorAll('.body-part');
const categoryDisplay = document.getElementById('categoryName');

async function loadWords() {
    try {
        const response = await fetch('words.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        categories = data.categories;
        // Calculer le nombre total de mots
        totalWords = categories.reduce((total, category) => total + category.mots.length, 0);
        // Charger la progression sauvegardée
        const savedWords = localStorage.getItem('pendu_foundWords');
        if (savedWords) {
            foundWords = new Set(JSON.parse(savedWords));
        }
        console.log('Mots chargés depuis words.json');
        console.log(`Total de mots disponibles: ${totalWords}`);
        console.log(`Mots déjà trouvés: ${foundWords.size}`);
        initGame();
    } catch (error) {
        console.error('Erreur lors du chargement des mots:', error);
        showErrorMessage();
    }
}

function showErrorMessage() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
            gap: 1rem;
        ">
            <h1 style="color: #ff6b6b; font-size: 2rem;">⚠️ Erreur de chargement</h1>
            <p style="color: #fff; font-size: 1.2rem; max-width: 600px; line-height: 1.5;">
                Impossible de charger le fichier words.json.
            </p>
            <div style="
                background: rgba(255, 107, 107, 0.1);
                border: 1px solid #ff6b6b;
                border-radius: 10px;
                padding: 1rem;
                margin: 1rem 0;
                color: #ff6b6b;
                max-width: 500px;
            ">
                <h3>💡 Solutions possibles :</h3>
                <ul style="text-align: left; margin-top: 0.5rem;">
                    <li>Servez le jeu via un serveur web (ex: <code>python -m http.server</code>)</li>
                    <li>Vérifiez que le fichier words.json existe</li>
                    <li>Utilisez une extension comme "Live Server" dans VS Code</li>
                </ul>
            </div>
            <button onclick="window.location.reload()" style="
                background: linear-gradient(135deg, #f39c12, #e67e22);
                color: white;
                border: none;
                padding: 0.8rem 2rem;
                font-size: 1.1rem;
                border-radius: 30px;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'" 
               onmouseout="this.style.transform='translateY(0)'">
                🔄 Réessayer
            </button>
        </div>
    `;
}

function initGame() {
    // Sélectionner un mot qui n'a pas été vu dans cette session
    let attempts = 0;
    const maxAttempts = 100; // Éviter une boucle infinie
    
    do {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        currentCategory = randomCategory.nom;
        currentWord = randomCategory.mots[Math.floor(Math.random() * randomCategory.mots.length)];
        attempts++;
    } while (sessionWords.has(currentWord) && attempts < maxAttempts);
    
    // Ajouter le mot à la session (qu'il soit trouvé ou pas, on ne le reverra plus)
    sessionWords.add(currentWord);
    
    guessedLetters = [];
    wrongLetters = [];
    remainingTries = 6;
    gameActive = true;
    
    resetHangman();
    createKeyboard();
    updateDisplay();
    
    categoryDisplay.textContent = currentCategory;
    
    document.querySelectorAll('.part:not(.body-part)').forEach(part => {
        part.classList.add('visible');
    });
}

function createKeyboard() {
    // Créer le clavier virtuel sur mobile ET tablette
    if (window.innerWidth > 1024) {
        keyboard.innerHTML = '';
        return;
    }
    
    keyboard.innerHTML = '';
    // Disposition AZERTY sur 3 lignes
    const azertyRows = [
        'AZERTYUIOP',
        'QSDFGHJKLM',
        'WXCVBN'
    ];
    
    azertyRows.forEach(row => {
        row.split('').forEach(letter => {
            const button = document.createElement('button');
            button.textContent = letter;
            button.addEventListener('click', () => handleGuess(letter));
            keyboard.appendChild(button);
        });
    });
}

function handleGuess(letter) {
    if (!gameActive || guessedLetters.includes(letter) || wrongLetters.includes(letter)) {
        return;
    }
    
    // Ne gérer les boutons du clavier virtuel que sur mobile
    if (window.innerWidth <= 1024) {
        const button = [...keyboard.children].find(btn => btn.textContent === letter);
        if (button) {
            if (currentWord.includes(letter)) {
                button.classList.add('correct');
            } else {
                button.classList.add('wrong');
            }
            button.disabled = true;
        }
    }
    
    if (currentWord.includes(letter)) {
        guessedLetters.push(letter);
        
        if (checkWin()) {
            endGame(true);
        }
    } else {
        wrongLetters.push(letter);
        remainingTries--;
        
        showHangmanPart();
        document.querySelector('.container').classList.add('shake');
        setTimeout(() => {
            document.querySelector('.container').classList.remove('shake');
        }, 500);
        
        if (remainingTries === 0) {
            endGame(false);
        }
    }
    
    updateDisplay();
}

function updateDisplay() {
    // Séparer les mots et créer des groupes
    const words = currentWord.split(' ');
    wordDisplay.innerHTML = words.map(word => {
        const letters = word.split('').map(letter => {
            return `<span>${guessedLetters.includes(letter) ? letter : '_'}</span>`;
        }).join('');
        return `<div class="word-group">${letters}</div>`;
    }).join('');
    
    // Ajuster la taille si nécessaire sur mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            // Réinitialiser d'abord
            wordDisplay.style.fontSize = '1.2rem';
            
            // Vérifier chaque groupe de mots
            const wordGroups = wordDisplay.querySelectorAll('.word-group');
            const containerWidth = wordDisplay.parentElement.clientWidth - 16; // Avec padding
            
            let needsScaling = false;
            let maxScale = 1;
            
            wordGroups.forEach(group => {
                const groupWidth = group.scrollWidth;
                if (groupWidth > containerWidth) {
                    needsScaling = true;
                    const scale = containerWidth / groupWidth;
                    if (scale < maxScale) {
                        maxScale = scale;
                    }
                }
            });
            
            if (needsScaling) {
                // Appliquer une taille de police réduite
                const newFontSize = Math.max(0.8, 1.2 * maxScale);
                wordDisplay.style.fontSize = `${newFontSize}rem`;
                
                // Réduire aussi l'espacement et les marges
                wordDisplay.querySelectorAll('span').forEach(span => {
                    span.style.padding = `0 ${0.15 * maxScale}rem`;
                    span.style.minWidth = `${1.1 * maxScale}rem`;
                });
            }
        }, 10);
    } else {
        wordDisplay.style.fontSize = '';
    }
    
    wrongLettersDisplay.textContent = wrongLetters.join(' ');
    triesLeftDisplay.textContent = remainingTries;
    progressDisplay.textContent = `${foundWords.size}/${totalWords}`;
}

function checkWin() {
    return currentWord.split('').every(letter => letter === ' ' || guessedLetters.includes(letter));
}

function endGame(won) {
    gameActive = false;
    
    if (won) {
        // Ne compter que si c'est un nouveau mot trouvé
        const isNewWord = !foundWords.has(currentWord);
        if (isNewWord) {
            foundWords.add(currentWord);
            localStorage.setItem('pendu_foundWords', JSON.stringify([...foundWords]));
        }
        updateDisplay(); // Mettre à jour la progression affichée
        
        if (isNewWord) {
            showGameMessage('Bravo ! Tu as trouvé le mot ! 🎉', 'win');
        } else {
            showGameMessage('Tu avais déjà trouvé ce mot ! 🔄', 'info');
        }
    } else {
        showGameMessage(`Perdu ! Le mot était : ${currentWord} 😢`, 'lose');
        
        // Afficher le mot complet avec couleurs
        const words = currentWord.split(' ');
        wordDisplay.innerHTML = words.map(word => {
            const letters = word.split('').map(letter => {
                const color = guessedLetters.includes(letter) ? '#2ed573' : '#ff6b6b';
                return `<span style="color: ${color}">${letter}</span>`;
            }).join('');
            return `<div class="word-group">${letters}</div>`;
        }).join('');
        
        // Réappliquer l'ajustement de taille après avoir modifié le contenu
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                const wordGroups = wordDisplay.querySelectorAll('.word-group');
                let maxWidth = 0;
                wordGroups.forEach(group => {
                    if (group.scrollWidth > maxWidth) {
                        maxWidth = group.scrollWidth;
                    }
                });
                
                const containerWidth = wordDisplay.parentElement.clientWidth;
                if (maxWidth > containerWidth) {
                    const scale = containerWidth / maxWidth * 0.95;
                    const newFontSize = 1.2 * scale;
                    wordDisplay.style.fontSize = `${newFontSize}rem`;
                }
            }, 10);
        }
    }
    
    // Ne désactiver les boutons que sur mobile
    if (window.innerWidth <= 1024) {
        [...keyboard.children].forEach(button => button.disabled = true);
    }
}

function showGameMessage(message, type) {
    showToast(message, type);
}


function showToast(message, type = 'info', duration = 4000) {
    // Supprimer les anciens toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'win' ? '🎉' : type === 'lose' ? '😢' : 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    // Ajouter au body
    document.body.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => toast.classList.add('toast-show'), 100);
    
    // Auto-suppression
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showHangmanPart() {
    const partIndex = 6 - remainingTries - 1;
    if (partIndex >= 0 && partIndex < hangmanParts.length) {
        hangmanParts[partIndex].classList.add('visible');
    }
}

function resetHangman() {
    hangmanParts.forEach(part => part.classList.remove('visible'));
}

document.addEventListener('keydown', (e) => {
    if (gameActive && /^[a-zA-Z]$/.test(e.key)) {
        handleGuess(e.key.toUpperCase());
    }
});

newGameBtn.addEventListener('click', initGame);

// Recréer le clavier lors du redimensionnement de la fenêtre
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        createKeyboard();
        // Remettre à jour l'état des boutons si le jeu est en cours
        if (gameActive) {
            const allLetters = [...guessedLetters, ...wrongLetters];
            allLetters.forEach(letter => {
                if (window.innerWidth <= 1024) {
                    const button = [...keyboard.children].find(btn => btn.textContent === letter);
                    if (button) {
                        button.disabled = true;
                        if (guessedLetters.includes(letter)) {
                            button.classList.add('correct');
                        } else {
                            button.classList.add('wrong');
                        }
                    }
                }
            });
        }
    }, 250);
});

loadWords();

// Afficher la version
document.addEventListener('DOMContentLoaded', () => {
    const versionDisplay = document.getElementById('versionDisplay');
    if (versionDisplay && typeof ARCADE_VERSION !== 'undefined') {
        versionDisplay.textContent = `v${ARCADE_VERSION}`;
    }
});