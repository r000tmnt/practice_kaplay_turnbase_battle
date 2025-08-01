import { GameObj, TimerController } from 'kaplay'
import k from '../lib/kaplay'
import store from "../store/store"
import { Unit } from '../model/unit'
import { 
    updateEffectTurnCounter,
    setActiveUnits,
    updateUnit
} from "../store/game";
import { enemyAI } from './battle';
import { spriteRef } from '../scene/game';

const {
    wait,
    getData,
    createATB
} = k

let timers : 
    { 
        index: number,
        wrapper?: GameObj,
        bar?: GameObj
        controller: TimerController
        remove?: Function,
        pause?: Function
    }[] 
    = []

const getStoreState = () => {
    const gameWidth = store.getState().setting.width  
    const stopAll = store.getState().game.stopAll 
    const activeUnits = store.getState().game.activeUnits
    
    return { gameWidth, stopAll, activeUnits }
}

const skipTimer = (index: number, unit: Unit) => {
    const changing = getData('changing', false)
    return (index < 5 && unit.action !== 'change' && changing)
}

export const loopConstructor = (index: number, unit: Unit, position: GameObj[][], action: Function | null, callBack: Function | null) => {
    // console.log(index)

    const { stopAll } = getStoreState()

    if(stopAll || skipTimer(index, unit)) return

    wait(1, () => {
        console.log(index, 'after wait')
        const { gameWidth, stopAll, activeUnits } = getStoreState()
        if(stopAll || skipTimer(index, unit)) return

        if(activeUnits.find(a => a === index)) return

        if(timers.find((t) => t.index === index)) return

        const side = (index < 5)? 0 : 1
        const sideIndex = (index < 5)? index : index - 5                
        const width = gameWidth * 0.1
        const height = (gameWidth * 0.1)/10
        
        const newTimer = createATB(
            unit.attribute.act * 10,
            width,
            height,
            {x: position[side][sideIndex].pos.x, y: position[side][sideIndex].pos.y - (67 / 2) - 10},
            () => timerEndAction(unit, index),
        )

        timers.push(
            {
                index,
                ...newTimer
            }
        )
    })
}   

export const waitConstructor = (index: number, unit: Unit, action: Function, callBack=null as Function | null) => {
    const { stopAll, activeUnits } = getStoreState()

    if(stopAll || skipTimer(index, unit)) return

    if(activeUnits.find(a => a === index)) return

    if(timers.find((t) => t.index === index)) return

    const time = (unit.action === 'defense')? 0 : unit.attribute.act * 10

    console.log(unit.name, 'set up wait')

    const newWait = {
        index,
        controller: wait(time, () => {
            const { stopAll } = getStoreState()
            if(stopAll || skipTimer(index, unit)) return
            try {
                action() 
            } catch (error) {
                console.log(error)
                console.log('unit action error', unit)
            }
        })
    }  

    newWait.controller.onEnd(() => {
        removeBar(index)
        if(callBack && !stopAll) callBack()
    })

    timers.push(newWait)
}

export const removeBar = (index: number) => {
    const theTimer = timers.filter(t => t.index === index)
    console.log(`timer ${index} remove`)
    theTimer.forEach(t => {
        if(t.remove){
            t.remove()
        }else{
            t.controller?.cancel()
        }                   
    })                           
    // Remove timer
    timers = timers.filter((t) => t.index !== index) 
}

export const pauseOrResume = (payload: { index: number, value: boolean }) =>{
    const { index, value } = payload
    timers.forEach((t) => { 
        if(t.index !== index && t.controller !== undefined) t.controller.paused = value 
    })
}

const timerEndAction = (unit: Unit, index: number) => {
    console.log(unit.name, 'action after timer ended')
    const { stopAll } = getStoreState()
    // Notify the parent with the index
    if(!stopAll) onAtbBarFinished(unit, index)
    // Remove timer
    removeBar(index)
}   

const onAtbBarFinished = (unit : Unit, index: number) => {
    const changing = getData('changing', false)

    // Do not set timer on position change
    if(index < 5 && unit.action !== 'change' && changing) return

    if(unit.action === 'defense'){
        store.dispatch(updateUnit({name: unit.name, attribute: unit.attribute, action: ''})) 
        spriteRef[index].play('idle')
    }

    const copy = JSON.parse(JSON.stringify(store.getState().game.activeUnits))
    copy.push(index)
    store.dispatch(
        setActiveUnits(copy)
    )

    // Checking buff or debuff turn counter
    const effectTurnCounter = JSON.parse(JSON.stringify(store.getState().game.effectTurnCounter))

    const ei = effectTurnCounter.findIndex(e => e.unit.name === unit.name)

    if(ei >= 0){
        const turn = store.getState().game.turn
        if(effectTurnCounter[ei].turn === turn){
            // Remove counter
            effectTurnCounter.splice(ei, 1)
            store.dispatch(updateEffectTurnCounter(effectTurnCounter))
        }
    }

    if(index > 4){
        if(unit.attribute.hp > 0){
        // Set enemy action after 1 to 3 seconds most
        wait(Math.round(Math.random() * 2) + 1, () => {
                enemyAI(unit, index)
            })        
        }
    }
}