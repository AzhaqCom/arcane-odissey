/**
 * PRESENTATION - GameLog Component
 * Journal narratif pur pour les événements du jeu D&D
 * Responsabilité : Affichage des messages pré-formatés uniquement
 */

import React, { useEffect, useRef } from 'react';
import type { NarrativeMessage, MessageType } from '../../domain/entities/NarrativeMessage';
import { GameNarrativeService } from '../../domain/services/GameNarrativeService';

interface GameLogProps {
  messages: NarrativeMessage[];
  maxMessages?: number;
  height?: string;
}

export const GameLog: React.FC<GameLogProps> = ({ 
  messages = [], // ← Protection contre undefined (défense en profondeur)
  maxMessages = 15, 
  height = '300px' 
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas à chaque nouveau message (logique UI pure)
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  // Limiter le nombre de messages affichés (logique UI pure)
  const displayedMessages = messages.slice(-maxMessages);

  // Styles par type de message (logique UI pure)
  const getMessageStyle = (type: MessageType): React.CSSProperties => {
    const styleMap: Record<MessageType, React.CSSProperties> = {
      'combat': { 
        color: '#d32f2f', 
        fontWeight: 'bold' 
      },
      'damage': { 
        color: '#d32f2f', 
        backgroundColor: '#ffebee',
        padding: '2px 4px',
        borderRadius: '3px'
      },
      'healing': { 
        color: '#388e3c', 
        backgroundColor: '#e8f5e9',
        padding: '2px 4px',
        borderRadius: '3px'
      },
      'narrative': { 
        color: '#1976d2', 
        fontStyle: 'italic'
      },
      'item': { 
        color: '#f57c00', 
        fontWeight: 'bold' 
      },
      'spell': { 
        color: '#7b1fa2', 
        fontWeight: 'bold' 
      },
      'system': { 
        color: '#616161', 
        fontSize: '0.9em' 
      }
    };
    
    return {
      ...styleMap[type],
      marginBottom: '2px'
    };
  };

  // Icônes par type de message (logique UI pure)
  const getMessageIcon = (type: MessageType): string => {
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
  };

  return (
    <div className="game-log" style={{ height }}>
      <div className="game-log-content" ref={logRef}>
        {displayedMessages.length === 0 ? (
          <div className="game-log-message system">
            <span className="log-timestamp">{new Date().toLocaleTimeString()}</span>
            Votre aventure commence...
          </div>
        ) : (
          displayedMessages.map((message) => (
            <div 
              key={message.id} 
              className={`game-log-message ${message.type}`} 
              style={getMessageStyle(message.type)}
            >
              <span className="log-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
              <span className="log-icon">{getMessageIcon(message.type)}</span>
              <span className="log-content">{message.content}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * HOOK - useGameLog
 * Gestion simplifiée des messages narratifs pré-formatés
 */
export const useGameLog = () => {
  // Initialisation avec un message de bienvenue aléatoire
  const [messages, setMessages] = React.useState<NarrativeMessage[]>(() => [
    GameNarrativeService.createWelcomeMessage()
  ]);

  const addMessage = React.useCallback((message: NarrativeMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addMessages = React.useCallback((newMessages: NarrativeMessage[]) => {
    setMessages(prev => [...prev, ...newMessages]);
  }, []);

  const clearMessages = React.useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    addMessages,
    clearMessages
  };
};

// ============================================================================
// ANCIEN CODE SUPPRIMÉ - 31/08/2025
// GameLogMessages, LogEntry, etc. remplacés par NarrativeMessage + GameNarrativeService
// Logique métier déplacée vers la couche Domain conformément aux ARCHITECTURE_GUIDELINES.md
// ============================================================================