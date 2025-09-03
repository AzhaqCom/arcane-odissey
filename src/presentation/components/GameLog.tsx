/**
 * PRESENTATION - GameLog Component
 * Journal narratif pur pour les événements du jeu D&D
 * Respecte ARCHITECTURE_GUIDELINES.md - Règle #3 Dumb Presentation
 * ✅ Aucun import Domain/Application - Isolation complète
 */

import React, { useEffect, useRef } from 'react';
import type { 
  NarrativeMessageView, 
  MessageTypeView, 
  GameLogProps 
} from '../types/NarrativeTypes';

export const GameLog: React.FC<GameLogProps> = ({ 
  messages = [], 
  maxMessages = 15, 
  height = '300px',
  autoScroll = true
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas à chaque nouveau message (logique UI pure)
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Limiter le nombre de messages affichés (logique UI pure)
  const displayedMessages = messages.slice(-maxMessages);

  // Styles par type de message (logique UI pure)
  const getMessageStyle = (type: MessageTypeView): React.CSSProperties => {
    const styleMap: Record<MessageTypeView, React.CSSProperties> = {
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
      },
      'movement': {
        color: '#4fc3f7',
        backgroundColor: '#e1f5fe',
        padding: '2px 4px',
        borderRadius: '3px'
      },
      'attack_success': {
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        padding: '2px 4px',
        borderRadius: '3px',
        fontWeight: 'bold'
      },
      'attack_miss': {
        color: '#9e9e9e',
        backgroundColor: '#f5f5f5',
        padding: '2px 4px',
        borderRadius: '3px'
      },
      'critical_hit': {
        color: '#ff1744',
        backgroundColor: '#ffebee',
        padding: '2px 4px',
        borderRadius: '3px',
        fontWeight: 'bold',
        animation: 'pulse 0.5s'
      },
      'turn_start': {
        color: '#1976d2',
        backgroundColor: '#e3f2fd',
        padding: '2px 4px',
        borderRadius: '3px',
        fontWeight: 'bold'
      },
      'turn_end': {
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
  const getMessageIcon = (type: MessageTypeView): string => {
    const iconMap: Record<MessageTypeView, string> = {
      'combat': '⚔️',
      'damage': '💥',
      'healing': '💚',
      'narrative': '📖',
      'item': '🎒',
      'spell': '✨',
      'system': '🔧',
      'movement': '🏃',
      'attack_success': '🎯',
      'attack_miss': '🚫',
      'critical_hit': '💥',
      'turn_start': '🎲',
      'turn_end': '⏹️'
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
          displayedMessages.map((message, index) => (
            <div 
              key={`${message.id}-${index}`} 
              className={`game-log-message ${message.type}`} 
              style={getMessageStyle(message.type)}
            >
              <span className="log-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
              <span className="log-icon">{message.icon || getMessageIcon(message.type)}</span>
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
 * ✅ Hook pur sans import Domain - Respecte ARCHITECTURE_GUIDELINES.md
 * Gestion simplifiée des messages View Models uniquement
 */
export const useGameLog = () => {
  // Initialisation avec un message de bienvenue (View Model pur)
  const [messages, setMessages] = React.useState<readonly NarrativeMessageView[]>(() => {
    return [{
      id: `welcome-${Date.now()}`,
      content: 'Votre aventure commence...',
      type: 'system',
      timestamp: new Date(),
      icon: '🌟'
    }];
  });

  const addMessage = React.useCallback((message: NarrativeMessageView) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addMessages = React.useCallback((newMessages: readonly NarrativeMessageView[]) => {
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