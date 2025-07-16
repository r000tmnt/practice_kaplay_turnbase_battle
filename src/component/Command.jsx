import { useSelector, useDispatch } from "react-redux"
import skills from "../data/skill.json"
import items from '../data/items.json'
import { useState, useEffect } from "react"
import k from '../lib/kaplay'
import store from "../store/store"
import { 
  updateUnit, setPointedTarget, setCurrentActivePlayer, 
  setAllToStop, setActiveUnits 
} from '../store/game'
import { 
  controller, attack, castSkill, 
  useItem, isEscapable, changeUnitOrder
} from "../utils/battle"
import { loopConstructor, waitConstructor } from "../utils/ATB"
import { 
  skillRef, itemRef, positionRef,
  spriteRef
} from "../scene/game"

const { 
  onClick, onHover, tween, 
  vec2, easings
} = k

export default function Command() {
  const units = useSelector(state => state.game.units)
  const gameWidth = useSelector(state => state.setting.width)
  const inventory = useSelector(state => state.game.inventory)
  const currentActivePlayer = useSelector(state => state.game.currentActivePlayer)
  const activeUnits = useSelector(state => state.game.activeUnits)
  const [showCancel, setShowCancel] = useState(false)
  const [skillList, setSkillList] = useState([])
  const [itemList, setItemList] = useState([])
  const dispatch = useDispatch()

  const setAction = (action) => {
    const unit = JSON.parse(JSON.stringify(units[currentActivePlayer]))
    unit.action = action
    dispatch(
      updateUnit({ name: unit.name, attribute: unit.attribute, action })
    )

    switch(action){
      case 'attack':
        setShowCancel(true)
        playerAction(action, units[currentActivePlayer])
      break;
      case 'skill':
        units[currentActivePlayer].skill.forEach(s => {
          setSkillList(prev => {
            return [...prev, skills[s]]
          });
        });
      break;
      case 'item':
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
      break;
      case 'defense':
      case 'change':
      case 'escape':
        playerAction(action, units[currentActivePlayer])
      break;        
    }      
  }

  const cancelAction = () => {
    if(units[currentActivePlayer].action === 'attack'){
      dispatch(
        updateUnit({ name: units[currentActivePlayer].name, attribute: units[currentActivePlayer].attribute, action: '' })
      )
      setShowCancel(false)
    }

    if(units[currentActivePlayer].action === 'skill'){
      setShowCancel(false)
      setAction('skill') // Reset skill list, back to skill menu
    }

    if(units[currentActivePlayer].action === 'item'){
      setShowCancel(false)
      setAction('item') // Reset item list, back to item menu
    }
  }

  const actionClear = (unit, currentActivePlayer, loop=false) => {
    const activeUnits = store.getState().game.activeUnits
    dispatch(
      setActiveUnits(activeUnits.filter((a) => a !== currentActivePlayer))
    )
    dispatch(setCurrentActivePlayer(-1))
    // Reset action value
    dispatch(
      updateUnit({ name: unit.name, attribute: unit.attribute, action: '' })
    )     
    unit.action = ''       
    if(loop) loopConstructor(currentActivePlayer, unit, positionRef, null, null)
  }
  // region Player Action
  const playerAction = (action, unit, payload = null) => {
    if(unit === undefined) return

    switch (action) {
      case 'attack': {
        spriteHoverEvent.paused = false
        spriteClickEvent.paused = false
        // Find available target
          for(let i=5; i < 10; i++){
            if(units[i] && units[i].attribute.hp > 0){
              dispatch(setPointedTarget(i - 5)) 
              break
            }
          }
        }
        break
      case 'skill': {
        if(payload && 'attribute' in payload){
          skillRef.push({
            unit,
            ...payload
          })
          spriteHoverEvent.paused = false
          spriteClickEvent.paused = false     
          
          if(payload.type !== 'Support'){ 
            // Find available target
            for(let i=5; i < 10; i++){
              if(units[i] && units[i].attribute.hp > 0){
                dispatch(setPointedTarget(i - 5)) 
                break
              }
            }      
          }else{
            // Find available target
            for(let i=0; i <= 4; i++){
              if(units[i] && units[i].attribute.hp > 0){
                dispatch(setPointedTarget(i)) 
                break
              }
            }               
          }
        }
      }
        break
      case 'item':
        if(payload && 'effect' in payload){
          itemRef.push({
            unit,
            ...payload
          })

          spriteHoverEvent.paused = false
          spriteClickEvent.paused = false   
          
          // Find available target
          for(let i=0; i <= 4; i++){
            if(units[i] && units[i].attribute.hp > 0){
              dispatch(setPointedTarget(i)) 
              break
            }
          }             
        }
        break
      case 'defense':{
        const input = {
          action: function(){ 
            controller(
              async() => { console.log('player defense') },
              currentActivePlayer
            ) 
          },
          callback: () => { loopConstructor(currentActivePlayer, unit, positionRef, null, null) }
        }
        const activeUnits = store.getState().game.activeUnits
        dispatch(
          setActiveUnits(activeUnits.filter((a) => a !== currentActivePlayer))
        )
        dispatch(setCurrentActivePlayer(-1))
        waitConstructor(currentActivePlayer, unit, input.action, input.callback)
      }
        // TODO - Switch to defense sprite / animation
        break
      case 'change': {
        // Front line to back, back to front line
        const input = {
          action: function(){ 
            controller(
              () => changeUnitOrder(),
              currentActivePlayer
            ) 
          },
          callback: () => { loopConstructor(currentActivePlayer, unit, positionRef, null, null) }
        }
        // Pause timers of the other units
        // pauseOrResume({ index: currentActivePlayer, value: true })
        // actionClear(unit, currentActivePlayer)
        const activeUnits = store.getState().game.activeUnits
        // Only enemy is allow to act in the next few seconds
        dispatch(
          setActiveUnits(activeUnits.filter((a) => a > 4))
        )
        dispatch(setCurrentActivePlayer(-1))        
        waitConstructor(currentActivePlayer, unit, input.action, input.callback)
      }
        break
      case 'escape':
        isEscapable(unit).then(result => {      
          if(result){
            // Escape animation
            for(let i=0; i < 5; i++){
              const sprite = spriteRef[i]
              if(sprite.opacity > 0){
                sprite.flipX = !sprite.flipX
                
                tween(
                  sprite.pos, 
                  vec2(gameWidth, sprite.pos.y), 
                  0.5,
                  (pos) => sprite.pos = pos,
                  easings.easeInOutQuad
                )
              }
            }

            // End the battle
            dispatch(setAllToStop(true))
            // Result screen
          }else{
            actionClear(unit, currentActivePlayer, true)
          }
        })
        break
    } 
  }

  const spriteClickEvent = onClick('unit', (sprite) => {
    if(currentActivePlayer < 0) {
      console.log('current active player error', currentActivePlayer)
      return
    }

    const unit = JSON.parse(JSON.stringify(units[currentActivePlayer]))
    
    // Get the index of the clicked sprite
    const tag = sprite.tags.find((tag) => tag.includes('index_'));
    const target = tag ? Number(tag.split('_')[1]) : -1;

    if(unit && !unit.action.length) {
      console.log('unit action lost', unit)
      return
    }

    const input = {
      action: () => {},
      callback: () => { loopConstructor(currentActivePlayer, unit, positionRef, null, null) }
    }

    switch(unit.action){
      case 'attack':{
        if(Number(target) > 4){
          input.action = function(){ 
            controller(
              () => attack(unit, units[target], currentActivePlayer, target), 
              currentActivePlayer
            ) 
          }        
        }
      }
      break;
      case 'skill': {
        const skill = skillRef.find(s => s.unit.name === unit.name)
        if(skill){
          input.action = function(){ 
            controller(
              () => castSkill(unit, units[target], currentActivePlayer, target, skill),
              currentActivePlayer
            ) 
          }
        }
      }
      break;
      case 'item': {
        const item = itemRef.find(i => i.unit.name === unit.name)
        if(item){
          input.action = function(){ 
            controller(
              // eslint-disable-next-line react-hooks/rules-of-hooks
              () => useItem(unit, units[target], currentActivePlayer, target, item),
              currentActivePlayer
            ) 
          }
        }
      }
      break;
    }

    dispatch(setPointedTarget(-1))
    spriteHoverEvent.paused = true
    spriteClickEvent.paused = true        
    actionClear(unit, currentActivePlayer)
    waitConstructor(currentActivePlayer, unit, input.action, input.callback)
  })
  // Default to paused
  spriteClickEvent.paused = true

  const spriteHoverEvent = onHover('unit', (sprite) => {
    // Get the latest state
    const currentActivePlayer = store.getState().game.currentActivePlayer
    const units = store.getState().game.units[currentActivePlayer]

    if(currentActivePlayer < 0 || units === undefined || !units.action.length) return

    const tag = sprite.tags.find((tag) => tag.includes('index_'));
    const target = tag ? Number(tag.split('_')[1]) : -1;

    switch(units.action){
      case 'attack': {
        if(target > 4) dispatch(setPointedTarget(target - 5)) 
      }
      break;
      case 'skill':{
        const skill = skillRef.find(s => s.unit.name === units.name)
        if(skill?.type !== 'Support'){
          if(target > 4) dispatch(setPointedTarget(target - 5)) 
        } 
        else if(target > 4) dispatch(setPointedTarget(target - 5)) 
        else dispatch(setPointedTarget(target)) 
      }
      break;
      case 'item':{
        const item = itemRef.find(item => item.unit.name === units.name)
        if(item){
          if(target > 4) dispatch(setPointedTarget(target - 5)) 
          else dispatch(setPointedTarget(target)) 
        }
      }
      break;
    }
  })
  // Default to paused
  spriteHoverEvent.paused = true

  // Listen to activeUnit changes
  useEffect(() => {
    // Get the latest state
    const currentActivePlayer = store.getState().game.currentActivePlayer

    if(activeUnits.length && currentActivePlayer < 0){
      // Set the next acting player
      const next = activeUnits.find(a => a < 5)?? -1
      if(next >= 0){
        console.log('Set the next acting player ', next)
        console.log('activeUnits ', activeUnits)
        const unit = store.getState().game.units[next]
        // Update unit state only when the action value is empty
        if(unit && !unit.action.length) dispatch(setCurrentActivePlayer(next))
        // else dispatch(updateUnit({name: unit.name, attribute: unit.attribute, action: ''}))
      }   
    }
  }, [activeUnits])  
  // endregion    

    useEffect(() => {
      console.log('currentActivePlayer update ', currentActivePlayer)
      if(currentActivePlayer < 0){
        setShowCancel(false)
        setSkillList([])
      }
    }, [currentActivePlayer])

    return(
      <>
        <div className={`command ui ${currentActivePlayer >= 0 && units[currentActivePlayer] !== undefined && !units[currentActivePlayer].action.length? 'show' : 'hide'}`} style={{ left: `${(window.innerWidth - gameWidth) / 2}px` }} >
          <div className='avatar'>
            { currentActivePlayer >= 0? units[currentActivePlayer]?.name : '' }
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
                      playerAction('skill', units[currentActivePlayer], s)
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
                      playerAction('item', units[currentActivePlayer], item)
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