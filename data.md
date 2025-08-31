   arcmj:{
        name: "Arc Du MJ",
        id: "arccheat",
        type: "weapon",
        category: "ranged",
        damage: { dice: "4d10", bonus: 50, type: "intelligence" },
        damageType: "perforant",
        properties: ["ammunition", "heavy", "two-handed"],
        range: { ranged: "150/600" },
        stat: "intelligence",
        description: "Un arc d'une grande précision, fabriqué à partir du bois d'un arbre ancien.",
        rarity :"Légendaire",
        weight :3
    }

        "Projectile Magique": {
        name: "Projectile Magique",
        level: 0,
        school: "Évocation",
        castingTime: "1 action",
        range: "36 mètres",
        description: "Vous créez trois fléchettes faites d'énergie magique brillante. Chacune touche une créature de votre choix, située à portée et dans votre champ de vision. Une fléchette inflige 1d4+1 dégâts de force à la cible. Toutes les fléchettes frappent leur cible en même temps, sachant que vous pouvez toutes les diriger contre une seule et même créature ou les répartir entre plusieurs.",
        damage: { dice: "10d40", bonus: 16,type: "force" },
        projectiles: 3,
        requiresAttackRoll: false,
        targetType: "enemy",
        castableOutOfCombat: false,
        class: ["Magicien"],
      
        aiWeight: 80,           // Bon sort de base
        targetPreference: "finishing", 
        situational: {
            multipleEnemies: +20,   // Bonus contre plusieurs ennemis
            lowHPTarget: +40,       // Excellent pour achever
            guaranteedHit: +30      // Avantage : ne rate jamais
        },
      
    },