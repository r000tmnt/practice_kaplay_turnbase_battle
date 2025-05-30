import { useSelector } from "react-redux"

export default function BattleCounter() {
    const wave = useSelector(state => state.game.wave)
    const turn = useSelector(state => state.game.turn)
    const tension = useSelector(state => state.game.tension)
    const gameWidth = useSelector(state => state.setting.width)
    // const scale = useSelector(state => state.setting.scale)

    return (
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

    )
}