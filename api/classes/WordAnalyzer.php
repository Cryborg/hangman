<?php
/**
 * Analyseur de mots pour le jeu du pendu
 * Principe SOLID : Single Responsibility - analyse des caractéristiques des mots
 * 
 * @version 1.0.0
 */

class WordAnalyzer {
    
    /**
     * Analyse complète d'un mot pour extraire ses caractéristiques
     */
    public static function analyze(string $word): array {
        $word = strtoupper($word);
        $length = mb_strlen($word, 'UTF-8');
        
        return [
            'length' => $length,
            'has_accents' => self::hasAccents($word),
            'has_numbers' => self::hasNumbers($word),
            'has_special_chars' => self::hasSpecialChars($word),
            'difficulty' => self::calculateDifficulty($word)
        ];
    }
    
    /**
     * Détecte la présence d'accents français
     */
    public static function hasAccents(string $word): bool {
        return preg_match('/[ÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/u', $word) > 0;
    }
    
    /**
     * Détecte la présence de chiffres
     */
    public static function hasNumbers(string $word): bool {
        return preg_match('/[0-9]/', $word) > 0;
    }
    
    /**
     * Détecte la présence de caractères spéciaux (hors lettres, accents, chiffres)
     */
    public static function hasSpecialChars(string $word): bool {
        return preg_match('/[^A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ0-9]/u', $word) > 0;
    }
    
    /**
     * Calcule automatiquement la difficulté basée sur les caractéristiques du mot
     */
    public static function calculateDifficulty(string $word): string {
        $length = mb_strlen($word, 'UTF-8');
        $hasAccents = self::hasAccents($word);
        $hasNumbers = self::hasNumbers($word);
        $hasSpecialChars = self::hasSpecialChars($word);
        
        // Algorithme de calcul de difficulté
        $complexityScore = 0;
        
        // Longueur
        if ($length <= 4) $complexityScore += 0;
        elseif ($length <= 7) $complexityScore += 1;
        else $complexityScore += 2;
        
        // Caractéristiques spéciales
        if ($hasAccents) $complexityScore += 1;
        if ($hasNumbers) $complexityScore += 1;
        if ($hasSpecialChars) $complexityScore += 2;
        
        // Détermination finale
        if ($complexityScore <= 1) return 'easy';
        elseif ($complexityScore <= 3) return 'medium';
        else return 'hard';
    }
    
    /**
     * Compte les voyelles dans un mot (utile pour les statistiques)
     */
    public static function countVowels(string $word): int {
        return preg_match_all('/[AEIOUYÀÂÄÉÈÊËÏÎÔÖÙÛÜŸ]/u', strtoupper($word));
    }
    
    /**
     * Compte les consonnes dans un mot
     */
    public static function countConsonants(string $word): int {
        return preg_match_all('/[BCDFGHJKLMNPQRSTVWXZÇ]/u', strtoupper($word));
    }
    
    /**
     * Valide qu'un mot est conforme aux règles du jeu
     */
    public static function isValidWord(string $word): array {
        $errors = [];
        $word = trim($word);
        
        if (empty($word)) {
            $errors[] = "Le mot ne peut pas être vide";
        }
        
        if (mb_strlen($word, 'UTF-8') < 2) {
            $errors[] = "Le mot doit contenir au moins 2 caractères";
        }
        
        if (mb_strlen($word, 'UTF-8') > 50) {
            $errors[] = "Le mot ne peut pas dépasser 50 caractères";
        }
        
        // Caractères autorisés : lettres, accents, chiffres, tirets, apostrophes, espaces, points
        if (preg_match('/[^A-ZÀ-ÿ0-9\s\-\'\.\,]/ui', $word)) {
            $errors[] = "Le mot contient des caractères non autorisés";
        }
        
        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
            'cleaned_word' => StringUtility::cleanWord($word)
        ];
    }
}