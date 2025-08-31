/**
 * APPLICATION SERVICE - CombatOrchestrationService
 * Service d'orchestration des actions de combat de haut niveau
 * Responsabilité : Centraliser la logique métier extraite des hooks React
 * Architecture : Utilise EXCLUSIVEMENT la nouvelle API immutable de Combat
 */

import { Combat, type CombatEntity } from '../../domain/entities/Combat';
import type { Position } from '../../domain/types';
import type { Spell, SpellLevel } from '../../domain/entities/Spell';

// Types de résultats pour l'orchestration
export interface CombatActionResult {
  readonly newCombat: Combat;
  readonly success: boolean;
  readonly message: string;
  readonly damage?: number;
  readonly healing?: number;
  readonly attackRoll?: number;
}

export interface CombatSpellResult {
  readonly newCombat: Combat;
  readonly success: boolean;
  readonly message: string;
  readonly damage?: number;
  readonly healing?: number;
  readonly spellLevel: SpellLevel;
}

export interface CombatMovementResult {
  readonly newCombat: Combat;
  readonly success: boolean;
  readonly message: string;
  readonly opportunityAttacks?: string[];
}

export interface CombatInitializationResult {
  readonly combat: Combat;
  readonly success: boolean;
  readonly message: string;
  readonly initiativeOrder: string[];
}

/**
 * SERVICE D'ORCHESTRATION DE COMBAT
 * Centralise toute la logique métier qui était dispersée dans les hooks React
 */
export class CombatOrchestrationService {

  /**
   * Orchestrer une attaque d'arme complète avec logique métier
   * Cette méthode centralise tout : jet d'attaque, jet de dégâts, application
   */
  performWeaponAttack(
    combat: Combat, 
    attackerId: string, 
    weaponId: string, 
    targetId: string
  ): CombatActionResult {
    try {
      // Récupérer les entités
      const attacker = combat.entities.get(attackerId);
      const target = combat.entities.get(targetId);

      if (!attacker) {
        return {
          newCombat: combat,
          success: false,
          message: `Attaquant ${attackerId} non trouvé`
        };
      }

      if (!target) {
        return {
          newCombat: combat,
          success: false,
          message: `Cible ${targetId} non trouvée`
        };
      }

      if (target.isDead) {
        return {
          newCombat: combat,
          success: false,
          message: `La cible ${target.name} est déjà morte`
        };
      }

      // Vérifications de base
      if (!attacker.actionsRemaining.action) {
        return {
          newCombat: combat,
          success: false,
          message: `${attacker.name} n'a plus d'actions disponibles`
        };
      }

      // LOGIQUE MÉTIER CENTRALISÉE - Calculs D&D
      const attackRoll = this.rollD20();
      const attackBonus = this.calculateAttackBonus(attacker, weaponId);
      const totalAttackRoll = attackRoll + attackBonus;
      
      // Vérifier si l'attaque touche
      const targetAC = target.baseAC;
      const hits = totalAttackRoll >= targetAC;

      if (!hits) {
        // Attaque ratée - consommer l'action quand même
        const combatAfterAction = combat.withActionConsumed(attackerId, 'action');
        return {
          newCombat: combatAfterAction,
          success: true,
          message: `${attacker.name} rate son attaque contre ${target.name} (${totalAttackRoll} vs AC ${targetAC})`,
          attackRoll: totalAttackRoll,
          damage: 0
        };
      }

      // Attaque réussie - calculer les dégâts
      const damage = this.rollWeaponDamage(weaponId, attacker);
      
      // Appliquer les effets via l'API immutable PROPRE
      let newCombat = combat;
      
      // 1. Consommer l'action
      newCombat = newCombat.withActionConsumed(attackerId, 'action');
      
      // 2. Appliquer les dégâts
      newCombat = newCombat.withDamageApplied(targetId, damage);

      return {
        newCombat,
        success: true,
        message: `${attacker.name} touche ${target.name} pour ${damage} dégâts (jet: ${totalAttackRoll} vs AC ${targetAC})`,
        attackRoll: totalAttackRoll,
        damage
      };

    } catch (error) {
      return {
        newCombat: combat,
        success: false,
        message: `Erreur lors de l'attaque: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Orchestrer le lancement d'un sort avec toute la logique métier
   */
  castSpellAction(
    combat: Combat,
    casterId: string,
    spellId: string,
    level: SpellLevel,
    targetId?: string
  ): CombatSpellResult {
    try {
      const caster = combat.entities.get(casterId);
      if (!caster) {
        return {
          newCombat: combat,
          success: false,
          message: `Lanceur ${casterId} non trouvé`,
          spellLevel: level
        };
      }

      // Trouver le sort dans la liste des sorts connus
      const spell = caster.knownSpells.find(s => s.id === spellId);
      if (!spell) {
        return {
          newCombat: combat,
          success: false,
          message: `Sort ${spellId} non connu par ${caster.name}`,
          spellLevel: level
        };
      }

      // Vérifier l'emplacement de sort disponible
      if (!spell.isCantrip() && (caster.spellSlots as any)[level] <= 0) {
        return {
          newCombat: combat,
          success: false,
          message: `Aucun emplacement de sort de niveau ${level} disponible`,
          spellLevel: level
        };
      }

      // Vérifier l'action requise
      const hasRequiredAction = spell.castingTime === 'bonus_action' 
        ? caster.actionsRemaining.bonusAction
        : caster.actionsRemaining.action;

      if (!hasRequiredAction) {
        return {
          newCombat: combat,
          success: false,
          message: `${caster.name} n'a pas l'action requise pour lancer ce sort`,
          spellLevel: level
        };
      }

      // LOGIQUE MÉTIER DU SORT - Utiliser l'API immutable
      let newCombat = combat;
      let totalDamage = 0;
      let totalHealing = 0;

      // Consommer l'action appropriée
      const actionType = spell.castingTime === 'bonus_action' ? 'bonusAction' : 'action';
      newCombat = newCombat.withActionConsumed(casterId, actionType);

      // Appliquer les effets selon le type de sort
      if (spell.effects.damage && targetId) {
        const target = combat.entities.get(targetId);
        if (target && !target.isDead) {
          totalDamage = this.calculateSpellDamage(spell, level, caster);
          newCombat = newCombat.withDamageApplied(targetId, totalDamage);
        }
      }

      if (spell.effects.healing && targetId) {
        const target = combat.entities.get(targetId);
        if (target && !target.isDead) {
          totalHealing = this.calculateSpellHealing(spell, level, caster);
          newCombat = newCombat.withHealing(targetId, totalHealing);
        }
      }

      const effectMessage = totalDamage > 0 ? ` (${totalDamage} dégâts)` :
                           totalHealing > 0 ? ` (${totalHealing} soins)` : '';

      return {
        newCombat,
        success: true,
        message: `${caster.name} lance ${spell.name}${effectMessage}`,
        damage: totalDamage || undefined,
        healing: totalHealing || undefined,
        spellLevel: level
      };

    } catch (error) {
      return {
        newCombat: combat,
        success: false,
        message: `Erreur lors du lancement du sort: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        spellLevel: level
      };
    }
  }

  /**
   * Orchestrer un mouvement avec vérifications et attaques d'opportunité
   */
  executeMovement(
    combat: Combat,
    entityId: string,
    newPosition: Position
  ): CombatMovementResult {
    try {
      const entity = combat.entities.get(entityId);
      if (!entity) {
        return {
          newCombat: combat,
          success: false,
          message: `Entité ${entityId} non trouvée`
        };
      }

      if (entity.isDead) {
        return {
          newCombat: combat,
          success: false,
          message: `${entity.name} est mort et ne peut pas se déplacer`
        };
      }

      if (entity.actionsRemaining.movement <= 0) {
        return {
          newCombat: combat,
          success: false,
          message: `${entity.name} n'a plus de mouvement disponible`
        };
      }

      // Vérifier les attaques d'opportunité AVANT le mouvement
      const opportunityAttackers = combat.checkOpportunityAttacks(entityId, entity.position, newPosition);
      
      // Effectuer le mouvement via l'API immutable
      const newCombat = combat.withEntityMoved(entityId, newPosition);

      const opportunityMessage = opportunityAttackers.length > 0 
        ? ` (provoque ${opportunityAttackers.length} attaque(s) d'opportunité)`
        : '';

      return {
        newCombat,
        success: true,
        message: `${entity.name} se déplace${opportunityMessage}`,
        opportunityAttacks: opportunityAttackers
      };

    } catch (error) {
      return {
        newCombat: combat,
        success: false,
        message: `Erreur lors du mouvement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Orchestrer l'avancement de tour avec toute la logique
   */
  executeTurnAdvancement(combat: Combat): CombatActionResult {
    try {
      const currentEntity = combat.getCurrentEntity();
      if (!currentEntity) {
        return {
          newCombat: combat,
          success: false,
          message: "Aucune entité courante trouvée"
        };
      }

      // Avancer au tour suivant via l'API immutable
      const newCombat = combat.withAdvancedTurn();
      
      const nextEntity = newCombat.getCurrentEntity();
      const nextEntityName = nextEntity ? nextEntity.name : "Fin du combat";

      return {
        newCombat,
        success: true,
        message: `Tour suivant : ${nextEntityName}`
      };

    } catch (error) {
      return {
        newCombat: combat,
        success: false,
        message: `Erreur lors de l'avancement du tour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Initialiser un nouveau combat avec les entités données
   */
  initializeCombat(
    combatId: string,
    entities: CombatEntity[],
    gridDimensions = { width: 12, height: 8 }
  ): CombatInitializationResult {
    try {
      // Créer le combat via l'API immutable
      let combat = new Combat(combatId, gridDimensions);

      // Ajouter toutes les entités
      for (const entity of entities) {
        combat = combat.withAddedEntity(entity);
      }

      // Calculer l'ordre d'initiative et démarrer
      combat = combat
        .withCalculatedInitiativeOrder()
        .withStartedCombat();

      return {
        combat,
        success: true,
        message: `Combat initialisé avec ${entities.length} entités`,
        initiativeOrder: combat.initiativeOrder.slice()
      };

    } catch (error) {
      // En cas d'erreur, retourner un combat vide mais valide
      const emptyCombat = new Combat(combatId, gridDimensions);
      return {
        combat: emptyCombat,
        success: false,
        message: `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        initiativeOrder: []
      };
    }
  }

  // === MÉTHODES PRIVÉES - LOGIQUE MÉTIER CENTRALISÉE ===

  /**
   * Rouler un d20 pour les jets d'attaque
   */
  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Calculer le bonus d'attaque pour une arme donnée
   */
  private calculateAttackBonus(attacker: CombatEntity, _weaponId: string): number {
    // Logique simplifiée - En réalité, cela dépendrait de l'arme et des stats
    const strengthMod = Math.floor((attacker.abilities.strength - 10) / 2);
    return strengthMod + attacker.proficiencyBonus;
  }

  /**
   * Rouler les dégâts d'une arme
   */
  private rollWeaponDamage(_weaponId: string, attacker: CombatEntity): number {
    // Logique simplifiée - 1d6 + modificateur de Force
    const weaponDie = Math.floor(Math.random() * 6) + 1;
    const strengthMod = Math.floor((attacker.abilities.strength - 10) / 2);
    return Math.max(1, weaponDie + strengthMod);
  }

  /**
   * Calculer les dégâts d'un sort
   */
  private calculateSpellDamage(spell: Spell, level: SpellLevel, caster: CombatEntity): number {
    // Utiliser la méthode du sort s'il l'a, sinon logique par défaut
    if (spell.calculateDamage) {
      const spellcastingMod = this.getSpellcastingModifier(caster);
      return spell.calculateDamage(level, spellcastingMod, caster.proficiencyBonus);
    }
    
    // Logique par défaut simplifiée
    return Math.floor(Math.random() * 8) + level;
  }

  /**
   * Calculer les soins d'un sort
   */
  private calculateSpellHealing(spell: Spell, level: SpellLevel, caster: CombatEntity): number {
    // Utiliser la méthode du sort s'il l'a, sinon logique par défaut
    if (spell.calculateHealing) {
      const spellcastingMod = this.getSpellcastingModifier(caster);
      return spell.calculateHealing(level, spellcastingMod);
    }
    
    // Logique par défaut simplifiée
    return Math.floor(Math.random() * 8) + level + 2;
  }

  /**
   * Obtenir le modificateur d'incantation
   */
  private getSpellcastingModifier(caster: CombatEntity): number {
    if (!caster.spellcastingAbility) return 0;
    
    const ability = caster.abilities[caster.spellcastingAbility];
    return Math.floor((ability - 10) / 2);
  }
}