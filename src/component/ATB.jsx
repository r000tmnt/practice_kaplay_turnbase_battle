import { useState, useMemo, useEffect } from "react"
import { useSelector } from "react-redux"
import k from '../lib/kaplay'
import unit from "../data/unit"

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
    position, 
    previousActiveUnits, 
    notifyParent, 
    reStart, // Set witch the unit and index to restart the timer
    pause, // Pause timers other than one that is running,
}) {
    const [timers, setTimers] = useState([])
    const previousSetTimers = useMemo(() => timers, [timers])
    const units = useSelector(state => state.game.units)
    const gameWidth = useSelector(state => state.setting.width)   
    // const scale = useSelector(state => state.setting.scale)

    // const atbBarsAnimate = ($el, unit, index) => {
    //     // console.log($el)
    //     // If the element exists
    //     if(!$el) return
       
    //     // If the unit is in the active stack
    //     if(previousActiveUnits.includes(index)) return
    
    //     // If the timer is set already
    //     if(previousSetTimers.find((t) => t.index === index)) return
    
    //     // Wait for 1s
    //     wait(1, () => {
    //       const time = unit.attribute.act * 100
    //       let percentage = 0
    //       let count = 0
    
    //       // Loop in every 100ms
    //       // Save time controller
    //       setTimers((prevState) => {
    //         if(prevState && !prevState.find((t) => t.index === index)){
    //           return [ ...prevState,
    //             {
    //               index,
    //               controller: loop(0.1, () => {
    //                 count += 1
    
    //                 if(count > time){
    //                   const theTimer = timers.find(t => t.index === index)
    //                   if(theTimer){
    //                     timerEndAction($el, unit, index)                      
    //                   }
    //                 }else{
    //                   // Check if timer overlap
    //                   const oldPercentage = Number($el.children[0].style.width.split('%')[0])
    //                   if(oldPercentage === percentage){
    //                     percentage += Math.floor(100/time)
    //                     // console.log(unit.name, percentage, count, time)
    //                     $el.children[0].style.width = `${percentage}%`                        
    //                   }
    //                 }
    //               }, time).onEnd(() => timerEndAction($el, unit, index))
    //             }
    //           ]
    //         }else{
    //           console.log('timer error', prevState)
    //           // Return the current timers if error
    //           return [ ...timers ]
    //         }
    //       })
    //     })    
    //   }

    // useEffect(() => {
    //     timers.forEach((timer) => {
    //         if(previousActiveUnits.includes(timer.index)) return

    //         // if(previousSetTimers.find((t) => t.index === timer.index)) return

    //         wait(1, () => {
    //             if(typeof timer.controller === "function"){
    //                 // Init timer
    //                 setTimers((prevState) => 
    //                     prevState.map(state => 
    //                         state.index === timer.index? { ...state, controller: timer.controller(timer.callBack) } : state
    //                     )
    //                 )                    
    //             }
    //         })                    
    //     })
    // }, [timers])

    const loopConstructor = (index, unit, controller=null, callBack=null) => {
        const side = (index < 5)? 0 : 1
        const sideIndex = (index < 5)? index : index - 5                
        const width = gameWidth * 0.1
        const height = (gameWidth * 0.1)/10

        const wrapper = add([
            rect(width, height),
            pos(position[side][sideIndex].pos.x, position[side][sideIndex].pos.y - (128 / 2) - 10),       
            color(0, 0, 0)                            
        ])

        wait(1, () => {
            setTimers((prevState) =>{
                if(prevState && !prevState.find((t) => t.index === index)){
                    const time = unit.attribute.act * 100

                    let percentage = 0
                    let count = 0

                    const bar = add([
                        rect(width * percentage, height),
                        pos(position[side][sideIndex].pos.x, position[side][sideIndex].pos.y - (128 / 2) - 10),
                        color(10, 130, 180)                            
                    ])    

                    return [
                        ...prevState,
                        {
                            index,
                            callBack,
                            controller: controller?
                            controller(callBack) :
                            loop(0.1, () => {
                                count += 1
                                console.log(count)
                                if(count > time){
                                    const theTimer = timers.find(t => t.index === index)
                                    if(theTimer){
                                        theTimer.controller.cancel()
                                        if(callBack) { callBack() } 
                                        else {
                                        timerEndAction(unit, index)      
                                        }
                                        wrapper.destroy()
                                        bar.destroy()                                                          
                                    }
                                }else{
                                    percentage += Math.floor(100/time)
                                    // bar.width = width * percentage
                                    tween(bar.width, percentage, 0, (p) => bar.width = p, easings.linear)

                                } 
                            }, time).onEnd(() => {
                                if(callBack) { callBack() } 
                                else {
                                timerEndAction(unit, index)      
                                }
                                wrapper.destroy()
                                bar.destroy()
                            })
                        }
                    ]
                }else{
                    console.log('timer error', prevState)
                    // Return the current timers if error
                    return [ ...timers ]
                }
            })            
        })
    }   

    // useEffect(() => {
    //     console.log(timers)
    // }, [timers])
    
    const waitConstructor = (index, unit, action, callBack=null) => {
        setTimers((prevState) =>{
            if(prevState && !prevState.find((t) => t.index === index)){
                const time = unit.attribute.act * 10

                return [
                    ...prevState,
                    {
                        index,
                        controller: wait(time, () => {
                            action()
                        }).onEnd(() => {
                            setTimers((prevState) => prevState.filter((t) => t.index !== index))
                            if(callBack) callBack()
                        })
                    }
                ]
            }else{
                console.log('timer error', prevState)
                // Return the current timers if error
                return [ ...timers ]
            }
        })        
    }
    
    const timerEndAction = (unit, index) => {
    // console.log(unit.name, 'Done after', time * 0.1, 's')
    // $el.children[0].style.width = '100%'
    // $el.children[0].classList.add('done')

    // Notify the parent with the index
    notifyParent(unit, index)
    // Remove the timer
    setTimers((prevState) => prevState.filter((t) => t.index !== index))
    // Hide the bar
    // $el.style.display = 'none'
    }    

    useEffect(() => {
        if(Object.keys(reStart).length === 0) return
        console.log(reStart)
        const {unit, index, display, controller, callBack } = reStart
        if(display) loopConstructor(index, unit, controller, callBack)
        else waitConstructor(index, unit, controller, callBack)
    }, [reStart])

    useEffect(() => {
        if(Object.keys(pause).length === 0) return
        const { index, value } = pause
        timers.forEach((t) => { 
            if(t.index !== index && t.controller !== undefined) t.controller.paused = value 
        })
    }, [pause])

    useEffect(() => {
        if(units.length === 10){
            units.forEach((unit, index) => loopConstructor(index, unit))
        }
    }, [units])

    // return (
    //     units.map((u, index) => {
    //         const side = (index < 5)? 0 : 1
    //         const sideIndex = (index < 5)? index : index - 5
    //         return <div 
    //           className="atb bar" 
    //           data-index={index}
    //           ref={($el) => atbBarsAnimate($el, u, index)} 
    //           key={index}
    //           style={{
    //             width: `${gameWidth * 0.1}px`,
    //             height: `${(gameWidth * 0.1)/10}px`,
    //             position: 'absolute', 
    //             top:0, 
    //             left: 0, 
    //             transform: `translate(${position[side][sideIndex].pos.x}px, ${position[side][sideIndex].pos.y - (128 / 2) - 10}px)`}}>
    //               <div className='inner'></div>
    //             </div>            
    //       })
    // )
}