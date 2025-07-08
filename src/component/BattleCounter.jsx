import { useSelector } from "react-redux"
import { useEffect, useRef } from "react"
import k from "../lib/kaplay"

const { wait } = k

export default function BattleCounter() {
    const wave = useSelector(state => state.game.wave)
    const turn = useSelector(state => state.game.turn)
    const tension = useSelector(state => state.game.tension)
    const gameWidth = useSelector(state => state.setting.width)
    const skillName = useSelector(state => state.game.currentCastingSkill)
    // const scale = useSelector(state => state.setting.scale)
    const wrapperRef = useRef(null)
    const labelRef = useRef(null)
    
    // Trigger element fade in & fade out
    useEffect(() => {
        if(skillName && skillName.length){
            labelRef.current.style.opacity = 1
            wait(0.7, () => {
                labelRef.current.style.opacity = 0
            })
        }
    }, [skillName])

    // Hide the counters on transition
    useEffect(() => {
        if(wave > 1){
            wrapperRef.current.style.opacity = 0
            wait(3, () => {
                wrapperRef.current.style.opacity = 1
            })
        }
    }, [wave])

    return (
        <div ref={($el) => wrapperRef.current = $el}>
            <div className="counter flex ui" style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }}>
                <div>
                    <div className='wave'>
                        WAVE { wave.current }/{ wave.max }
                    </div>
                    <div className='turn'>
                        Turn { turn }
                    </div>                
                </div>
                <div>
                    <div className="tension">
                        Tension { tension.current }/{ tension.max }
                    </div>
                </div>
            </div>
            <div className="flex skill-name ui" 
                style={{ width: gameWidth + 'px', marginTop: gameWidth * (8/100) + 'px', left: `${(window.innerWidth - gameWidth) / 2}px`, opacity: 0}}
                ref={($el) => labelRef.current = $el}>
                <label>{ skillName }</label>
            </div>        
        </div>
    )
}