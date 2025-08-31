/**
 * DOMAIN SERVICE - GameNarrativeService
 * Service de génération de messages narratifs D&D
 * Responsabilité : Centraliser la logique métier de création des messages du jeu
 */

import { NarrativeMessage, type MessagePriority } from '../entities/NarrativeMessage';
import type { Position } from '../types';

/**
 * SERVICE DE GÉNÉRATION DE MESSAGES NARRATIFS
 * Toutes les méthodes sont statiques et pures (pas d'état)
 */
export class GameNarrativeService {

  // === COMBAT MESSAGES ===

  /**
   * Message de début de combat
   */
  static createCombatStartMessage(): NarrativeMessage {
    return new NarrativeMessage('combat', 'Un combat commence !', 'high');
  }

  /**
   * Message de fin de combat
   */
  static createCombatEndMessage(victory: boolean): NarrativeMessage {
    const content = victory ? 'Victoire ! Le combat se termine.' : 'Défaite... Le combat se termine.';
    return new NarrativeMessage('combat', content, 'high');
  }

  /**
   * Message d'initiative calculée
   */
  static createInitiativeMessage(
    entityName: string, 
    roll: number, 
    abilityModifier: number
  ): NarrativeMessage {
    const totalInitiative = roll + abilityModifier;
    const modifierText = abilityModifier >= 0 ? `+${abilityModifier}` : `${abilityModifier}`;
    const content = `${entityName} : ${roll} ${modifierText} = ${totalInitiative} en initiative`;
    
    return new NarrativeMessage('system', content);
  }

  /**
   * Message d'attaque avec arme
   */
  static createAttackMessage(
    attackerName: string,
    targetName: string,
    weaponName: string,
    hit: boolean,
    damage?: number
  ): NarrativeMessage {
    let content: string;
    let priority: MessagePriority = 'normal';
    
    if (hit) {
      content = `${attackerName} touche ${targetName} avec ${weaponName}`;
      if (damage) {
        content += ` et inflige ${damage} dégâts`;
        priority = damage >= 10 ? 'high' : 'normal';
      }
    } else {
      content = `${attackerName} manque ${targetName} avec ${weaponName}`;
    }
    
    return new NarrativeMessage(hit ? 'damage' : 'combat', content, priority);
  }

  /**
   * Message de mouvement d'entité
   */
  static createMovementMessage(
    entityName: string, 
    fromPos: Position, 
    toPos: Position
  ): NarrativeMessage {
    const content = `${entityName} se déplace de (${fromPos.x},${fromPos.y}) vers (${toPos.x},${toPos.y})`;
    return new NarrativeMessage('combat', content);
  }

  /**
   * Message de lancement de sort
   */
  static createSpellMessage(
    casterName: string,
    spellName: string,
    targetName?: string,
    damage?: number
  ): NarrativeMessage {
    let content = `${casterName} lance ${spellName}`;
    let priority: MessagePriority = 'normal';
    
    if (targetName) {
      content += ` sur ${targetName}`;
    }
    
    if (damage) {
      content += ` et inflige ${damage} dégâts`;
      priority = damage >= 15 ? 'high' : 'normal';
    }
    
    return new NarrativeMessage('spell', content, priority);
  }

  /**
   * Message de soins
   */
  static createHealingMessage(
    healerName: string,
    targetName: string,
    healing: number,
    source?: string
  ): NarrativeMessage {
    let content = `${targetName} récupère ${healing} points de vie`;
    if (healerName !== targetName) {
      content = `${healerName} soigne ${targetName} : ${healing} points de vie récupérés`;
    }
    if (source) {
      content += ` grâce à ${source}`;
    }
    
    const priority: MessagePriority = healing >= 20 ? 'high' : 'normal';
    return new NarrativeMessage('healing', content, priority);
  }

  /**
   * Message d'action générique
   */
  static createActionMessage(entityName: string, actionName: string): NarrativeMessage {
    const content = `${entityName} utilise l'action ${actionName}`;
    return new NarrativeMessage('combat', content);
  }

  // === PROGRESSION MESSAGES ===

  /**
   * Message de gain d'expérience
   */
  static createExperienceGainMessage(amount: number): NarrativeMessage {
    const content = `Vous gagnez ${amount} points d'expérience`;
    const priority: MessagePriority = amount >= 500 ? 'high' : 'normal';
    return new NarrativeMessage('system', content, priority);
  }

  /**
   * Message de montée de niveau
   */
  static createLevelUpMessage(characterName: string, newLevel: number): NarrativeMessage {
    const content = `${characterName} atteint le niveau ${newLevel} !`;
    return new NarrativeMessage('system', content, 'high');
  }

  // === ITEM MESSAGES ===

  /**
   * Message d'objet trouvé
   */
  static createItemFoundMessage(itemName: string, quantity: number = 1): NarrativeMessage {
    const content = quantity > 1 
      ? `Vous trouvez : ${itemName} (×${quantity})`
      : `Vous trouvez : ${itemName}`;
    return new NarrativeMessage('item', content);
  }

  /**
   * Message d'objet équipé
   */
  static createItemEquippedMessage(itemName: string): NarrativeMessage {
    const content = `Vous équipez : ${itemName}`;
    return new NarrativeMessage('item', content);
  }

  /**
   * Message d'objet vendu/acheté
   */
  static createItemTradeMessage(
    itemName: string, 
    action: 'buy' | 'sell', 
    price: number
  ): NarrativeMessage {
    const actionText = action === 'buy' ? 'achetez' : 'vendez';
    const content = `Vous ${actionText} ${itemName} pour ${price} pièces d'or`;
    return new NarrativeMessage('item', content);
  }

  // === NARRATIVE MESSAGES ===

  /**
   * Message narratif général
   */
  static createNarrativeMessage(content: string, priority: MessagePriority = 'normal'): NarrativeMessage {
    return new NarrativeMessage('narrative', content, priority);
  }

  /**
   * Message de dialogue
   */
  static createDialogueMessage(speakerName: string, dialogue: string): NarrativeMessage {
    const content = `${speakerName} : "${dialogue}"`;
    return new NarrativeMessage('narrative', content);
  }

  /**
   * Message de découverte d'environnement
   */
  static createDiscoveryMessage(discovery: string): NarrativeMessage {
    return new NarrativeMessage('narrative', discovery, 'normal');
  }

  // === SYSTEM MESSAGES ===

  /**
   * Message de bienvenue aléatoire au lancement de l'application
   */
  static createWelcomeMessage(): NarrativeMessage {
    const welcomeMessages = [
      "La fortune sourit aux audacieux",
      "L'aventure vous attend au-delà de l'horizon", 
      "Que les dés vous soient favorables",
      "Votre destinée s'écrit à chaque pas",
      "Les légendes naissent des choix courageux",
      "Chaque quête commence par un premier pas",
      "L'épée de la bravoure ne rouille jamais",
      "Dans l'ombre du danger, brille la gloire"
    ];
    
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    const selectedMessage = welcomeMessages[randomIndex];
    
    return new NarrativeMessage('narrative', selectedMessage, 'normal');
  }

  /**
   * Message de sauvegarde
   */
  static createSaveMessage(): NarrativeMessage {
    return new NarrativeMessage('system', 'Partie sauvegardée', 'low');
  }

  /**
   * Message d'erreur utilisateur (sans stack trace)
   */
  static createUserErrorMessage(errorMessage: string): NarrativeMessage {
    return new NarrativeMessage('system', `Erreur : ${errorMessage}`, 'normal');
  }
}