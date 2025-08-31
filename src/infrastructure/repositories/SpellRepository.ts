/**
 * INFRASTRUCTURE - Spell Repository
 * Repository pour l'accès aux données de sorts
 */

import { Spell, type SpellLevel, type SpellSchool, type CastingTime, type SpellRange, type Duration } from '../../domain/entities/Spell';
import { GameDataStore } from '../stores/GameDataStore';
import { logger } from '../services/Logger';
import type { SpellData } from '../data/types/SpellData';

export interface ISpellRepository {
  getSpell(id: string): Spell | null;
  getAllSpells(): Spell[];
  getSpellsByIds(ids: string[]): Spell[];
  getSpellsByLevel(level: SpellLevel): Spell[];
  getSpellsByClass(characterClass: string): Spell[];
  getSpellsBySchool(school: SpellSchool): Spell[];
  getCantrips(): Spell[];
  searchSpells(query: string): Spell[];
}

/**
 * Repository des sorts
 * Convertit les SpellData en entités Spell du domain
 */
export class SpellRepository implements ISpellRepository {
  private gameDataStore: GameDataStore;
  
  constructor(gameDataStore: GameDataStore) {
    this.gameDataStore = gameDataStore;
  }
  
  /**
   * Obtenir un sort par ID
   */
  getSpell(id: string): Spell | null {
    logger.debug('SPELL_REPO', `Getting spell: ${id}`);
    
    const spellData = this.gameDataStore.getSpell(id);
    if (!spellData) {
      logger.warn('SPELL_REPO', `Spell not found: ${id}`);
      return null;
    }
    
    return this.convertToSpell(spellData);
  }
  
  /**
   * Obtenir tous les sorts
   */
  getAllSpells(): Spell[] {
    logger.debug('SPELL_REPO', 'Getting all spells');
    
    const spellsData = this.gameDataStore.getAllSpells();
    return spellsData.map(data => this.convertToSpell(data));
  }
  
  /**
   * Obtenir des sorts par IDs
   */
  getSpellsByIds(ids: string[]): Spell[] {
    logger.debug('SPELL_REPO', `Getting spells by IDs: ${ids.join(', ')}`);
    
    const spellsData = this.gameDataStore.getSpellsByIds(ids);
    const spells = spellsData.map(data => this.convertToSpell(data));
    
    // Log des sorts manquants
    const foundIds = spellsData.map(s => s.id);
    const missingIds = ids.filter(id => !foundIds.includes(id));
    if (missingIds.length > 0) {
      logger.warn('SPELL_REPO', `Spells not found: ${missingIds.join(', ')}`);
    }
    
    return spells;
  }
  
  /**
   * Obtenir des sorts par niveau
   */
  getSpellsByLevel(level: SpellLevel): Spell[] {
    logger.debug('SPELL_REPO', `Getting spells by level: ${level}`);
    
    const spellsData = this.gameDataStore.getSpellsByLevel(level);
    return spellsData.map(data => this.convertToSpell(data));
  }
  
  /**
   * Obtenir des sorts par classe
   */
  getSpellsByClass(characterClass: string): Spell[] {
    logger.debug('SPELL_REPO', `Getting spells by class: ${characterClass}`);
    
    const spellsData = this.gameDataStore.getSpellsByClass(characterClass);
    return spellsData.map(data => this.convertToSpell(data));
  }
  
  /**
   * Obtenir des sorts par école
   */
  getSpellsBySchool(school: SpellSchool): Spell[] {
    logger.debug('SPELL_REPO', `Getting spells by school: ${school}`);
    
    const spellsData = this.gameDataStore.getSpellsBySchool(school);
    return spellsData.map(data => this.convertToSpell(data));
  }
  
  /**
   * Obtenir tous les cantrips (niveau 0)
   */
  getCantrips(): Spell[] {
    logger.debug('SPELL_REPO', 'Getting cantrips');
    
    return this.getSpellsByLevel(0);
  }
  
  /**
   * Rechercher des sorts
   */
  searchSpells(query: string): Spell[] {
    logger.debug('SPELL_REPO', `Searching spells: ${query}`);
    
    const spellsData = this.gameDataStore.searchSpells(query);
    return spellsData.map(data => this.convertToSpell(data));
  }
  
  // MÉTHODES PRIVÉES
  
  /**
   * Convertir SpellData vers entité Spell du domain
   */
  private convertToSpell(data: SpellData): Spell {
    // Convertir castingTime vers le type attendu
    const castingTime = this.convertCastingTime(data.castingTime);
    
    // Convertir range vers le format attendu
    const range = this.convertRange(data.range);
    
    // Convertir duration vers le format attendu  
    const duration = this.convertDuration(data.duration);
    
    // Construire les effets
    const effects: any = {};
    
    if (data.damage) {
      effects.damage = [{
        diceCount: this.parseDiceCount(data.damage.dice),
        diceType: this.parseDiceType(data.damage.dice),
        modifier: data.damage.bonus,
        damageType: data.damage.type
      }];
    }
    
    if (data.healing) {
      effects.healing = [{
        diceCount: this.parseDiceCount(data.healing.dice),
        diceType: this.parseDiceType(data.healing.dice),
        modifier: data.healing.bonus,
        damageType: 'radiant' // Type par défaut pour les soins
      }];
    }
    
    // Area of Effect
    const areaOfEffect = data.areaOfEffect ? {
      shape: data.areaOfEffect.shape,
      size: data.areaOfEffect.size,
      originatesFromCaster: data.areaOfEffect.originatesFromCaster
    } : undefined;
    
    // Combat Properties  
    const combatProperties = data.combatProperties || {};
    
    return new Spell(
      data.id,
      data.name,
      data.level,
      data.school,
      castingTime,
      range,
      duration,
      {
        verbal: data.components.verbal,
        somatic: data.components.somatic,
        material: data.components.material,
        materialDescription: data.components.materialDescription,
        consumed: data.components.consumed,
        costInGP: data.components.costInGP
      },
      data.description,
      effects,
      areaOfEffect,
      combatProperties,
      data.higherLevelEffects,
      data.ritual || false,
      data.concentration || false
    );
  }
  
  private convertCastingTime(castingTime: string): CastingTime {
    switch (castingTime) {
      case '1 action': return 'action';
      case '1 bonus action': return 'bonus_action';
      case '1 reaction': return 'reaction';
      case '1 minute': return 'minute';
      case '10 minutes':
      case '1 hour':
      case '8 hours':
      case '24 hours': return 'hour';
      default: return 'action';
    }
  }
  
  private convertRange(range: string): SpellRange {
    if (range === 'self') return 'self';
    if (range === 'touch') return 'touch';
    if (range.includes('unlimited')) return 'unlimited';
    
    // Extraire le nombre de mètres et convertir en cases (1 case = 5ft ≈ 1.5m)
    const match = range.match(/(\d+)/);
    if (match) {
      const meters = parseInt(match[1]);
      return Math.floor(meters / 1.5); // Conversion approximative mètres -> cases
    }
    
    return 120; // Valeur par défaut
  }
  
  private convertDuration(duration: string): Duration {
    if (duration === 'instantaneous') return 'instantaneous';
    if (duration === 'concentration') return 'concentration';
    
    // Extraire les tours/minutes
    const minuteMatch = duration.match(/(\d+) minute/);
    if (minuteMatch) {
      return parseInt(minuteMatch[1]) * 10; // 1 minute = 10 tours
    }
    
    const turnMatch = duration.match(/(\d+) tour/);
    if (turnMatch) {
      return parseInt(turnMatch[1]);
    }
    
    return 'instantaneous';
  }
  
  private parseDiceCount(dice: string): number {
    const match = dice.match(/(\d+)d/);
    return match ? parseInt(match[1]) : 1;
  }
  
  private parseDiceType(dice: string): number {
    const match = dice.match(/d(\d+)/);
    return match ? parseInt(match[1]) : 4;
  }
}