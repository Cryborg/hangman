<?php
/**
 * Transformateur de données pour l'API
 * Principe SOLID : Single Responsibility - transformation et formatage des données
 * Principe DRY : Centralise toutes les conversions de types
 * 
 * @version 1.0.0
 */

class DataTransformer {
    
    /**
     * Transforme les données d'un mot pour l'API
     */
    public static function transformWord(array $word): array {
        return [
            'id' => (int) $word['id'],
            'word' => $word['word'],
            'category_id' => (int) ($word['category_id'] ?? 0),
            'difficulty' => $word['difficulty'] ?? 'medium',
            'active' => (bool) ($word['active'] ?? true),
            'created_at' => $word['created_at'] ?? null,
            'updated_at' => $word['updated_at'] ?? null
        ];
    }
    
    /**
     * Transforme les données d'une catégorie pour l'API
     */
    public static function transformCategory(array $category): array {
        return [
            'id' => (int) $category['id'],
            'name' => $category['name'],
            'slug' => $category['slug'],
            'icon' => $category['icon'] ?? '📁',
            'display_order' => (int) ($category['display_order'] ?? 0),
            'active' => (bool) ($category['active'] ?? true),
            'word_count' => (int) ($category['word_count'] ?? 0),
            'created_at' => $category['created_at'] ?? null,
            'updated_at' => $category['updated_at'] ?? null
        ];
    }
    
    /**
     * Transforme les données d'un tag pour l'API
     */
    public static function transformTag(array $tag): array {
        return [
            'id' => (int) $tag['id'],
            'name' => $tag['name'],
            'slug' => $tag['slug'],
            'color' => $tag['color'] ?? '#3498db',
            'display_order' => (int) ($tag['display_order'] ?? 0),
            'created_at' => $tag['created_at'] ?? null,
            'updated_at' => $tag['updated_at'] ?? null
        ];
    }
    
    /**
     * Transforme un tableau de mots
     */
    public static function transformWords(array $words): array {
        return array_map([self::class, 'transformWord'], $words);
    }
    
    /**
     * Transforme un tableau de catégories
     */
    public static function transformCategories(array $categories): array {
        return array_map([self::class, 'transformCategory'], $categories);
    }
    
    /**
     * Transforme un tableau de tags
     */
    public static function transformTags(array $tags): array {
        return array_map([self::class, 'transformTag'], $tags);
    }
    
    /**
     * Génère des données de pagination formatées
     */
    public static function buildPaginationData(int $currentPage, int $perPage, int $total, ?string $search = null): array {
        $totalPages = ceil($total / $perPage);
        $hasMore = ($currentPage * $perPage) < $total;
        
        return [
            'current_page' => $currentPage,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $hasMore,
            'from' => $total > 0 ? (($currentPage - 1) * $perPage) + 1 : 0,
            'to' => min($currentPage * $perPage, $total),
            'search' => $search
        ];
    }
    
    /**
     * Transforme les statistiques d'une catégorie
     */
    public static function transformCategoryStats(array $stats): array {
        return [
            'total_words' => (int) ($stats['total_words'] ?? 0),
            'easy_words' => (int) ($stats['easy_words'] ?? 0),
            'medium_words' => (int) ($stats['medium_words'] ?? 0),
            'hard_words' => (int) ($stats['hard_words'] ?? 0)
        ];
    }
    
    /**
     * Supprime les champs techniques des données d'export
     */
    public static function cleanForExport(array $data): array {
        $fieldsToRemove = ['created_at', 'updated_at', 'id'];
        
        if (is_array($data)) {
            foreach ($fieldsToRemove as $field) {
                unset($data[$field]);
            }
        }
        
        return $data;
    }
    
    /**
     * Formate les données pour l'export JSON
     */
    public static function formatForJsonExport(array $data): string {
        return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
    
    /**
     * Parse et valide les tags depuis une chaîne CSV ou un array
     */
    public static function parseTags($tagsInput): array {
        if (is_string($tagsInput)) {
            return array_filter(array_map('trim', explode(',', $tagsInput)));
        }
        
        if (is_array($tagsInput)) {
            return array_filter($tagsInput);
        }
        
        return [];
    }
}