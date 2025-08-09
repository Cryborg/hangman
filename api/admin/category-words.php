<?php
/**
 * API ADMIN - Gestion des mots par catégorie
 * Utilise la nouvelle architecture BaseAdminController avec spécialisation
 * 
 * @version 2.0.0 - SOLID/DRY refactored
 */

require_once '../config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../classes/CategoryWordsController.php';

// Vérifier l'authentification
AdminAuth::requireAuth();

// Instancier le contrôleur et traiter la requête
$db = Database::getInstance()->getConnection();
$controller = new CategoryWordsController($db);
$controller->handleRequest();