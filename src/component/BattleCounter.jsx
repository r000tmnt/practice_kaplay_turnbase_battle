import { useSelector } from "react-redux"

export default function BattleCounter() {
    const wave = useSelector(state => state.game.wave)
    const turn = useSelector(state => state.game.turn)
    const tension = useSelector(state => state.game.tension)

    return (
        <div className="counter flex ui">
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