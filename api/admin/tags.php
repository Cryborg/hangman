<?php
/**
 * API ADMIN - Gestion des tags
 * Utilise la nouvelle architecture BaseAdminController
 * 
 * @version 2.0.0 - SOLID/DRY refactored
 */

require_once '../config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../classes/TagController.php';

// Vérifier l'authentification
AdminAuth::requireAuth();

// Instancier le contrôleur et traiter la requête
$db = Database::getInstance()->getConnection();
$controller = new TagController($db);
$controller->handleRequest();