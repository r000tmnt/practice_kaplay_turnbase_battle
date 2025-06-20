import { Unit } from "../model/unit";
import { Skill } from "../model/skill";
import store from "../store/store";
import k from '../lib/kaplay'

const { 
    add,
    wait, 
    loop, 
    rect,
    pos,
    text,
    opacity,
    vec2,
    outline,
    easings,
    tween,
    color,
    BLACK,
    YELLOW,
    WHITE,
    RED
} = k

const updateUnitState = (obj: { name: string, attribute: Object, action: string }) => {
    const action = { type: "game/updateUnit", payload: obj };
    store.dispatch(action);
} 

const updateTensionState = (obj: { current?: number, max?: number }) => {
    const action = { type: "game/setTension", payload: obj };
    store.dispatch(action);
}

const updateWaveState = (obj: { current: number }) => {
    const action = { type: "game/setWave", payload: obj };
    store.dispatch(action);
}

const getAvailableTargets = (target: Unit ,tindex: number, start: number, end: number) => {
    // Get latest state
    const units = store.getState().game.units

    // Check if the target is in the field
    if(units[tindex].attribute.hp === 0){
        // Change target if any
        let nextTarget: Unit | null = null
        for(let i=start; i < end; i++){
        if(units[i] && units[i].attribute.hp > 0){
            nextTarget = units[i]
            break
        }
        }

        if(nextTarget) target = nextTarget

        return nextTarget
    }else{
        return target
    }
}

/**
 * Attack function
 * @param {Unit} unit - Who performs the attack
 * @param {Unit} target - Who takes damage 
 * @param {number} uindex - The index of the player unit in the unitSprites array
 * @param {number} tindex - The index of the enemy unit in the unitSprites array
 */
export const attack = async (unit: Unit, target: Unit, uIndex: number, tindex: number) => {
    const realTarget: Unit | null  = getAvailableTargets(target, tindex, 5, 10)

    if(!realTarget) return

    const tension = store.getState().game.tension

    let dmg = (unit.attribute.inFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100))) - Math.round(realTarget.attribute.def * (realTarget.attribute.def / 100))
    dmg += Math.round(dmg * (tension.current / 100)) // Add tension bonus

    const crit = unit.attribute.luck / 100

    const rng = Math.random()

    if(rng <= crit){
        dmg = Math.round(dmg * 1.5)
    }

    // If the target take defense
    if(realTarget.action === 'defense') dmg = Math.round(dmg / 2)    

    const attribute = JSON.parse(JSON.stringify(realTarget.attribute))
    attribute.hp -= (dmg > attribute.hp)? attribute.hp : dmg

    updateUnitState({ name: realTarget.name, attribute: attribute, action: realTarget.action })

    // return showText(unit, dmg, rng, crit, tindex, attribute)
    return { unit, number: dmg, crit: rng <= crit, tindex, attribute }
}
  
/**
 * Skill function
 * @param {Unit} unit - Who performs the attack
 * @param {Unit} target - Who takes damage 
 * @param {number} uindex - The index of the player unit in the unitSprites array
 * @param {number} tindex - The index of the enemy unit in the unitSprites array
 * @param {Skill} skill - The skill object
 */
export const castSkill = async (unit: Unit, target: Unit, uIndex: number, tindex: number, skill: Skill) => {
    if(skill.type !== 'Support'){
        const realTarget: Unit | null = getAvailableTargets(target, tindex, 5, 10)
        if(!realTarget) return

        const tension = store.getState().game.tension

        // 0 means ALL
        realTarget.attribute.mp -= skill.cost.mp? skill.cost.mp : realTarget.attribute.mp
        if(skill.cost.tension !== undefined) updateTensionState({ current: (skill.cost.tension)? tension.current - skill.cost.tension : 0 })

        let dmg = 0

        if(skill.type === 'InFight'){
            const baseNumber = unit.attribute.inFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100))
            const enemyDef = Math.round(realTarget.attribute.def * (realTarget.attribute.def / 100))
            dmg = baseNumber - enemyDef 
        }

        if(skill.type === 'GunFight'){
            const baseNumber = unit.attribute.gunFight + Math.round(unit.attribute.gunFight * (unit.attribute.gunFight / 100))
            const enemyDef = Math.round(realTarget.attribute.def * (realTarget.attribute.will / 100))
            dmg = baseNumber - enemyDef 
        }

        if(skill.type === 'Super'){
            const baseNumber = unit.attribute.gunFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100)) + Math.round(unit.attribute.gunFight * (unit.attribute.gunFight / 100))
            const enemyDef = Math.round(realTarget.attribute.def * (realTarget.attribute.will / 100)) + Math.round(realTarget.attribute.def * (realTarget.attribute.def / 100))
            dmg = baseNumber - enemyDef 
        }

        // Add skill based damage
        if(!skill.attribute.dmg) return
        const skillDmg = Math.floor(Math.random() * skill.attribute.dmg.max) + skill.attribute.dmg.min
        dmg += Math.round(dmg * skillDmg)
        // Add tension bonus 
        dmg += Math.round(dmg * (tension.current / 100))   

        const crit = unit.attribute.luck / 100
        
        const rng = Math.random()

        if(rng <= crit){
            dmg = Math.round(dmg * 1.5)
        }

        // If the target take defense
        if(realTarget.action === 'defense') dmg = Math.round(dmg / 2)    

        const attribute = JSON.parse(JSON.stringify(realTarget.attribute))
        attribute.hp -= (dmg > attribute.hp)? attribute.hp : dmg
        
        updateUnitState({ name: realTarget.name, attribute: attribute, action: realTarget.action })

        // return showText(unit, dmg, rng, crit, tindex, attribute)    
        return { unit, number: dmg, crit: rng <= crit, tindex, attribute }    
    }else{
        const realTarget: Unit | null = getAvailableTargets(target, tindex, 0, 5)
        if(!realTarget) return
    }
}
