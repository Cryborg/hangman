<?php
/**
 * API Hangman - Point d'entrée principal
 * 
 * Documentation des endpoints disponibles
 * 
 * @version 1.0.0
 */

require_once 'config.php';

$documentation = [
    'api' => [
        'name' => 'Hangman Game API',
        'version' => API_VERSION,
        'description' => 'API REST pour récupérer les données du jeu du pendu',
        'base_url' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . API_BASE_PATH,
        'documentation_url' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . API_BASE_PATH . '/index.php'
    ],
    'endpoints' => [
        'categories' => [
            'url' => '/categories.php',
            'method' => 'GET',
            'description' => 'Récupère les catégories de mots avec leurs mots associés',
            'parameters' => [
                'id' => [
                    'type' => 'integer',
                    'required' => false,
                    'description' => 'ID de la catégorie spécifique à récupérer'
                ],
                'slug' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Slug de la catégorie spécifique à récupérer'
                ],
                'tags' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Filtrer par tags (séparés par des virgules)',
                    'example' => 'enfant,nature'
                ],
                'stats' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Inclure les statistiques détaillées',
                    'default' => 'false'
                ],
                'words' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Inclure les mots dans la réponse',
                    'default' => 'true'
                ]
            ],
            'examples' => [
                '/categories.php' => 'Toutes les catégories avec leurs mots',
                '/categories.php?id=1' => 'Catégorie avec ID 1',
                '/categories.php?slug=animaux' => 'Catégorie "animaux"',
                '/categories.php?tags=enfant,nature' => 'Catégories avec tags "enfant" ou "nature"',
                '/categories.php?stats=true' => 'Toutes les catégories avec statistiques',
                '/categories.php?words=false' => 'Catégories sans les mots'
            ]
        ],
        'words' => [
            'url' => '/words.php',
            'method' => 'GET',
            'description' => 'Récupère les mots d\'une catégorie avec filtres avancés',
            'parameters' => [
                'category' => [
                    'type' => 'string|integer',
                    'required' => true,
                    'description' => 'ID ou slug de la catégorie'
                ],
                'random' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Récupérer un mot aléatoire',
                    'default' => 'false'
                ],
                'difficulty' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Filtrer par difficulté',
                    'allowed_values' => ['facile', 'moyen', 'difficile']
                ],
                'length' => [
                    'type' => 'string',
                    'required' => false,
                    'description' => 'Filtrer par longueur (format: min-max)',
                    'example' => '5-8'
                ],
                'limit' => [
                    'type' => 'integer',
                    'required' => false,
                    'description' => 'Limiter le nombre de résultats (1-1000)'
                ]
            ],
            'examples' => [
                '/words.php?category=1' => 'Tous les mots de la catégorie 1',
                '/words.php?category=animaux' => 'Tous les mots de la catégorie "animaux"',
                '/words.php?category=1&random=true' => 'Mot aléatoire de la catégorie 1',
                '/words.php?category=1&difficulty=facile' => 'Mots faciles de la catégorie 1',
                '/words.php?category=1&length=5-8' => 'Mots de 5 à 8 caractères',
                '/words.php?category=1&limit=10' => 'Maximum 10 mots'
            ]
        ],
        'stats' => [
            'url' => '/stats.php',
            'method' => 'GET',
            'description' => 'Récupère les statistiques générales du jeu',
            'parameters' => [
                'categories' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Inclure les statistiques par catégorie',
                    'default' => 'false'
                ],
                'tags' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Inclure les statistiques par tag',
                    'default' => 'false'
                ],
                'difficulty' => [
                    'type' => 'boolean',
                    'required' => false,
                    'description' => 'Inclure l\'analyse de difficulté détaillée',
                    'default' => 'false'
                ]
            ],
            'examples' => [
                '/stats.php' => 'Statistiques globales',
                '/stats.php?categories=true' => 'Stats globales + stats par catégorie',
                '/stats.php?tags=true' => 'Stats globales + stats par tag',
                '/stats.php?categories=true&tags=true&difficulty=true' => 'Toutes les statistiques'
            ]
        ]
    ],
    'response_format' => [
        'success_response' => [
            'success' => true,
            'data' => '/* Les données demandées */',
            'meta' => [
                'api_version' => API_VERSION,
                'timestamp' => '/* ISO 8601 timestamp */',
                'count' => '/* Nombre d\'éléments retournés */'
            ]
        ],
        'error_response' => [
            'success' => false,
            'error' => [
                'code' => '/* Code d\'erreur HTTP */',
                'message' => '/* Message d\'erreur */',
                'api_version' => API_VERSION,
                'timestamp' => '/* ISO 8601 timestamp */'
            ]
        ]
    ],
    'data_structure' => [
        'category' => [
            'id' => 'integer - Unique category ID',
            'name' => 'string - Category name',
            'icon' => 'string - Emoji representing the category',
            'slug' => 'string - URL-friendly slug',
            'description' => 'string|null - Optional description',
            'display_order' => 'integer - Display order',
            'tags' => 'array - List of associated tags',
            'words' => 'array - List of words (if included)'
        ],
        'word' => [
            'id' => 'integer - Unique word ID',
            'word' => 'string - The word to guess (uppercase)',
            'difficulty' => 'string - Difficulty level (easy/medium/hard)',
            'length' => 'integer - Number of characters',
            'popularity' => 'integer - Popularity score',
            'category_name' => 'string - Category name',
            'category_icon' => 'string - Category icon'
        ]
    ],
    'error_codes' => [
        400 => 'Bad Request - Paramètres manquants ou invalides',
        404 => 'Not Found - Ressource introuvable',
        500 => 'Internal Server Error - Erreur serveur'
    ],
    'notes' => [
        'Tous les endpoints supportent uniquement la méthode GET',
        'Les réponses sont en format JSON avec encodage UTF-8',
        'Les headers CORS sont configurés pour permettre les requêtes cross-origin',
        'Les mots sont stockés en majuscules avec accents français corrects',
        'La difficulté est calculée automatiquement basée sur la longueur et les caractères spéciaux',
        'Les statistiques sont calculées en temps réel à partir de la base de données'
    ]
];

sendSuccessResponse($documentation, [
    'documentation' => true,
    'endpoints_count' => count($documentation['endpoints']),
    'last_updated' => '2024-01-01'
]);
?>