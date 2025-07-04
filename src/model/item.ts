type AllowedAttributes = 'hp' | 'mp' | 'inFight' | 'gunFight' | 'spd' | 'def' | 'luck' | 'act' | 'cast' | 'will' | 'tension' | 'turn'

interface Item {
    id: number,
    name: string,
    type: number,
    stackable: boolean,
    amount?: number,
    desc: string,
    effect: {
        target: Record<AllowedAttributes, number>,
    },
}

export { Item }