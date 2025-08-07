<?php
/**
 * Autoloader pour les classes PHP réutilisables
 * Principe SOLID : Dependency Inversion - facilite l'injection de dépendances
 * Principe DRY : Évite la duplication des includes
 * 
 * Usage: require_once 'classes/autoload.php';
 * 
 * @version 1.0.0
 */

// Définir le répertoire des classes
define('CLASSES_DIR', __DIR__);

// Enregistrer l'autoloader
spl_autoload_register(function ($className) {
    $classFile = CLASSES_DIR . '/' . $className . '.php';
    
    if (file_exists($classFile)) {
        require_once $classFile;
        return true;
    }
    
    return false;
});

/**
 * Classes disponibles après chargement de cet autoloader :
 * 
 * === Utilitaires ===
 * - StringUtility      : Opérations sur les chaînes (slug, nettoyage)
 * - WordAnalyzer       : Analyse des caractéristiques des mots
 * - DataTransformer    : Transformation et formatage des données
 * - Validator          : Validation et sanitisation des entrées
 * 
 * === Repositories (accès aux données) ===
 * - WordRepository     : CRUD pour les mots
 * - CategoryRepository : CRUD pour les catégories
 * - TagRepository      : CRUD pour les tags
 * 
 * === Services (logique métier) ===
 * - ImportExportService : Import/export des données JSON
 * 
 * === Exemple d'utilisation ===
 * 
 * require_once 'classes/autoload.php';
 * require_once 'config.php';
 * 
 * $db = Database::getInstance()->getConnection();
 * $wordRepo = new WordRepository($db);
 * $categoryRepo = new CategoryRepository($db);
 * $importService = new ImportExportService($db);
 * 
 * // Utilisation des classes
 * $words = $wordRepo->findByCategoryWithPagination(1, 1, 10);
 * $slug = StringUtility::generateSlug("Test Category");
 * $analysis = WordAnalyzer::analyze("TÉLÉPHONE");
 * 
 */

// Vérification que les dépendances principales sont disponibles
if (!class_exists('Database')) {
    trigger_error('Database class not found. Make sure to include config.php before autoload.php', E_USER_WARNING);
}

// Version de l'API des classes
define('CLASSES_API_VERSION', '1.0.0');