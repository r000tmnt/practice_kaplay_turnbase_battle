import { GameObj, TimerController } from 'kaplay'
import k from '../lib/kaplay'
import store from "../store/store"
import { Unit } from '../model/unit'
import { 
    updateUnit,
    updateEffectTurnCounter,
    setActiveUnits
} from "../store/game";
import { enemyAI } from './battle';

const { 
    add,
    wait, 
    loop, 
    rect,
    pos,
    easings,
    tween,
    color,
} = k

let timers : 
    { 
        index: number,
        wrapper?: GameObj,
        bar?: GameObj
        controller: TimerController
        callBack?: Function | null
    }[] 
    = []

const getStoreState = () => {
    const gameWidth = store.getState().setting.width  
    const stopAll = store.getState().game.stopAll 
    const activeUnits = store.getState().game.activeUnits
    
    return { gameWidth, stopAll, activeUnits }
}

export const loopConstructor = (index: number, unit: Unit, position: GameObj[][], action: Function | null, callBack: Function | null) => {
    // console.log(index)

    const { gameWidth, stopAll, activeUnits } = getStoreState()

    if(stopAll) return

    wait(1, () => {
        console.log(index, 'after wait')

        if(stopAll) return

        if(activeUnits.find(a => a === index)) return

        if(timers.find((t) => t.index === index)) return

        const side = (index < 5)? 0 : 1
        const sideIndex = (index < 5)? index : index - 5                
        const width = gameWidth * 0.1
        const height = (gameWidth * 0.1)/10

        const wrapper = add([
            rect(width, height),
            pos(position[side][sideIndex].pos.x, position[side][sideIndex].pos.y - (128 / 2) - 10),       
            color(0, 0, 0)                            
        ])

        const time = unit.attribute.act * 100

        let percentage = 0
        // let count = 0

        const bar = add([
            rect(percentage, height),
            pos(position[side][sideIndex].pos.x, position[side][sideIndex].pos.y - (128 / 2) - 10),
            color(10, 130, 180)                            
        ])    

        console.log(unit.name, 'set up loop', performance.now())            

        timers.push(
            {
                index,
                wrapper,
                bar,
                callBack,
                controller: action?
                action(callBack) :
                loop(0.1, () => {
                    const { stopAll } = getStoreState()
                    if(stopAll){
                        timerEndAction(unit, index)
                    }else{
                        const add = Math.floor(100/time)
                        percentage = (percentage + add > 100)? 100 : percentage + add
                        const newWidth = width * (percentage/100)
                        tween(bar.width, newWidth, 0, (p) => bar.width = p, easings.linear)
                    }
                }, time).onEnd(() => {
                    console.log(`timer ${index} ended`)
                    if(callBack) { callBack() } 
                    else timerEndAction(unit, index)
                })
            }
        )
    })
}   

export const waitConstructor = (index: number, unit: Unit, action: Function, callBack=null as Function | null) => {
    const { stopAll, activeUnits } = getStoreState()

    if(stopAll) return

    if(activeUnits.find(a => a === index)) return

    if(timers.find((t) => t.index === index)) return

    const units = store.getState().game.units
    const time = (units[index].action === 'defense')? 0 : unit.attribute.act * 10

    console.log(unit.name, 'set up wait')

    const newWait = {
        index,
        controller: wait(time, () => {
            const { stopAll } = getStoreState()
            if(stopAll) return
            try {
                action() 
            } catch (error) {
                console.log(error)
                console.log('unit action error', units[index])
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
        t.controller?.cancel()
        if(t.wrapper) t.wrapper.destroy()
        if(t.bar) t.bar.destroy()                    
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

const timerEndAction = (unit, index) => {
    console.log(unit.name, 'action after timer ended')
    const { stopAll } = getStoreState()
    // Notify the parent with the index
    if(!stopAll) onAtbBarFinished(unit, index)
    // Remove timer
    removeBar(index)
}   

const onAtbBarFinished = (unit : Unit, index: number) => {
    const activeUnits = store.getState().game.activeUnits

    if(activeUnits.find(a => a === index) !== undefined) return

    const copy = JSON.parse(JSON.stringify(activeUnits))
    copy.push(index)
    store.dispatch(
        setActiveUnits(copy)
    )
    const unitData = store.getState().game.units[index]

    if(unitData.action === 'defense') store.dispatch(updateUnit({name: unit.name, attribute: unit.attribute, action: ''}))

    // Checking buff or debuff turn counter
    const effectTurnCounter = JSON.parse(JSON.stringify(store.getState().game.effectTurnCounter))

    const ei = effectTurnCounter.findIndex(e => e.unit.name === unit.name)

    if(ei >= 0){
        if(effectTurnCounter[ei].turn > 1){
        effectTurnCounter[ei].turn -= 1
        store.dispatch(updateEffectTurnCounter(effectTurnCounter))
        }else{
        // Remove counter
        effectTurnCounter.splice(ei, 1)
        store.dispatch(updateEffectTurnCounter(effectTurnCounter))
        }
    }

    if(index > 4){
        if(unitData.attribute.hp > 0){
        // Set enemy action after 1 to 3 seconds most
        wait(Math.round(Math.random() * 2) + 1, () => {
                enemyAI(unit, index)
            })        
        }
    }
}