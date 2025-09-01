/**
 * APPLICATION LAYER - CombatUseCase
 * Orchestration propre, incluant l'instanciation des ennemis.
 */
import { Combat, type Position } from '../../domain/entities/Combat';
import { CombatantFactory } from '../../domain/factories/CombatantFactory';
import { type ICombatRepository, type ICharacterRepository, type IEffectsRepository } from '../../domain/repositories';
import { type IWeaponRepository } from '../../infrastructure/repositories/WeaponRepository';
import { GameNarrativeService } from '../../domain/services/GameNarrativeService';
import { type NarrativeMessage } from '../../domain/entities/NarrativeMessage';
import { EnemyMapper } from '../mappers/EnemyMapper';
import { DiceRollingService } from '../../domain/services/DiceRollingService';
import { InitiativeService } from '../../domain/services/InitiativeService';

// On définit un type pour la "recette" d'ennemis venant de la scène
export interface EnemyEncounter {
  templateId: string;
  count: number;
  positions: Position[];
}

export class CombatUseCase {
  private readonly combatRepo: ICombatRepository;
  private readonly characterRepo: ICharacterRepository;
  // Repositories pour futures implémentations
  // private readonly effectsRepo: IEffectsRepository;
  // private readonly weaponRepo: IWeaponRepository;

  constructor(
    combatRepo: ICombatRepository,
    characterRepo: ICharacterRepository,
    _effectsRepo: IEffectsRepository,
    _weaponRepo: IWeaponRepository
  ) {
    this.combatRepo = combatRepo;
    this.characterRepo = characterRepo;
    // effectsRepo et weaponRepo seront utilisés dans futures implémentations
  }

  async initiateCombat(
    playerIds: string[],
    enemyEncounters: EnemyEncounter[],
    initialPositions: Record<string, Position>
  ): Promise<{ success: boolean; combat?: Combat; error?: string; narrativeMessages?: NarrativeMessage[] }> {
    try {
      let combat = new Combat(`combat_${Date.now()}`);
      const narrativeMessages: NarrativeMessage[] = [];

      // Message de début de combat généré par le Domain
      narrativeMessages.push(GameNarrativeService.createCombatStartMessage());

      // --- JOUEURS ET COMPAGNONS ---
      for (const characterId of playerIds) {
        const character = await this.characterRepo.getById(characterId);
        if (!character) return { success: false, error: `Character ${characterId} not found` };
      
        const initiativeRoll = Math.floor(Math.random() * 20) + 1;
        const initiative = initiativeRoll + character.getAbilityModifiers().dexterity;

        // Message d'initiative généré par le Domain
        narrativeMessages.push(
          GameNarrativeService.createInitiativeMessage(
            character.name,
            initiativeRoll,
            character.getAbilityModifiers().dexterity
          )
        );

        const combatant = CombatantFactory.createFromCharacter(character, initiative, initialPositions[characterId]);
        combat = combat.withAddedEntity(combatant);
        combat.tacticalGrid.occupyCell(combatant.position, combatant.id);
      }

      // --- ENNEMIS (AVEC MAPPERS) ---
      for (const encounter of enemyEncounters) {
        const enemyTemplate = await this.characterRepo.getEnemyTemplateById(encounter.templateId);
        if (!enemyTemplate) {
          return { success: false, error: `Enemy template ${encounter.templateId} not found` };
        }

        for (let i = 0; i < encounter.count; i++) {
          const instanceId = `${encounter.templateId}_${i + 1}`;
          const position = encounter.positions[i] || { x: 10, y: 5 };

          // Utilisation du mapper pour créer les données 
          const enemyDataSource = EnemyMapper.createEnemyDataSource(
            encounter.templateId,
            instanceId,
            enemyTemplate,
            position
          );

          // Conversion via mapper
          const mappedData = EnemyMapper.infraToEnemySpec(enemyDataSource, enemyTemplate);

          const initiativeRoll = DiceRollingService.rollD20();
          const dexModifier = 2; // TODO: récupérer le vrai modificateur de dextérité de l'ennemi
          const initiative = InitiativeService.calculateInitiativeWithModifier(dexModifier);

          // Message d'initiative ennemi généré par le Domain
          narrativeMessages.push(
            GameNarrativeService.createInitiativeMessage(
              mappedData.enemySpec.name,
              initiativeRoll,
              dexModifier
            )
          );

          // Utilisation de la nouvelle méthode createFromEnemySpec
          const combatant = CombatantFactory.createFromEnemySpec(
            mappedData.enemySpec,
            mappedData.baseStats,
            mappedData.maxHp,
            mappedData.armorClass,
            mappedData.speed,
            mappedData.level,
            initiative,
            position
          );

          combat = combat.withAddedEntity(combatant);
          combat.tacticalGrid.occupyCell(combatant.position, combatant.id);
        }
      }

      const finalCombat = combat
        .withCalculatedInitiativeOrder()
        .withStartedCombat();
      await this.combatRepo.saveCombat(finalCombat);
      return { success: true, combat: finalCombat, narrativeMessages };

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Obtenir l'état actuel du combat
   */
  async getCurrentCombat(): Promise<Combat | null> {
    try {
      return await this.combatRepo.getCombat();
    } catch (error) {
      logger.error('Failed to get current combat:', error);
      return null;
    }
  }

  /**
   * Exécuter un tour d'IA automatique
   */
  async executeAITurn(): Promise<{ success: boolean; result?: any; error?: string; combat?: Combat }> {
    try {
      const combat = await this.combatRepo.getCombat();
      if (!combat) {
        return { success: false, error: 'No active combat' };
      }



      const result = combat.executeAITurn();



      if (!result) {

        return { success: false, error: 'No AI turn available (probably player turn)' };
      }

      if (!result.valid) {

        return { success: false, error: `AI action invalid: ${result.reasons?.join(', ')}` };
      }



      // Le résultat de l'IA ne contient plus newCombatState - utiliser combat directement
      const finalCombat = combat.withCheckedCombatEnd();
      await this.combatRepo.saveCombat(finalCombat);
      return { success: true, result, combat: finalCombat };
    } catch (error) {
      logger.error('🚨 AI Turn error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Passer à l'entité suivante
   */
  async advanceTurn(): Promise<{ success: boolean; nextEntity?: any; combatEnded?: boolean; combat?: Combat }> {
    const combat = await this.combatRepo.getCombat();
    if (!combat) {
      return { success: false };
    }

    const newCombat = combat.withAdvancedTurn();
    const nextEntity = newCombat.getCurrentEntity();
    const combatResult = newCombat.withCheckedCombatEnd();

    await this.combatRepo.saveCombat(newCombat);

    return {
      success: true,
      nextEntity: nextEntity || undefined,
      combatEnded: combatResult !== null,
      combat: newCombat
    };
  }

  /**
   * Appliquer des dégâts à une entité
   */
  async applyDamage(
    targetId: string,
    damage: number
  ): Promise<{ success: boolean; targetDied?: boolean; combat?: Combat }> {
    const combat = await this.combatRepo.getCombat();
    if (!combat) {
      return { success: false };
    }

    try {
      const newCombat = combat.withDamageApplied(targetId, damage);
      const target = newCombat.entities.get(targetId);
      const targetDied = target?.isDead || false;

      await this.combatRepo.saveCombat(newCombat);
      return { success: true, targetDied, combat: newCombat };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Soigner une entité
   */
  async healEntity(
    targetId: string,
    healing: number
  ): Promise<{ success: boolean; combat?: Combat }> {
    const combat = await this.combatRepo.getCombat();
    if (!combat) {
      return { success: false };
    }

    try {
      const newCombat = combat.withHealing(targetId, healing);
      await this.combatRepo.saveCombat(newCombat);
      return { success: true, combat: newCombat };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Déplacer une entité
   */
  async moveEntity(
    entityId: string,
    newPosition: Position,
    movementCost: number = 1
  ): Promise<{ success: boolean; error?: string; combat?: Combat }> {
    const combat = await this.combatRepo.getCombat();
    if (!combat) {
      return { success: false, error: 'No active combat' };
    }



    try {
      const newCombat = combat.withEntityMoved(entityId, newPosition, movementCost);
      await this.combatRepo.saveCombat(newCombat);

      return { success: true, combat: newCombat };
    } catch (error) {

      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Terminer le combat actuel
   */
  async endCombat(): Promise<{ success: boolean }> {
    const combat = await this.combatRepo.getCombat();
    if (!combat) {
      return { success: false };
    }


    return { success: true };
  }

  /**
   * Attaquer avec une arme
   */
  async performWeaponAttack(
    attackerId: string,
    _weaponId: string,
    targetId: string
  ): Promise<{ success: boolean; damage?: number; error?: string; combat?: Combat; narrativeMessage?: NarrativeMessage }> {
    const combat = await this.combatRepo.getCombat();
    if (!combat) {
      return { success: false, error: 'No active combat' };
    }

    const attacker = combat.entities.get(attackerId);
    const target = combat.entities.get(targetId);

    if (!attacker || !target) {
      return { success: false, error: 'Attacker or target not found' };
    }

    if (!attacker.actionsRemaining.action) {
      return { success: false, error: 'No action remaining' };
    }

    // Calcul d'attaque simplifié pour l'instant
    const attackRoll = DiceRollingService.rollD20();
    const hit = attackRoll >= target.baseAC;
    const damage = hit ? DiceRollingService.rollD6() : 0;

    // Message d'attaque généré par le Domain
    const narrativeMessage = GameNarrativeService.createAttackMessage(
      attacker.name,
      target.name,
      'Épée', // TODO: récupérer le vrai nom de l'arme depuis weaponId
      hit,
      hit ? damage : undefined
    );

    try {
      let newCombat = combat;

      if (hit) {
        newCombat = combat.withDamageApplied(targetId, damage);
      }

      newCombat = newCombat.withActionConsumed(attackerId, 'action');
      await this.combatRepo.saveCombat(newCombat);

      return { success: true, damage, combat: newCombat, narrativeMessage };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Lancer un sort
   */
  async performSpellCast(
    casterId: string,
    _spellId: string,
    targetId: string
  ): Promise<{ success: boolean; damage?: number; error?: string; combat?: Combat; narrativeMessage?: NarrativeMessage }> {
    const combat = await this.combatRepo.getCombat();
    if (!combat) {
      return { success: false, error: 'No active combat' };
    }

    const caster = combat.entities.get(casterId);
    const target = combat.entities.get(targetId);

    if (!caster || !target) {
      return { success: false, error: 'Caster or target not found' };
    }

    if (!caster.actionsRemaining.action) {
      return { success: false, error: 'No action remaining' };
    }

    try {
      // Sort de dégâts simplifié
      const damage = DiceRollingService.rollD6();
      const spellName = 'Trait de feu'; // TODO: récupérer le vrai nom du sort depuis spellId

      // Message de sort généré par le Domain
      const narrativeMessage = GameNarrativeService.createSpellMessage(
        caster.name,
        spellName,
        target.name,
        damage
      );

      let newCombat = combat.withDamageApplied(targetId, damage);
      newCombat = newCombat.withActionConsumed(casterId, 'action');

      await this.combatRepo.saveCombat(newCombat);

      return { success: true, damage, combat: newCombat, narrativeMessage };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}