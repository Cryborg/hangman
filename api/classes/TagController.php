<?php
/**
 * Contrôleur pour la gestion des tags
 * Hérite de BaseAdminController pour éliminer la duplication
 * 
 * @version 1.0.0
 */

require_once __DIR__ . '/BaseAdminController.php';
require_once __DIR__ . '/StringUtility.php';
require_once __DIR__ . '/TagRepository.php';

class TagController extends BaseAdminController {
    private TagRepository $repository;
    
    public function __construct(PDO $db) {
        parent::__construct($db, 'tag');
        $this->repository = new TagRepository($db);
    }
    
    // ===== IMPLÉMENTATION DES MÉTHODES ABSTRAITES =====
    
    protected function findById(int $id): ?array {
        return $this->repository->findById($id);
    }
    
    protected function findWithPagination(array $params): array {
        // Pour les tags, on retourne simplement tous les tags
        // car ils ne sont généralement pas nombreux
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
        
        // Valider la couleur hexadécimale
        if (!empty($data['color']) && !preg_match('/^#[0-9A-Fa-f]{6}$/', $data['color'])) {
            $data['color'] = '#3498db';
        }
        
        // Vérifier l'unicité du nom/slug
        if ($this->repository->existsByNameOrSlug($data['name'], $data['slug'])) {
            throw new InvalidArgumentException('This name or slug already exists');
        }
        
        $tagId = $this->repository->create($data);
        
        // Gérer les associations de catégories si fournies
        if (!empty($data['categories'])) {
            $this->updateTagCategories($tagId, $data['categories']);
        }
        
        return $tagId;
    }
    
    protected function update(int $id, array $data): bool {
        // Générer le slug automatiquement si absent mais nom fourni
        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = StringUtility::generateSlug($data['name']);
        }
        
        // Valider la couleur hexadécimale
        if (!empty($data['color']) && !preg_match('/^#[0-9A-Fa-f]{6}$/', $data['color'])) {
            $data['color'] = '#3498db';
        }
        
        // Vérifier l'unicité du nom/slug (sauf pour le tag actuel)
        if (!empty($data['name']) || !empty($data['slug'])) {
            $name = $data['name'] ?? '';
            $slug = $data['slug'] ?? '';
            
            if ($this->repository->existsByNameOrSlug($name, $slug, $id)) {
                throw new InvalidArgumentException('This name or slug already exists');
            }
        }
        
        $success = $this->repository->update($id, $data);
        
        // Gérer les associations de catégories si fournies
        if (isset($data['categories'])) {
            $this->updateTagCategories($id, $data['categories']);
        }
        
        return $success;
    }
    
    protected function delete(int $id): bool {
        return $this->repository->delete($id);
    }
    
    protected function validateForCreate(array $data): array {
        $errors = [];
        $validData = [];
        
        // Validation du nom (requis)
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
        
        // Validation de la couleur
        $color = $data['color'] ?? '#3498db';
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
            $color = '#3498db';
        }
        $validData['color'] = $color;
        
        
        // Catégories (optionnel)
        if (!empty($data['categories'])) {
            $validData['categories'] = is_array($data['categories']) ? $data['categories'] : [];
        }
        
        return [
            'data' => $validData,
            'errors' => $errors
        ];
    }
    
    protected function validateForUpdate(array $data): array {
        $errors = [];
        $validData = [];
        
        // Validation du nom (optionnel en update)
        if (isset($data['name'])) {
            $nameValidation = Validator::validateName($data['name']);
            if (!empty($nameValidation['errors'])) {
                $errors = array_merge($errors, $nameValidation['errors']);
            } else {
                $validData['name'] = $nameValidation['value'];
            }
        }
        
        // Validation optionnelle du slug
        if (isset($data['slug'])) {
            $validData['slug'] = Validator::sanitizeString($data['slug']);
        }
        
        // Validation de la couleur
        if (isset($data['color'])) {
            $color = $data['color'];
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
                $color = '#3498db';
            }
            $validData['color'] = $color;
        }
        
        
        // Catégories (optionnel)
        if (isset($data['categories'])) {
            $validData['categories'] = is_array($data['categories']) ? $data['categories'] : [];
        }
        
        return [
            'data' => $validData,
            'errors' => $errors
        ];
    }
    
    protected function transformForResponse(array $item): array {
        return [
            'id' => (int) $item['id'],
            'name' => $item['name'],
            'slug' => $item['slug'],
            'color' => $item['color'] ?? '#3498db',
            'category_count' => (int) ($item['category_count'] ?? 0),
            'categories' => $item['categories'] ?? [],
            'created_at' => $item['created_at'] ?? null,
            'updated_at' => $item['updated_at'] ?? null
        ];
    }
    
    // ===== MÉTHODES SPÉCIFIQUES AUX TAGS =====
    
    /**
     * Met à jour les associations tag-catégories
     */
    private function updateTagCategories(int $tagId, array $categoryIds): void {
        // Ne pas gérer les transactions ici car BaseAdminController s'en charge déjà
        
        // Supprimer les anciennes associations
        $stmt = $this->db->prepare("DELETE FROM hangman_category_tag WHERE tag_id = ?");
        $stmt->execute([$tagId]);
        
        // Ajouter les nouvelles associations
        if (!empty($categoryIds)) {
            $categoryStmt = $this->db->prepare("
                INSERT INTO hangman_category_tag (category_id, tag_id) 
                VALUES (?, ?)
            ");
            
            foreach ($categoryIds as $categoryId) {
                // Vérifier que la catégorie existe
                if ($this->categoryExists($categoryId)) {
                    $categoryStmt->execute([$categoryId, $tagId]);
                }
            }
        }
    }
    
    /**
     * Vérifie si une catégorie existe
     */
    private function categoryExists(int $categoryId): bool {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE id = ?");
        $stmt->execute([$categoryId]);
        return $stmt->fetchColumn() > 0;
    }
}