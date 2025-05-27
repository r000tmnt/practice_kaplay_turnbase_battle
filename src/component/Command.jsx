import { useSelector } from "react-redux"

export default function Command({currentActivePlayer, notifyParent}) {
    const units = useSelector(state => state.game.units)
    const gameWidth = useSelector(state => state.setting.width)   

    return(
        <div className={`command ui ${currentActivePlayer >= 0? 'show' : 'hide'}`} style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }} >
            <div className='avatar'>
                <img src="battle/Animations/Defensive_Stance.png" alt="player" style={{ width: `${gameWidth * 0.2}px`, height: `${gameWidth * 0.2}px`, objectFit: 'cover' }}></img>
                <div className='meter'>
                    <label>
                    HP
                    <div className='bar hp'>
                        { units[currentActivePlayer]?.attribute.hp }/{ units[currentActivePlayer]?.attribute.maxHp }
                    </div>
                    </label>
                    <label>
                    MP
                    <div className='bar mp'>
                        { units[currentActivePlayer]?.attribute.mp }/{ units[currentActivePlayer]?.attribute.maxMp }
                    </div>
                    </label>
                </div>
            </div>
        <div className='action'>
          <div className='relative'>
            <button className='position-center' onClick={() => notifyParent('attack', units[currentActivePlayer], currentActivePlayer)}>ATTACK</button>
          </div>
          <div className='relative'>
            <button className='position-center' onClick={() => notifyParent('skill', units[currentActivePlayer], currentActivePlayer)}>SKILL</button>
          </div>
          <div className='relative'>
            <button className='position-center' onClick={() => notifyParent('item', units[currentActivePlayer], currentActivePlayer)}>ITEM</button>
          </div>
          <div className='relative'>
            <button className='position-center' onClick={() => notifyParent('defense', units[currentActivePlayer], currentActivePlayer)}>DEFENSE</button>
          </div>
          <div className='relative'>
            <button className='position-center' onClick={() => notifyParent('change', units[currentActivePlayer], currentActivePlayer)}>CHANGE</button>
          </div>
          <div className='relative'>
            <button className='position-center' onClick={() => notifyParent('escape', units[currentActivePlayer], currentActivePlayer)}>ESCAPE</button>
          </div>
        </div>
      </div>
    )
}