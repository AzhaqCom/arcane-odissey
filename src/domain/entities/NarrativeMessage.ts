/**
 * DOMAIN ENTITY - NarrativeMessage
 * Value Object pour les messages narratifs du jeu
 * Responsabilité : Représenter un message immutable avec ses métadonnées
 */

export type MessageType = 
  | 'combat' 
  | 'narrative' 
  | 'item' 
  | 'spell' 
  | 'system' 
  | 'damage' 
  | 'healing';

export type MessagePriority = 'low' | 'normal' | 'high';

/**
 * NARRATIVE MESSAGE - Value Object
 * Représente un message narratif immutable du jeu
 */
export class NarrativeMessage {
  private readonly _id: string;
  private readonly _type: MessageType;
  private readonly _content: string;
  private readonly _timestamp: Date;
  private readonly _priority: MessagePriority;

  constructor(
    type: MessageType,
    content: string,
    priority: MessagePriority = 'normal'
  ) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }
    
    this._id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this._type = type;
    this._content = content.trim();
    this._timestamp = new Date();
    this._priority = priority;
  }

  // GETTERS (Pure)
  get id(): string { return this._id; }
  get type(): MessageType { return this._type; }
  get content(): string { return this._content; }
  get timestamp(): Date { return this._timestamp; }
  get priority(): MessagePriority { return this._priority; }

  // BUSINESS RULES (Pure Logic)

  /**
   * Vérifier si le message est considéré comme important
   */
  isImportant(): boolean {
    return this._priority === 'high' || this._type === 'damage' || this._type === 'combat';
  }

  /**
   * Vérifier si le message est lié au combat
   */
  isCombatRelated(): boolean {
    return ['combat', 'damage', 'healing', 'spell'].includes(this._type);
  }

  /**
   * Obtenir une représentation string du message pour logs/debug
   */
  toString(): string {
    return `[${this._type.toUpperCase()}] ${this._content}`;
  }

  /**
   * Créer un message avec une priorité différente (immutable)
   */
  withPriority(newPriority: MessagePriority): NarrativeMessage {
    return new NarrativeMessage(this._type, this._content, newPriority);
  }
}