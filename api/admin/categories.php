<?php
/**
 * API ADMIN - Gestion des catégories
 * Utilise la nouvelle architecture BaseAdminController
 * 
 * @version 2.0.0 - SOLID/DRY refactored
 */

require_once '../config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../classes/CategoryController.php';

// Vérifier l'authentification
AdminAuth::requireAuth();

// Instancier le contrôleur et traiter la requête
$db = Database::getInstance()->getConnection();
$controller = new CategoryController($db);
$controller->handleRequest();