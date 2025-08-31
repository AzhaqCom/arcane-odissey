/**
 * INFRASTRUCTURE - Game Scenes Data
 * Données des scènes de jeu pour le Scene System
 */

import type { SceneData } from './types/SceneData';

export const SCENES_DATA: SceneData[] = [
  // SCÈNE D'INTRODUCTION - Taverne
  {
    id: 'tavern_start',
    type: 'text',
    title: 'La Taverne du Dragon Noir',
    description: `L'atmosphère chaleureuse de la taverne contraste avec l'air mystérieux qui règne ce soir.`,
    metadata: {
      environment: 'indoor',
      timeOfDay: 'night',
      safety: 'safe',
      lighting: 'dim'
    },
    content: {
      text: `Vous êtes assis dans la taverne du Dragon Noir, savourant une chope de bière après une longue journée de voyage. L'ambiance est chaleureuse : le feu crépite dans l'âtre, des aventuriers échangent des histoires, et le tavernier Tom nettoie ses chopes avec un sourire bienveillant.Soudain, un vieil homme au regard perçant s'approche de votre table. Il porte une cape sombre et ses yeux brillent d'une lueur mystérieuse."Jeune aventurier," dit-il d'une voix grave, "j'ai une proposition qui pourrait changer votre destin..."`,
      contextualSpells: ['detect_magic', 'insight']
    },
    choices: [
      {
        id: 'listen',
        text: 'Écouter sa proposition',
        targetSceneId: 'old_man_proposal'
      },
      {
        id: 'decline',
        text: 'Décliner poliment et partir',
        targetSceneId: 'tavern_leave'
      },
      {
        id: 'investigate',
        text: `Observer l'homme attentivement`,
        targetSceneId: 'old_man_investigation'
      }
    ]
  },

  // INVESTIGATION DU VIEIL HOMME
  {
    id: 'old_man_investigation',
    type: 'investigation',
    title: 'Qui est cet homme ?',
    description: `Vous observez attentivement l'étranger pour déceler ses intentions.`,
    metadata: {
      environment: 'indoor',
      timeOfDay: 'night',
      safety: 'safe',
      lighting: 'dim'
    },
    content: {
      clues: [
        {
          id: 'expensive_clothes',
          text: 'Ses vêtements sont de belle qualité, suggérant une certaine richesse.',
          difficulty: 10,
          found: false
        },
        {
          id: 'magic_aura',
          text: 'Une légère aura magique émane de ses bijoux.',
          difficulty: 15,
          found: false
        },
        {
          id: 'noble_bearing',
          text: 'Sa posture et ses manières trahissent une éducation noble.',
          difficulty: 12,
          found: false
        }
      ],
      skillChecks: [
        {
          skill: 'Insight',
          dc: 13,
          successText: `L'homme semble sincère, bien qu'il cache quelque chose d'important.`,
          failureText: 'Vous ne parvenez pas à percer ses intentions.'
        },
        {
          skill: 'Investigation',
          dc: 15,
          successText: `Vous remarquez qu'il porte une bague avec le sceau d'une famille noble.`,
          failureText: 'Rien de particulier ne vous saute aux yeux.'
        }
      ]
    },
    choices: [
      {
        id: 'accept_proposal',
        text:  `✅ L'homme semble digne de confiance, écouter sa proposition `,
        targetSceneId: 'old_man_proposal'
      },
      {
        id: 'stay_cautious',
        text: '⚠️ Rester prudent mais écouter quand même',
        targetSceneId: 'old_man_proposal'
      },
      {
        id: 'leave_now',
        text: '🚪 Quelque chose cloche, partir immédiatement',
        targetSceneId: 'tavern_leave'
      }
    ]
  },

  // PROPOSITION DU VIEIL HOMME
  {
    id: 'old_man_proposal',
    type: 'dialogue',
    title: 'Une Quête Mystérieuse',
    description: 'Le vieil homme vous révèle les détails de sa proposition.',
    metadata: {
      environment: 'indoor',
      timeOfDay: 'night',
      safety: 'safe',
      lighting: 'dim'
    },
    content: {
      npcId: 'mysterious_old_man',
      dialogue: [
        {
          speaker: 'npc',
          text: 'Je suis Lord Aldric de Ravenscroft. Ma fille a disparu il y a trois jours près de la forêt maudite.',
          emotion: 'sad'
        },
        {
          speaker: 'npc',
          text:  `Les gardes du village n'osent pas s'y aventurer... mais vous, vous avez l'air différent. `,
          emotion: 'neutral'
        },
        {
          speaker: 'npc',
          text:  `Je vous offre 200 pièces d'or si vous me la ramenez saine et sauve. Acceptez-vous ? `,
          emotion: 'happy'
        }
      ]
    },
    choices: [
      {
        id: 'accept_quest',
        text:  `⚔️ J'accepte votre quête, Lord Aldric `,
        targetSceneId: 'forest_entrance',
        effects: [
          { type: 'gain_xp', target: 'player', value: '50' },
          { type: 'add_item', target: 'inventory', value: 'quest_scroll' }
        ]
      },
      {
        id: 'negotiate',
        text:  `💰 300 pièces d'or et c'est d'accord `,
        targetSceneId: 'negotiation_scene'
      },
      {
        id: 'refuse_quest',
        text:  `❌ Désolé, c'est trop dangereux pour moi `,
        targetSceneId: 'tavern_leave'
      }
    ]
  },

  // ENTRÉE DE LA FORÊT
  {
    id: 'forest_entrance',
    type: 'text',
    title:  `L'Orée de la Forêt Maudite `,
    description:  `Vous vous tenez à l'entrée d'une forêt sombre et inquiétante. `,
    metadata: {
      environment: 'outdoor',
      timeOfDay: 'dawn',
      safety: 'moderate',
      lighting: 'dim',
      weather: 'fog'
    },
    content: {
      text: `L'aube perce à peine à travers les nuages sombres quand vous atteignez l'orée de la forêt maudite.
Des brumes épaisses s'élèvent entre les arbres centenaires, créant des formes fantomatiques qui semblent danser dans la pénombre. Le silence est troublant - aucun chant d'oiseau, aucun bruissement de petits animaux.
Seuls les gémissements du vent dans les branches mortes viennent rompre ce calme inquiétant.
Au loin, vous apercevez un sentier qui s'enfonce dans les profondeurs de la forêt. C'est par là que la fille de Lord Aldric a dû passer...`,
      contextualSpells: ['light', 'detect_magic', 'protection_from_evil']
    },
    choices: [
      {
        id: 'take_main_path',
        text: '🛤️ Suivre le sentier principal',
        targetSceneId: 'forest_ambush'
      },
      {
        id: 'sneak_around',
        text: '🌿 Contourner par les buissons (Discrétion)',
        targetSceneId: 'forest_stealth'
      },
      {
        id: 'cast_spell_first',
        text:  `✨ Lancer un sort de détection avant d'avancer `,
        targetSceneId: 'magical_detection'
      },
      {
        id: 'go_back',
        text: '↩️ Finalement, faire demi-tour',
        targetSceneId: 'tavern_start'
      }
    ]
  },

  // EMBUSCADE DANS LA FORÊT - COMBAT COMPLET
  {
    id: 'forest_ambush',
    type: 'combat',
    title: 'Embuscade de Gobelins !',
    description: 'Des créatures malveillantes surgissent des buissons !',
    metadata: {
      environment: 'outdoor',
      timeOfDay: 'dawn',
      safety: 'dangerous',
      lighting: 'dim',
      weather: 'fog'
    },
    content: {
      // Ennemis à instancier - Système avec count
      enemies: [
        { 
          templateId: 'goblin_scout',
          customName: 'Gobelin Éclaireur',
          level: 2,
          count: 1, // 2 éclaireurs
          position: { x: 8, y: 2 },
          alternativePositions: [
            { x: 10, y: 3 } // Position du 2e éclaireur
          ]
        },
        { 
          templateId: 'goblin', 
          customName: 'Gobelin Guerrier',
          level: 1,
          count: 1,
          position: { x: 9, y: 6 }
        }
      ],
      
      // Alliés éventuels
      allies: [],
      
      // Configuration tactique
      combat: {
        gridSize: { width: 12, height: 8 },
        playerStartPosition: { x: 2, y: 6 }, // Position de départ du joueur
        initiativeBonus: 0,
        surpriseRound: false,
        environment: 'forest'
      },
      
      // Terrain tactique
      terrain: [
        { 
          x: 5, y: 3, 
          type: 'difficult', 
          cover: 'half',
          description: 'Buisson épais',
          movementCost: 2
        },
        { 
          x: 6, y: 4, 
          type: 'difficult', 
          cover: 'half',
          description: 'Buisson dense', 
          movementCost: 2
        },
        { 
          x: 3, y: 1, 
          type: 'normal', 
          cover: 'three_quarters',
          description: 'Chêne centenaire',
          movementCost: 1
        },
        { 
          x: 10, y: 7, 
          type: 'normal', 
          cover: 'half',
          description: 'Rocher mousu',
          movementCost: 1
        }
      ],
      
      // Conditions de victoire/défaite
      objectives: {
        victory: 'defeat_all_enemies',
        defeat: 'player_death',
        special: []
      },
      
      // Récompenses de combat
      rewards: {
        xp: 150,
        gold: 25,
        items: ['goblin_ear', 'rusty_dagger'],
        reputation: { faction: 'villagers', points: 5 }
      },
      
      // Effets d'ambiance
      ambiance: {
        backgroundMusic: 'forest_combat',
        soundEffects: ['leaves_rustle', 'goblin_growl'],
        lighting: 'dim_forest',
        weather: 'light_fog'
      }
    },
    
    // Choix post-combat (affichés après résolution)
    choices: [
      {
        id: 'victory_continue',
        text: '🏆 Fouiller les corps et continuer plus profondément',
        targetSceneId: 'forest_deeper',
        condition: { type: 'combat_result', value: 'victory' },
        effects: [
          { type: 'gain_xp', target: 'player', value: '150' },
          { type: 'gain_gold', target: 'player', value: '25' },
          { type: 'add_item', target: 'inventory', value: 'goblin_ear' },
          { type: 'add_item', target: 'inventory', value: 'rusty_dagger' }
        ]
      },
      {
        id: 'defeat_retreat',
        text: '💀 Battre en retraite vers la taverne',
        targetSceneId: 'tavern_start',
        condition: { type: 'combat_result', value: 'defeat' },
        effects: [
          { type: 'lose_hp', target: 'player', value: '50%' },
          { type: 'lose_gold', target: 'player', value: '10' }
        ]
      }
    ]
  },

  // SORTIR DE LA TAVERNE
  {
    id: 'tavern_leave',
    type: 'text',
    title:  `Retour à l'Auberge `,
    description: 'Vous décidez de ne pas vous mêler de cette histoire.',
    metadata: {
      environment: 'indoor',
      timeOfDay: 'night',
      safety: 'safe',
      lighting: 'bright'
    },
    content: {
      text: `Vous remerciez poliment le vieil homme mais déclinez sa proposition. Après tout, une forêt maudite et une disparition mystérieuse, cela sent les ennuis à plein nez.

Vous finissez votre bière tranquillement et montez dans votre chambre à l'étage. Demain, vous reprendrez la route vers la prochaine ville.

Parfois, la prudence est la meilleure des vertus pour un aventurier...

**FIN - Chemin de la Prudence**

*Vous avez évité les dangers, mais aussi les récompenses. Une autre aventure vous attend peut-être ailleurs.*`
    },
    choices: [
      {
        id: 'restart',
        text:  `🔄 Recommencer l'aventure `,
        targetSceneId: 'tavern_start'
      }
    ]
  }
];

export default SCENES_DATA;