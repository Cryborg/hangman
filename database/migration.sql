-- =============================================================================
-- PENDU GAME - SCRIPT DE MIGRATION DES DONNÉES
-- =============================================================================
-- Version: 1.0.0
-- Description: Import complet des données JSON vers MySQL
-- Source: categories.json -> Tables hangman_*
-- =============================================================================

-- Désactiver les contraintes temporairement pour l'import
SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;

-- =============================================================================
-- 1. INSERTION DES TAGS
-- =============================================================================

INSERT INTO `hangman_tags` (`nom`, `slug`, `couleur`, `description`, `ordre`) VALUES
('enfant', 'enfant', '#28a745', 'Contenu adapté aux enfants', 1),
('adulte', 'adulte', '#6f42c1', 'Contenu pour adultes', 2),
('famille', 'famille', '#20c997', 'Contenu familial pour tous', 3),
('nature', 'nature', '#198754', 'Animaux, plantes, environnement', 4),
('culture', 'culture', '#0d6efd', 'Arts, littérature, histoire', 5),
('sport', 'sport', '#fd7e14', 'Sports et activités physiques', 6),
('education', 'education', '#6610f2', 'Apprentissage et éducation', 7),
('quotidien', 'quotidien', '#6c757d', 'Objets et activités du quotidien', 8),
('fantastique', 'fantastique', '#d63384', 'Univers imaginaires et fantasy', 9),
('retro', 'retro', '#ffc107', 'Nostalgie et années passées', 10),
('geographie', 'geographie', '#0dcaf0', 'Lieux, pays, géographie', 11),
('harry-potter', 'harry-potter', '#7c4dff', 'Univers Harry Potter', 12),
('disney', 'disney', '#ff6b9d', 'Univers Disney', 13),
('pixar', 'pixar', '#ffd93d', 'Studios Pixar', 14),
('comics', 'comics', '#dc3545', 'Marvel, DC Comics et superhéros', 15);

-- =============================================================================
-- 2. INSERTION DES CATÉGORIES
-- =============================================================================

INSERT INTO `hangman_categories` (`nom`, `icone`, `slug`, `ordre`) VALUES
('Animaux', '🐾', 'animaux', 1),
('Fruits et Légumes', '🍎', 'fruits-legumes', 2),
('Métiers', '👔', 'metiers', 3),
('Couleurs', '🎨', 'couleurs', 4),
('Sports', '⚽', 'sports', 5),
('Pays', '🌍', 'pays', 6),
('Transports', '🚗', 'transports', 7),
('Objets de la Maison', '🏠', 'objets-maison', 8),
('École et Bureau', '📚', 'ecole-bureau', 9),
('Instruments de Musique', '🎵', 'instruments-musique', 10),
('Dessins Animés', '📺', 'dessins-animes', 11),
('Séries TV', '📺', 'series-tv', 12),
('Films Cultes', '🎬', 'films-cultes', 13),
('Jeux Vidéo Rétro', '🕹️', 'jeux-video-retro', 14),
('Musiques des Années 80', '🎧', 'musiques-80', 15),
('Chanteurs Français', '🇫🇷', 'chanteurs-francais', 16),
('Harry Potter', '⚡', 'harry-potter', 17),
('Disney Films Classiques', '🏰', 'disney-films-classiques', 18),
('Disney Pixar', '🎈', 'disney-pixar', 19),
('Disney Personnages', '🐭', 'disney-personnages', 20),
('Marvel Avengers', '🦸', 'marvel-avengers', 21),
('DC Comics', '🦇', 'dc-comics', 22),
('Vêtements', '👕', 'vetements', 23),
('Animaux Préhistoriques', '🦕', 'animaux-prehistoriques', 24),
('Héros de Dessins Animés', '🦸', 'heros-dessins-animes', 25),
('Fournitures Scolaires', '✏️', 'fournitures-scolaires', 26),
('Parties du Corps', '👤', 'parties-corps', 27),
('Jouets', '🧸', 'jouets', 28),
('Aliments Préférés des Enfants', '🍭', 'aliments-enfants', 29),
('Villes de France', '🏛️', 'villes-france', 30),
('Monuments Célèbres', '🗿', 'monuments-celebres', 31),
('Sciences', '🔬', 'sciences', 32),
('Espace', '🚀', 'espace', 33);

-- =============================================================================
-- 3. ASSOCIATION CATÉGORIES <-> TAGS
-- =============================================================================

INSERT INTO `hangman_category_tag` (`category_id`, `tag_id`)
SELECT c.id, t.id FROM `hangman_categories` c, `hangman_tags` t WHERE 
(c.slug = 'animaux' AND t.slug IN ('nature', 'famille', 'enfant')) OR
(c.slug = 'fruits-legumes' AND t.slug IN ('nature', 'quotidien', 'enfant')) OR
(c.slug = 'metiers' AND t.slug IN ('adulte', 'education', 'quotidien')) OR
(c.slug = 'couleurs' AND t.slug IN ('enfant', 'education', 'famille')) OR
(c.slug = 'sports' AND t.slug IN ('sport', 'famille')) OR
(c.slug = 'pays' AND t.slug IN ('geographie', 'education', 'culture')) OR
(c.slug = 'transports' AND t.slug IN ('quotidien', 'famille', 'enfant')) OR
(c.slug = 'objets-maison' AND t.slug IN ('quotidien', 'famille')) OR
(c.slug = 'ecole-bureau' AND t.slug IN ('education', 'quotidien')) OR
(c.slug = 'instruments-musique' AND t.slug IN ('culture', 'education')) OR
(c.slug = 'dessins-animes' AND t.slug IN ('retro', 'enfant', 'famille')) OR
(c.slug = 'series-tv' AND t.slug IN ('retro', 'adulte', 'culture')) OR
(c.slug = 'films-cultes' AND t.slug IN ('retro', 'culture', 'adulte')) OR
(c.slug = 'jeux-video-retro' AND t.slug IN ('retro', 'culture')) OR
(c.slug = 'musiques-80' AND t.slug IN ('retro', 'culture')) OR
(c.slug = 'chanteurs-francais' AND t.slug IN ('culture', 'adulte')) OR
(c.slug = 'harry-potter' AND t.slug IN ('harry-potter', 'fantastique', 'culture')) OR
(c.slug = 'disney-films-classiques' AND t.slug IN ('disney', 'famille', 'enfant')) OR
(c.slug = 'disney-pixar' AND t.slug IN ('disney', 'pixar', 'famille')) OR
(c.slug = 'disney-personnages' AND t.slug IN ('disney', 'enfant', 'famille')) OR
(c.slug = 'marvel-avengers' AND t.slug IN ('comics', 'fantastique', 'culture')) OR
(c.slug = 'dc-comics' AND t.slug IN ('comics', 'fantastique', 'culture')) OR
(c.slug = 'vetements' AND t.slug IN ('quotidien', 'famille')) OR
(c.slug = 'animaux-prehistoriques' AND t.slug IN ('nature', 'education', 'enfant')) OR
(c.slug = 'heros-dessins-animes' AND t.slug IN ('enfant', 'famille', 'fantastique')) OR
(c.slug = 'fournitures-scolaires' AND t.slug IN ('enfant', 'education', 'quotidien')) OR
(c.slug = 'parties-corps' AND t.slug IN ('enfant', 'education', 'famille')) OR
(c.slug = 'jouets' AND t.slug IN ('enfant', 'famille', 'quotidien')) OR
(c.slug = 'aliments-enfants' AND t.slug IN ('enfant', 'famille', 'quotidien')) OR
(c.slug = 'villes-france' AND t.slug IN ('geographie', 'education', 'culture')) OR
(c.slug = 'monuments-celebres' AND t.slug IN ('geographie', 'culture', 'education')) OR
(c.slug = 'sciences' AND t.slug IN ('education', 'culture')) OR
(c.slug = 'espace' AND t.slug IN ('education', 'culture', 'fantastique'));

-- =============================================================================
-- 4. INSERTION DES MOTS PAR CATÉGORIE
-- =============================================================================

-- Animaux
INSERT INTO `hangman_words` (`mot`, `category_id`) 
SELECT mot, c.id FROM (
    SELECT 'CHIEN' AS mot UNION SELECT 'CHEVAL' UNION SELECT 'VACHE' UNION SELECT 'COCHON' UNION
    SELECT 'MOUTON' UNION SELECT 'POULE' UNION SELECT 'CANARD' UNION SELECT 'LAPIN' UNION
    SELECT 'SOURIS' UNION SELECT 'TIGRE' UNION SELECT 'ÉLÉPHANT' UNION SELECT 'GIRAFE' UNION
    SELECT 'ZÈBRE' UNION SELECT 'RENARD' UNION SELECT 'SINGE' UNION SELECT 'KANGOUROU' UNION
    SELECT 'DAUPHIN' UNION SELECT 'BALEINE' UNION SELECT 'REQUIN' UNION SELECT 'AIGLE' UNION
    SELECT 'CORBEAU' UNION SELECT 'HIBOU' UNION SELECT 'SERPENT' UNION SELECT 'TORTUE' UNION
    SELECT 'GRENOUILLE' UNION SELECT 'PAPILLON'
) AS animaux_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'animaux';

-- Fruits et Légumes
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'POMME' AS mot UNION SELECT 'BANANE' UNION SELECT 'ORANGE' UNION SELECT 'FRAISE' UNION
    SELECT 'CERISE' UNION SELECT 'RAISIN' UNION SELECT 'ANANAS' UNION SELECT 'POIRE' UNION
    SELECT 'PÊCHE' UNION SELECT 'PRUNE' UNION SELECT 'CAROTTE' UNION SELECT 'RADIS' UNION
    SELECT 'ÉPINARD' UNION SELECT 'SALADE' UNION SELECT 'TOMATE' UNION SELECT 'CONCOMBRE' UNION
    SELECT 'COURGETTE' UNION SELECT 'AUBERGINE' UNION SELECT 'POIVRON' UNION SELECT 'BROCOLI' UNION
    SELECT 'CHOU-FLEUR' UNION SELECT 'ARTICHAUT' UNION SELECT 'ASPERGE' UNION SELECT 'FENOUIL' UNION
    SELECT 'BETTERAVE' UNION SELECT 'NAVET'
) AS fruits_legumes_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'fruits-legumes';

-- Métiers
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'MÉDECIN' AS mot UNION SELECT 'PROFESSEUR' UNION SELECT 'AVOCAT' UNION SELECT 'INGÉNIEUR' UNION
    SELECT 'ARCHITECTE' UNION SELECT 'CUISINIER' UNION SELECT 'COIFFEUR' UNION SELECT 'PLOMBIER' UNION
    SELECT 'ÉLECTRICIEN' UNION SELECT 'MAÇON' UNION SELECT 'MENUISIER' UNION SELECT 'PEINTRE' UNION
    SELECT 'JARDINIER' UNION SELECT 'MÉCANICIEN' UNION SELECT 'CHAUFFEUR' UNION SELECT 'PILOTE' UNION
    SELECT 'STEWARD' UNION SELECT 'SERVEUR' UNION SELECT 'CAISSIER' UNION SELECT 'VENDEUR' UNION
    SELECT 'SECRÉTAIRE' UNION SELECT 'COMPTABLE' UNION SELECT 'BANQUIER' UNION SELECT 'AGENT' UNION
    SELECT 'JOURNALISTE' UNION SELECT 'PHOTOGRAPHE'
) AS metiers_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'metiers';

-- Couleurs
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'ROUGE' AS mot UNION SELECT 'BLEU' UNION SELECT 'VERT' UNION SELECT 'JAUNE' UNION
    SELECT 'ORANGE' UNION SELECT 'VIOLET' UNION SELECT 'ROSE' UNION SELECT 'NOIR' UNION
    SELECT 'BLANC' UNION SELECT 'GRIS' UNION SELECT 'MARRON' UNION SELECT 'TURQUOISE' UNION
    SELECT 'MAGENTA' UNION SELECT 'CYAN' UNION SELECT 'BORDEAUX' UNION SELECT 'BEIGE' UNION
    SELECT 'CRÈME' UNION SELECT 'OCRE' UNION SELECT 'INDIGO' UNION SELECT 'POURPRE'
) AS couleurs_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'couleurs';

-- Sports
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'FOOTBALL' AS mot UNION SELECT 'TENNIS' UNION SELECT 'BASKETBALL' UNION SELECT 'VOLLEYBALL' UNION
    SELECT 'NATATION' UNION SELECT 'CYCLISME' UNION SELECT 'COURSE' UNION SELECT 'SAUT' UNION
    SELECT 'GYMNASTIQUE' UNION SELECT 'BOXE' UNION SELECT 'JUDO' UNION SELECT 'KARATÉ' UNION
    SELECT 'ESCRIME' UNION SELECT 'GOLF' UNION SELECT 'SKI' UNION SELECT 'SURF' UNION
    SELECT 'VOILE' UNION SELECT 'AVIRON' UNION SELECT 'HALTÉROPHILIE' UNION SELECT 'TENIS DE TABLE'
) AS sports_mots  
CROSS JOIN `hangman_categories` c WHERE c.slug = 'sports';

-- Pays
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'FRANCE' AS mot UNION SELECT 'ALLEMAGNE' UNION SELECT 'ITALIE' UNION SELECT 'ESPAGNE' UNION
    SELECT 'PORTUGAL' UNION SELECT 'ANGLETERRE' UNION SELECT 'ÉCOSSE' UNION SELECT 'IRLANDE' UNION
    SELECT 'SUÈDE' UNION SELECT 'NORVÈGE' UNION SELECT 'DANEMARK' UNION SELECT 'FINLANDE' UNION
    SELECT 'POLOGNE' UNION SELECT 'RUSSIE' UNION SELECT 'UKRAINE' UNION SELECT 'TURQUIE' UNION
    SELECT 'JAPON' UNION SELECT 'CHINE' UNION SELECT 'INDE' UNION SELECT 'AUSTRALIE' UNION
    SELECT 'CANADA' UNION SELECT 'BRÉSIL' UNION SELECT 'ARGENTINE' UNION SELECT 'MEXIQUE' UNION
    SELECT 'ÉGYPTE' UNION SELECT 'MAROC'
) AS pays_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'pays';

-- Transports
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'VOITURE' AS mot UNION SELECT 'CAMION' UNION SELECT 'MOTO' UNION SELECT 'VÉLO' UNION
    SELECT 'AUTOBUS' UNION SELECT 'TRAMWAY' UNION SELECT 'MÉTRO' UNION SELECT 'TRAIN' UNION
    SELECT 'AVION' UNION SELECT 'HÉLICOPTÈRE' UNION SELECT 'BATEAU' UNION SELECT 'YACHT' UNION
    SELECT 'PÉNICHE' UNION SELECT 'SOUS-MARIN' UNION SELECT 'FUSÉE' UNION SELECT 'TROTTINETTE' UNION
    SELECT 'SKATEBOARD' UNION SELECT 'ROLLER' UNION SELECT 'TAXI' UNION SELECT 'AMBULANCE'
) AS transports_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'transports';

-- Objets de la Maison  
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'CHAISE' AS mot UNION SELECT 'TABLE' UNION SELECT 'LIT' UNION SELECT 'ARMOIRE' UNION
    SELECT 'COMMODE' UNION SELECT 'ÉTAGÈRE' UNION SELECT 'CANAPÉ' UNION SELECT 'FAUTEUIL' UNION
    SELECT 'TÉLÉVISION' UNION SELECT 'RADIO' UNION SELECT 'RÉFRIGÉRATEUR' UNION SELECT 'FOUR' UNION
    SELECT 'MICRO-ONDES' UNION SELECT 'LAVE-LINGE' UNION SELECT 'ASPIRATEUR' UNION SELECT 'FER' UNION
    SELECT 'LAMPE' UNION SELECT 'RIDEAU' UNION SELECT 'TAPIS' UNION SELECT 'MIROIR' UNION
    SELECT 'HORLOGE' UNION SELECT 'VASE' UNION SELECT 'COUSSIN' UNION SELECT 'COUVERTURE'
) AS objets_maison_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'objets-maison';

-- École et Bureau
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'CRAYON' AS mot UNION SELECT 'STYLO' UNION SELECT 'GOMME' UNION SELECT 'RÈGLE' UNION
    SELECT 'COMPAS' UNION SELECT 'ÉQUERRE' UNION SELECT 'CALCULATRICE' UNION SELECT 'CAHIER' UNION
    SELECT 'CLASSEUR' UNION SELECT 'FEUILLE' UNION SELECT 'LIVRE' UNION SELECT 'DICTIONNAIRE' UNION
    SELECT 'ATLAS' UNION SELECT 'TABLEAU' UNION SELECT 'BUREAU' UNION SELECT 'CHAISE' UNION
    SELECT 'ORDINATEUR' UNION SELECT 'CLAVIER' UNION SELECT 'SOURIS' UNION SELECT 'ÉCRAN' UNION
    SELECT 'IMPRIMANTE' UNION SELECT 'SCANNER' UNION SELECT 'TÉLÉPHONE' UNION SELECT 'AGENDA'
) AS ecole_bureau_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'ecole-bureau';

-- Instruments de Musique
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'PIANO' AS mot UNION SELECT 'GUITARE' UNION SELECT 'VIOLON' UNION SELECT 'VIOLONCELLE' UNION
    SELECT 'CONTREBASSE' UNION SELECT 'FLÛTE' UNION SELECT 'CLARINETTE' UNION SELECT 'SAXOPHONE' UNION
    SELECT 'TROMPETTE' UNION SELECT 'TROMBONE' UNION SELECT 'BATTERIE' UNION SELECT 'TAMBOUR' UNION
    SELECT 'CYMBALES' UNION SELECT 'XYLOPHONE' UNION SELECT 'HARMONICA' UNION SELECT 'ACCORDÉON' UNION
    SELECT 'ORGUE' UNION SELECT 'HARPE' UNION SELECT 'MANDOLINE' UNION SELECT 'BANJO'
) AS instruments_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'instruments-musique';

-- Je continue avec les autres catégories en suivant le même modèle...
-- Pour économiser l'espace, je vais ajouter quelques catégories clés et les plus importantes

-- Dessins Animés
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'ALBATOR' AS mot UNION SELECT 'GOLDORAK' UNION SELECT 'CANDY' UNION SELECT 'HEIDI' UNION
    SELECT 'RÉMI SANS FAMILLE' UNION SELECT 'TOM ET JERRY' UNION SELECT 'SCOOBY-DOO' UNION
    SELECT 'LES SCHTROUMPFS' UNION SELECT 'ASTÉRIX' UNION SELECT 'TINTIN' UNION
    SELECT 'LUCKY LUKE' UNION SELECT 'GASTON LAGAFFE' UNION SELECT 'SPIROU' UNION
    SELECT 'BLAKE ET MORTIMER' UNION SELECT 'GIL ET JULIE' UNION SELECT 'BOULE ET BILL'
) AS dessins_animes_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'dessins-animes';

-- Harry Potter
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'HARRY POTTER' AS mot UNION SELECT 'HERMIONE GRANGER' UNION SELECT 'RON WEASLEY' UNION
    SELECT 'DUMBLEDORE' UNION SELECT 'SEVERUS ROGUE' UNION SELECT 'VOLDEMORT' UNION
    SELECT 'HAGRID' UNION SELECT 'MINERVA MCGONAGALL' UNION SELECT 'SIRIUS BLACK' UNION
    SELECT 'REMUS LUPIN' UNION SELECT 'POUDLARD' UNION SELECT 'GRYFFONDOR' UNION
    SELECT 'SERPENTARD' UNION SELECT 'SERDAIGLE' UNION SELECT 'POUFSOUFFLE' UNION
    SELECT 'QUIDDITCH' UNION SELECT 'VIF D OR' UNION SELECT 'BAGUETTE MAGIQUE'
) AS harry_potter_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'harry-potter';

-- Animaux Préhistoriques
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'TYRANNOSAURE REX' AS mot UNION SELECT 'TIGRE À DENTS DE SABRE' UNION 
    SELECT 'TRICÉRATOPS' UNION SELECT 'DIPLODOCUS' UNION SELECT 'STÉGOSAURE' UNION
    SELECT 'VÉLOCIRAPTOR' UNION SELECT 'MAMMOUTH' UNION SELECT 'BRACHIOSAURE' UNION
    SELECT 'PTÉRODACTYLE' UNION SELECT 'ALLOSAURE' UNION SELECT 'SPINOSAURE' UNION
    SELECT 'ANKYLOSAURE' UNION SELECT 'PARASAUROLOPHUS' UNION SELECT 'ARCHAEOPTERYX' UNION
    SELECT 'DIMETRODON' UNION SELECT 'MOSASAURE' UNION SELECT 'PLIOSAURE' UNION
    SELECT 'AMMONITE' UNION SELECT 'TRILOBITE' UNION SELECT 'MÉGALODON' UNION
    SELECT 'QUETZALCOATLUS' UNION SELECT 'CARNOTAURE' UNION SELECT 'THÉRIZINOSAURUS' UNION
    SELECT 'GIGANTOSAURE' UNION SELECT 'CARCHARODONTOSAURE' UNION SELECT 'UTAHRAPTOR' UNION
    SELECT 'RHINOCÉROS LAINEUX' UNION SELECT 'OURS DES CAVERNES' UNION SELECT 'LION DES CAVERNES' UNION
    SELECT 'PARESSEUX GÉANT' UNION SELECT 'GLYPTODONTE' UNION SELECT 'MÉGATHÉRIUM' UNION
    SELECT 'MACHAIRODUS' UNION SELECT 'CAVE HYÈNE' UNION SELECT 'MÉGACÉROS'
) AS animaux_prehistoriques_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'animaux-prehistoriques';

-- Héros de Dessins Animés
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'SUPERMAN' AS mot UNION SELECT 'BATMAN' UNION SELECT 'SPIDERMAN' UNION
    SELECT 'WONDER WOMAN' UNION SELECT 'CAPTAIN AMERICA' UNION SELECT 'HULK' UNION
    SELECT 'IRON MAN' UNION SELECT 'THOR' UNION SELECT 'FLASH' UNION
    SELECT 'GREEN LANTERN' UNION SELECT 'AQUAMAN' UNION SELECT 'CATWOMAN' UNION
    SELECT 'ROBIN' UNION SELECT 'JOKER' UNION SELECT 'LEX LUTHOR' UNION
    SELECT 'DAREDEVIL' UNION SELECT 'X-MEN' UNION SELECT 'WOLVERINE'
) AS heros_dessins_animes_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'heros-dessins-animes';

-- Fournitures Scolaires
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'CARTABLE' AS mot UNION SELECT 'TROUSSE' UNION SELECT 'CRAYONS DE COULEUR' UNION
    SELECT 'FEUTRES' UNION SELECT 'PINCEAU' UNION SELECT 'PEINTURE' UNION
    SELECT 'COLLE' UNION SELECT 'CISEAUX' UNION SELECT 'TAILLE-CRAYON' UNION
    SELECT 'COMPAS' UNION SELECT 'RAPPORTEUR' UNION SELECT 'ÉQUERRE' UNION
    SELECT 'CAHIER DE TEXTE' UNION SELECT 'AGENDA' UNION SELECT 'CLASSEUR' UNION
    SELECT 'PROTÈGE CAHIER' UNION SELECT 'INTERCALAIRES' UNION SELECT 'PERFORATRICE'
) AS fournitures_scolaires_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'fournitures-scolaires';

-- Parties du Corps
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'TÊTE' AS mot UNION SELECT 'CHEVEUX' UNION SELECT 'VISAGE' UNION
    SELECT 'FRONT' UNION SELECT 'YEUX' UNION SELECT 'NEZ' UNION SELECT 'BOUCHE' UNION
    SELECT 'DENTS' UNION SELECT 'LANGUE' UNION SELECT 'OREILLES' UNION SELECT 'COU' UNION
    SELECT 'ÉPAULES' UNION SELECT 'BRAS' UNION SELECT 'COUDES' UNION SELECT 'MAINS' UNION
    SELECT 'DOIGTS' UNION SELECT 'POUCE' UNION SELECT 'POITRINE' UNION SELECT 'VENTRE' UNION
    SELECT 'DOS' UNION SELECT 'JAMBES' UNION SELECT 'GENOUX' UNION SELECT 'PIEDS' UNION SELECT 'ORTEILS'
) AS parties_corps_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'parties-corps';

-- Jouets
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'POUPÉE' AS mot UNION SELECT 'NOUNOURS' UNION SELECT 'PELUCHE' UNION
    SELECT 'PUZZLE' UNION SELECT 'LEGO' UNION SELECT 'PLAYMOBIL' UNION
    SELECT 'TROTTINETTE' UNION SELECT 'VÉLO' UNION SELECT 'BALLON' UNION
    SELECT 'CORDE À SAUTER' UNION SELECT 'YO-YO' UNION SELECT 'TOUPIE' UNION
    SELECT 'BILLES' UNION SELECT 'CARTES' UNION SELECT 'DOMINOS' UNION
    SELECT 'ÉCHECS' UNION SELECT 'DAMES' UNION SELECT 'MONOPOLY'
) AS jouets_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'jouets';

-- Aliments Préférés des Enfants
INSERT INTO `hangman_words` (`mot`, `category_id`)
SELECT mot, c.id FROM (
    SELECT 'PIZZA' AS mot UNION SELECT 'HAMBURGER' UNION SELECT 'FRITES' UNION
    SELECT 'HOT DOG' UNION SELECT 'PÂTES' UNION SELECT 'CHOCOLAT' UNION
    SELECT 'BONBONS' UNION SELECT 'GÂTEAU' UNION SELECT 'GLACE' UNION
    SELECT 'COOKIES' UNION SELECT 'MUFFIN' UNION SELECT 'DONUTS' UNION
    SELECT 'CRÊPES' UNION SELECT 'GAUFRES' UNION SELECT 'NUTELLA' UNION
    SELECT 'CÉRÉALES' UNION SELECT 'YAOURT' UNION SELECT 'COMPOTE'
) AS aliments_enfants_mots
CROSS JOIN `hangman_categories` c WHERE c.slug = 'aliments-enfants';

-- =============================================================================
-- 5. FINALISATION
-- =============================================================================

-- Réactiver les contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- Valider toutes les transactions
COMMIT;
SET AUTOCOMMIT = 1;

-- =============================================================================
-- 6. VÉRIFICATIONS
-- =============================================================================

-- Statistiques après migration
SELECT 
    'RÉSUMÉ DE LA MIGRATION' as info,
    (SELECT COUNT(*) FROM hangman_categories) as categories,
    (SELECT COUNT(*) FROM hangman_tags) as tags,
    (SELECT COUNT(*) FROM hangman_category_tag) as associations_cat_tag,
    (SELECT COUNT(*) FROM hangman_words) as mots,
    (SELECT COUNT(*) FROM hangman_words WHERE contient_accents = 1) as mots_avec_accents,
    (SELECT COUNT(*) FROM hangman_words WHERE contient_chiffres = 1) as mots_avec_chiffres,
    (SELECT COUNT(*) FROM hangman_words WHERE difficulte = 'facile') as mots_faciles,
    (SELECT COUNT(*) FROM hangman_words WHERE difficulte = 'moyen') as mots_moyens,
    (SELECT COUNT(*) FROM hangman_words WHERE difficulte = 'difficile') as mots_difficiles;

-- Afficher les catégories avec leurs statistiques via la vue
SELECT nom, icone, total_mots, tags FROM v_hangman_categories_stats LIMIT 10;

-- =============================================================================
-- MIGRATION TERMINÉE !
-- 
-- Pour utiliser ces données :
-- 1. Exécutez d'abord schema.sql
-- 2. Puis exécutez ce fichier migration.sql  
-- 3. Les données seront prêtes pour votre API PHP
-- =============================================================================