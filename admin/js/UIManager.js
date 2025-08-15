/**
 * UIManager - Gestion de l'interface utilisateur
 * Principe SOLID : Single Responsibility Principle
 * Principe DRY : Centralise la logique UI réutilisable
 */
class UIManager {
    constructor(domManager) {
        if (!domManager) {
            throw new Error('UIManager requires a DOMManager instance');
        }
        this.domManager = domManager;
        this.toastCounter = 0;
        // Plus besoin d'injecter les styles, ils sont dans toast.css
    }

    // =================
    // TOAST SYSTEM
    // =================
    
    showToast(title, message = '', type = 'info', duration = 4000) {
        const toastId = `toast-${this.toastCounter++}`;
        const toastContainer = this.getOrCreateToastContainer();
        
        if (!toastContainer) {
            console.error('Cannot show toast: container not found');
            return null;
        }
        
        const typeIcons = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `admin-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${typeIcons[type] || 'ℹ️'}</div>
                <div class="toast-message">
                    <strong>${title}</strong>
                    ${message ? `<div>${message}</div>` : ''}
                </div>
                <button class="toast-close" onclick="uiManager.closeToast('${toastId}')">&times;</button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Animation d'entrée
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-suppression
        if (duration > 0) {
            setTimeout(() => this.closeToast(toastId), duration);
        }
        
        return toastId;
    }

    closeToast(toastId) {
        const toast = this.domManager.getById(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }

    getOrCreateToastContainer() {
        // Utiliser directement getElementById pour éviter le cache du domManager
        let container = document.getElementById('toast-container');
        
        if (!container) {
            console.error('Toast container not found in HTML!');
            // Ne pas créer dynamiquement, car il devrait exister dans le HTML
            return null;
        }
        return container;
    }


    // =================
    // LOADING SYSTEM
    // =================
    
    showLoading(show = true, message = 'Chargement...') {
        const overlay = this.domManager.getById('loadingOverlay');
        if (!overlay) return;
        
        const messageEl = overlay.querySelector('p');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    // =================
    // MODAL SYSTEM
    // =================
    
    createModal(title, content, options = {}) {
        const modalId = `modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'admin-modal-overlay';
        
        modal.innerHTML = `
            <div class="admin-modal" style="max-width: ${options.width || '600px'}">
                <div class="admin-modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="uiManager.closeModal('${modalId}')">&times;</button>
                </div>
                <div class="admin-modal-content">
                    ${content}
                </div>
                ${options.actions ? `
                    <div class="admin-modal-actions">
                        ${options.actions}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        
        // Animation d'ouverture
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Fermeture au clic sur l'overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });

        return modalId;
    }

    closeModal(modalId) {
        const modal = this.domManager.getById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // =================
    // CONFIRMATION DIALOGS
    // =================
    
    confirm(title, message, onConfirm, onCancel = null) {
        // Créer d'abord la modal sans les actions
        const modalId = this.createModal(title, `<p>${message}</p>`, { 
            actions: `
                <button class="btn btn-secondary" id="confirmCancelBtn">
                    Annuler
                </button>
                <button class="btn btn-danger" id="confirmBtn">
                    Confirmer
                </button>
            `,
            width: '400px'
        });
        
        // Ajouter les event listeners après création
        setTimeout(() => {
            const modal = this.domManager.getById(modalId);
            if (modal) {
                const cancelBtn = modal.querySelector('#confirmCancelBtn');
                const confirmBtn = modal.querySelector('#confirmBtn');
                
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        this.closeModal(modalId);
                        if (onCancel) onCancel();
                    };
                }
                
                if (confirmBtn) {
                    confirmBtn.onclick = () => {
                        this.closeModal(modalId);
                        if (window[onConfirm]) window[onConfirm]();
                    };
                }
            }
        }, 10);
        
        return modalId;
    }

    // =================
    // FORM HELPERS
    // =================
    
    getFormData(formId) {
        const form = this.domManager.getById(formId);
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    clearForm(formId) {
        const form = this.domManager.getById(formId);
        if (form) {
            form.reset();
        }
    }

    setFormData(formId, data) {
        const form = this.domManager.getById(formId);
        if (!form) return;
        
        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    }

    // =================
    // NAVIGATION
    // =================
    
    showSection(sectionId) {
        // Cacher toutes les sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Enlever active de tous les boutons nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Afficher la section demandée
        const targetSection = this.domManager.getById(sectionId);
        const targetBtn = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // Mettre à jour le titre dans la barre de navigation
        this.updatePageTitle(sectionId);
    }

    updatePageTitle(sectionId) {
        const titles = {
            'dashboard': '📊 Tableau de bord',
            'categories': '📁 Catégories & Mots',
            'tags': '🏷️ Tags',
            'data': '💾 Import/Export'
        };
        
        const titleElement = this.domManager.getById('adminPageTitle');
        if (titleElement && titles[sectionId]) {
            titleElement.textContent = titles[sectionId];
        }
    }

    // =================
    // UTILITY METHODS
    // =================
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString('fr-FR');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export pour utilisation globale
window.UIManager = UIManager;