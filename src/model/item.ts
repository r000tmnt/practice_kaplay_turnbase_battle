import { Unit } from "./unit"

type AllowedAttributes = 'hp' | 'mp' | 'inFight' | 'gunFight' | 'spd' | 'def' | 'luck' | 'act' | 'cast' | 'will' | 'tension' | 'turn'

interface Item {
    id: number,
    name: string,
    type: number,
    stackable: boolean,
    amount?: number,
    desc: string,
    effect: Record<AllowedAttributes, number>,
}

interface ItemRef extends Item{
    unit: Unit
}

export { Item, ItemRef }