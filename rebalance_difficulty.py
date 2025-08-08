#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
from collections import Counter
from typing import Dict, List, Tuple

class DifficultyRebalancer:
    def __init__(self):
        # Mots très courants qui sont généralement faciles
        self.easy_words_patterns = {
            'acteurs-et-actrices': ['TOM CRUISE', 'BRAD PITT', 'WILL SMITH', 'GEORGE CLOONEY', 'LEONARDO DICAPRIO'],
            'animaux': ['CHIEN', 'CHAT', 'CHEVAL', 'VACHE', 'POULE', 'SOURIS', 'LAPIN'],
            'pays': ['FRANCE', 'ITALIE', 'ESPAGNE', 'ALLEMAGNE', 'ANGLETERRE', 'SUISSE'],
            'couleurs': ['ROUGE', 'BLEU', 'VERT', 'JAUNE', 'NOIR', 'BLANC'],
            'fruits': ['POMME', 'POIRE', 'BANANE', 'ORANGE', 'FRAISE'],
            'légumes': ['CAROTTE', 'SALADE', 'TOMATE', 'POMME DE TERRE'],
            'métiers': ['MÉDECIN', 'AVOCAT', 'PROFESSEUR', 'POMPIER', 'POLICIER'],
            'sports': ['FOOTBALL', 'TENNIS', 'RUGBY', 'BASKET', 'NATATION'],
            'voitures': ['PEUGEOT', 'RENAULT', 'CITROËN', 'BMW', 'MERCEDES'],
        }
        
        # Mots compliqués qui sont généralement difficiles
        self.hard_words_patterns = {
            'acteurs-et-actrices': ['SCHWARZENEGGER', 'MCCONAUGHEY', 'JOHANNSSON'],
            'animaux': ['ORNITHORYNQUE', 'HIPPOPOTAME', 'KANGOUROU', 'RHINOCÉROS'],
            'pays': ['AZERBAÏDJAN', 'OUZBÉKISTAN', 'KIRGHIZISTAN', 'BANGLADESH'],
        }

    def calculate_word_difficulty(self, word: str, category_slug: str) -> str:
        """Calcule la difficulté d'un mot selon plusieurs critères"""
        word_clean = word.upper().strip()
        length = len(word_clean)
        
        # Critère 1: Longueur
        length_score = 0
        if length <= 7:
            length_score = 1  # Facile
        elif length <= 12:
            length_score = 2  # Moyen
        else:
            length_score = 3  # Difficile
            
        # Critère 2: Complexité orthographique
        complexity_score = 1
        
        # Présence d'accents ou caractères spéciaux augmente la difficulté
        if re.search(r'[ÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]', word_clean):
            complexity_score += 1
            
        # Présence de chiffres
        if re.search(r'\d', word_clean):
            complexity_score += 0.5
            
        # Mots composés (avec espaces ou tirets)
        if ' ' in word_clean or '-' in word_clean:
            complexity_score += 0.5
            
        # Critère 3: Évidence par rapport à la catégorie
        evidence_score = 2  # Moyen par défaut
        
        # Vérification des listes de mots faciles/difficiles
        if category_slug in self.easy_words_patterns:
            for easy_word in self.easy_words_patterns[category_slug]:
                if easy_word.upper() in word_clean:
                    evidence_score = 1
                    break
                    
        if category_slug in self.hard_words_patterns:
            for hard_word in self.hard_words_patterns[category_slug]:
                if hard_word.upper() in word_clean:
                    evidence_score = 3
                    break
        
        # Règles spéciales par catégorie
        evidence_score = self.apply_category_rules(word_clean, category_slug, evidence_score)
        
        # Score final (moyenne pondérée)
        final_score = (length_score * 0.4) + (complexity_score * 0.3) + (evidence_score * 0.3)
        
        # Conversion en difficulté
        if final_score <= 1.5:
            return 'easy'
        elif final_score <= 2.5:
            return 'medium'
        else:
            return 'hard'

    def apply_category_rules(self, word: str, category_slug: str, base_score: int) -> int:
        """Applique des règles spécifiques par catégorie"""
        
        if 'acteurs' in category_slug or 'actrices' in category_slug:
            # Acteurs très connus = facile
            famous_actors = ['TOM CRUISE', 'BRAD PITT', 'WILL SMITH', 'LEONARDO DICAPRIO', 
                           'GEORGE CLOONEY', 'ROBERT DE NIRO', 'AL PACINO', 'MORGAN FREEMAN']
            if any(actor in word for actor in famous_actors):
                return 1
            # Noms très compliqués = difficile
            if len(word) > 15 and (' ' in word):
                return 3
                
        elif 'animaux' in category_slug:
            # Animaux domestiques/communs = facile
            common_animals = ['CHIEN', 'CHAT', 'CHEVAL', 'VACHE', 'POULE', 'COCHON', 'MOUTON', 'LAPIN']
            if any(animal in word for animal in common_animals):
                return 1
            # Animaux exotiques = difficile
            exotic_animals = ['ORNITHORYNQUE', 'HIPPOPOTAME', 'RHINOCÉROS', 'KANGOUROU', 'CROCODILE']
            if any(animal in word for animal in exotic_animals):
                return 3
                
        elif 'pays' in category_slug:
            # Pays européens connus = facile à moyen
            european_countries = ['FRANCE', 'ALLEMAGNE', 'ITALIE', 'ESPAGNE', 'ANGLETERRE', 'SUISSE', 'BELGIQUE']
            if any(country in word for country in european_countries):
                return min(2, base_score)
            # Pays compliqués = difficile
            complex_countries = ['AZERBAÏDJAN', 'OUZBÉKISTAN', 'KIRGHIZISTAN', 'BANGLADESH', 'SRI LANKA']
            if any(country in word for country in complex_countries):
                return 3
                
        elif 'métiers' in category_slug:
            # Métiers courants = facile
            common_jobs = ['MÉDECIN', 'AVOCAT', 'PROFESSEUR', 'POMPIER', 'POLICIER', 'BOULANGER', 'COIFFEUR']
            if any(job in word for job in common_jobs):
                return 1
                
        elif 'fruits' in category_slug:
            # Fruits communs = facile
            common_fruits = ['POMME', 'POIRE', 'BANANE', 'ORANGE', 'FRAISE', 'PÊCHE', 'RAISIN']
            if any(fruit in word for fruit in common_fruits):
                return 1
                
        elif 'couleurs' in category_slug:
            # Couleurs primaires = facile
            primary_colors = ['ROUGE', 'BLEU', 'VERT', 'JAUNE', 'NOIR', 'BLANC']
            if any(color in word for color in primary_colors):
                return 1
        
        return base_score

    def balance_categories(self, categories: List[Dict]) -> Dict:
        """Équilibre les difficultés dans chaque catégorie"""
        changes_report = {}
        
        for category in categories:
            if not category['words']:
                continue
                
            category_name = category['name']
            category_slug = category['slug']
            words = category['words']
            
            print(f"\n=== Analyse de la catégorie: {category_name} ===")
            print(f"Nombre de mots: {len(words)}")
            
            # Calculer les nouvelles difficultés
            old_difficulties = []
            new_difficulties = []
            word_changes = []
            
            for word_data in words:
                old_difficulty = word_data['difficulty']
                new_difficulty = self.calculate_word_difficulty(word_data['word'], category_slug)
                
                old_difficulties.append(old_difficulty)
                new_difficulties.append(new_difficulty)
                
                if old_difficulty != new_difficulty:
                    word_changes.append({
                        'word': word_data['word'],
                        'old': old_difficulty,
                        'new': new_difficulty
                    })
                
                # Mise à jour
                word_data['difficulty'] = new_difficulty
            
            # Statistiques
            old_counts = Counter(old_difficulties)
            new_counts = Counter(new_difficulties)
            
            print(f"Avant: Easy={old_counts.get('easy', 0)}, Medium={old_counts.get('medium', 0)}, Hard={old_counts.get('hard', 0)}")
            print(f"Après: Easy={new_counts.get('easy', 0)}, Medium={new_counts.get('medium', 0)}, Hard={new_counts.get('hard', 0)}")
            print(f"Changements: {len(word_changes)}")
            
            # Ajuster si trop déséquilibré
            total_words = len(words)
            target_easy = total_words // 3
            target_medium = total_words // 3
            target_hard = total_words - target_easy - target_medium
            
            current_easy = new_counts.get('easy', 0)
            current_medium = new_counts.get('medium', 0)
            current_hard = new_counts.get('hard', 0)
            
            # Si on a trop de mots faciles, on en passe quelques-uns en moyen
            if current_easy > target_easy + 3:
                self.adjust_difficulties(words, 'easy', 'medium', current_easy - target_easy - 1)
                
            # Si on a trop de mots difficiles, on en passe quelques-uns en moyen
            if current_hard > target_hard + 3:
                self.adjust_difficulties(words, 'hard', 'medium', current_hard - target_hard - 1)
            
            changes_report[category_name] = {
                'total_words': total_words,
                'changes_count': len(word_changes),
                'word_changes': word_changes[:10],  # Limiter l'affichage
                'old_distribution': dict(old_counts),
                'new_distribution': Counter(word['difficulty'] for word in words)
            }
        
        return changes_report

    def adjust_difficulties(self, words: List[Dict], from_difficulty: str, to_difficulty: str, count: int):
        """Ajuste quelques mots d'une difficulté vers une autre"""
        adjusted = 0
        for word_data in words:
            if word_data['difficulty'] == from_difficulty and adjusted < count:
                word_data['difficulty'] = to_difficulty
                adjusted += 1

    def process_file(self, input_file: str, output_file: str):
        """Traite le fichier JSON complet"""
        print(f"Lecture du fichier: {input_file}")
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Erreur lors de la lecture: {e}")
            return
        
        print(f"Fichier chargé. {len(data.get('categories', []))} catégories trouvées.")
        
        # Rebalancer les difficultés
        changes_report = self.balance_categories(data['categories'])
        
        # Sauvegarder le fichier modifié
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"\nFichier sauvegardé: {output_file}")
        except Exception as e:
            print(f"Erreur lors de la sauvegarde: {e}")
            return
        
        # Générer le rapport détaillé
        self.generate_report(changes_report)

    def generate_report(self, changes_report: Dict):
        """Génère un rapport détaillé des changements"""
        print("\n" + "="*80)
        print("RAPPORT DÉTAILLÉ DES CHANGEMENTS DE DIFFICULTÉ")
        print("="*80)
        
        total_changes = sum(cat['changes_count'] for cat in changes_report.values())
        print(f"\nTotal des changements: {total_changes}")
        
        for category_name, report in changes_report.items():
            if report['changes_count'] > 0:
                print(f"\n📂 {category_name}")
                print(f"   Mots total: {report['total_words']}")
                print(f"   Changements: {report['changes_count']}")
                
                old_dist = report['old_distribution']
                new_dist = report['new_distribution']
                
                print(f"   Avant: E={old_dist.get('easy', 0)} M={old_dist.get('medium', 0)} H={old_dist.get('hard', 0)}")
                print(f"   Après: E={new_dist.get('easy', 0)} M={new_dist.get('medium', 0)} H={new_dist.get('hard', 0)}")
                
                if report['word_changes']:
                    print("   Exemples de changements:")
                    for change in report['word_changes'][:5]:
                        print(f"     • {change['word']}: {change['old']} → {change['new']}")

if __name__ == "__main__":
    rebalancer = DifficultyRebalancer()
    
    input_file = "hangman_full_export_2025-08-08.json"
    output_file = "hangman_rebalanced.json"
    
    rebalancer.process_file(input_file, output_file)