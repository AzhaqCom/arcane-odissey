/**
 * PRESENTATION ADAPTER - Narrative View Adapter
 * Conversion Domain → View Models pour les messages narratifs
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Isolation Presentation
 */

import type { NarrativeMessage, MessageType } from '../../domain/entities/NarrativeMessage';
import type { NarrativeMessageView, MessageTypeView } from '../types/NarrativeTypes';

/**
 * Adapter pur pour convertir les entités Domain en View Models
 * Aucune logique métier - transformation pure des données
 */
export class NarrativeViewAdapter {
  
  /**
   * Convertir un message Domain en View Model
   */
  static messageToView(message: NarrativeMessage): NarrativeMessageView {
    return {
      id: message.id,
      content: message.content || (message as any).message || '[Message vide]',
      type: this.convertMessageType(message.type),
      timestamp: message.timestamp,
      icon: this.getIconForType(message.type),
      priority: message.priority
    };
  }

  /**
   * Convertir une liste de messages Domain en View Models
   */
  static messagesToView(messages: readonly NarrativeMessage[]): readonly NarrativeMessageView[] {
    return messages.map(message => this.messageToView(message));
  }

  /**
   * Convertir le type de message Domain vers View
   */
  private static convertMessageType(domainType: MessageType): MessageTypeView {
    // Les types sont identiques, mais on garde la conversion pour l'isolation
    return domainType as MessageTypeView;
  }

  /**
   * Obtenir l'icône pour un type de message
   * Logique UI pure - pas de logique métier
   */
  private static getIconForType(type: MessageType): string {
    const iconMap: Record<MessageType, string> = {
      'combat': '⚔️',
      'damage': '💥', 
      'healing': '💚',
      'narrative': '📖',
      'item': '🎒',
      'spell': '✨',
      'system': '🔧'
    };
    return iconMap[type] || '•';
  }

  /**
   * Créer un message de bienvenue View Model
   * Fonction utilitaire pour l'UI
   */
  static createWelcomeMessageView(): NarrativeMessageView {
    return {
      id: `welcome-${Date.now()}`,
      content: 'Votre aventure commence...',
      type: 'system',
      timestamp: new Date(),
      icon: '🌟'
    };
  }
}