/**
 * EventListenerManager - Gestion centralisée des event listeners
 * Principe DRY : Évite la duplication de logique d'attachement d'events
 * Principe SOLID : Single Responsibility - Gère uniquement les event listeners
 */
class EventListenerManager {
    /**
     * Attache un event listener une seule fois sur un élément
     * @param {HTMLElement} element - L'élément DOM
     * @param {string} event - Le type d'event
     * @param {Function} handler - Le gestionnaire d'event
     * @param {string} dataKey - Clé pour marquer l'attachement (sans 'data-')
     */
    static attachOnce(element, event, handler, dataKey = 'listenerAttached') {
        if (!element || typeof element.addEventListener !== 'function') {
            console.warn('EventListenerManager: Element invalid', element);
            return false;
        }
        
        const dataAttribute = `data-${dataKey}`;
        
        if (!element.dataset[dataKey]) {
            element.addEventListener(event, handler);
            element.dataset[dataKey] = 'true';
            return true;
        }
        
        return false; // Déjà attaché
    }
    
    /**
     * Attache des event listeners sur une collection d'éléments
     * @param {NodeList|Array} elements - Collection d'éléments
     * @param {string} event - Le type d'event
     * @param {Function} handler - Le gestionnaire d'event
     * @param {string} dataKey - Clé pour marquer l'attachement
     */
    static attachOnceToCollection(elements, event, handler, dataKey = 'listenerAttached') {
        if (!elements || !elements.forEach) {
            console.warn('EventListenerManager: Elements collection invalid', elements);
            return 0;
        }
        
        let attachedCount = 0;
        elements.forEach(element => {
            if (this.attachOnce(element, event, handler, dataKey)) {
                attachedCount++;
            }
        });
        
        return attachedCount;
    }
    
    /**
     * Réinitialise le marquage d'attachement sur une collection
     * @param {NodeList|Array} elements - Collection d'éléments
     * @param {string} dataKey - Clé à réinitialiser
     */
    static resetAttachmentMarkers(elements, dataKey = 'listenerAttached') {
        if (!elements || !elements.forEach) return;
        
        elements.forEach(element => {
            if (element && element.dataset) {
                delete element.dataset[dataKey];
            }
        });
    }
    
    /**
     * Vérifie si un event listener est déjà attaché
     * @param {HTMLElement} element - L'élément à vérifier
     * @param {string} dataKey - Clé à vérifier
     * @returns {boolean}
     */
    static isAttached(element, dataKey = 'listenerAttached') {
        return element && element.dataset && element.dataset[dataKey] === 'true';
    }
}

// Export pour utilisation
window.EventListenerManager = EventListenerManager;