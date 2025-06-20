import { useSelector, useDispatch } from "react-redux"
import { updateUnit } from "../store/game"
import skills from "../data/skill.json"
import { useState } from "react"

export default function Command({currentActivePlayer, notifyParent}) {
    const units = useSelector(state => state.game.units)
    const gameWidth = useSelector(state => state.setting.width)
    const [showCancel, setShowCancel] = useState(false)
    const [skillList, setSkillList] = useState([])
    const dispatch = useDispatch()

    const setAction = (action) => {
      notifyParent(action, units[currentActivePlayer])

      if(action === 'attack'){
        setShowCancel(true)
      }

      if(action === 'skill'){
        // setShowCancel(true)
        units[currentActivePlayer].skill.forEach(s => {
          setSkillList(prev => {
            return [...prev, skills[s]]
          });
        });
      }
    }

    const cancelAction = () => {
      if(units[currentActivePlayer].action === 'attck'){
        dispatch(updateUnit({ name: units[currentActivePlayer].name, attribute: units[currentActivePlayer].attribute, action: '' }))
      }

      if(units[currentActivePlayer].action === 'skill'){
        setShowCancel(false)
        setAction('skill') // Reset skill list, back to skill menu
      }
    }

    return(
      <>
        <div className={`command ui ${currentActivePlayer >= 0 && !units[currentActivePlayer].action.length? 'show' : 'hide'}`} style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }} >
          <div className='avatar'>
            { currentActivePlayer >= 0? units[currentActivePlayer].name : '' }
            <img src="battle/Animations/Defensive_Stance.png" alt="player" style={{ width: `${gameWidth * 0.2}px`, height: `${gameWidth * 0.2}px`, objectFit: 'cover' }}></img>
            <div className='meter'>
              <label>
                HP
                <div className='bar hp' style={{ width: `${(units[currentActivePlayer]?.attribute.hp / units[currentActivePlayer]?.attribute.maxHp) * 100}%` }}>
                  { units[currentActivePlayer]?.attribute.hp }/{ units[currentActivePlayer]?.attribute.maxHp }
                </div>
              </label>
              <label>
                MP
                <div className='bar mp' style={{ width: `${(units[currentActivePlayer]?.attribute.mp / units[currentActivePlayer]?.attribute.maxMp) * 100}%` }}>
                  { units[currentActivePlayer]?.attribute.mp }/{ units[currentActivePlayer]?.attribute.maxMp }
                </div>
              </label>
            </div>
          </div>
          <div className='action'>
            <div className='relative'>
              <button className='position-center' onClick={() => setAction('attack')}>ATTACK</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => setAction('skill')}>SKILL</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => setAction('item')}>ITEM</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => setAction('defense')}>DEFENSE</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => setAction('change')}>CHANGE</button>
            </div>
            <div className='relative'>
              <button className='position-center' onClick={() => setAction('escape')}>ESCAPE</button>
            </div>
          </div>
        </div>

        {
          // Skill menu 
        }
        <div className={`skill-list ui ${skillList.length > 0? 'show' : 'hide'}`} style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }}>
        { skillList.map((s, index) => {
              return (
                <div key={index} className={`skill-item ${units[currentActivePlayer].attribute.mp < s.cost['mp']? 'not-enough' : ''}`} 
                onClick={() => {
                  setShowCancel(true)
                  notifyParent('skill', units[currentActivePlayer], s)
                  setSkillList([])
                }}>
                  {/* <img src={s.icon} alt={s.name} /> */}
                  <div className='skill-name'>{s.name}</div>
                  <div className='skill-cost'>{
                    Object.keys(s.cost).map((key, i) => {
                      return (
                        <span key={i}>
                          {key}: {s.cost[key]} 
                        </span>
                      )
                    })  
                  }</div>
                </div>
              )
            }) }
            <button onClick={() => dispatch(updateUnit({ name: units[currentActivePlayer].name, attribute: units[currentActivePlayer].attribute, action: '' }))}>BACK</button>
        </div>

        <button 
          className={`back ui ${currentActivePlayer >= 0 && showCancel? 'show' : 'hide'}`} 
          style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }}
          onClick={() => cancelAction()}>BACK</button>      
      </>
    )
}