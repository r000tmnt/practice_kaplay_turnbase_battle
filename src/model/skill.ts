type AllowedAttributes = 'hp' | 'mp' | 'inFight' | 'gunFight' | 'spd' | 'def' | 'luck' | 'act' | 'cast' | 'will' | 'tension' | 'turn';

interface Skill {
    id: number,
    name: string,
    type: string,
    cost: Record<AllowedAttributes, number>,
    attribute: {
        dmg: { min: number, max: number } | null,
        buff: Record<AllowedAttributes, number> | null,
        debuff: Record<AllowedAttributes, number> | null,
    },

}

export { Skill }