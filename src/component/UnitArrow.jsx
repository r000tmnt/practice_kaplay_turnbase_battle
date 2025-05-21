import { useSelector } from "react-redux"
import k from '../lib/kaplay'

const { loop } = k

export default function UnitArrow({currentActivePlayer, position}) {
    const gameWidth = useSelector(state => state.setting.width)  
    
    const setRotate3d = ($el) => {
        if(!$el) return
        // Rotate the element every 100ms
        const time = 360/10
        let deg = 0
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
      }

    return(
        (currentActivePlayer !== undefined)?
        <div 
        className='arrow-down'
        ref={($el) => setRotate3d($el)}
        style={{
            width: `${gameWidth * 0.05}px`,
            height: `${(gameWidth * 0.1)/5}px`,
            fontSize: `${gameWidth * 0.05}px`,         
            position: 'absolute',
            top:0,
            left: 0,            
            transform: `translate(${position[0][currentActivePlayer].pos.x + ((gameWidth * 0.05)/2)}px, ${position[0][currentActivePlayer].pos.y - (128 / 2) - 40}px)`
        }}>&#11167;</div>
        : null
    )
}