import { Unit } from "../model/unit";
import { Skill, SkillRef } from "../model/skill";
import store from "../store/store";
import { 
    updateUnit,
    setTension,
    setCurrentCastingSkill,
    updateEffectTurnCounter,
    setInventory,
    setActiveUnits,
    setWave,
    setAllToStop,
    setInactiveUnits
} from "../store/game";
import k from '../lib/kaplay'
import { Item, ItemRef } from "../model/item";
import { positionRef, spriteRef } from "../scene/game";
import { loopConstructor, waitConstructor, pauseOrResume, removeBar } from "./ATB";

import skill from '../data/skill.json'
import item from '../data/items.json'

import { skillRef } from "../scene/game";

const { 
    add,
    wait, 
    // loop, 
    // rect,
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
    // RED
} = k

// #region Shared actions
export const controller = (actionFunction: Function, index: number, actionCallBack = null as Function | null) => {
    // Pause timers of the other units
    pauseOrResume({ index, value: true })

    actionFunction().then((result) => {
        if(result !== undefined) {
            showText(result)
        }

        if(actionCallBack) actionCallBack()
        
        // Tracking actived unit count
        const inactiveUnits = JSON.parse(JSON.stringify(store.getState().game.inactiveUnits))

        if(!inactiveUnits.length || !inactiveUnits.find((i: number) => i === index)){
            inactiveUnits.push(index)
            store.dispatch(
                setInactiveUnits(inactiveUnits)
            )
        }

        // Resume timers of the other units
        pauseOrResume({ index, value: false })
    })
}

const showText = ({unit, number, crit, tindex, attribute}) => {
    if(!spriteRef[tindex]) return
    // Create text
    const resultText = add([
        text(number, { size: crit? 48 : 36 }),
        pos(spriteRef[tindex].pos.x + (128 / 2), spriteRef[tindex].pos.y - 10),
        opacity(1),
        color(crit? YELLOW : WHITE),
        outline(1, BLACK)
    ])

    // Animate the text
    tween(
        resultText.pos, 
        vec2(resultText.pos.x, resultText.pos.y - 50), 
        0.5,
        (pos) => resultText.pos = pos,
        easings.easeInOutQuad
    ).onEnd(() => {
        resultText.destroy()

        if(unit.action === 'attack') {
            if(attribute.hp === 0) {
                unitLoseHandle(tindex)
            }else{
                store.dispatch(
                    setTension({ current: 1 })
                )
            }        
        }

        if(unit.action === 'skill') {
        const skill = skillRef.find(s => s.unit.name === unit.name)
        if(skill?.type !== 'Support'){
            if(attribute.hp === 0) {
                unitLoseHandle(tindex)
                removeBar(tindex)
            }else{
                store.dispatch(
                    setTension({ current: 1 })
                )
            }    
        }
        }
    })
}

const unitLoseHandle = (tindex: number) => {
    // TODO - Unit lose animation
    store.dispatch(
        setTension({ current: 5 })
    )

    // Get the latest state
    const wave = store.getState().game.wave
    const units = store.getState().game.units
    tween(
        spriteRef[tindex].opacity, 
        0, 
        0.5,
        (o) => spriteRef[tindex].opacity = o, 
        easings.linear
    ).onEnd(() => {
        // Remove sprite
        spriteRef[tindex].destroy()

        // Remove the atb bar of the unit
        removeBar(tindex)

        // TODO - If no more enemy in the scene
        let remain = 0
        // TODO - Need to set the starting number as the length of players
        for(let i=5; i < units.length; i++){
        // In case if the state is not update yet
        if(units[i].attribute.hp > 0 && i !== tindex) remain += 1
        }

        if(!remain){
            store.dispatch(setAllToStop(true))
            // initGame.stopAllUnit()
            wait(0.3, () => {
                if(wave.current !== wave.max){
                    console.log('next wave?')
                    store.dispatch(setWave(1))
                }else{
                    // TODO - End of the battle
                }        
            })
        }

        console.log('remaing', remain)      
    })
}
// endregion

// #region Enemy AI
export const enemyAI = (unit, index) => {
    const actions = [ 'attack', 'skill', 'defense', 'escape' ]
                
    const rng = Math.random() * actions.length

    const action = actions[Math.floor(rng)]

    const input = {
        action: () => {},
        callback: () => {
            console.log(unit.name, 'callback loop')
            const unitData = store.getState().game.units[index]
            if(unitData.attribute.hp > 0){
                loopConstructor(index, unit, positionRef, null, null)
            }
        }
    }

    // Keep tracking action
    store.dispatch(
        updateUnit({ name: unit.name, attribute: unit.attribute, action })
    )

    // TODO - Call the action
    switch (action) {
        case 'attack':{
            // Choose a player
            const target = Math.round(Math.random() * 4)
            const units = store.getState().game.units
            input.action = function(){ controller(() => attack(unit, units[target], index, target), index ) } 
        }
        break
        case 'skill':{
            const skillList = unit.skill.map((s: number) => skill[s])
            const units = store.getState().game.units
            // Picking skill
            const skillToCast = skillList[Math.floor(Math.random() * (skillList.length - 1))]
            let target = 0
            // Picking target
            if(skillToCast.type === 'support')
                target = Math.round(Math.random() * 4) + 5
            else
                target = Math.round(Math.random() * 4)

            input.action = function(){ controller(async() => castSkill(unit, units[target], index, target, skillToCast), index ) } 
        }
        break
        // case 'item':
        //   input.action = function(){ controller(async() => { console.log('Enemy item')}, index ) } 
        //   break
        case 'defense':
            input.action = function(){ controller(async() => { console.log('Enemy defense')}, index ) } 
        break
        // case 'change':
        //   input.action = function(){ controller(async() => { console.log('Enemy change')}, index ) } 
        //   break
        case 'escape':
            input.action = function(){ controller(async() => { console.log('Enemy escape')}, index ) } 
        break
    }

    const copy = JSON.parse(JSON.stringify(
        store.getState().game.activeUnits
    ))
    store.dispatch(
        setActiveUnits(copy.filter((a: number) => a !== index))
    )

    waitConstructor(index, unit, input.action, input.callback)
}
// #endregion

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

                // Copy assigned effects
                const effectTurnCounter = JSON.parse(JSON.stringify(store.getState().game.effectTurnCounter))

                // Effects collector
                const newEffects : {unit: Unit, turn: number}[] = []

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
                    const turn = store.getState().game.turn
                    Object.entries(skill.attribute.buff).forEach((param) => {
                        if(param[0] !== 'turn'){
                            attribute[param[0]] += Math.round(attribute[param[0]] * param[1])
                            if(param[0] == 'hp' || param[0] == 'mp'){
                                number = Math.round(attribute[param[0]] * param[1])
                            }                    
                        }else{
                            // Store the number of turns
                            if(param[1] > 0) newEffects.push({ unit: realTarget, turn: turn + param[1] })
                        }
                    })
                }

                if(skill.attribute.debuff){
                    const turn = store.getState().game.turn
                    Object.entries(skill.attribute.debuff).forEach((param) => {
                        if(param[0] !== 'turn'){
                            attribute[param[0]] -= Math.round(attribute[param[0]] * param[1])
                            if(param[0] == 'hp' || param[0] == 'mp'){
                                number = Math.round(attribute[param[0]] * param[1])
                            }                    
                        }else{
                            // Store the number of turns
                            if(param[1] > 0) newEffects.push({ unit: realTarget, turn: turn + param[1]})
                        }
                    })                       
                }

                // Combine with the old one
                store.dispatch(
                    updateEffectTurnCounter([...effectTurnCounter, ...newEffects])
                )                         

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
