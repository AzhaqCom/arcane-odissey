/**
 * INFRASTRUCTURE REPOSITORY - EnemyRepository
 * Implémentation concrète du repository pour les ennemis
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #5 Injection de dépendances
 */

import type { IEnemyRepository } from '../../domain/repositories/IEnemyRepository';
import type { DomainEnemyTemplate } from '../../domain/types/Enemy';
import { Enemy } from '../../domain/entities/Enemy';
import { ENEMY_TEMPLATES } from '../data/characters/enemies';
import { SCENES_DATA } from '../data/scenes';
import type { SceneData } from '../data/types/SceneData';

/**
 * Repository concret pour la gestion des ennemis
 * Charge les données depuis les fichiers de configuration
 */
export class EnemyRepository implements IEnemyRepository {
  
  /**
   * Récupère les templates d'ennemis nécessaires pour une scène donnée
   * Extrait les templateIds depuis la configuration de la scène
   */
  async getTemplatesForScene(sceneId: string): Promise<DomainEnemyTemplate[]> {
    // 1. Trouver la scène
    const scene = SCENES_DATA.find(s => s.id === sceneId);
    if (!scene || scene.type !== 'combat') {
      return [];
    }
    
    // 2. Extraire les templateIds uniques depuis la configuration des ennemis
    const templateIds = new Set<string>();
    const enemies = (scene.content as any).enemies || [];
    
    for (const enemySpec of enemies) {
      if (enemySpec.templateId) {
        templateIds.add(enemySpec.templateId);
      }
    }
    
    // 3. Récupérer les templates correspondants
    const templates: DomainEnemyTemplate[] = [];
    for (const templateId of templateIds) {
      const template = ENEMY_TEMPLATES[templateId];
      if (template) {
        templates.push(template);
      }
    }
    
    return templates;
  }
  
  /**
   * Récupère les ennemis instanciés pour une scène
   * Crée des instances Enemy avec IDs uniques et positions
   */
  async getEnemiesByScene(sceneId: string): Promise<Enemy[]> {
    // 1. Trouver la scène
    const scene = SCENES_DATA.find(s => s.id === sceneId);
    if (!scene || scene.type !== 'combat') {
      return [];
    }
    
    // 2. Extraire la configuration des ennemis
    const sceneContent = scene.content as any;
    const enemySpecs = sceneContent.enemies || [];
    const allEnemies: Enemy[] = [];
    
    // 3. Créer les instances pour chaque spec
    for (const spec of enemySpecs) {
      const template = await this.getTemplate(spec.templateId);
      if (!template) {
        console.warn(`Template not found: ${spec.templateId}`);
        continue;
      }
      
      // Préparer les positions
      const positions = this.preparePositions(spec);
      
      // Créer les instances avec Enemy.createMultiple
      const enemies = Enemy.createMultiple(
        spec.templateId,
        template,
        spec.count || 1,
        positions
      );
      
      // Si un nom custom est fourni, l'appliquer
      if (spec.customName) {
        enemies.forEach((enemy, index) => {
          // Pour l'instant on ne peut pas modifier le nom après création
          // C'est une limitation de l'immutabilité
        });
      }
      
      allEnemies.push(...enemies);
    }
    
    return allEnemies;
  }
  
  /**
   * Récupère un template d'ennemi par son ID
   */
  async getTemplate(templateId: string): Promise<DomainEnemyTemplate | null> {
    return ENEMY_TEMPLATES[templateId] || null;
  }
  
  /**
   * Récupère plusieurs templates par leurs IDs
   */
  async getTemplates(templateIds: string[]): Promise<DomainEnemyTemplate[]> {
    const templates: DomainEnemyTemplate[] = [];
    
    for (const id of templateIds) {
      const template = ENEMY_TEMPLATES[id];
      if (template) {
        templates.push(template);
      }
    }
    
    return templates;
  }
  
  /**
   * Sauvegarde l'état d'un ennemi (HP, position, etc.)
   * Pour l'instant, implémentation en mémoire ou localStorage
   */
  async saveEnemyState(enemy: Enemy): Promise<void> {
    // TODO: Implémenter la sauvegarde persistante
    // Pour l'instant, on pourrait utiliser localStorage ou une solution en mémoire
    const key = `enemy_state_${enemy.id}`;
    const state = {
      id: enemy.id,
      currentHP: enemy.currentHP,
      position: enemy.position,
      isDead: enemy.isDead
    };
    
    // Exemple avec localStorage (à adapter selon les besoins)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }
  
  /**
   * Récupère un ennemi par son ID unique
   */
  async getEnemyById(enemyId: string): Promise<Enemy | null> {
    // Extraire le templateId depuis l'ID (format: templateId_index)
    const parts = enemyId.split('_');
    if (parts.length < 2) {
      return null;
    }
    
    const templateId = parts.slice(0, -1).join('_');
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      return null;
    }
    
    // Vérifier si on a un état sauvegardé
    const savedState = this.loadEnemyState(enemyId);
    
    // Créer l'instance Enemy
    const enemy = new Enemy(
      enemyId,
      template,
      savedState?.currentHP || template.maxHp,
      savedState?.position
    );
    
    return enemy;
  }
  
  /**
   * Helper: Prépare les positions pour les ennemis multiples
   * @private
   */
  private preparePositions(spec: any): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    
    // Position principale
    if (spec.position) {
      positions.push(spec.position);
    }
    
    // Positions alternatives
    if (spec.alternativePositions) {
      positions.push(...spec.alternativePositions);
    }
    
    // S'assurer qu'on a assez de positions pour le count
    const count = spec.count || 1;
    while (positions.length < count) {
      // Générer une position par défaut si nécessaire
      const lastPos = positions[positions.length - 1] || { x: 5, y: 5 };
      positions.push({
        x: lastPos.x + 1,
        y: lastPos.y
      });
    }
    
    return positions.slice(0, count);
  }
  
  /**
   * Helper: Charge l'état sauvegardé d'un ennemi
   * @private
   */
  private loadEnemyState(enemyId: string): any | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = `enemy_state_${enemyId}`;
      const data = localStorage.getItem(key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse enemy state:', e);
        }
      }
    }
    return null;
  }
  
  /**
   * Réinitialise tous les états sauvegardés
   * Utile pour recommencer un combat
   */
  async clearAllStates(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('enemy_state_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}