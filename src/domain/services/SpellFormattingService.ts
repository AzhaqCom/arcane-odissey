/**
 * DOMAIN - SpellFormattingService
 * Service de domaine pour le formatage des sorts et de leurs effets
 * Responsabilité: Logique métier pure pour l'affichage des caractéristiques de sorts
 */

import type { Spell } from '../entities/Spell';

export class SpellFormattingService {
  
  /**
   * Formater l'affichage des dégâts d'un sort
   * @param spell Le sort
   * @returns Chaîne formatée des dégâts (ex: "3d6+2" ou "1d8 (2 projectiles)")
   */
  static formatDamageDisplay(spell: Spell): string {
    if (!spell.effects.damage || spell.effects.damage.length === 0) {
      return '';
    }

    const damageEffect = spell.effects.damage[0];
    let damageText = `${damageEffect.diceCount}d${damageEffect.diceType}`;
    
    // Ajouter le modificateur si présent
    if (damageEffect.modifier && damageEffect.modifier > 0) {
      damageText += `+${damageEffect.modifier}`;
    }
    
    // Ajouter les projectiles si applicable
    if (spell.combatProperties.projectiles && spell.combatProperties.projectiles > 1) {
      damageText += ` (${spell.combatProperties.projectiles} projectiles)`;
    }
    
    return damageText;
  }

  /**
   * Formater l'affichage complet d'un sort pour l'UI
   * @param spell Le sort
   * @returns Texte descriptif complet
   */
  static formatSpellDescription(spell: Spell): string {
    const parts = [`Niveau ${spell.level}`];
    
    if (spell.effects.damage) {
      parts.push(`Dégâts: ${this.formatDamageDisplay(spell)}`);
    }
    
    if (spell.effects.healing) {
      const healEffect = spell.effects.healing[0];
      parts.push(`Soins: ${healEffect.diceCount}d${healEffect.diceType}${healEffect.modifier ? `+${healEffect.modifier}` : ''}`);
    }
    
    return parts.join(' • ');
  }

  /**
   * Obtenir le texte du temps d'incantation pour l'UI
   * @param spell Le sort
   * @returns Texte lisible du casting time
   */
  static getCastingTimeDisplay(spell: Spell): string {
    switch (spell.castingTime) {
      case 'action':
        return 'Action';
      case 'bonus_action':
        return 'Action bonus';
      case 'reaction':
        return 'Réaction';
      default:
        return spell.castingTime;
    }
  }

  /**
   * Obtenir le texte de la portée pour l'UI
   * @param spell Le sort
   * @returns Texte de la portée (ex: "Contact", "9m", "Soi")
   */
  static getRangeDisplay(spell: Spell): string {
    if (spell.range.type === 'self') {
      return 'Soi';
    } else if (spell.range.type === 'touch') {
      return 'Contact';
    } else if (spell.range.type === 'ranged' && spell.range.distance) {
      return `${spell.range.distance}m`;
    }
    
    return 'Variable';
  }
}