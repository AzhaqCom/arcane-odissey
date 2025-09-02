/**
 * DOMAIN SERVICE - CombatSession Factory
 * Factory pour créer des sessions de combat
 * Respecte la Constitution Architecturale - Règle #1 : Domain-Centric
 */

import { Combat, type Position } from '../entities/Combat';
import { CombatSession } from '../entities/CombatSession';
import { CombatantFactory } from '../factories/CombatantFactory';
import { type DiceRollingService } from './DiceRollingService';
import { type InitiativeService } from './InitiativeService';
import { GameNarrativeService } from './GameNarrativeService';
import { type NarrativeMessage } from '../entities/NarrativeMessage';
import type { ICharacterRepository } from '../repositories';

// Types pour la création de session
export interface EnemyEncounter {
  templateId: string;
  count: number;
  positions: Position[];
}

export interface SessionCreationResult {
  readonly success: boolean;
  readonly session?: CombatSession;
  readonly narrativeMessages?: NarrativeMessage[];
  readonly error?: string;
}

/**
 * Factory Service pour créer des CombatSession
 */
export class CombatSessionFactory {
  constructor(
    private readonly characterRepo: ICharacterRepository,
    private readonly diceRollingService: DiceRollingService,
    private readonly initiativeService: InitiativeService,
    private readonly gameNarrativeService: GameNarrativeService,
    private readonly combatFactory: (id: string, gridDimensions?: any) => Combat
  ) {}

  /**
   * Créer une nouvelle session de combat
   * Pure Domain Logic - respecte Règle #1
   */
  async createCombatSession(
    playerIds: string[],
    enemyEncounters: EnemyEncounter[],
    initialPositions: Record<string, Position>
  ): Promise<SessionCreationResult> {
    try {
      // Créer Combat de base
      let combat = this.combatFactory(`combat_${Date.now()}`);
      const narrativeMessages: NarrativeMessage[] = [];

      // Message de début généré par le Domain
      narrativeMessages.push(this.gameNarrativeService.createCombatStartMessage());

      // Ajouter joueurs
      for (const characterId of playerIds) {
        const character = await this.characterRepo.getById(characterId);
        if (!character) {
          return { success: false, error: `Character ${characterId} not found` };
        }

        const initiative = this.calculateInitiative(character.getAbilityModifiers().dexterity);
        narrativeMessages.push(
          this.gameNarrativeService.createInitiativeMessage(
            character.name,
            initiative,
            character.getAbilityModifiers().dexterity
          )
        );

        const combatant = CombatantFactory.createFromCharacter(
          character,
          initiative,
          initialPositions[characterId]
        );
        combat = combat.withAddedEntity(combatant);
        combat.tacticalGrid.occupyCell(combatant.position, combatant.id);
      }

      // Ajouter ennemis (logique existante adaptée)
      for (const encounter of enemyEncounters) {
        const result = await this.addEnemyEncounter(combat, encounter, narrativeMessages);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        combat = result.combat!;
      }

      // Finaliser le combat
      const finalCombat = combat
        .withCalculatedInitiativeOrder()
        .withStartedCombat();

      // Créer la session (Aggregate Root)
      const session = CombatSession.create(finalCombat);

      return { success: true, session, narrativeMessages };

    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ====== MÉTHODES PRIVÉES ======

  private calculateInitiative(dexModifier: number): number {
    const roll = this.diceRollingService.rollD20();
    return this.initiativeService.calculateInitiativeWithModifier(dexModifier);
  }

  private async addEnemyEncounter(
    combat: Combat,
    encounter: EnemyEncounter,
    narrativeMessages: NarrativeMessage[]
  ): Promise<{ success: boolean; combat?: Combat; error?: string }> {
    // Réutiliser la logique existante d'ajout d'ennemis depuis CombatUseCase
    // TODO: Extraire cette logique dans une méthode réutilisable
    
    const enemyTemplate = await this.characterRepo.getEnemyTemplateById(encounter.templateId);
    if (!enemyTemplate) {
      return { success: false, error: `Enemy template ${encounter.templateId} not found` };
    }

    let updatedCombat = combat;

    for (let i = 0; i < encounter.count; i++) {
      const instanceId = `${encounter.templateId}_${i + 1}`;
      const position = encounter.positions[i] || { x: 10, y: 5 };

      // Utiliser la logique de mapping existante (simplifiée pour l'instant)
      const initiative = this.calculateInitiative(2); // TODO: Récupérer vrai dex modifier

      narrativeMessages.push(
        this.gameNarrativeService.createInitiativeMessage(
          enemyTemplate.name,
          initiative,
          2
        )
      );

      // Pour l'instant, créer un combatant basique
      // TODO: Intégrer avec EnemyMapper et CombatantFactory.createFromEnemySpec
      const basicCombatant = this.createBasicEnemyCombatant(
        instanceId,
        enemyTemplate,
        initiative,
        position
      );

      updatedCombat = updatedCombat.withAddedEntity(basicCombatant);
      updatedCombat.tacticalGrid.occupyCell(basicCombatant.position, basicCombatant.id);
    }

    return { success: true, combat: updatedCombat };
  }

  private createBasicEnemyCombatant(
    instanceId: string,
    template: any,
    initiative: number,
    position: Position
  ): any {
    // Implémentation simplifiée pour l'instant
    // TODO: Utiliser CombatantFactory.createFromEnemySpec après integration
    return {
      id: instanceId,
      name: template.name,
      type: 'enemy' as const,
      maxHP: template.maxHp,
      currentHP: template.maxHp,
      baseAC: template.armorClass,
      baseSpeed: template.speed,
      level: template.level,
      proficiencyBonus: Math.ceil(template.level / 4) + 1,
      abilities: template.baseAbilities,
      position,
      initiative,
      actionsRemaining: { action: true, bonus: true, reaction: true, movement: template.speed },
      availableActions: [],
      knownSpells: [],
      inventory: { weapons: template.equipment.weapons || [] },
      spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      isActive: true,
      isDead: false,
      conditions: [],
      concentratingOn: undefined
    };
  }
}