<?php
/**
 * Classe utilitaire pour les opérations sur les chaînes
 * Principe SOLID : Single Responsibility - gestion des chaînes uniquement
 * 
 * @version 1.0.0
 */

class StringUtility {
    
    /**
     * Génération d'un slug à partir d'un nom
     * Applique les règles françaises d'accentuation
     */
    public static function generateSlug(string $name): string {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[àáâãäå]/u', 'a', $slug);
        $slug = preg_replace('/[èéêë]/u', 'e', $slug);
        $slug = preg_replace('/[ìíîï]/u', 'i', $slug);
        $slug = preg_replace('/[òóôõöø]/u', 'o', $slug);
        $slug = preg_replace('/[ùúûü]/u', 'u', $slug);
        $slug = preg_replace('/[ýÿ]/u', 'y', $slug);
        $slug = preg_replace('/[ç]/u', 'c', $slug);
        $slug = preg_replace('/[ñ]/u', 'n', $slug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        
        return $slug;
    }
    
    /**
     * Nettoie et formate un mot selon les règles du jeu
     */
    public static function cleanWord(string $word): string {
        return strtoupper(trim($word));
    }
    
    /**
     * Valide qu'une chaîne n'est pas vide après nettoyage
     */
    public static function isValidString(string $str): bool {
        return !empty(trim($str));
    }
    
    /**
     * Tronque une chaîne à une longueur donnée avec ellipsis
     */
    public static function truncate(string $str, int $length, string $suffix = '...'): string {
        if (mb_strlen($str, 'UTF-8') <= $length) {
            return $str;
        }
        
        return mb_substr($str, 0, $length - mb_strlen($suffix, 'UTF-8'), 'UTF-8') . $suffix;
    }
}