import { SpriteData, PosComp } from "kaplay"

interface Unit {
    name: String,
    sprite: SpriteData,
    attribute: {
        hp: Number,
        mp: Number,
        maxHp: Number,
        maxMp: Number,
        inFight: Number,
        gunFight: Number,
        will: Number,
        spd: Number,
        luck: Number,
        act: Number,
        cast: Number,
        status: String
    },
    action: String
}

interface Position {
    value: PosComp,
    unit: Unit
}

export { Unit, Position }
