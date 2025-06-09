import { useSelector, useDispatch } from "react-redux"
import { updateUnit } from "../store/game"

export default function Command({currentActivePlayer, notifyParent}) {
    const units = useSelector(state => state.game.units)
    const gameWidth = useSelector(state => state.setting.width)   
    const dispatch = useDispatch()

    return(
      <>
        <div className={`command ui ${currentActivePlayer >= 0 && !units[currentActivePlayer].action.length? 'show' : 'hide'}`} style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }} >
          <div className='avatar'>
            { currentActivePlayer >= 0? units[currentActivePlayer].name : '' }
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
              <button className='position-center' onClick={() => notifyParent('attack', units[currentActivePlayer])}>ATTACK</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => notifyParent('skill', units[currentActivePlayer])}>SKILL</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => notifyParent('item', units[currentActivePlayer])}>ITEM</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => notifyParent('defense', units[currentActivePlayer])}>DEFENSE</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => notifyParent('change', units[currentActivePlayer])}>CHANGE</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => notifyParent('escape', units[currentActivePlayer])}>ESCAPE</button>
            </div>
          </div>
        </div>

        <button 
          className={`back ui ${currentActivePlayer >= 0 && units[currentActivePlayer].action.length? 'show' : 'hide'}`} 
          style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }}
          onClick={() => dispatch(updateUnit({ name: units[currentActivePlayer].name, attribute: units[currentActivePlayer].attribute, action: '' }))}>BACK</button>      
      </>
    )
}