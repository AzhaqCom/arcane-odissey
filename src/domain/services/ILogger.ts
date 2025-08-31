/**
 * DOMAIN SERVICE INTERFACE - ILogger
 * Interface pour le logging sans dépendance infrastructure
 */

export interface ILogger {
  /**
   * Log des informations générales
   */
  info(module: string, message: string, data?: any): void;
  
  /**
   * Log des avertissements
   */
  warn(module: string, message: string, data?: any): void;
  
  /**
   * Log des erreurs
   */
  error(module: string, message: string, error?: any): void;
  
  /**
   * Log de debug (développement)
   */
  debug(module: string, message: string, data?: any): void;
  
  /**
   * Log spécifique au game
   */
  game(message: string, data?: any): void;
}