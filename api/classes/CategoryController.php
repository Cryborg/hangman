<?php
/**
 * Contrôleur pour la gestion des catégories
 * Hérite de BaseAdminController pour éliminer la duplication
 * 
 * @version 1.0.0
 */

require_once __DIR__ . '/BaseAdminController.php';
require_once __DIR__ . '/StringUtility.php';
require_once __DIR__ . '/CategoryRepository.php';

class CategoryController extends BaseAdminController {
    private CategoryRepository $repository;
    
    public function __construct(PDO $db) {
        parent::__construct($db, 'category');
        $this->repository = new CategoryRepository($db);
    }
    
    // ===== IMPLÉMENTATION DES MÉTHODES ABSTRAITES =====
    
    protected function findById(int $id): ?array {
        return $this->repository->findById($id);
    }
    
    protected function findWithPagination(array $params): array {
        $items = $this->repository->findAll();
        return [
            'items' => $items,
            'total' => count($items),
            'page' => $params['page'] ?? 1,
            'limit' => $params['limit'] ?? count($items)
        ];
    }
    
    protected function create(array $data): int {
        // Générer le slug automatiquement si absent
        if (empty($data['slug'])) {
            $data['slug'] = StringUtility::generateSlug($data['name']);
        }
        
        // Vérifier l'unicité du slug
        if ($this->repository->existsBySlug($data['slug'])) {
            throw new InvalidArgumentException('This slug already exists');
        }
        
        return $this->repository->create($data);
    }
    
    protected function update(int $id, array $data): bool {
        // Générer le slug automatiquement si absent
        if (empty($data['slug'])) {
            $data['slug'] = StringUtility::generateSlug($data['name']);
        }
        
        // Vérifier l'unicité du slug (sauf pour la catégorie actuelle)
        if ($this->repository->existsBySlug($data['slug'], $id)) {
            throw new InvalidArgumentException('This slug already exists');
        }
        
        return $this->repository->update($id, $data);
    }
    
    protected function delete(int $id): bool {
        // Vérifier qu'il n'y a pas de mots dans cette catégorie
        if ($this->repository->hasWords($id)) {
            $wordsCount = $this->repository->getWordsCount($id);
            throw new InvalidArgumentException("elle contient {$wordsCount} mot(s)");
        }
        
        return $this->repository->delete($id);
    }
    
    protected function validateForCreate(array $data): array {
        $errors = [];
        $validData = [];
        
        // Validation du nom
        $nameValidation = Validator::validateName($data['name'] ?? '');
        if (!empty($nameValidation['errors'])) {
            $errors = array_merge($errors, $nameValidation['errors']);
        } else {
            $validData['name'] = $nameValidation['value'];
        }
        
        // Validation optionnelle du slug
        if (!empty($data['slug'])) {
            $validData['slug'] = Validator::sanitizeString($data['slug']);
        }
        
        // Validation de l'icône
        $validData['icon'] = !empty($data['icon']) ? Validator::sanitizeString($data['icon']) : '📁';
        
        
        // Tags (optionnel)
        if (!empty($data['tags'])) {
            $validData['tags'] = is_array($data['tags']) ? $data['tags'] : [];
        }
        
        return [
            'data' => $validData,
            'errors' => $errors
        ];
    }
    
    protected function validateForUpdate(array $data): array {
        // La validation est identique pour create et update
        return $this->validateForCreate($data);
    }
    
    protected function transformForResponse(array $item): array {
        return [
            'id' => (int) $item['id'],
            'name' => $item['name'],
            'slug' => $item['slug'],
            'icon' => $item['icon'] ?? '📁',
            'active' => (bool) ($item['active'] ?? true),
            'words_count' => (int) ($item['words_count'] ?? 0),
            'tags' => $item['tags'] ?? [],
            'created_at' => $item['created_at'] ?? null,
            'updated_at' => $item['updated_at'] ?? null
        ];
    }
}