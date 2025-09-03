/**
 * PRESENTATION TYPES - Narrative View Models
 * Types purs pour l'affichage narratif - Aucun import Domain/Application
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Dumb Presentation
 */

export type MessageTypeView = 
  | 'combat'
  | 'damage' 
  | 'healing'
  | 'narrative'
  | 'item'
  | 'spell'
  | 'system';

/**
 * Message narratif pour l'affichage UI uniquement
 * Données minimales nécessaires à la présentation
 */
export interface NarrativeMessageView {
  readonly id: string;
  readonly content: string;
  readonly type: MessageTypeView;
  readonly timestamp: Date;
  readonly icon?: string;
  readonly priority?: number;
}

/**
 * Props pour le composant GameLog
 */
export interface GameLogProps {
  readonly messages: readonly NarrativeMessageView[];
  readonly maxMessages?: number;
  readonly height?: string;
  readonly autoScroll?: boolean;
}

/**
 * État du hook useGameLog
 */
export interface GameLogState {
  readonly messages: readonly NarrativeMessageView[];
  readonly addMessage: (message: NarrativeMessageView) => void;
  readonly addMessages: (messages: readonly NarrativeMessageView[]) => void;
  readonly clearMessages: () => void;
}