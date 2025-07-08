import { Unit } from "../model/unit";
import { Skill } from "../model/skill";
import store from "../store/store";
import { 
    updateUnit,
    setTension,
    setCurrentCastingSkill,
    updateEffectTurnCounter,
    setInventory
} from "../store/game";
import k from '../lib/kaplay'
import { Item } from "../model/item";

const { 
    // add,
    wait, 
    // loop, 
    // rect,
    // pos,
    // text,
    // opacity,
    // vec2,
    // outline,
    // easings,
    // tween,
    // color,
    // BLACK,
    // YELLOW,
    // WHITE,
    // RED
} = k

const getAvailableTarget = (target: Unit ,tindex: number, start: number, end: number) => {
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
 * @param {Unit} unit - Who is going to attack
 * @param {Unit} target - Who takes damage 
 * @param {number} uindex - The index of the player unit in the unitSprites array
 * @param {number} tindex - The index of the enemy unit in the unitSprites array
 */
export const attack = async (unit: Unit, target: Unit, uIndex: number, tindex: number) => {
    const realTarget: Unit | null  = getAvailableTarget(target, tindex, 5, 10)

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

    store.dispatch(
        updateUnit({ name: realTarget.name, attribute: attribute, action: realTarget.action })
    )

    // return showText(unit, dmg, rng, crit, tindex, attribute)
    return { unit, number: dmg, crit: rng <= crit, tindex, attribute }
}
  
/**
 * Skill function
 * @param {Unit} unit - Who is going to cast thes kill
 * @param {Unit} target - Who takes damage 
 * @param {number} uindex - The index of the player unit in the unitSprites array
 * @param {number} tindex - The index of the enemy unit in the unitSprites array
 * @param {Skill} skill - The skill object
 */
export const castSkill = async (unit: Unit, target: Unit, uIndex: number, tindex: number, skill: Skill) => {
    // Display skill name
    store.dispatch(
        setCurrentCastingSkill(skill.name)
    )

    return new Promise((resolve, reject) => {
        // Calculate the number or damage
        wait(0.7, () => {
            if(skill.type !== 'Support'){
                const realTarget: Unit | null = getAvailableTarget(target, tindex, 5, 10)
                if(!realTarget) return

                const tension = store.getState().game.tension

                const attribute = JSON.parse(JSON.stringify(realTarget.attribute))

                // 0 means ALL
                attribute.mp -= skill.cost.mp? skill.cost.mp : attribute.mp
                if(skill.cost.tension !== undefined) 
                    store.dispatch(
                        setTension({ current: (skill.cost.tension)? tension.current - skill.cost.tension : 0 })
                    )

                let dmg = 0

                if(skill.type === 'InFight'){
                    const baseNumber = unit.attribute.inFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100))
                    const enemyDef = Math.round(attribute.def * (attribute.def / 100))
                    dmg = baseNumber - enemyDef 
                }

                if(skill.type === 'GunFight'){
                    const baseNumber = unit.attribute.gunFight + Math.round(unit.attribute.gunFight * (unit.attribute.gunFight / 100))
                    const enemyDef = Math.round(attribute.def * (attribute.will / 100))
                    dmg = baseNumber - enemyDef 
                }

                if(skill.type === 'Super'){
                    const baseNumber = unit.attribute.gunFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100)) + Math.round(unit.attribute.gunFight * (unit.attribute.gunFight / 100))
                    const enemyDef = Math.round(attribute.def * (attribute.will / 100)) + Math.round(attribute.def * (attribute.def / 100))
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

                attribute.hp -= (dmg > attribute.hp)? attribute.hp : dmg
                
                store.dispatch(
                    updateUnit({ name: realTarget.name, attribute, action: realTarget.action })
                )

                // return showText(unit, dmg, rng, crit, tindex, attribute)    
                resolve({ unit, number: dmg, crit: rng <= crit, tindex, attribute })
            }else{
                const realTarget: Unit | null = getAvailableTarget(target, tindex, 0, 5)
                if(!realTarget) return

                const effectTurnCounter = JSON.parse(JSON.stringify(store.getState().game.effectTurnCounter))

                const tension = store.getState().game.tension

                const attribute = JSON.parse(JSON.stringify(realTarget.attribute))

                // 0 means ALL
                attribute.mp -= skill.cost.mp? skill.cost.mp : attribute.mp
                if(skill.cost.tension !== undefined)
                    store.dispatch(
                        setTension({ current: (skill.cost.tension)? tension.current - skill.cost.tension : 0 })
                    )

                let number = 0

                if(skill.attribute.buff){
                    Object.entries(skill.attribute.buff).forEach((param) => {
                        if(param[0] !== 'turn'){
                            attribute[param[0]] += Math.round(attribute[param[0]] * param[1])
                            if(param[0] == 'hp' || param[0] == 'mp'){
                                number = Math.round(attribute[param[0]] * param[1])
                            }                    
                        }else{
                            // Store the number of turns
                            if(param[1] > 0) effectTurnCounter.push({ unit: realTarget, turn: param[1] })
                        }
                    })
                    store.dispatch(
                        updateEffectTurnCounter(effectTurnCounter)
                    )
                }

                if(skill.attribute.debuff){
                    Object.entries(skill.attribute.debuff).forEach((param) => {
                        if(param[0] !== 'turn'){
                            attribute[param[0]] -= Math.round(attribute[param[0]] * param[1])
                            if(param[0] == 'hp' || param[0] == 'mp'){
                                number = Math.round(attribute[param[0]] * param[1])
                            }                    
                        }else{
                            // Store the number of turns
                            if(param[1] > 0) effectTurnCounter.push({ unit: realTarget, turn: param[1] })
                        }
                    })     
                    store.dispatch(
                        updateEffectTurnCounter(effectTurnCounter)
                    )                           
                }

                store.dispatch(
                    updateUnit({ name: realTarget.name, attribute, action: realTarget.action })
                )

                resolve({ unit, number, crit: false, tindex, attribute })    
            }
        })        
    })
}

export const useItem = async (unit: Unit, target: Unit, uIndex: number, tindex: number, item: Item) => {
    // Display item name
    store.dispatch(
        setCurrentCastingSkill(item.name)
    )

    return new Promise((resolve, reject) => {
        // Calculate the number or damage
        wait(0.7, () => {
            const realTarget: Unit | null = getAvailableTarget(target, tindex, 0, 5)
            if(!realTarget) return

            const inventory = JSON.parse(JSON.stringify(store.getState().game.inventory))

            const effectTurnCounter = JSON.parse(JSON.stringify(store.getState().game.effectTurnCounter))

            const tension = store.getState().game.tension

            const attribute = JSON.parse(JSON.stringify(realTarget.attribute))

            let number = 0

            // Get effected attributes
            Object.entries(item.effect).forEach(param=> {
                switch(param[0]){
                    case 'turn':
                        // Store the number of turns
                        if(param[1] > 0){
                            effectTurnCounter.push({ unit: realTarget, turn: param[1] })     
                            store.dispatch(
                                updateEffectTurnCounter(effectTurnCounter)
                            )                               
                        }                                               
                    break;
                    case 'tension':
                        store.dispatch(
                            setTension({ current: tension.current + param[1] })
                        )                        
                    break;
                    default:
                        attribute[param[0]] += param[1]
                        number = attribute[param[0]]
                    break;
                }
            })

            // Update items
            for(let i=0; i < inventory.length; i++){
                if(inventory[i].id === item.id){
                    inventory[i].amount -= 1
                    if(inventory[i].amount == 0){
                        inventory.splice(i, 1)
                    }
                    break   
                }
            }

            store.dispatch(
                setInventory(inventory)
            )      

            store.dispatch(
                updateUnit({ name: realTarget.name, attribute, action: realTarget.action })
            )

            if(number > 0) resolve({ unit, number, crit: false, tindex, attribute })                
        })        
    })
}

/**
 * Escape function
 * @param {Unit} unit - Who is gonna escape
 * @returns 
 */
export const isEscapable = async(unit: Unit) => {
    const posibility = (unit.attribute.luck + Math.round(unit.attribute.spd * (unit.attribute.luck / 100))) * 10

    const random = Math.floor(Math.random() * 100)

    console.log('escape posibility: ', posibility)
    console.log('rng: ', random)

    return random <= posibility
}
