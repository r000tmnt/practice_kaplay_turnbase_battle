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
    setInactiveUnits,
    setTurn,
    setCurrentActivePlayer,
} from "../store/game";
import k from '../lib/kaplay'
import { Item, ItemRef } from "../model/item";
import { positionRef, spriteRef } from "../scene/game";
import { loopConstructor, waitConstructor, pauseOrResume, removeBar } from "./ATB";

import skill from '../data/skill.json'
import { GameObj, TweenController } from "kaplay";
// import item from '../data/items.json'

// import { skillRef, changeSpritePosition } from "../scene/game";

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
    setData
} = k

// sprite fade out timers
let fadeOutTimers: {index: number, controller: TweenController}[] = []

// #region Shared actions
export const controller = (actionFunction: Function, index: number, actionCallBack = null as Function | null) => {
    // Pause timers of the other units
    pauseOrResume({ index, value: true })

    actionFunction().then((result) => {
        console.log('player ' + index + ' result', result)

        if(typeof result === "object") {
            switch(result.action){
                case 'attack':
                case 'skill':
                case 'item':
                    showText(result)
                break;
                case 'change':
                    const units = store.getState().game.units
                    const unit = units.find(u => u.index === result.uIndex)
                    const turn = store.getState().game.turn
                    store.dispatch(setTurn(turn + 1))
                    setData('changing', false)
                    store.dispatch(updateUnit({index: unit?.index, attribute: unit?.attribute, action: ''})) 
                    // Get players on the field
                    Array.from([0, 1, 2, 3, 4]).filter(i => {
                        if(units[i].index && units[i].index < 5 && units[i].attribute.hp > 0){
                            loopConstructor(units[i].index, units[i], positionRef, null, null)
                        }
                    })
                break;
            }
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

const getAvailableTarget = (target: Unit ,tIndex: number, start: number, end: number) => {
    // Get latest state
    const units = store.getState().game.units
    const unit = units.find(u => u.index === tIndex)

    // Check if the target is in the field
    if(unit && unit.attribute.hp === 0){
        // Change target if any
        let nextTarget: Unit | null = null
        let nextIndex = -1
        for(let i=start; i < end; i++){
            if(units[i] && units[i].attribute.hp > 0){
                nextTarget = units[i]
                nextIndex = nextTarget.index?? i
                break
            }
        }

        return {target: nextTarget, tIndex: nextIndex}
    }else{
        return {target, tIndex}
    }
}

const getRemainingUnits = (start: number, end: number, mode=0) => {
    let remain = 0
    const units = store.getState().game.units

    for(let i=start; i < end; i++){
        if(units[i] !== undefined &&
            units[i].index === i && 
            units[i].attribute.hp > 0) {
                if(!mode) remain += 1
                else loopConstructor(units[i].index?? i, units[i], positionRef, null, null)
            }
    }

    return remain
} 

const getSprite = (target: number) => {
    // Find the sprite
    return spriteRef.find(s => {
        const index = s.tags.find(t => t.includes('index_'))?.split('index_')[1]
        return Number(index) === target
    })
}

const showText = ({unit, uIndex, number, crit, tIndex, attribute}) => {
    // Find the sprite
    const sprite = getSprite(tIndex)
    if(sprite === undefined || !sprite.opacity){
        console.log('target sprite not found or destoryed', tIndex, sprite)
        return
    }
    // Create text
    const resultText = add([
        text(number, { size: crit? 48 : 36, width: 128, align: 'center', font: 'bebasNeue_regular' }),
        pos(sprite.pos.x - ((128 - 45) / 2), sprite.pos.y - 10),
        opacity(1),
        color(crit? YELLOW : WHITE),
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

        if(attribute.hp === 0) {
            console.log('Removing sprite', tIndex)
            const currentActivePlayer = store.getState().game.currentActivePlayer
            const activeUnits = store.getState().game.activeUnits

            store.dispatch(
                setActiveUnits(activeUnits.filter(a => a !== tIndex))
            )

            if(tIndex === currentActivePlayer){
                // Hide command component
                store.dispatch(
                    setCurrentActivePlayer(-1)
                )
            }
            unitLoseHandle(tIndex, sprite)
            removeBar(tIndex)
        }else{
            const unit = store.getState().game.units.find(u => u.index === tIndex)
            if(unit && unit.action === 'defense'){
                sprite.frame = 5
            }
            store.dispatch(
                setTension({ current: 1 })
            )
        }       
    })
}

const unitLoseHandle = (tIndex: number, sprite: GameObj) => {
    // TODO - Unit lose animation
    store.dispatch(
        setTension({ current: 5 })
    )

    // Get the latest state
    const wave = store.getState().game.wave

    try {
        const timer = tween(
            sprite.opacity, 
            0, 
            0.5,
            (o) => sprite.opacity = o, 
            easings.linear
        )
        
        timer.onEnd(() => {
            // Remove timer
            fadeOutTimers = fadeOutTimers.filter(t => t.index !== tIndex)
            // Remove sprite
            sprite.destroy()

            const target = store.getState().game.units.find(u => u.index === tIndex)
            // If no more enemy in the scene
            const remainingEnemies = getRemainingUnits(5, 10)
            const remainingPlayers = getRemainingUnits(0, 5)

            if(!remainingEnemies){
                // If no more timer
                if(fadeOutTimers.length === 0){
                    store.dispatch(setAllToStop(true))
                    // initGame.stopAllUnit()
                    wait(0.3, () => {
                        if(wave.current !== wave.max){
                            console.log('next wave?')
                            store.dispatch(setWave(1))
                        }else{
                            // TODO - End of the battle
                            const gameWidth = store.getState().setting.width
                            const gameHeight = store.getState().setting.height
                            add([
                                text("YOU WIN", { size: 128, align: 'center', width: gameWidth, font: 'bebasNeue_regular' }),
                                pos(0, (gameHeight / 2) - 128)
                            ])
                        }        
                    })                    
                }
            }  

            if(!remainingPlayers){
                // If no more timer
                if(fadeOutTimers.length === 0){
                    store.dispatch(setAllToStop(true))
                    // initGame.stopAllUnit()
                    wait(0.3, () => {
                        // TODO - End of the battle
                        const gameWidth = store.getState().setting.width
                        const gameHeight = store.getState().setting.height
                        add([
                            text("YOU LOSE", { size: 128, align: 'center', width: gameWidth, font: 'bebasNeue_regular' }),
                            pos(0, (gameHeight / 2) - 128)
                        ])
                    })                    
                }      
            }

            // Reset timers if the target was going to change position
            if(target && target.action === 'change'){
                getRemainingUnits(0, 5, 1)
            }                   
        })

        fadeOutTimers.push({ index: tIndex, controller: timer })        
    } catch (error) {
        console.log('sprite destroyed')
    }

}

/**
 * Attack function
 * @param {Unit} unit - Who is going to attack
 * @param {Unit} target - Who takes damage 
 * @param {number} uIndex - The index of the player unit in the unitSprites array
 * @param {number} tIndex - The index of the enemy unit in the unitSprites array
 */
export const attack = async (unit: Unit, target: Unit, uIndex: number, tIndex: number) => {
    const realTarget: { target: Unit | null, tIndex: number }  = getAvailableTarget(target, tIndex, 5, 10)

    if(!realTarget.target){
        // Cancel action
        store.dispatch(updateUnit({index: unit.index, attribute: unit.attribute, action: ''})) 
        return
    }
    target = realTarget.target
    tIndex = realTarget.tIndex
    console.log('target exist')

    const tension = store.getState().game.tension

    let dmg = (unit.attribute.inFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100))) - Math.round(target.attribute.def * (target.attribute.def / 100))
    dmg += Math.round(dmg * (tension.current / 100)) // Add tension bonus

    const crit = unit.attribute.luck / 100

    const rng = Math.random()

    if(rng <= crit){
        dmg = Math.round(dmg * 1.5)
    }

    // If the target is in the backline
    if(uIndex > 4 && tIndex > 1 || uIndex < 5 && tIndex > 6){
        dmg = Math.round(dmg * 0.75) // Reduce damage by 75%
    }

    // If the target is in defense action
    if(target.action === 'defense') dmg = Math.round(dmg / 2)    

    const tragetAttribute = JSON.parse(JSON.stringify(target.attribute))
    tragetAttribute.hp -= (dmg > tragetAttribute.hp)? tragetAttribute.hp : dmg

    store.dispatch(
        updateUnit({ index: target.index, attribute: tragetAttribute, action: (tragetAttribute.hp === 0)? '' : target.action })
    )

    const playerSprite = getSprite(uIndex)
    const enemySprite = getSprite(tIndex)

    playerSprite?.play('attack', {
        onEnd: () => {
            playerSprite?.play('idle')
        }
    })
    enemySprite?.play('hurt', {
        onEnd: () => {
            if(target.action === 'defense'){
                if(enemySprite) enemySprite.frame = 5
            }
        }
    }) 

    return { unit, uIndex, number: dmg, crit: rng <= crit, tIndex, attribute: tragetAttribute, action: 'attack' }
}

/**
 * Skill function
 * @param {Unit} unit - Who is going to cast thes kill
 * @param {Unit} target - Who takes damage 
 * @param {number} uIndex - The index of the player unit in the unitSprites array
 * @param {number} tIndex - The index of the enemy unit in the unitSprites array
 * @param {Skill} skill - The skill object
 */
export const castSkill = async (unit: Unit, target: Unit, uIndex: number, tIndex: number, skill: Skill) => {
    // Display skill name
    store.dispatch(
        setCurrentCastingSkill(skill.name)
    )

    return new Promise((resolve, reject) => {
        // Calculate the number or damage
        wait(0.7, () => {
            if(skill.type !== 'Support'){
                const realTarget: { target: Unit | null, tIndex: number }  = getAvailableTarget(target, tIndex, 5, 10)

                if(!realTarget.target){
                    // Cancel action
                    store.dispatch(updateUnit({index: unit.index, attribute: unit.attribute, action: ''})) 
                    return
                }
                target = realTarget.target
                tIndex = realTarget.tIndex

                const tension = store.getState().game.tension

                // Deduct MP or tensiiton
                // 0 means ALL
                const caster = JSON.parse(JSON.stringify(unit))
                caster.attribute.mp -= (skill.cost.mp !== undefined)? 
                                        (skill.cost.mp === 0)? caster.attribute.mp : skill.cost.mp : 0
                if(skill.cost.tension !== undefined) 
                    store.dispatch(
                        setTension({ current: (skill.cost.tension)? tension.current - skill.cost.tension : 0 })
                    )

                const tragetAttribute = JSON.parse(JSON.stringify(target.attribute))

                let dmg = 0

                if(skill.type === 'InFight'){
                    const baseNumber = caster.attribute.inFight + Math.round(caster.attribute.inFight * (caster.attribute.inFight / 100))
                    const enemyDef = Math.round(tragetAttribute.def * (tragetAttribute.def / 100))
                    dmg = baseNumber - enemyDef 
                }

                if(skill.type === 'GunFight'){
                    const baseNumber = caster.attribute.gunFight + Math.round(caster.attribute.gunFight * (caster.attribute.gunFight / 100))
                    const enemyDef = Math.round(tragetAttribute.def * (tragetAttribute.will / 100))
                    dmg = baseNumber - enemyDef 
                }

                if(skill.type === 'Super'){
                    const baseNumber = caster.attribute.gunFight + Math.round(caster.attribute.inFight * (caster.attribute.inFight / 100)) + Math.round(caster.attribute.gunFight * (caster.attribute.gunFight / 100))
                    const enemyDef = Math.round(tragetAttribute.def * (tragetAttribute.will / 100)) + Math.round(tragetAttribute.def * (tragetAttribute.def / 100))
                    dmg = baseNumber - enemyDef 
                }

                // Add skill based damage
                if(!skill.attribute.dmg) return
                const skillDmg = Math.floor(Math.random() * skill.attribute.dmg.max) + skill.attribute.dmg.min
                dmg += Math.round(dmg * skillDmg)
                // Add tension bonus 
                dmg += Math.round(dmg * (tension.current / 100))   

                const crit = caster.attribute.luck / 100
                
                const rng = Math.random()

                if(rng <= crit){
                    dmg = Math.round(dmg * 1.5)
                }

                // If the target is in the backline
                if(uIndex > 4 && tIndex > 1 || uIndex < 5 && tIndex > 6){
                    dmg = Math.round(dmg * 0.75) // Reduce damage by 75%
                }                

                // If the target take defense
                if(target.action === 'defense') dmg = Math.round(dmg / 2)    

                tragetAttribute.hp -= (dmg > tragetAttribute.hp)? tragetAttribute.hp : dmg
                
                // Update target attribute
                store.dispatch(
                    updateUnit({ index: target.index, attribute: tragetAttribute, action:(tragetAttribute.hp === 0)? '' : target.action })
                )

                // Update caster attribute
                store.dispatch(
                    updateUnit({ index: caster.index, attribute: caster.attribute, action: caster.action })
                )     
                
                const playerSprite = getSprite(uIndex)
                const enemySprite = getSprite(tIndex)

                playerSprite?.play('attack', {
                    onEnd: () => {
                        playerSprite?.play('idle')
                    }
                })
                enemySprite?.play('hurt', {
                    onEnd: () => {
                        if(target.action === 'defense'){
                            if(enemySprite) enemySprite.frame = 5
                        }
                    }
                }) 
                resolve({ unit: caster, uIndex, number: dmg, crit: rng <= crit, tIndex, attribute: tragetAttribute, action: 'skill' })
            }else{
                const realTarget: { target: Unit | null, tIndex: number }  = getAvailableTarget(target, tIndex, 0, 5)

                if(!realTarget.target){
                    // Cancel action
                    store.dispatch(updateUnit({index: unit.index, attribute: unit.attribute, action: ''})) 
                    return
                }
                target = realTarget.target
                tIndex = realTarget.tIndex

                // Copy assigned effects
                const effectTurnCounter = JSON.parse(JSON.stringify(store.getState().game.effectTurnCounter))

                // Effects collector
                const newEffects : {unit: Unit, turn: number}[] = []

                const tension = store.getState().game.tension

                const tragetAttribute = JSON.parse(JSON.stringify(target.attribute))

                // Deduct MP or tensiiton
                // 0 means ALL
                const caster = JSON.parse(JSON.stringify(unit))
                caster.attribute.mp -= (skill.cost.mp !== undefined)? 
                                        (skill.cost.mp === 0)? caster.attribute.mp : skill.cost.mp : 0
                if(skill.cost.tension !== undefined) 
                    store.dispatch(
                        setTension({ current: (skill.cost.tension)? tension.current - skill.cost.tension : 0 })
                    )

                let number = 0

                if(skill.attribute.buff){
                    const turn = store.getState().game.turn
                    Object.entries(skill.attribute.buff).forEach((param) => {
                        if(param[0] !== 'turn'){
                            tragetAttribute[param[0]] += Math.round(tragetAttribute[param[0]] * param[1])
                            if(param[0] == 'hp' || param[0] == 'mp'){
                                number = Math.round(tragetAttribute[param[0]] * param[1])
                            }                    
                        }else{
                            // Store the number of turns
                            if(param[1] > 0) newEffects.push({ unit: target, turn: turn + param[1] })
                        }
                    })
                }

                if(skill.attribute.debuff){
                    const turn = store.getState().game.turn
                    Object.entries(skill.attribute.debuff).forEach((param) => {
                        if(param[0] !== 'turn'){
                            tragetAttribute[param[0]] -= Math.round(tragetAttribute[param[0]] * param[1])
                            if(param[0] == 'hp' || param[0] == 'mp'){
                                number = Math.round(tragetAttribute[param[0]] * param[1])
                            }                    
                        }else{
                            // Store the number of turns
                            if(param[1] > 0) newEffects.push({ unit: target, turn: turn + param[1]})
                        }
                    })                       
                }

                // Combine with the old one
                store.dispatch(
                    updateEffectTurnCounter([...effectTurnCounter, ...newEffects])
                )                         

                // Update target attribute
                store.dispatch(
                    updateUnit({ index: target.index, attribute: tragetAttribute, action: target.action })
                )

                // Update caster attribute
                store.dispatch(
                    updateUnit({ index: caster.index, attribute: caster.attribute, action: caster.action })
                )       

                resolve({ unit: caster, uIndex, number, crit: false, tIndex, attribute: tragetAttribute, action: 'skill' })    
            }
        })        
    })
}

export const useItem = async (unit: Unit, target: Unit, uIndex: number, tIndex: number, item: Item) => {
    // Display item name
    store.dispatch(
        setCurrentCastingSkill(item.name)
    )

    return new Promise((resolve, reject) => {
        // Calculate the number or damage
        wait(0.7, () => {
            const realTarget: { target: Unit | null, tIndex: number }  = getAvailableTarget(target, tIndex, 0, 5)

            if(!realTarget.target){
                // Cancel action
                store.dispatch(updateUnit({index: unit.index, attribute: unit.attribute, action: ''})) 
                return
            }
            target = realTarget.target
            tIndex = realTarget.tIndex

            const inventory = JSON.parse(JSON.stringify(store.getState().game.inventory))

            const effectTurnCounter = JSON.parse(JSON.stringify(store.getState().game.effectTurnCounter))

            const tension = store.getState().game.tension

            const tragetAttribute = JSON.parse(JSON.stringify(target.attribute))

            let number = 0

            // Get effected attributes
            Object.entries(item.effect).forEach(param=> {
                switch(param[0]){
                    case 'turn':
                        // Store the number of turns
                        if(param[1] > 0){
                            effectTurnCounter.push({ unit: target, turn: param[1] })     
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
                        tragetAttribute[param[0]] += param[1]
                        number = tragetAttribute[param[0]]
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
                updateUnit({ index: target.index, attribute: tragetAttribute, action: target.action })
            )

            if(number > 0) resolve({ unit, number, uIndex, crit: false, tIndex, attribute: tragetAttribute, action: 'skill' })                
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
// endregion

// #region Enemy AI
export const enemyAI = (unit: Unit, index: number) => {
    const actions = [ 'attack', 'skill', 'defense', 'escape' ]
                
    const rng = Math.random() * actions.length

    const action = actions[Math.floor(rng)]

    const input = {
        action: () => {},
        callback: () => {
            console.log(unit.name, 'callback loop')
            const unitData = store.getState().game.units[index]
            if(unitData && unitData.attribute.hp > 0){
                loopConstructor(index, unit, positionRef, null, null)
            }
        }
    }

    // Keep tracking action
    store.dispatch(
        updateUnit({ index: unit.index, attribute: unit.attribute, action })
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
