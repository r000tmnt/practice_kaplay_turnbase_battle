import { PosComp } from "kaplay"
interface Unit {
    name: string,
    attribute: {
        hp: number,
        mp: number,
        maxHp: number,
        maxMp: number,
        inFight: number,
        gunFight: number,
        will: number,
        spd: number,
        def: number,
        luck: number,
        act: number,
        cast: number,
        status: string
    },
    action: string,
}

interface Position {
    value: PosComp,
    unit: Unit
}

export { Unit, Position }
