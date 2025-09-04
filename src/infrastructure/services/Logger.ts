/**
 * INFRASTRUCTURE - Logger Service
 * Système de logging centralisé pour remplacer console.log
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly category: string;
  readonly message: string;
  readonly data?: any;
}

/**
 * Service de logging centralisé
 * Permet un contrôle fin des logs et facilite le debugging
 */
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Éviter l'accumulation infinie
  private logLevel: LogLevel = 'debug'; // Mode développement - afficher tous les logs
  
  private constructor() {}
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * Configuration du niveau de log minimum
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  /**
   * Configuration du nombre maximum de logs stockés
   */
  setMaxLogs(max: number): void {
    this.maxLogs = max;
    this.trimLogs();
  }
  
  // MÉTHODES DE LOGGING
  
  debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }
  
  info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }
  
  warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }
  
  error(category: string, message: string, data?: any): void {
    this.log('error', category, message, data);
  }
  
  // MÉTHODES SPÉCIALISÉES POUR LES DOMAINES
  
  combat(message: string, data?: any): void {
    this.info('COMBAT', message, data);
  }
  
  spell(message: string, data?: any): void {
    this.info('SPELL', message, data);
  }
  
  scene(message: string, data?: any): void {
    this.info('SCENE', message, data);
  }
  
  ui(message: string, data?: any): void {
    this.debug('UI', message, data);
  }
  
  data(message: string, data?: any): void {
    this.debug('DATA', message, data);
  }
  
  ai(message: string, data?: any): void {
    this.info('AI', message, data);
  }
  
  repo(message: string, data?: any): void {
    this.debug('REPO', message, data);
  }
  
  game(message: string, data?: any): void {
    this.info('GAME', message, data);
  }
  
  // MÉTHODES D'ACCÈS AUX LOGS
  
  /**
   * Obtenir tous les logs
   */
  getAllLogs(): readonly LogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Obtenir les logs par niveau
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
  
  /**
   * Obtenir les logs par catégorie
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }
  
  /**
   * Obtenir les logs récents (dernières X minutes)
   */
  getRecentLogs(minutes: number = 5): LogEntry[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => log.timestamp >= cutoff);
  }
  
  /**
   * Vider tous les logs
   */
  clear(): void {
    this.logs = [];
  }
  
  /**
   * Exporter les logs en format lisible
   */
  export(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const data = log.data ? ` | Data: ${JSON.stringify(log.data)}` : '';
        return `[${timestamp}] ${log.level.toUpperCase()} [${log.category}] ${log.message}${data}`;
      })
      .join('\n');
  }
  
  // MÉTHODES PRIVÉES
  
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    // Vérifier si le niveau est suffisant
    if (!this.shouldLog(level)) {
      return;
    }
    
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      category: category.toUpperCase(),
      message,
      data
    };
    
    this.logs.push(logEntry);
    this.trimLogs();
    
    // Afficher aussi en console pour le développement
    this.outputToConsole(logEntry);
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }
  
  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
  
  private outputToConsole(log: LogEntry): void {
    const timestamp = log.timestamp.toLocaleTimeString();
    const prefix = `[${timestamp}] ${log.category}:`;
    
    switch (log.level) {
      case 'debug':
        console.log(prefix, log.message, ...(log.data ? [log.data] : [])); 
        break;
      case 'info':
        console.info(prefix, log.message, ...(log.data ? [log.data] : [])); 
        break;
      case 'warn':
        console.warn(prefix, log.message, ...(log.data ? [log.data] : []));
        break;
      case 'error':
        console.error(prefix, log.message, ...(log.data ? [log.data] : []));
        break;
    }
  }
}

// Export d'une instance globale pour faciliter l'usage
export const logger = Logger.getInstance();

// Utilitaires pour configuration facile
export const setLogLevel = (level: LogLevel) => logger.setLogLevel(level);
export const clearLogs = () => logger.clear();
export const exportLogs = () => logger.export();