● 🚀 PARFAIT ! On enchaîne avec l'ÉTAPE 1.2 !

  ⚡ ÉTAPE 1.2 EN COURS : Factory ECS avec armes réelles (45min)

  Je vais modifier ECSEntityFactory.ts pour intégrer WeaponRepository et charger les vraies armes
  depuis equipment.weapons :

● Update(arcane-odissey\src\domain\factories\ECSEntityFactory.ts)
  ⎿  Updated arcane-odissey\src\domain\factories\ECSEntityFactory.ts with 1 addition
        8    import { type ECSEntity, ECSEntityBuilder } from '../entities/ECS';
        9    import { SpellSlots } from '../entities/Spell';
       10    import type { EnemySpec, ActionsRemaining } from '../types';
       11 +  import type { IWeaponRepository } from 
          + '../../infrastructure/repositories/WeaponRepository';
       12    
       13    // Interface temporaire pour la transition
       14    interface EnemyTemplate {

● Je dois d'abord mettre à jour l'interface EnemyTemplate dans le factory pour qu'elle corresponde à
  la nouvelle structure :

● Update(arcane-odissey\src\domain\factories\ECSEntityFactory.ts)
  ⎿  Updated arcane-odissey\src\domain\factories\ECSEntityFactory.ts with 18 additions and 2 removals
       10    import type { EnemySpec, ActionsRemaining } from '../types';
       11    import type { IWeaponRepository } from 
            '../../infrastructure/repositories/WeaponRepository';
       12    
       13 -  // Interface temporaire pour la transition
       13 +  // Interface temporaire pour la transition - mise à jour selon enemies.ts
       14    interface EnemyTemplate {
       15      readonly id: string;
       16      readonly name: string;
     ...
       26      readonly maxHp: number;
       27      readonly armorClass: number;
       28      readonly speed: number;
       29 -    readonly actions: readonly string[];
       29 +    readonly equipment: {
       30 +      readonly weapons: readonly string[];
       31 +      readonly armor?: readonly string[];
       32 +      readonly items?: readonly string[];
       33 +    };
       34 +    readonly specialAbilities?: readonly string[];
       35 +    readonly combatModifiers?: {
       36 +      readonly attackBonus?: number;
       37 +      readonly damageBonus?: number;
       38 +      readonly resistances?: readonly string[];
       39 +      readonly vulnerabilities?: readonly string[];
       40 +    };
       41 +    readonly aiProfile?: {
       42 +      readonly behavior: 'aggressive' | 'defensive' | 'tactical' | 'cowardly';
       43 +      readonly preferredRange: 'melee' | 'ranged' | 'mixed';
       44 +      readonly aggroRadius?: number;
       45 +    };
       46      readonly lootTable?: ReadonlyArray<{ itemId: string; dropChance: number; }>;
       47    }
       48

● Maintenant je vais ajouter une méthode pour résoudre les armes d'équipement vers des objets Weapon
  et modifier createFromEnemyTemplate :

● Update(arcane-odissey\src\domain\factories\ECSEntityFactory.ts)
  ⎿  Updated arcane-odissey\src\domain\factories\ECSEntityFactory.ts with 1 addition
       116        instanceId: string,
       117        initiative: number,
       118        position: Position,
       119 +      weaponRepository: IWeaponRepository,
       120        currentHp?: number
       121      ): ECSEntity {
       122        const proficiencyBonus = 
             ECSEntityFactory.calculateProficiencyBonus(template.level);

● Maintenant je vais modifier la section withWeapons pour charger les vraies armes :

● Read(arcane-odissey\src\domain\factories\ECSEntityFactory.ts)
  ⎿  Read 30 lines (ctrl+r to expand)