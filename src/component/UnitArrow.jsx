import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import k from '../lib/kaplay'

const { loop } = k

export default function UnitArrow({currentActivePlayer, pointedTarget, position}) {
    const gameWidth = useSelector(state => state.setting.width)
    const scale = useSelector(state => state.setting.scale)  
    const [animation, setAnimation] = useState({})
    const [target, setTarget] = useState({})
    
    const setRotate3d = ($el) => {
        if(!$el) return
        // If the element is already animated, keep the  running
        if(Object.keys(animation).length > 0) return

        // Rotate the element every 100ms
        const time = 360/10
        let deg = 0
        setAnimation(
            loop(0.1, () => {
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
        )
    }

    useEffect(() => {
        if(pointedTarget >=0){
            setTarget({
                position: 1,
                index: pointedTarget
            })
        }else{
            if(currentActivePlayer === undefined) return
            setTarget({
                position: 0,
                index: currentActivePlayer
            })
        }
    }, [currentActivePlayer, pointedTarget])

    return(
        (Object.keys(target).length > 0)?
        <div 
        className='arrow-down ui'
        ref={($el) => setRotate3d($el)}
        style={{
            width: `${(gameWidth * 0.05) * scale}px`,
            fontSize: `${(gameWidth * 0.05) * scale}px`,
            left: `${((window.innerWidth - (gameWidth * scale)) / 2)}px`,            
            transform: `
                translate(
                    ${(position[target.position][target.index].pos.x + ((gameWidth * 0.05)/4)) * scale}px, 
                    ${(position[target.position][target.index].pos.y - (128 / 2) - 40) * scale}px)
            `,
        }}>&#11167;</div>
        : null
    )
}