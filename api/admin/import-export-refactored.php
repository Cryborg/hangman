<?php
/**
 * API ADMIN - Import/Export JSON (VERSION REFACTORISÉE)
 * Démonstration de l'utilisation des classes PHP réutilisables
 * 
 * Comparaison avant/après refactoring :
 * - AVANT : 436 lignes avec logique complexe et duplication
 * - APRÈS : ~80 lignes avec logique déléguée aux services
 * 
 * @version 2.0.0 - Refactorisée avec classes SOLID/DRY
 */

require_once '../config.php';
require_once '../auth.php';
require_once '../classes/autoload.php';

// Vérifier l'authentification
AdminAuth::requireAuth();

// Initialiser le service d'import/export
$db = Database::getInstance()->getConnection();
$importExportService = new ImportExportService($db);

// Traitement selon la méthode HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleExport($importExportService);
        break;
        
    case 'POST':
        handleImport($importExportService);
        break;
        
    default:
        sendErrorResponse(405, 'Method not allowed');
}

/**
 * GET - Export des données
 */
function handleExport(ImportExportService $service) {
    $type = $_GET['type'] ?? 'full';
    $format = $_GET['format'] ?? 'json';
    
    // Validation des paramètres
    if (!in_array($type, ['full', 'categories'])) {
        sendErrorResponse(400, 'Type d\'export invalide. Valeurs acceptées : full, categories');
        return;
    }
    
    if ($format !== 'json') {
        sendErrorResponse(400, 'Seul le format JSON est supporté');
        return;
    }
    
    try {
        // Utiliser le service pour exporter les données
        $exportData = $service->exportData($type, $format);
        
        // Générer le nom de fichier
        $filename = $service->generateExportFilename($type);
        
        // Gérer le téléchargement ou l'affichage
        if (isset($_GET['download']) && $_GET['download'] === 'true') {
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            
            $jsonContent = DataTransformer::formatForJsonExport($exportData);
            header('Content-Length: ' . strlen($jsonContent));
            echo $jsonContent;
        } else {
            sendSuccessResponse($exportData, [
                'suggested_filename' => $filename,
                'export_type' => $type
            ]);
        }
        
    } catch (Exception $e) {
        sendErrorResponse(500, 'Erreur lors de l\'export', $e->getMessage());
    }
}

/**
 * POST - Import des données
 */
function handleImport(ImportExportService $service) {
    // Validation de l'entrée JSON
    $inputValidation = Validator::validateJsonInput();
    if (!empty($inputValidation['errors'])) {
        sendErrorResponse(400, implode(', ', $inputValidation['errors']));
        return;
    }
    
    $input = $inputValidation['data'];
    $mode = $input['mode'] ?? 'replace';
    
    // Validation du mode
    if (!in_array($mode, ['replace', 'merge', 'append'])) {
        sendErrorResponse(400, 'Mode d\'import invalide. Valeurs acceptées : replace, merge, append');
        return;
    }
    
    try {
        // Valider la structure d'import
        $structureErrors = $service->validateImportStructure($input);
        if (!empty($structureErrors)) {
            sendErrorResponse(400, implode(', ', $structureErrors));
            return;
        }
        
        // Générer un aperçu pour information
        $preview = $service->generateImportPreview($input['data']);
        
        // Exécuter l'import
        $importStats = $service->importData($input['data'], $mode);
        
        // Résultat de l'import
        $result = [
            'import_completed' => true,
            'statistics' => $importStats,
            'preview' => $preview,
            'import_mode' => $mode,
            'import_date' => date('c')
        ];
        
        if (!empty($importStats['errors'])) {
            $result['warnings'] = 'Certaines données n\'ont pas pu être importées';
        }
        
        $message = sprintf(
            'Import terminé : %d catégorie(s), %d mot(s), %d tag(s)',
            $importStats['categories_imported'],
            $importStats['words_imported'],
            $importStats['tags_imported']
        );
        
        sendSuccessResponse($result, ['message' => $message]);
        
    } catch (Exception $e) {
        sendErrorResponse(500, 'Erreur lors de l\'import', $e->getMessage());
    }
}
?>