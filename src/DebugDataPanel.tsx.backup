/**
 * PRESENTATION - Debug Data Panel
 * Composant pour tester et démontrer notre nouvelle infrastructure
 */

import React, { useState } from 'react';
import { useRepositories, useGameData } from '../hooks/useRepositories';
import { logger } from '../../infrastructure/services/Logger';

export const DebugDataPanel: React.FC = () => {
  const { weaponRepository, spellRepository, characterRepository } = useRepositories();
  const { getStats, searchWeapons, searchSpells } = useGameData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeaponId, setSelectedWeaponId] = useState('dagger');
  const [selectedSpellId, setSelectedSpellId] = useState('magic_missile');
  
  // États pour les données
  const [weaponData, setWeaponData] = useState<any>(null);
  const [spellData, setSpellData] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any>({ weapons: [], spells: [] });
  
  const handleLoadWeapon = () => {
    logger.ui('Loading weapon for debug', { id: selectedWeaponId });
    const weapon = weaponRepository.getWeapon(selectedWeaponId);
    setWeaponData(weapon);
  };
  
  const handleLoadSpell = () => {
    logger.ui('Loading spell for debug', { id: selectedSpellId });
    const spell = spellRepository.getSpell(selectedSpellId);
    setSpellData(spell);
  };
  
  const handleLoadCharacters = () => {
    logger.ui('Loading all characters for debug');
    const allCharacters = characterRepository.getAllCharacters();
    setCharacters(allCharacters);
  };
  
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    logger.ui('Searching data', { query: searchQuery });
    const weapons = searchWeapons(searchQuery);
    const spells = searchSpells(searchQuery);
    setSearchResults({ weapons, spells });
  };
  
  const stats = getStats();
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px',
      fontSize: '12px',
      overflow: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
        🔧 Debug Data Panel - Phase 2.5
      </h3>
      
      {/* Stats générales */}
      <div style={{ marginBottom: '15px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <strong>📊 Store Stats:</strong>
        <div>Weapons: {stats.weapons}</div>
        <div>Spells: {stats.spells}</div>
        <div>Characters: {stats.characters}</div>
        <div>Players: {stats.players}</div>
        <div>Enemies: {stats.enemies}</div>
      </div>
      
      {/* Test Weapon Repository */}
      <div style={{ marginBottom: '15px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <strong>⚔️ Test Weapon Repository:</strong>
        <div style={{ margin: '5px 0' }}>
          <select 
            value={selectedWeaponId} 
            onChange={(e) => setSelectedWeaponId(e.target.value)}
            style={{ marginRight: '5px' }}
          >
            <option value="dagger">Dague</option>
            <option value="shortsword">Épée courte</option>
            <option value="longbow">Arc long</option>
            <option value="arccheat">Arc Du MJ</option>
          </select>
          <button onClick={handleLoadWeapon} style={{ fontSize: '11px', padding: '2px 6px' }}>
            Load
          </button>
        </div>
        {weaponData && (
          <div style={{ fontSize: '10px', backgroundColor: '#f9f9f9', padding: '4px', borderRadius: '2px' }}>
            <div><strong>{weaponData.name}</strong> ({weaponData.rarity})</div>
            <div>Dégâts: {weaponData.getDamageDisplay()}</div>
            <div>Catégorie: {weaponData.category}</div>
            <div>Description: {weaponData.description}</div>
          </div>
        )}
      </div>
      
      {/* Test Spell Repository */}
      <div style={{ marginBottom: '15px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <strong>✨ Test Spell Repository:</strong>
        <div style={{ margin: '5px 0' }}>
          <select 
            value={selectedSpellId} 
            onChange={(e) => setSelectedSpellId(e.target.value)}
            style={{ marginRight: '5px' }}
          >
            <option value="firebolt">Trait de feu</option>
            <option value="magic_missile">Projectile magique</option>
            <option value="fireball">Boule de feu</option>
            <option value="cure_wounds">Soin des blessures</option>
          </select>
          <button onClick={handleLoadSpell} style={{ fontSize: '11px', padding: '2px 6px' }}>
            Load
          </button>
        </div>
        {spellData && (
          <div style={{ fontSize: '10px', backgroundColor: '#f9f9f9', padding: '4px', borderRadius: '2px' }}>
            <div><strong>{spellData.name}</strong> (Niveau {spellData.level})</div>
            <div>École: {spellData.school}</div>
            <div>Temps: {spellData.castingTime}</div>
            {spellData.combatProperties.projectiles && (
              <div>Projectiles: {spellData.combatProperties.projectiles}</div>
            )}
            <div>Classes: {spellData.classes || 'N/A'}</div>
          </div>
        )}
      </div>
      
      {/* Test Character Repository */}
      <div style={{ marginBottom: '15px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <strong>👤 Test Character Repository:</strong>
        <div style={{ margin: '5px 0' }}>
          <button onClick={handleLoadCharacters} style={{ fontSize: '11px', padding: '2px 6px' }}>
            Load All Characters
          </button>
        </div>
        {characters.length > 0 && (
          <div style={{ fontSize: '10px', backgroundColor: '#f9f9f9', padding: '4px', borderRadius: '2px' }}>
            {characters.map(char => (
              <div key={char.id} style={{ marginBottom: '3px' }}>
                <strong>{char.name}</strong> - {char.class} Lv.{char.level} ({char.type})
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Test Search */}
      <div style={{ marginBottom: '15px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <strong>🔍 Test Search:</strong>
        <div style={{ margin: '5px 0' }}>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            style={{ width: '120px', marginRight: '5px' }}
          />
          <button onClick={handleSearch} style={{ fontSize: '11px', padding: '2px 6px' }}>
            Search
          </button>
        </div>
        {(searchResults.weapons.length > 0 || searchResults.spells.length > 0) && (
          <div style={{ fontSize: '10px', backgroundColor: '#f9f9f9', padding: '4px', borderRadius: '2px' }}>
            {searchResults.weapons.length > 0 && (
              <div>
                <strong>Armes:</strong> {searchResults.weapons.map((w: any) => w.name).join(', ')}
              </div>
            )}
            {searchResults.spells.length > 0 && (
              <div>
                <strong>Sorts:</strong> {searchResults.spells.map((s: any) => s.name).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
        Phase 2.5 - Infrastructure Foundation ✅
      </div>
    </div>
  );
};