import React from 'react';
import type { GameTime } from '../../domain/entities';

interface TimeDisplayProps {
  gameTime: GameTime;
  showDayNight?: boolean;
  showPauseButton?: boolean;
  className?: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  gameTime,
  showDayNight = true,
  showPauseButton = false,
  className = ''
}) => {
  
  // Formatage du temps
  const formattedTime = `Jour ${gameTime.day} - ${gameTime.hour.toString().padStart(2, '0')}:${gameTime.minute.toString().padStart(2, '0')}`;
  
  // Détermination de la période
  const getTimeOfDay = () => {
    const hour = gameTime.hour;
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'dusk';
    return 'night';
  };
  
  const timeOfDay = getTimeOfDay();

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case 'dawn': return '🌅';
      case 'day': return '☀️';
      case 'dusk': return '🌆';
      case 'night': return '🌙';
      default: return '⏰';
    }
  };

  const getTimeOfDayLabel = () => {
    switch (timeOfDay) {
      case 'dawn': return 'Aube';
      case 'day': return 'Jour';
      case 'dusk': return 'Crépuscule';
      case 'night': return 'Nuit';
      default: return '';
    }
  };

  return (
    <div className={`time-display ${className}`}>
      <div className="time-info">
        <span className="time-text">{formattedTime}</span>
        {showDayNight && (
          <span className="time-period">
            {getTimeIcon()} {getTimeOfDayLabel()}
          </span>
        )}
      </div>
      
      {showPauseButton && (
        <button 
          className="time-toggle"
          onClick={() => {/* TODO: Implémenter pause/resume */}}
        >
          ▶️
        </button>
      )}
    </div>
  );
};