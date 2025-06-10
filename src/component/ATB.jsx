import { useRef, useMemo, useEffect, useImperativeHandle } from "react"
import { useSelector } from "react-redux"
import k from '../lib/kaplay'
import store from "../store/store"

const { 
    add,
    wait, 
    loop, 
    rect,
    pos,
    outline,
    easings,
    tween,
    color,
    BLACK,
    RED
} = k

export default function ATB({
    activeUnits, 
    notifyParent, 
    ref, // Set witch the unit and index to restart the timer
    pause, // Pause timers other than one that is running,
}) {
    const timers = useRef([])
    const gameWidth = useSelector(state => state.setting.width)   
    // const scale = useSelector(state => state.setting.scale)

    const loopConstructor = (index, unit, position, controller=null, callBack=null) => {
        console.log(index)

        wait(1, () => {
            console.log(index, 'after wait')

            if(activeUnits.find(a => a === index)) return

            if(timers.current.find((t) => t.index === index)) return
    
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

            timers.current.push(
                {
                    index,
                    wrapper,
                    bar,
                    callBack,
                    controller: controller?
                    controller(callBack) :
                    loop(0.1, () => {
                        // count += 1
                        // console.log(count)
                        const add = Math.floor(100/time)
                        percentage = (percentage + add > 100)? 100 : percentage + add
                        const newWidth = width * (percentage/100)
                        tween(bar.width, newWidth, 0, (p) => bar.width = p, easings.linear)
                    }, time).onEnd(() => {
                        console.log(`timer ${index} ended`)
                        if(callBack) { callBack() } 
                        else timerEndAction(unit, index)
                    })
                }
            )
        })
    }   

    // useEffect(() => {
    //     // console.log(timers)
    //     // Check if the timers duplicated
    //     setTimers(prevState => {
    //         return prevState.filter((timer, index) => {
    //             const matched = prevState.findIndex(t => t.index === index) === index
    //             if(!matched) timer.controller?.destroy()
    //             else return timer 
    //         })
    //     })
    // }, [timers])
    
    const waitConstructor = (index, unit, action, callBack=null) => {
        if(activeUnits.find(a => a === index)) return

        if(timers.current.find((t) => t.index === index)) return

        const units = store.getState().game.units
        const time = (units[index].action === 'defense')? 0 : unit.attribute.act * 10

        console.log(unit.name, 'set up wait')

        timers.current.push(
            {
                index,
                controller: wait(time, () => {
                    try {
                        action() 
                    } catch (error) {
                        console.log(error)
                        console.log('unit action error', units[index])
                    }
                }).onEnd(() => {
                    removeBar(index)
                    if(callBack) callBack()
                })
            }            
        )
    }

    const removeBar = (index) => {
        const theTimer = timers.current.filter(t => t.index === index)
        if(theTimer.length){
            console.log(`timer ${index} remove`)
            theTimer.forEach(t => {
                t.controller?.cancel()
                if(t.wrapper) t.wrapper.destroy()
                if(t.bar) t.bar.destroy()                    
            })                           
            // Remove timer
            timers.current = timers.current.filter((t) => t.index !== index)   
        }
    }
    
    const timerEndAction = (unit, index) => {
        console.log(unit.name, 'action after timer ended')
        // Notify the parent with the index
        notifyParent(unit, index)
        // Remove timer
        removeBar(index)
    }    

    // useEffect(() => {
    //     if(Object.keys(reStart).length === 0) return
    //     console.log(reStart)
    //     const {unit, index, display, action, callBack } = reStart
    //     if(display) loopConstructor(index, unit, action, callBack)
    //     else waitConstructor(index, unit, action, callBack)
    // }, [reStart])

    useEffect(() => {
        if(Object.keys(pause).length === 0) return
        const { index, value } = pause
        timers.current.forEach((t) => { 
            if(t.index !== index && t.controller !== undefined) t.controller.paused = value 
        })
    }, [pause])

    useImperativeHandle(ref, () => {
        return { 
            loopConstructor,
            waitConstructor,
            removeBar
         }
    }, [])
}