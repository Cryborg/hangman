<?php
/**
 * Service d'import/export pour l'administration
 * Principe SOLID : Single Responsibility - logique métier d'import/export
 * Principe DRY : Centralise la logique de traitement des données
 * 
 * @version 1.0.0
 */

class ImportExportService {
    private CategoryRepository $categoryRepo;
    private WordRepository $wordRepo;
    private TagRepository $tagRepo;
    
    public function __construct(PDO $db) {
        $this->categoryRepo = new CategoryRepository($db);
        $this->wordRepo = new WordRepository($db);
        $this->tagRepo = new TagRepository($db);
    }
    
    /**
     * Exporte les données au format JSON
     */
    public function exportData(string $type = 'full', string $format = 'json'): array {
        if ($format !== 'json') {
            throw new InvalidArgumentException('Seul le format JSON est supporté');
        }
        
        $exportData = [
            'export_info' => [
                'type' => $type,
                'date' => date('c'),
                'version' => API_VERSION,
                'app_version' => APP_VERSION
            ]
        ];
        
        if ($type === 'categories' || $type === 'full') {
            $categories = $this->categoryRepo->findAllWithTags();
            
            // Traitement des catégories
            foreach ($categories as &$category) {
                $category = DataTransformer::transformCategory($category);
                $category['tags'] = DataTransformer::parseTags($category['tags']);
                
                if ($type === 'full') {
                    // Ajouter les mots de la catégorie
                    $words = $this->wordRepo->findAllByCategory($category['id']);
                    $category['words'] = DataTransformer::transformWords($words);
                    
                    // Nettoyer pour l'export
                    foreach ($category['words'] as &$word) {
                        $word = DataTransformer::cleanForExport($word);
                    }
                }
                
                // Nettoyer la catégorie pour l'export
                $category = DataTransformer::cleanForExport($category);
            }
            
            $exportData['categories'] = $categories;
        }
        
        if ($type === 'full') {
            // Export des tags
            $tags = $this->tagRepo->findAll();
            $exportData['tags'] = array_map(function($tag) {
                return DataTransformer::cleanForExport(DataTransformer::transformTag($tag));
            }, $tags);
            
            // Statistiques globales
            $stats = $this->categoryRepo->getGlobalStats();
            $exportData['statistics'] = DataTransformer::transformCategoryStats($stats);
            $exportData['statistics']['total_categories'] = count($exportData['categories']);
            $exportData['statistics']['total_tags'] = count($exportData['tags']);
        }
        
        return $exportData;
    }
    
    /**
     * Importe les données depuis un tableau JSON
     */
    public function importData(array $data, string $mode = 'replace'): array {
        // Validation de base
        if (!isset($data['categories']) || !is_array($data['categories'])) {
            throw new InvalidArgumentException('Structure d\'import invalide: "categories" manquant ou invalide');
        }
        
        $importStats = [
            'categories_imported' => 0,
            'words_imported' => 0,
            'tags_imported' => 0,
            'errors' => []
        ];
        
        try {
            // En mode replace, supprimer toutes les données existantes
            if ($mode === 'replace') {
                $this->clearAllData();
            }
            
            // Collecter et créer tous les tags nécessaires
            $allTagNames = $this->collectAllTagNames($data['categories']);
            if (isset($data['tags']) && is_array($data['tags'])) {
                $importStats['tags_imported'] += $this->importTags($data['tags']);
            }
            
            // Créer automatiquement les tags manquants
            if (!empty($allTagNames)) {
                $this->tagRepo->ensureTagsExist($allTagNames);
            }
            
            // Import des catégories et leurs mots
            foreach ($data['categories'] as $categoryData) {
                try {
                    $result = $this->importCategory($categoryData, $mode);
                    $importStats['categories_imported']++;
                    $importStats['words_imported'] += $result['words_imported'];
                    
                } catch (Exception $e) {
                    $importStats['errors'][] = "Catégorie '{$categoryData['name']}': " . $e->getMessage();
                }
            }
            
            return $importStats;
            
        } catch (Exception $e) {
            throw new Exception("Erreur lors de l'import: " . $e->getMessage());
        }
    }
    
    /**
     * Importe une catégorie individuelle avec ses mots et tags
     */
    private function importCategory(array $categoryData, string $mode): array {
        // Validation des données de catégorie
        $nameValidation = Validator::validateName($categoryData['name'] ?? '');
        if (!empty($nameValidation['errors'])) {
            throw new InvalidArgumentException(implode(', ', $nameValidation['errors']));
        }
        
        // Préparer les données de la catégorie
        $categoryInfo = [
            'name' => $nameValidation['value'],
            'slug' => $categoryData['slug'] ?? StringUtility::generateSlug($nameValidation['value']),
            'icon' => $categoryData['icon'] ?? '📁'
        ];
        
        // Créer ou mettre à jour la catégorie
        $categoryId = $this->categoryRepo->create($categoryInfo);
        
        $wordsImported = 0;
        
        // Supprimer les anciens mots si mode replace
        if ($mode === 'replace') {
            $this->wordRepo->deleteByCategory($categoryId);
        }
        
        // Import des mots de la catégorie
        if (isset($categoryData['words']) && is_array($categoryData['words'])) {
            $result = $this->wordRepo->bulkImport($categoryId, $categoryData['words']);
            $wordsImported = $result['imported'];
        }
        
        // Associer les tags à la catégorie
        if (isset($categoryData['tags']) && is_array($categoryData['tags'])) {
            $tagIds = $this->tagRepo->ensureTagsExist($categoryData['tags']);
            $this->categoryRepo->associateTags($categoryId, $tagIds);
        }
        
        return ['words_imported' => $wordsImported];
    }
    
    /**
     * Importe une liste de tags
     */
    private function importTags(array $tags): int {
        $result = $this->tagRepo->bulkImport($tags);
        return $result['imported'];
    }
    
    /**
     * Collecte tous les noms de tags utilisés dans les catégories
     */
    private function collectAllTagNames(array $categories): array {
        $allTagNames = [];
        
        foreach ($categories as $categoryData) {
            if (isset($categoryData['tags']) && is_array($categoryData['tags'])) {
                foreach ($categoryData['tags'] as $tagName) {
                    $tagName = trim($tagName);
                    if (!empty($tagName) && !in_array($tagName, $allTagNames)) {
                        $allTagNames[] = $tagName;
                    }
                }
            }
        }
        
        return $allTagNames;
    }
    
    /**
     * Supprime toutes les données (pour le mode replace)
     */
    private function clearAllData(): void {
        // Note: L'ordre est important à cause des contraintes de clés étrangères
        $db = $this->categoryRepo->db ?? Database::getInstance()->getConnection();
        
        $db->exec("SET FOREIGN_KEY_CHECKS = 0");
        $db->exec("DELETE FROM hangman_category_tag");
        $db->exec("DELETE FROM hangman_words");
        $db->exec("DELETE FROM hangman_categories");
        $db->exec("DELETE FROM hangman_tags");
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    }
    
    /**
     * Génère un nom de fichier pour l'export
     */
    public function generateExportFilename(string $type): string {
        return 'hangman_' . $type . '_export_' . date('Y-m-d_H-i-s') . '.json';
    }
    
    /**
     * Valide la structure d'import
     */
    public function validateImportStructure(array $data): array {
        $errors = [];
        
        if (!isset($data['data'])) {
            $errors[] = 'Structure d\'import invalide: clé "data" manquante';
        }
        
        $importData = $data['data'] ?? [];
        
        if (!isset($importData['categories']) || !is_array($importData['categories'])) {
            $errors[] = 'Structure d\'import invalide: "categories" manquant ou invalide';
        }
        
        if (empty($importData['categories'])) {
            $errors[] = 'Aucune catégorie à importer';
        }
        
        // Valider chaque catégorie
        foreach ($importData['categories'] as $index => $category) {
            if (!is_array($category)) {
                $errors[] = "Catégorie #{$index}: doit être un objet";
                continue;
            }
            
            if (empty($category['name'])) {
                $errors[] = "Catégorie #{$index}: nom manquant";
            }
        }
        
        return $errors;
    }
    
    /**
     * Génère un aperçu des données d'import
     */
    public function generateImportPreview(array $data): array {
        $preview = [
            'categories_count' => 0,
            'words_count' => 0,
            'tags_count' => 0,
            'categories_preview' => [],
            'warnings' => []
        ];
        
        if (!isset($data['categories']) || !is_array($data['categories'])) {
            return $preview;
        }
        
        $allTags = [];
        
        foreach ($data['categories'] as $category) {
            $preview['categories_count']++;
            
            // Compter les mots
            if (isset($category['words']) && is_array($category['words'])) {
                $preview['words_count'] += count($category['words']);
            }
            
            // Collecter les tags
            if (isset($category['tags']) && is_array($category['tags'])) {
                foreach ($category['tags'] as $tag) {
                    if (!in_array($tag, $allTags)) {
                        $allTags[] = $tag;
                    }
                }
            }
            
            // Aperçu des catégories (premières 5)
            if (count($preview['categories_preview']) < 5) {
                $preview['categories_preview'][] = [
                    'name' => $category['name'] ?? 'Sans nom',
                    'icon' => $category['icon'] ?? '📁',
                    'words_count' => isset($category['words']) ? count($category['words']) : 0
                ];
            }
        }
        
        $preview['tags_count'] = count($allTags);
        
        return $preview;
    }
}