import { useSelector, useDispatch } from "react-redux"
import { setTurn, setInactiveUnits } from '../store/game'
import { useEffect, useRef } from "react"
import k from "../lib/kaplay"

const { wait } = k

export default function BattleCounter() {
    const wave = useSelector(state => state.game.wave)
    const turn = useSelector(state => state.game.turn)
    const tension = useSelector(state => state.game.tension)
    const gameWidth = useSelector(state => state.setting.width)
    const uiOffsetV = useSelector(state => state.setting.uiOffsetV)
    const uiOffsetH = useSelector(state => state.setting.uiOffsetH)
    const skillName = useSelector(state => state.game.currentCastingSkill)
    const inactiveUnits = useSelector(state => state.game.inactiveUnits)
    const units = useSelector(state => state.game.units)
    const wrapperRef = useRef(null)
    const labelRef = useRef(null)
    const dispatch = useDispatch()
    
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
        if(wave.current > 1){
            wrapperRef.current.style.opacity = 0
            wait(3, () => {
                wrapperRef.current.style.opacity = 1
            })
        }
    }, [wave])

    useEffect(() => {
        // TODO - If reached a turn
        const activatingUnits = units.filter(u => u.attribute.hp > 0)
        if(activatingUnits.length && inactiveUnits.length >= activatingUnits.length){
            dispatch(setTurn(turn + 1))
            dispatch(setInactiveUnits([]))
        }
    }, [inactiveUnits])

    return (
        <div ref={($el) => wrapperRef.current = $el}>
            <div className="counter flex ui" style={{ left: `${uiOffsetV}px`, top: `${uiOffsetH}px` }}>
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
                style={{ width: gameWidth + 'px', marginTop: gameWidth * (8/100) + 'px', left: `${uiOffsetV}px`, top: `${uiOffsetH}px`, opacity: 0}}
                ref={($el) => labelRef.current = $el}>
                <label>{ skillName }</label>
            </div>        
        </div>
    )
}