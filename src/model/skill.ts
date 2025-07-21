import { Unit } from "./unit";

type AllowedAttributes = 'hp' | 'mp' | 'inFight' | 'gunFight' | 'spd' | 'def' | 'luck' | 'act' | 'cast' | 'will' | 'tension' | 'turn';

interface Skill {
    id: number,
    name: string,
    type: string,
    cost: Partial<Record<AllowedAttributes, number>>,
    attribute: {
        dmg: { min: number, max: number } | null,
        buff: Partial<Record<AllowedAttributes, number>> | null,
        debuff: Partial<Record<AllowedAttributes, number>> | null,
    },
}

interface SkillRef extends Skill{
    unit: Unit
}

export { Skill, SkillRef }