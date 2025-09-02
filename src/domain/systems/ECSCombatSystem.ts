/**
 * DOMAIN SYSTEM - ECS Combat System
 * Gestionnaire central des entités ECS en combat
 */

import { 
type  ECSEntity, 
  type EntityId, 
  type ComponentType, 
  type StatsComponent, 
  type PositionComponent, 
  type ActionsComponent,
  type StatusComponent,
  type WeaponsComponent,
  type SpellsComponent,
  type AIComponent,
  type PlayerComponent,
  ECSUtils
} from '../entities/ECS';

/**
 * Système ECS pour le combat
 * Gère toutes les entités et leurs composants
 */
export class ECSCombatSystem {
  private entities: Map<EntityId, ECSEntity> = new Map();

  // ====== GESTION DES ENTITÉS ======

  /**
   * Ajouter une entité au système
   */
  addEntity(entity: ECSEntity): void {
    this.entities.set(entity.id, entity);
  }

  /**
   * Supprimer une entité du système
   */
  removeEntity(entityId: EntityId): void {
    this.entities.delete(entityId);
  }

  /**
   * Récupérer une entité
   */
  getEntity(entityId: EntityId): ECSEntity | null {
    return this.entities.get(entityId) || null;
  }

  /**
   * Récupérer toutes les entités
   */
  getAllEntities(): ReadonlyMap<EntityId, ECSEntity> {
    return this.entities;
  }

  /**
   * Mettre à jour une entité
   */
  updateEntity(entity: ECSEntity): void {
    this.entities.set(entity.id, entity);
  }

  // ====== QUERIES AVANCÉES ======

  /**
   * Trouver toutes les entités avec un composant spécifique
   */
  getEntitiesWith(componentType: ComponentType): ECSEntity[] {
    return Array.from(this.entities.values()).filter(entity =>
      ECSUtils.hasComponent(entity, componentType)
    );
  }

  /**
   * Trouver toutes les entités avec plusieurs composants
   */
  getEntitiesWithAll(componentTypes: ComponentType[]): ECSEntity[] {
    return Array.from(this.entities.values()).filter(entity =>
      componentTypes.every(type => ECSUtils.hasComponent(entity, type))
    );
  }

  /**
   * Récupérer toutes les entités de joueur
   */
  getPlayerEntities(): ECSEntity[] {
    return this.getEntitiesWith('player');
  }

  /**
   * Récupérer toutes les entités IA
   */
  getAIEntities(): ECSEntity[] {
    return this.getEntitiesWith('ai');
  }

  /**
   * Récupérer toutes les entités vivantes
   */
  getLivingEntities(): ECSEntity[] {
    return Array.from(this.entities.values()).filter(entity => {
      const status = ECSUtils.getComponent<StatusComponent>(entity, 'status');
      return status && status.isActive && !status.isDead;
    });
  }

  /**
   * Récupérer les entités ennemies d'une entité donnée
   */
  getEnemiesOf(entityId: EntityId): ECSEntity[] {
    const sourceEntity = this.getEntity(entityId);
    if (!sourceEntity) return [];

    const sourceStatus = ECSUtils.getComponent<StatusComponent>(sourceEntity, 'status');
    if (!sourceStatus) return [];

    return this.getLivingEntities().filter(entity => {
      const entityStatus = ECSUtils.getComponent<StatusComponent>(entity, 'status');
      if (!entityStatus || entity.id === entityId) return false;

      // Logique d'ennemi : joueur/allié vs ennemi
      if (sourceStatus.entityType === 'enemy') {
        return entityStatus.entityType === 'player' || entityStatus.entityType === 'ally';
      } else {
        return entityStatus.entityType === 'enemy';
      }
    });
  }

  /**
   * Récupérer les alliés d'une entité donnée
   */
  getAlliesOf(entityId: EntityId): ECSEntity[] {
    const sourceEntity = this.getEntity(entityId);
    if (!sourceEntity) return [];

    const sourceStatus = ECSUtils.getComponent<StatusComponent>(sourceEntity, 'status');
    if (!sourceStatus) return [];

    return this.getLivingEntities().filter(entity => {
      const entityStatus = ECSUtils.getComponent<StatusComponent>(entity, 'status');
      if (!entityStatus || entity.id === entityId) return false;

      // Logique d'allié : même camp
      if (sourceStatus.entityType === 'enemy') {
        return entityStatus.entityType === 'enemy';
      } else {
        return entityStatus.entityType === 'player' || entityStatus.entityType === 'ally';
      }
    });
  }

  // ====== SYSTÈMES SPÉCIALISÉS ======

  /**
   * Système de traitement IA
   * Traite toutes les entités avec composant AI
   */
  processAIEntities(processFunction: (entity: ECSEntity) => ECSEntity): void {
    const aiEntities = this.getAIEntities();
    
    for (const entity of aiEntities) {
      const processedEntity = processFunction(entity);
      this.updateEntity(processedEntity);
    }
  }

  /**
   * Système de régénération des actions
   * Remet à zéro les actions pour le nouveau tour
   */
  resetActionsForNewTurn(): void {
    const allEntities = Array.from(this.entities.values());
    
    for (const entity of allEntities) {
      const stats = ECSUtils.getComponent<StatsComponent>(entity, 'stats');
      const actions = ECSUtils.getComponent<ActionsComponent>(entity, 'actions');
      
      if (stats && actions) {
        const resetActions: ActionsComponent = {
          type: 'actions',
          actionsRemaining: {
            movement: stats.baseSpeed,
            action: true,
            bonusAction: true,
            reaction: true
          },
          availableActions: actions.availableActions
        };
        
        const updatedEntity = ECSUtils.withComponent(entity, resetActions);
        this.updateEntity(updatedEntity);
      }
    }
  }

  /**
   * Système de nettoyage des morts
   * Marque les entités mortes comme inactives
   */
  processDeathSystem(): void {
    const allEntities = Array.from(this.entities.values());
    
    for (const entity of allEntities) {
      const stats = ECSUtils.getComponent<StatsComponent>(entity, 'stats');
      const status = ECSUtils.getComponent<StatusComponent>(entity, 'status');
      
      if (stats && status && stats.currentHP <= 0 && !status.isDead) {
        const deadStatus: StatusComponent = {
          ...status,
          isDead: true,
          isActive: false
        };
        
        const updatedEntity = ECSUtils.withComponent(entity, deadStatus);
        this.updateEntity(updatedEntity);
      }
    }
  }

  // ====== UTILITAIRES ======

  /**
   * Nettoyer le système (reset complet)
   */
  clear(): void {
    this.entities.clear();
  }

  /**
   * Obtenir statistiques du système
   */
  getSystemStats(): {
    totalEntities: number;
    livingEntities: number;
    playerEntities: number;
    aiEntities: number;
    deadEntities: number;
  } {
    const allEntities = Array.from(this.entities.values());
    
    return {
      totalEntities: allEntities.length,
      livingEntities: this.getLivingEntities().length,
      playerEntities: this.getPlayerEntities().length,
      aiEntities: this.getAIEntities().length,
      deadEntities: allEntities.filter(entity => {
        const status = ECSUtils.getComponent<StatusComponent>(entity, 'status');
        return status?.isDead || false;
      }).length
    };
  }
}