<?php
/**
 * Script de setup pour la base de données de test
 * Nettoie et recrée les données de test
 */

require_once __DIR__ . '/bootstrap.php';

// Connecter à la base de test (les variables d'env sont déjà chargées)
try {
    $dsn = "mysql:host=" . $_ENV['DB_HOST'] . ";dbname=" . $_ENV['DB_DATABASE'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ Connexion à la base de test : " . $_ENV['DB_DATABASE'] . "\n";
    
    // Nettoyer toutes les tables
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE hangman_category_tag");
    $pdo->exec("TRUNCATE TABLE hangman_words");
    $pdo->exec("TRUNCATE TABLE hangman_tags");
    $pdo->exec("TRUNCATE TABLE hangman_categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "✅ Tables nettoyées\n";
    
    // Créer quelques données de test de base
    $pdo->exec("INSERT INTO hangman_categories (name, icon, slug, created_at, updated_at) VALUES 
        ('Test Category', '🧪', 'test-category', NOW(), NOW()),
        ('Animals', '🐾', 'animals', NOW(), NOW())");
    
    $pdo->exec("INSERT INTO hangman_tags (name, slug, color, created_at, updated_at) VALUES 
        ('test', 'test', '#FF0000', NOW(), NOW()),
        ('animals', 'animals', '#00FF00', NOW(), NOW())");
    
    echo "✅ Données de test créées\n";
    echo "🎯 Base de test prête pour PHPUnit\n";
    
} catch (Exception $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
    exit(1);
}