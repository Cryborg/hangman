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
        this.setupToastStyles();
    }

    // =================
    // TOAST SYSTEM
    // =================
    
    showToast(title, message = '', type = 'info', duration = 4000) {
        const toastId = `toast-${this.toastCounter++}`;
        const toastContainer = this.getOrCreateToastContainer();
        
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
        setTimeout(() => toast.classList.add('show'), 10);

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
        let container = this.domManager.getById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    setupToastStyles() {
        const existing = this.domManager.getById('toast-styles', true); // Supprime le warning
        if (existing) return;
        
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                pointer-events: none;
            }
            
            .admin-toast {
                background: var(--bg-modal);
                border-radius: var(--radius-md);
                border-left: 4px solid var(--primary-color);
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                pointer-events: auto;
                min-width: 300px;
                max-width: 400px;
            }
            
            .admin-toast.show {
                transform: translateX(0);
            }
            
            .admin-toast.toast-success { border-left-color: var(--success-color); }
            .admin-toast.toast-error { border-left-color: var(--error-color); }
            .admin-toast.toast-warning { border-left-color: var(--warning-color); }
            
            .toast-content {
                display: flex;
                align-items: flex-start;
                padding: 1rem;
                gap: 0.75rem;
            }
            
            .toast-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .toast-message {
                flex: 1;
                color: var(--text-primary);
                line-height: 1.4;
            }
            
            .toast-message strong {
                display: block;
                margin-bottom: 0.25rem;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .toast-close:hover {
                background: var(--bg-primary);
                color: var(--text-primary);
            }
        `;
        document.head.appendChild(styles);
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
        const actions = `
            <button class="btn btn-secondary" onclick="uiManager.closeModal('${Date.now()}'); ${onCancel ? onCancel + '()' : ''}">
                Annuler
            </button>
            <button class="btn btn-danger" onclick="uiManager.closeModal('${Date.now()}'); ${onConfirm}()">
                Confirmer
            </button>
        `;
        
        return this.createModal(title, `<p>${message}</p>`, { 
            actions,
            width: '400px'
        });
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