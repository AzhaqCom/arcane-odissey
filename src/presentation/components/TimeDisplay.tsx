import React from 'react';
import type { GameTime } from '../../domain/entities';
import { TimeOfDay } from '../../domain/entities/TimeOfDay';

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
  
  // Déléguer logique temporelle à l'entité Domain
  const timeOfDayDisplay = TimeOfDay.getDisplayDataFromHour(gameTime.hour);

  return (
    <div className={`time-display ${className}`}>
      <div className="time-info">
        <span className="time-text">{formattedTime}</span>
        {showDayNight && (
          <span className="time-period">
            {timeOfDayDisplay.icon} {timeOfDayDisplay.label}
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