<?php
/**
 * Repository pour la gestion des catégories
 * Principe SOLID : Single Responsibility - opérations de base de données pour les catégories
 * Principe SOLID : Dependency Inversion - dépend d'abstraction (PDO)
 * 
 * @version 1.0.0
 */

class CategoryRepository {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    /**
     * Récupère toutes les catégories avec leurs tags
     */
    public function findAllWithTags(): array {
        $stmt = $this->db->query("
            SELECT 
                c.*,
                GROUP_CONCAT(DISTINCT t.slug) as tags,
                COUNT(DISTINCT w.id) as word_count
            FROM hangman_categories c
            LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id
            LEFT JOIN hangman_tags t ON ct.tag_id = t.id
            LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
            WHERE c.active = 1
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.name ASC
        ");
        
        return $stmt->fetchAll();
    }
    
    /**
     * Trouve une catégorie par son ID
     */
    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT c.*, COUNT(w.id) as word_count
            FROM hangman_categories c
            LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
            WHERE c.id = ? AND c.active = 1
            GROUP BY c.id
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Trouve une catégorie par son slug
     */
    public function findBySlug(string $slug): ?array {
        $stmt = $this->db->prepare("
            SELECT c.*, COUNT(w.id) as word_count
            FROM hangman_categories c
            LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
            WHERE c.slug = ? AND c.active = 1
            GROUP BY c.id
        ");
        $stmt->execute([$slug]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Vérifie si une catégorie existe par nom ou slug
     */
    public function existsByNameOrSlug(string $name, string $slug, ?int $excludeId = null): bool {
        $sql = "SELECT id FROM hangman_categories WHERE (name = ? OR slug = ?)";
        $params = [$name, $slug];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch() !== false;
    }
    
    /**
     * Crée une nouvelle catégorie
     */
    public function create(array $categoryData): int {
        $stmt = $this->db->prepare("
            INSERT INTO hangman_categories (name, slug, icon, display_order, active) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $categoryData['name'],
            $categoryData['slug'] ?? StringUtility::generateSlug($categoryData['name']),
            $categoryData['icon'] ?? '📁',
            $categoryData['display_order'] ?? 0,
            $categoryData['active'] ?? 1
        ]);
        
        return $this->db->lastInsertId();
    }
    
    /**
     * Met à jour une catégorie
     */
    public function update(int $id, array $updateData): bool {
        $allowedFields = ['name', 'slug', 'icon', 'display_order', 'active'];
        $updates = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($updateData[$field])) {
                $updates[] = "{$field} = ?";
                if ($field === 'active') {
                    $params[] = $updateData[$field] ? 1 : 0;
                } else {
                    $params[] = $updateData[$field];
                }
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $id;
        
        $stmt = $this->db->prepare("
            UPDATE hangman_categories 
            SET " . implode(', ', $updates) . ", updated_at = NOW()
            WHERE id = ?
        ");
        
        return $stmt->execute($params);
    }
    
    /**
     * Supprime une catégorie (suppression logique)
     */
    public function softDelete(int $id): bool {
        $stmt = $this->db->prepare("UPDATE hangman_categories SET active = 0 WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    /**
     * Supprime définitivement une catégorie et ses mots
     */
    public function delete(int $id): bool {
        $this->db->beginTransaction();
        
        try {
            // Supprimer les associations tags-catégorie
            $this->db->prepare("DELETE FROM hangman_category_tag WHERE category_id = ?")->execute([$id]);
            
            // Supprimer les mots de la catégorie
            $this->db->prepare("DELETE FROM hangman_words WHERE category_id = ?")->execute([$id]);
            
            // Supprimer la catégorie
            $stmt = $this->db->prepare("DELETE FROM hangman_categories WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            $this->db->commit();
            return $result;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Récupère les tags d'une catégorie
     */
    public function getTags(int $categoryId): array {
        $stmt = $this->db->prepare("
            SELECT t.*
            FROM hangman_tags t
            JOIN hangman_category_tag ct ON t.id = ct.tag_id
            WHERE ct.category_id = ?
            ORDER BY t.name ASC
        ");
        $stmt->execute([$categoryId]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Associe des tags à une catégorie
     */
    public function associateTags(int $categoryId, array $tagIds): bool {
        $this->db->beginTransaction();
        
        try {
            // Supprimer les anciennes associations
            $this->db->prepare("DELETE FROM hangman_category_tag WHERE category_id = ?")->execute([$categoryId]);
            
            // Ajouter les nouvelles associations
            if (!empty($tagIds)) {
                $stmt = $this->db->prepare("INSERT INTO hangman_category_tag (category_id, tag_id) VALUES (?, ?)");
                foreach ($tagIds as $tagId) {
                    $stmt->execute([$categoryId, $tagId]);
                }
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Récupère les statistiques globales des catégories
     */
    public function getGlobalStats(): array {
        $stmt = $this->db->query("
            SELECT 
                COUNT(DISTINCT c.id) as total_categories,
                COUNT(DISTINCT w.id) as total_words,
                COUNT(DISTINCT t.id) as total_tags,
                COUNT(CASE WHEN w.difficulty = 'easy' THEN 1 END) as easy_words,
                COUNT(CASE WHEN w.difficulty = 'medium' THEN 1 END) as medium_words,
                COUNT(CASE WHEN w.difficulty = 'hard' THEN 1 END) as hard_words
            FROM hangman_categories c
            LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
            LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id
            LEFT JOIN hangman_tags t ON ct.tag_id = t.id
            WHERE c.active = 1
        ");
        
        return $stmt->fetch() ?: [];
    }
    
    /**
     * Recherche de catégories avec filtres
     */
    public function search(array $filters = []): array {
        $whereConditions = ["c.active = 1"];
        $params = [];
        
        if (!empty($filters['name'])) {
            $whereConditions[] = "c.name LIKE ?";
            $params[] = "%{$filters['name']}%";
        }
        
        if (!empty($filters['tag_slug'])) {
            $whereConditions[] = "EXISTS (
                SELECT 1 FROM hangman_category_tag ct 
                JOIN hangman_tags t ON ct.tag_id = t.id 
                WHERE ct.category_id = c.id AND t.slug = ?
            )";
            $params[] = $filters['tag_slug'];
        }
        
        $sql = "
            SELECT 
                c.*,
                GROUP_CONCAT(DISTINCT t.slug) as tags,
                COUNT(DISTINCT w.id) as word_count
            FROM hangman_categories c
            LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id
            LEFT JOIN hangman_tags t ON ct.tag_id = t.id
            LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
            WHERE " . implode(' AND ', $whereConditions) . "
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.name ASC
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Import en masse de catégories
     */
    public function bulkImport(array $categories): array {
        $this->db->beginTransaction();
        $imported = 0;
        $errors = [];
        
        try {
            $stmt = $this->db->prepare("
                INSERT INTO hangman_categories (name, slug, icon, display_order) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                icon = VALUES(icon),
                display_order = VALUES(display_order)
            ");
            
            foreach ($categories as $categoryData) {
                try {
                    $slug = $categoryData['slug'] ?? StringUtility::generateSlug($categoryData['name'] ?? '');
                    
                    $stmt->execute([
                        $categoryData['name'] ?? '',
                        $slug,
                        $categoryData['icon'] ?? '📁',
                        $categoryData['display_order'] ?? 0
                    ]);
                    
                    $imported++;
                    
                } catch (Exception $e) {
                    $errors[] = "Catégorie '{$categoryData['name']}': " . $e->getMessage();
                }
            }
            
            $this->db->commit();
            
            return [
                'imported' => $imported,
                'errors' => $errors
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}