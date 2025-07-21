import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import k from '../lib/kaplay'
import { positionRef } from "../scene/game"

const { loop } = k

export default function UnitArrow() {
    const gameWidth = useSelector(state => state.setting.width)
    const scale = useSelector(state => state.setting.scale)  
    const currentActivePlayer = useSelector(state => state.game.currentActivePlayer)
    const pointedTarget = useSelector(state => state.game.pointedTarget)
    const [target, setTarget] = useState({})
    const animation = useRef({})
    
    const setRotate3d = ($el) => {
        if(!$el) return
        // If the element is already animated, keep it running
        if(animation.current.$el && animation.current.$el.dataset['time'] === $el.dataset['time']) return

        // Rotate the element every 100ms
        const time = 360/10
        let deg = 0
        animation.current = {
            $el,
            controller: loop(0.1, () => {
                if(deg === 360) deg = 0
            
                if($el.style.transform.includes('rotate3d')){
                    const transform = $el.style.transform.split('rotate3d')
                    deg += time
                    transform[1] = `(0, 1, 0 , ${deg}deg)`
                    $el.style.transform = `${transform[0]}rotate3d${transform[1]}`
                }else{
                    // x, y, z, deg
                    $el.style.transform += ` rotate3d(0, 1, 0, ${deg}deg)`
                }
            })
        }
    }

    const reset = () => {
        // Reset position
        setTarget({})  
        // Stop animation
        if(animation.current && Object.keys(animation.current).length > 0){
            if(animation.current.controller) animation.current.controller.cancel()
            // animation.current.$el.remove()
        }
    }

    useEffect(() => {
        if(pointedTarget >=0){
            if(pointedTarget > 4){
                setTarget({
                    position: 1,
                    index: pointedTarget - 5
                })   
            }else{
                setTarget({
                    position: 0,
                    index: pointedTarget
                })  
            }
        }else reset()
    }, [pointedTarget])

    useEffect(() => {
        if(currentActivePlayer >= 0){
            setTarget({
                position: 0,
                index: currentActivePlayer
            })   
        }else reset()
    }, [currentActivePlayer])

    return(
        <>
            {
                (Object.keys(target).length > 0)?
                <div 
                className='arrow-down ui'
                ref={($el) => setRotate3d($el)}
                data-time={new Date().getTime()}
                style={{
                    width: `${(gameWidth * 0.05) * scale}px`,
                    fontSize: `${(gameWidth * 0.05) * scale}px`,
                    left: `${((window.innerWidth - (gameWidth * scale)) / 2)}px`,            
                    transform: `
                        translate(
                            ${(positionRef[target.position][target.index].pos.x + ((gameWidth * 0.05)/4)) * scale}px, 
                            ${(positionRef[target.position][target.index].pos.y - (128 / 2) - 40) * scale}px)
                    `,
                }}>&#11167;</div>
                : null
            }
        </>
    )
}