import { useSelector, useDispatch } from "react-redux"
import { updateUnit } from "../store/game"
import skills from "../data/skill.json"
import items from '../data/items.json'
import { useState, useEffect } from "react"

export default function Command({currentActivePlayer, notifyParent}) {
    const units = useSelector(state => state.game.units)
    const gameWidth = useSelector(state => state.setting.width)
    const inventory = useSelector(state => state.game.inventory)
    const [showCancel, setShowCancel] = useState(false)
    const [skillList, setSkillList] = useState([])
    const [itemList, setItemList] = useState([])
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

      if(action === 'item'){
        inventory.forEach(item => {
          for(let i=0; i < item.amount; i++){
            const data = items.find(d => d.id === item.id)
            if(data.stackable){
              data.amount = item.amount
            }else{
              data.amount = 1
            }
            
            setItemList(prev => {
              return [...prev, data]
            })

            if(data.stackable) break
          }
        })
      }
    }

    const cancelAction = () => {
      if(units[currentActivePlayer].action === 'attack'){
        dispatch(updateUnit({ name: units[currentActivePlayer].name, attribute: units[currentActivePlayer].attribute, action: '' }))
        setShowCancel(false)
      }

      if(units[currentActivePlayer].action === 'skill'){
        setShowCancel(false)
        setAction('skill') // Reset skill list, back to skill menu
      }
    }

    useEffect(() => {
      if(currentActivePlayer < 0){
        setShowCancel(false)
        setSkillList([])
      }
    }, [currentActivePlayer])

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
          <div className="action">
            { skillList.map((s, index) => {
                if(s)
                  return (
                    <button key={index} className={`skill-item ${units[currentActivePlayer] !== undefined && units[currentActivePlayer].attribute.mp < s.cost['mp']? 'not-enough' : ''}`} 
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
                    </button>
                  )
                }) }
          </div>
          <button className="back" style={{ width: '100%' }}
          onClick={() => {
            dispatch(updateUnit({ name: units[currentActivePlayer].name, attribute: units[currentActivePlayer].attribute, action: '' }))
            setSkillList([])
          }}>BACK</button>
        </div>

        {
          // Item menu
        }
        <div className={`item-list ui ${itemList.length > 0? 'show' : 'hide'}`} style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }}>
          <div className="action">
            { itemList.map((item, index) => {
                if(item)
                  return (
                    <button key={index} className={`item`} onClick={() => {
                      setShowCancel(true)
                      notifyParent('item', units[currentActivePlayer], item)
                      setItemList([])
                    }}>
                      <div className='skill-name'>{item.name}</div>
                      <div className='skill-cost'>{item.amount}</div>
                    </button>
                  )
              }) }
          </div>
          <button className="back" style={{ width: '100%' }}
          onClick={() => {
            dispatch(updateUnit({ name: units[currentActivePlayer].name, attribute: units[currentActivePlayer].attribute, action: '' }))
            setItemList([])
          }}>BACK</button>
        </div>

        <button 
          className={`back ui ${currentActivePlayer >= 0 && showCancel? 'show' : 'hide'}`} 
          style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }}
          onClick={() => cancelAction()}>BACK</button>      
      </>
    )
}