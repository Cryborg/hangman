-- Migration pour ajouter les niveaux de difficulté aux mots existants
-- Version: 2024-08-07
-- Auteur: Classification automatique basée sur la complexité des mots

-- La colonne difficulty existe déjà dans hangman_words
-- Mise à jour directe des valeurs existantes

-- ===========================================
-- MISE À JOUR DES NIVEAUX DE DIFFICULTÉ
-- ===========================================

-- ANIMAUX
-- Easy: mots simples, familiers pour enfants
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'CHIEN', 'CHEVAL', 'VACHE', 'COCHON', 'MOUTON', 'POULE', 'CANARD', 'LAPIN', 'SOURIS', 'TIGRE'
);

-- Medium: animaux plus exotiques, moyennement complexes
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ÉLÉPHANT', 'GIRAFE', 'ZÈBRE', 'RENARD', 'SINGE', 'DAUPHIN', 'BALEINE', 'REQUIN', 'AIGLE', 'CORBEAU', 'HIBOU', 'SERPENT', 'TORTUE'
);

-- Hard: mots longs ou très complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'KANGOUROU', 'GRENOUILLE', 'PAPILLON'
);

-- FRUITS ET LÉGUMES
-- Easy: fruits et légumes très communs
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'POMME', 'BANANE', 'ORANGE', 'FRAISE', 'CERISE', 'RAISIN', 'POIRE', 'PÊCHE', 'PRUNE', 'CAROTTE', 'TOMATE', 'SALADE', 'RADIS', 'OIGNON', 'CITRON'
);

-- Medium: légumes moins familiers, plus longs
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ANANAS', 'COURGETTE', 'AUBERGINE', 'POIVRON', 'CONCOMBRE', 'BROCOLI', 'ÉPINARD', 'HARICOT', 'AVOCAT'
);

-- Hard: mots composés ou très longs
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'POMME DE TERRE', 'PETIT POIS', 'CHAMPIGNON'
);

-- MÉTIERS
-- Easy: métiers très connus des enfants
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'MÉDECIN', 'POLICIER', 'POMPIER', 'CUISINIER', 'PILOTE', 'VENDEUR', 'ACTEUR', 'FERMIER'
);

-- Medium: métiers courants mais moyennement complexes
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'PROFESSEUR', 'BOULANGER', 'COIFFEUR', 'DENTISTE', 'AVOCAT', 'MENUISIER', 'PLOMBIER', 'JARDINIER', 'CHAUFFEUR', 'INFIRMIER', 'BANQUIER', 'MUSICIEN', 'SECRÉTAIRE'
);

-- Hard: métiers spécialisés, mots longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ÉLECTRICIEN', 'COMPTABLE', 'INGÉNIEUR', 'ARCHITECTE', 'PHOTOGRAPHE', 'JOURNALISTE', 'VÉTÉRINAIRE', 'PHARMACIEN'
);

-- OBJETS DU QUOTIDIEN
-- Easy: objets très familiers et courts
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'LIVRE', 'STYLO', 'CHAISE', 'TABLE', 'LAMPE', 'MIROIR', 'BROSSE', 'PEIGNE', 'SAVON', 'VERRE', 'MONTRE'
);

-- Medium: objets courants de longueur moyenne
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'TÉLÉPHONE', 'VOITURE', 'HORLOGE', 'SERVIETTE', 'COUTEAU', 'FOURCHETTE', 'ASSIETTE', 'BOUTEILLE', 'CHAUSSURE', 'PANTALON', 'CHEMISE', 'CHAPEAU', 'LUNETTES', 'PARAPLUIE'
);

-- Hard: objets technologiques complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ORDINATEUR', 'TÉLÉVISION'
);

-- SPORTS
-- Easy: sports très populaires et simples
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'FOOTBALL', 'TENNIS', 'COURSE', 'BOXE', 'RUGBY', 'HOCKEY', 'DANSE'
);

-- Medium: sports moins populaires ou plus longs
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'BASKETBALL', 'VOLLEYBALL', 'NATATION', 'CYCLISME', 'KARATE', 'BASEBALL', 'BADMINTON', 'ESCALADE', 'MARATHON', 'PLONGÉE', 'VOILE', 'ESCRIME'
);

-- Hard: sports avec mots composés ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'PING PONG', 'ÉQUITATION', 'GYMNASTIQUE', 'MUSCULATION', 'TRIATHLON'
);

-- PAYS
-- Easy: pays très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'FRANCE', 'ESPAGNE', 'ITALIE', 'CHINE', 'JAPON', 'RUSSIE', 'GRÈCE'
);

-- Medium: pays moyennement connus
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ALLEMAGNE', 'ANGLETERRE', 'PORTUGAL', 'SUISSE', 'BELGIQUE', 'CANADA', 'BRÉSIL', 'ARGENTINE', 'AUSTRALIE', 'EGYPTE', 'MAROC', 'MEXIQUE', 'NORVÈGE', 'SUÈDE', 'DANEMARK', 'POLOGNE', 'TURQUIE', 'ISRAEL', 'CHILI', 'COLOMBIE'
);

-- Hard: pays avec tirets
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ÉTATS-UNIS'
);

-- COULEURS
-- Easy: couleurs primaires et basiques
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'ROUGE', 'JAUNE', 'ORANGE', 'VIOLET', 'BLANC', 'MARRON'
);

-- Medium: couleurs moins communes
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'BEIGE', 'BORDEAUX', 'TURQUOISE', 'INDIGO', 'MAGENTA', 'BRONZE', 'CORAIL', 'SAUMON', 'LAVANDE'
);

-- Hard: couleurs sophistiquées avec accents
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ARGENTÉ', 'POURPRE', 'ÉCARLATE', 'VERMILLON', 'ÉMERAUDE', 'AMBRE'
);

-- VÉHICULES
-- Easy: véhicules très courants
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'VOITURE', 'TRAIN', 'AVION', 'BATEAU', 'CAMION', 'SCOOTER'
);

-- Medium: véhicules moins courants
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'TRAMWAY', 'AMBULANCE', 'FUSÉE', 'VOILIER', 'CAMIONNETTE', 'TRACTEUR', 'FERRY', 'CANOË', 'KAYAK'
);

-- Hard: véhicules complexes ou mots composés
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'HÉLICOPTÈRE', 'SOUS-MARIN', 'BULLDOZER', 'PELLETEUSE', 'MONTGOLFIÈRE', 'PLANEUR', 'PAQUEBOT', 'PLANCHE A VOILE'
);

-- CHANTEURS ET CHANTEUSES
-- Easy: artistes très célèbres avec noms courts
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'MADONNA', 'ADELE', 'RIHANNA', 'PRINCE'
);

-- Medium: artistes célèbres avec noms moyens
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'MICHAEL JACKSON', 'ELVIS PRESLEY', 'BEYONCÉ', 'LADY GAGA', 'TAYLOR SWIFT', 'JUSTIN BIEBER', 'ED SHEERAN', 'BRUNO MARS', 'EMINEM', 'DRAKE', 'CÉLINE DION', 'TINA TURNER', 'STEVIE WONDER', 'DAVID BOWIE', 'ELTON JOHN', 'JOHNNY CASH', 'BOB DYLAN'
);

-- Hard: artistes avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ARIANA GRANDE', 'BILLIE EILISH', 'WHITNEY HOUSTON', 'MARIAH CAREY', 'BARBRA STREISAND', 'ARETHA FRANKLIN', 'FRANK SINATRA', 'RAY CHARLES'
);

-- GROUPES DE MUSIQUE
-- Easy: groupes très connus avec noms courts
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'QUEEN', 'ABBA', 'OASIS'
);

-- Medium: groupes célèbres
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'THE BEATLES', 'LED ZEPPELIN', 'PINK FLOYD', 'NIRVANA', 'METALLICA', 'COLDPLAY', 'RADIOHEAD', 'THE POLICE', 'DURAN DURAN', 'BEE GEES', 'THE EAGLES', 'THE DOORS', 'AEROSMITH', 'BON JOVI', 'THE CURE', 'PEARL JAM'
);

-- Hard: groupes avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'THE ROLLING STONES', 'AC/DC', 'GUNS N\' ROSES', 'DEPECHE MODE', 'FLEETWOOD MAC', 'BLACK SABBATH', 'IRON MAIDEN', 'DEEP PURPLE', 'RED HOT CHILI PEPPERS'
);

-- ACTEURS ET ACTRICES
-- Easy: acteurs très célèbres avec noms simples
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'TOM CRUISE', 'BRAD PITT', 'WILL SMITH', 'JOHNNY DEPP', 'BRUCE WILLIS', 'GIBSON', 'MATT DAMON', 'AFFLECK'
);

-- Medium: acteurs célèbres
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'LEONARDO DICAPRIO', 'ROBERT DE NIRO', 'MORGAN FREEMAN', 'DENZEL WASHINGTON', 'CLINT EASTWOOD', 'HARRISON FORD', 'SEAN CONNERY', 'KEVIN COSTNER', 'NICOLAS CAGE', 'JOHN TRAVOLTA', 'GEORGE CLOONEY', 'RYAN REYNOLDS', 'HUGH JACKMAN', 'CHRISTIAN BALE', 'RUSSELL CROWE', 'JACK NICHOLSON', 'JULIA ROBERTS', 'SANDRA BULLOCK', 'ANGELINA JOLIE', 'NICOLE KIDMAN', 'EMMA STONE'
);

-- Hard: acteurs avec noms très longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ARNOLD SCHWARZENEGGER', 'SYLVESTER STALLONE', 'ANTHONY HOPKINS', 'KEVIN SPACEY', 'DUSTIN HOFFMAN', 'MERYL STREEP', 'CHARLIZE THERON', 'CATE BLANCHETT', 'JENNIFER LAWRENCE', 'SCARLETT JOHANSSON'
);

-- DESSINS ANIMÉS 80s
-- Easy: personnages très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'CANDY', 'BATMAN', 'SUPERMAN', 'TINTIN', 'ASTERIX'
);

-- Medium: dessins animés populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'GOLDORAK', 'ALBATOR', 'DRAGON BALL', 'SAINT SEIYA', 'MAYA ABEILLE', 'HEIDI', 'CAPITAINE FLAM', 'NICKY LARSON', 'TRANSFORMERS', 'SPIDER-MAN', 'X-MEN', 'LUCKY LUKE', 'SPIROU'
);

-- Hard: titres longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'LES SCHTROUMPFS', 'INSPECTEUR GADGET', 'REMI SANS FAMILLE', 'KEN LE SURVIVANT', 'CHEVALIERS DU ZODIAQUE', 'TORTUES NINJA', 'GASTON LAGAFFE', 'BOULE ET BILL'
);

-- SÉRIES TV
-- Easy: séries très connues avec titres courts
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'MAGNUM', 'KOJAK', 'COLUMBO', 'DALLAS', 'FRIENDS'
);

-- Medium: séries populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'DYNASTIE', 'SANTA BARBARA', 'HART TO HART', 'MOONLIGHTING', 'MIAMI VICE', 'EQUALIZER', 'MACGYVER', 'KNIGHT RIDER', 'TEAM AMERICA', 'RICK HUNTER', 'DERRICK', 'JULIE LESCAUT', 'NAVARRO', 'MAIGRET', 'COLOMBA', 'SEINFELD', 'CHEERS', 'FRASIER'
);

-- Hard: séries avec titres longs
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'SHERLOCK HOLMES', 'COMMISSAIRE MOULIN', 'FAMILY TIES'
);

-- FILMS CULTES
-- Easy: films très connus avec titres simples
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'GREMLINS', 'RAMBO', 'ROCKY', 'ALIEN', 'MATRIX', 'STAR WARS', 'JAWS', 'ET', 'SUPERMAN', 'BATMAN', 'SPIDER-MAN', 'X-MEN'
);

-- Medium: films populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'GHOSTBUSTERS', 'INDIANA JONES', 'KARATE KID', 'TOP GUN', 'TERMINATOR', 'PREDATOR', 'ROBOCOP', 'JURASSIC PARK', 'DIE HARD'
);

-- Hard: films avec titres longs
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'RETOUR VERS LE FUTUR', 'BLADE RUNNER', 'CLOSE ENCOUNTERS', 'LETHAL WEAPON', 'BEVERLY HILLS COP'
);

-- JEUX DE SOCIÉTÉ
-- Easy: jeux très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'MONOPOLY', 'SCRABBLE', 'CLUEDO', 'RISK', 'POKER', 'BELOTE', 'TAROT', 'UNO', 'MORPION'
);

-- Medium: jeux moyennement connus
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'PICTIONARY', 'YAHTZEE', 'STRATEGO', 'MASTERMIND', 'BACKGAMMON', 'DAMES', 'ECHECS', 'BRIDGE', 'RAMI', 'DESTIN'
);

-- Hard: jeux avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'TRIVIAL PURSUIT', 'BATAILLE NAVALE', 'PUISSANCE QUATRE', 'MILLE BORNES', 'BONNE PAYE', 'JEU DE OIE', 'PETITS CHEVAUX'
);

-- JEUX VIDÉO
-- Easy: jeux très connus avec noms courts
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'PACMAN', 'TETRIS', 'SONIC', 'ZELDA'
);

-- Medium: jeux populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ASTEROIDS', 'DONKEY KONG', 'CENTIPEDE', 'FROGGER', 'DEFENDER', 'TEKKEN', 'METROID', 'MINECRAFT'
);

-- Hard: jeux avec titres longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'SUPER MARIO BROS', 'MARIO KART 8', 'SPACE INVADERS', 'MISSILE COMMAND', 'PRINCE OF PERSIA', 'STREET FIGHTER', 'MORTAL KOMBAT', 'FINAL FANTASY', 'DRAGON QUEST', 'CASTLEVANIA'
);

-- INSTRUMENTS DE MUSIQUE
-- Easy: instruments très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'GUITARE', 'PIANO', 'BATTERIE', 'VIOLON', 'FLÛTE', 'HARPE', 'ORGUE', 'BANJO'
);

-- Medium: instruments moins communs
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'SAXOPHONE', 'TROMPETTE', 'CLARINETTE', 'ACCORDÉON', 'HARMONICA', 'MANDOLINE', 'TROMBONE', 'HAUTBOIS', 'BASSON', 'PICCOLO', 'XYLOPHONE', 'TAMBOURIN', 'TRIANGLE'
);

-- Hard: instruments avec noms complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'GUITARE BASSE', 'CONTREBASSE', 'VIOLONCELLE'
);

-- FLEURS
-- Easy: fleurs très communes
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'TULIPE', 'ROSE', 'LILAS', 'VIOLETTE'
);

-- Medium: fleurs moyennement connues
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'MARGUERITE', 'ORCHIDÉE', 'TOURNESOL', 'PIVOINE', 'DAHLIA', 'BEGONIA', 'GÉRANIUM', 'PETUNIE', 'PENSÉE', 'JONQUILLE', 'NARCISSE', 'JACINTHE', 'CROCUS', 'FREESIA', 'ASTER', 'ZINNIA', 'SOUCI', 'CAPUCINE', 'IMPATIENS'
);

-- Hard: fleurs avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'GLADIEUL', 'CHRYSANTHÈME'
);

-- MONUMENTS
-- Easy: monuments très célèbres
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'TOUR EIFFEL', 'COLISÉE', 'BIG BEN'
);

-- Medium: monuments connus
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'TOUR DE PISE', 'TAJ MAHAL', 'TOWER BRIDGE', 'SAGRADA FAMILIA', 'ALHAMBRA', 'ACROPOLE', 'PARTHÉNON', 'MACHU PICCHU', 'ANGKOR VAT', 'PETRA', 'STONEHENGE', 'MONT RUSHMORE', 'OPERA DE SYDNEY', 'BURJ KHALIFA', 'GOLDEN GATE', 'PONT DU GARD', 'ARC DE TRIOMPHE'
);

-- Hard: monuments avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'STATUE DE LA LIBERTÉ', 'PYRAMIDES DE GIZEH', 'NOTRE-DAME DE PARIS', 'CHRIST RÉDEMPTEUR', 'CHÂTEAU DE VERSAILLES', 'PALAIS DU LOUVRE'
);

-- VILLES
-- Easy: villes très connues
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'PARIS', 'LONDRES', 'NEW YORK', 'TOKYO', 'SYDNEY', 'ROME', 'MADRID', 'BERLIN', 'MOSCOU'
);

-- Medium: villes moyennement connues
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'BARCELONE', 'AMSTERDAM', 'VIENNE', 'PRAGUE', 'BUDAPEST', 'VARSOVIE', 'STOCKHOLM', 'COPENHAGUE', 'HELSINKI', 'LISBONNE', 'ATHÈNES', 'ISTANBUL', 'MONTRÉAL', 'TORONTO', 'VANCOUVER'
);

-- Hard: villes avec noms longs
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'SAINT PETERSBOURG'
);

-- PIÈCES DE LA MAISON
-- Easy: pièces très communes
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'CUISINE', 'SALON', 'CHAMBRE', 'GARAGE', 'GRENIER', 'CAVE', 'BUREAU', 'ENTRÉE', 'COULOIR', 'ESCALIER', 'BALCON', 'TERRASSE', 'JARDIN'
);

-- Medium: pièces moins communes
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'SALLE DE BAIN', 'SALLE À MANGER', 'VERANDA', 'BUANDERIE', 'DRESSING', 'SALLE DE JEUX', 'ATELIER', 'CELLIER', 'VESTIBULE', 'BOUDOIR'
);

-- Hard: pièces avec noms composés longs
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'BIBLIOTHÈQUE', 'GARDE-MANGER'
);

-- FILMS CLASSIQUES DISNEY
-- Easy: films Disney très connus avec titres courts
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'DUMBO', 'BAMBI', 'CENDRILLON', 'PETER PAN', 'ALADDIN', 'MULAN', 'TARZAN', 'HERCULE'
);

-- Medium: films Disney populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'BLANCHE-NEIGE', 'PINOCCHIO', 'FANTASIA', 'LA BELLE ET LA BÊTE', 'LE ROI LION', 'POCAHONTAS', 'DINOSAURE', 'VAIANA', 'ENCANTO'
);

-- Hard: films Disney avec titres très longs
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ALICE AU PAYS DES MERVEILLES', 'LA BELLE ET LE CLOCHARD', 'LA BELLE AU BOIS DORMANT', 'LES 101 DALMATIENS', 'MERLIN L\'ENCHANTEUR', 'LE LIVRE DE LA JUNGLE', 'LES ARISTOCHATS', 'ROBIN DES BOIS', 'LES AVENTURES DE WINNIE L\'OURSON', 'LES AVENTURES DE BERNARD ET BIANCA', 'ROX ET ROUKY', 'TARAM ET LE CHAUDRON MAGIQUE', 'BASIL DETECTIVE PRIVÉ', 'OLIVER ET COMPAGNIE', 'LA PETITE SIRÈNE', 'BERNARD ET BIANCA AU PAYS DES KANGOUROUS', 'LE BOSSU DE NOTRE-DAME', 'FANTASIA 2000', 'KUZCO L\'EMPEREUR MÉGALO', 'ATLANTIDE L\'EMPIRE PERDU', 'LILO ET STITCH', 'LA PLANÈTE AU TRÉSOR', 'FRÈRE DES OURS', 'LA FERME SE REBELLE', 'CHICKEN LITTLE', 'BIENVENUE CHEZ LES ROBINSON', 'VOLT STAR MALGRÉ LUI', 'LA PRINCESSE ET LA GRENOUILLE', 'RAIPONCE', 'WINNIE L\'OURSON', 'LES MONDES DE RALPH', 'LA REINE DES NEIGES', 'LES NOUVEAUX HÉROS', 'ZOOTOPIE', 'RALPH 2.0', 'LA REINE DES NEIGES 2', 'RAYA ET LE DERNIER DRAGON', 'AVALONIA L\'ÉTRANGE VOYAGE', 'ASHA ET LA BONNE ÉTOILE'
);

-- L'UNIVERS DE PIXAR
-- Easy: films Pixar très connus avec titres courts
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'TOY STORY', 'CARS', 'WALL-E', 'LÀ-HAUT', 'COCO', 'LUCA', 'WOODY', 'NEMO', 'DORY'
);

-- Medium: films et personnages Pixar populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'MONSTRES ET CIE', 'LE MONDE DE NÉMO', 'LE MONDE DE DORY', 'LES INDESTRUCTIBLES', 'RATATOUILLE', 'REBELLE', 'VICE-VERSA', 'LE VOYAGE D\'ARLO', 'EN AVANT', 'SOUL', 'ALERTE ROUGE', 'ÉLÉMENTAIRE', 'JESSIE', 'REX', 'SULLY', 'MARIN', 'REMY', 'CARL FREDRICKSEN', 'RUSSELL', 'BOB PARR', 'HELEN PARR', 'MERIDA', 'JOIE', 'TRISTESSE', 'COLÈRE', 'PEUR', 'ARLO', 'SPOT', 'MIGUEL', 'HECTOR', 'JOE GARDNER'
);

-- Hard: titres et personnages Pixar complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'MONSTRES ACADEMY', 'BUZZ L\'ÉCLAIR', 'M. PATATE', 'BAYONNE', 'PILE-POIL', 'ZIG-ZAG', 'BOB RAZOWSKI', 'FLASH MCQUEEN', 'MARTIN', 'SALLY', 'DOC HUDSON', 'LINGUINI', 'VIOLETTE PARR', 'FLECHE PARR', 'JACK-JACK PARR', 'FROZONE', 'EDNA MODE', 'DÉGOUT', 'BING BONG'
);

-- PERSONNAGES DISNEY
-- Easy: personnages Disney très célèbres
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'MICKEY MOUSE', 'MINNIE MOUSE', 'DONALD DUCK', 'DINGO', 'PLUTO', 'SIMBA', 'ELSA', 'ANNA', 'OLAF'
);

-- Medium: personnages Disney populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'BLANCHE-NEIGE', 'CENDRILLON', 'BELLE', 'ARIEL', 'JASMINE', 'MULAN', 'POCAHONTAS', 'RAIPONCE', 'VAIANA', 'PINOCCHIO', 'MUFASA', 'TIMON', 'PUMBAA', 'SCAR', 'BALOO', 'MOWGLI', 'BAGHEERA', 'ALADIN', 'JAFAR', 'WOODY', 'REMY', 'NEMO', 'DORY', 'SULLY', 'KRISTOFF', 'SVEN', 'HANS', 'STITCH', 'WALL-E', 'EVE', 'MIGUEL', 'HECTOR', 'DANTE', 'MAUI', 'PUA', 'HEI HEI'
);

-- Hard: personnages Disney avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'JIMINY CRICKET', 'GENIE', 'BUZZ L\'ÉCLAIR', 'FLASH MCQUEEN', 'BOB RAZOWSKI', 'CARL FREDRICKSEN', 'RUSSELL', 'BOB PARR', 'HELEN PARR', 'VIOLETTE PARR', 'FLECHE PARR'
);

-- APPAREILS ÉLECTROMÉNAGER
-- Easy: appareils très courants
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'FOUR', 'ASPIRATEUR', 'CAFETIÈRE', 'BOUILLOIRE', 'VENTILATEUR', 'RADIATEUR'
);

-- Medium: appareils moyennement courants
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'LAVE LINGE', 'LAVE VAISSELLE', 'RÉFRIGÉRATEUR', 'CONGÉLATEUR', 'MICRO-ONDES', 'SÈCHE-LINGE', 'GRILLE-PAIN', 'MIXEUR', 'CENTRIFUGEUSE', 'RICE COOKER', 'FRITEUSE', 'PLANCHA', 'BARBECUE', 'CLIMATISEUR', 'HUMIDIFICATEUR', 'PURIFICATEUR', 'FER A REPASSER', 'STEAMER'
);

-- Hard: appareils spécialisés
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'ROBOT MÉNAGER', 'NETTOYEUR VAPEUR'
);

-- PERSONNAGES HARRY POTTER
-- Easy: personnages principaux très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'HARRY POTTER', 'HERMIONE GRANGER', 'RON WEASLEY', 'HAGRID', 'VOLDEMORT', 'DOBBY', 'HEDWIGE'
);

-- Medium: personnages populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ALBUS DUMBLEDORE', 'SEVERUS ROGUE', 'SIRIUS BLACK', 'REMUS LUPIN', 'DRAGO MALEFOY', 'GINNY WEASLEY', 'NEVILLE LONDUBAT', 'LUNA LOVEGOOD', 'ARTHUR WEASLEY', 'MOLLY WEASLEY', 'FRED WEASLEY', 'GEORGE WEASLEY', 'PERCY WEASLEY', 'CHARLIE WEASLEY', 'BILL WEASLEY', 'CEDRIC DIGGORY', 'CHO CHANG', 'OLIVIER DUBOIS', 'KATIE BELL', 'LEE JORDAN', 'COLIN CREEVEY', 'FLEUR DELACOUR', 'VIKTOR KRUM', 'HANNAH ABBOTT', 'ERNIE MACMILLAN', 'SUSAN BONES', 'BLAISE ZABINI', 'PANSY PARKINSON', 'VINCENT CRABBE', 'GREGORY GOYLE', 'ROGER DAVIES', 'MICHAEL CORNER', 'TERRY BOOT', 'LISA TURPIN', 'MARCUS FLINT', 'ROMILDA VANE', 'PETER PETTIGROW', 'KREATTUR', 'BUCK', 'ARAGOG', 'FUMSECK', 'TOUFFU'
);

-- Hard: personnages avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'RUBEUS HAGRID', 'MINERVA MCGONAGALL', 'BELLATRIX LESTRANGE', 'LUCIUS MALEFOY', 'NARCISSA MALEFOY', 'LAVANDE BROWN', 'PARVATI PATIL', 'PADMA PATIL', 'SEAMUS FINNIGAN', 'DEAN THOMAS', 'ALICIA SPINNET', 'ANGELINA JOHNSON', 'DENNIS CREEVEY', 'GILDEROY LOCKHART', 'QUIRINUS QUIRRELL', 'DOLORES OMBRAGE', 'NYMPHADORA TONKS', 'KINGSLEY SHACKLEBOLT', 'ALASTOR MAUGREY', 'BARTY CROUPTON', 'CORNELIUS FUDGE', 'RUFUS SCRIMGEOUR', 'JUSTIN FINCH FLETCHLEY', 'ZACHARIAS SMITH', 'MILLICENT BULSTRODE', 'THEODORE NOTT', 'DAPHNE GREENGRASS', 'ANTHONY GOLDSTEIN', 'MANDY BROCKLEHURST', 'PENELOPE CLEARWATER', 'CORMAC MCLAGGEN', 'FENRIR GREYBACK', 'NORBERT DRAGONNEAU'
);

-- LIEUX HARRY POTTER
-- Easy: lieux principaux très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'POUDLARD', 'GRINGOTTS', 'GRANDE SALLE', 'BIBLIOTHÈQUE', 'TERRIER'
);

-- Medium: lieux moyennement connus
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'CHEMIN DE TRAVERSE', 'CHAUDRON BAVEUR', 'PRE-AU-LARD', 'FORÊT INTERDITE', 'SAULE COGNEUR', 'LAC NOIR', 'TOUR DE GRYFFONDOR', 'TOUR DE SERDAIGLE', 'BUREAU DE DUMBLEDORE', 'BUREAU DE MCGONAGALL', 'BUREAU DE ROGUE', 'SALLE SUR DEMANDE', 'CHAMBRE DES SECRETS', 'INFIRMERIE', 'SALLE COMMUNE', 'DORTOIR', 'TERRAIN DE QUIDDITCH', 'STADE DE QUIDDITCH', 'VESTIAIRES', 'SALLE DE CLASSE', 'DONJON', 'BUREAU DE HAGRID', 'CABANE DE HAGRID', 'POTAGER DE HAGRID', 'VOLIÈRE', 'MINISTÈRE DE LA MAGIE', 'ATRIUM', 'BUREAU DES AURORS', 'SALLE D\'AUDIENCE', 'GARAGE VOLANT', 'MAISON DES DURSLEY', 'MANOIR JÉDUSOR', 'ORPHELINAT', 'CIMETIÈRE DE GODRIC\'S HOLLOW', 'MANOIR DES MALEFOY', 'PRISON D\'AZKABAN'
);

-- Hard: lieux avec noms longs ou complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'VOIE 9¾', 'TÊTES BRÛLÉES', 'CABANE HURLANTE', 'CACHOTS DE SERPENTARD', 'SOUS SOL DE POUFSOUFFLE', 'SALLE DE BAIN DE MIMI GEIGNARDE', 'ESCALIERS MOUVANTS', 'PORTRAITS PARLANTS', 'ARMURE ENCHANTEE', 'TAPISSERIE', 'ENCLOS A CREATURES', 'DÉPARTEMENT DES MYSTÈRES', 'ASCENSEURS MAGIQUES', 'FONTAINE DE LA FRATERNITÉ MAGIQUE', '4 PRIVET DRIVE', 'PLACARD SOUS L\'ESCALIER', 'GROTTE DE L\'HORCRUXE', 'CABANE SUR LE ROCHER', 'GODRIC\'S HOLLOW'
);

-- ANIMAUX PRÉHISTORIQUES
-- Easy: dinosaures très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'TYRANNOSAURE REX', 'TRICÉRATOPS', 'STÉGOSAURE', 'DIPLODOCUS'
);

-- Medium: dinosaures populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'VÉLOCIRAPTOR', 'BRACHIOSAURE', 'PTÉRODACTYLE', 'MAMMOUTH LAINEUX', 'MASTODONTE', 'ALLOSAURE', 'SPINOSAURE', 'CARNOTAURE', 'GIGANTOSAURE', 'COMPSOGNATHUS', 'ANKYLOSAURE', 'IGUANODON', 'PARASAUROLOPHUS', 'DEINONYCHUS', 'UTAHRAPTOR', 'MOSASAURE', 'PLÉSIOSAURE', 'ICHTYOSAURE', 'DIMÉTRODON', 'MEGALODON', 'CAVE OURS', 'GLYPTODON', 'TERROR BIRD', 'DOEDICURUS', 'MACRAUCHENIA', 'SMILODON'
);

-- Hard: animaux préhistoriques avec noms complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'TIGRE À DENTS DE SABRE', 'QUETZALCOATLUS', 'ARCHÉOPTÉRYX', 'RHINOCÉROS LAINEUX', 'MÉGATHÉRIUM'
);

-- HÉROS DE DESSINS ANIMÉS
-- Easy: super-héros très connus
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'SPIDERMAN', 'BATMAN', 'SUPERMAN', 'HULK', 'THOR', 'FLASH', 'ROBIN'
);

-- Medium: super-héros populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'WONDER WOMAN', 'IRON MAN', 'CAPTAIN AMERICA', 'AQUAMAN', 'GREEN LANTERN', 'CAPTAIN MARVEL', 'BLACK PANTHER', 'WOLVERINE', 'X-MEN', 'DAREDEVIL', 'SPIDER-GIRL', 'BATGIRL', 'SUPERGIRL', 'GREEN ARROW', 'HAWKEYE', 'BLACK WIDOW', 'DOCTOR STRANGE', 'ANT-MAN', 'WASP', 'VISION', 'SCARLET WITCH', 'FALCON', 'WAR MACHINE', 'WINTER SOLDIER', 'STAR-LORD', 'GAMORA', 'GROOT', 'ROCKET RACCOON', 'DRAX'
);

-- Hard: super-héros avec noms complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'FANTASTIC FOUR'
);

-- OBJETS SCOLAIRES
-- Easy: fournitures très basiques
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'CRAYON', 'STYLO', 'FEUTRE', 'RÈGLE', 'GOMME', 'CAHIER', 'CARNET', 'FEUILLE', 'PAPIER', 'LIVRE', 'CHAISE', 'CRAIE'
);

-- Medium: fournitures moyennement communes
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ÉQUERRE', 'COMPAS', 'TAILLE-CRAYON', 'CLASSEUR', 'CHEMISE', 'INTERCALAIRE', 'CARTABLE', 'SAC À DOS', 'TROUSSE', 'POCHETTE', 'CALCULATRICE', 'RAPPORTEUR', 'SURLIGNEUR', 'CORRECTEUR', 'COLLE', 'CISEAUX', 'AGRAFEUSE', 'PERFORATRICE', 'TABLEAU', 'MARQUEUR', 'BROSSE', 'ÉPONGE', 'PUPITRE', 'BUREAU', 'AGENDA', 'MANUEL', 'DICTIONNAIRE', 'ATLAS', 'GLOBE'
);

-- Hard: fournitures spécialisées
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'TABLEAU BLANC', 'CARTABLE À ROULETTES', 'EMPLOI DU TEMPS'
);

-- PARTIES DU CORPS
-- Easy: parties très basiques du corps
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'TÊTE', 'COU', 'BRAS', 'MAIN', 'DOIGT', 'DOS', 'PIED', 'ŒIL', 'NEZ', 'BOUCHE', 'DENT', 'OREILLE'
);

-- Medium: parties moyennement connues
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ÉPAULE', 'COUDE', 'POIGNET', 'POUCE', 'ONGLE', 'POITRINE', 'VENTRE', 'HANCHE', 'FESSE', 'CUISSE', 'GENOU', 'MOLLET', 'CHEVILLE', 'ORTEIL', 'TALON', 'SOURCIL', 'PAUPIÈRE', 'CILS', 'NARINE', 'LÈVRE', 'LANGUE', 'MENTON', 'JOUE', 'FRONT', 'TEMPE', 'CHEVEUX', 'BARBE', 'MOUSTACHE'
);

-- JOUETS
-- Easy: jouets très basiques
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'POUPÉE', 'PELUCHE', 'NOUNOURS', 'BALLON', 'BALLE', 'VÉLO', 'PUZZLE', 'TRAIN', 'VOITURE', 'CAMION', 'AVION', 'BATEAU', 'MASQUE', 'ÉPÉE', 'SABRE', 'PISTOLET', 'ARC', 'FLÈCHE', 'YO-YO', 'TOUPIE', 'BILLES', 'CARTES', 'DOMINOS', 'MIKADO', 'ROBOT'
);

-- Medium: jouets moyennement courants
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'TROTTINETTE', 'DRAISIENNES', 'LÉGO', 'PLAYMOBIL', 'KAPLA', 'CUBES', 'HÉLICOPTÈRE', 'POUPÉE BARBIE', 'ACTION MAN', 'FIGURINE', 'DÎNETTE', 'CUISINE', 'DÉGUISEMENT', 'CORDE À SAUTER', 'CERCEAU', 'PÂTE À MODELER', 'CRAYON DE COULEUR', 'FEUTRE', 'COLORIAGE', 'CAHIER DE DESSIN', 'MAGNÉTOS'
);

-- Hard: jouets spécialisés
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'TABLEAU MAGIQUE', 'TÉLÉGOMMANDÉE'
);

-- NOURRITURE PRÉFÉRÉE DES ENFANTS
-- Easy: aliments très populaires chez les enfants
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'PIZZA', 'HAMBURGER', 'PÂTES', 'FRITES', 'NUGGETS', 'JAMBON', 'SANDWICH', 'CHOCOLAT', 'NUTELLA', 'YAOURT', 'FROMAGE', 'GLACE', 'GÂTEAU', 'BISCUIT', 'COOKIE', 'CROISSANT', 'BONBON', 'SUCETTE'
);

-- Medium: aliments populaires
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'HOT-DOG', 'SPAGHETTI', 'MACARONI', 'LASAGNE', 'RAVIOLI', 'POISSON PANÉ', 'SAUCISSE', 'MERGUEZ', 'STEAK HACHÉ', 'CROQUE-MONSIEUR', 'TARTINE', 'CÉRÉALES', 'CORN FLAKES', 'CONFITURE', 'MIEL', 'SORBET', 'ESQUIMAU', 'CORNETTO', 'MAGNUM', 'MADELEINE', 'CHEWING-GUM', 'CHOCOLAT CHAUD', 'SIROP', 'JUS DE FRUIT', 'COCA-COLA', 'LIMONADE', 'GRENADINE'
);

-- Hard: aliments avec noms composés
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'PAIN AU CHOCOLAT', 'CHAUSSON AUX POMMES'
);

-- ===========================================
-- VÉRIFICATION ET RAPPORT
-- ===========================================

-- Compter les mots par niveau de difficulté
SELECT 
    difficulty,
    COUNT(*) as nombre_mots,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM hangman_words), 2) as pourcentage
FROM hangman_words 
GROUP BY difficulty 
ORDER BY 
    CASE difficulty 
        WHEN 'easy' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'hard' THEN 3 
    END;

-- Afficher quelques exemples par niveau
SELECT 'EASY' as niveau, word, c.name as categorie 
FROM hangman_words w 
JOIN categories c ON w.category_id = c.id 
WHERE w.difficulty = 'easy' 
LIMIT 10;

SELECT 'MEDIUM' as niveau, word, c.name as categorie 
FROM hangman_words w 
JOIN categories c ON w.category_id = c.id 
WHERE w.difficulty = 'medium' 
LIMIT 10;

SELECT 'HARD' as niveau, word, c.name as categorie 
FROM hangman_words w 
JOIN categories c ON w.category_id = c.id 
WHERE w.difficulty = 'hard' 
LIMIT 10;

-- Commit des changements
COMMIT;