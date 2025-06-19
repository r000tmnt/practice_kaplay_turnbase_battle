import { useEffect, useState, useMemo, useRef } from 'react'
import './App.css'
import k from './lib/kaplay';

// store
import { useSelector, useDispatch } from 'react-redux';
import {
  setUnits,
  updateUnit,
  setWave,
  setTension,
  setCurrentActivePlayer,
} from './store/game';
import store from './store/store'
import { setScale } from './store/setting';

// Units data
import unit from './data/unit';

// Components
import BattleCounter from './component/BattleCounter';
import ATB from './component/ATB';
import UnitArrow from './component/UnitArrow';
import Command from './component/Command';

const { 
  scene, 
  loadSprite, 
  loadShader,
  add, 
  pos, 
  sprite, 
  go, 
  scale,
  rect,
  area,
  text,
  onClick,
  onHover,
  onUpdate,
  onDraw,
  shader,
  outline,
  wait, 
  time,
  loop,
  opacity,
  rotate,
  animate,
  tween,
  easings,
  vec2,
  color,
  BLACK,
  WHITE,
  RED,
  YELLOW,
  drawUVQuad,
  width,
  dt,
} = k

// const getStoreState = (target) => {
//   return settingStore.getState()[target]
// }

const initScene = () => {
  // Scenes can accept argument from go()
  scene('game', () => {
    // Load sprites
    loadSprite('field', 'bg/nature_2/orig.png')
    loadSprite('player', 'battle/Animations/Defensive_Stance.png')

    // Shader
    // Reference from: https://github.com/kaplayjs/kaplay/issues/394
    // loadShader('outline', null,
    //   `uniform vec3 u_color;

    //   vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    //       vec4 outlineColor = vec4(vec3(u_color) / 255.0, 1.0);
    //       vec2 textureSize = vec2(2048, 2048);
    //       vec4 pixel = texture2D(tex, uv);
    //       const float EPSILON = 0.0001;
    //       if(pixel.a < EPSILON)
    //       {
    //           vec2 offset = vec2(1.0 / textureSize.x, 0.0);
    //           float left = texture2D(tex, uv - offset).a;
    //           float right = texture2D(tex, uv + offset).a;
          
    //           offset.x = 0.0;
    //           offset.y = 1.0 / textureSize.y;
    //           float up = texture2D(tex, uv - offset).a;
    //           float down = texture2D(tex, uv + offset).a;
          
    //           float a = step(EPSILON, left + right + up + down);
    //           pixel = mix(pixel, outlineColor, a);
    //       }
    //       return pixel;
    //   }`
    // )

    loadShader('waveTransition', null,
      `precision mediump float;

      uniform float u_time;

      vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
          float progress = u_time * 0.5;

          // Width of the mask band (0.3 = ~30% of screen width)
          float bandWidth = 1.0;

          // Jagged shape (random noise via sin)
          float bands = 20.0;
          float band = floor(uv.y * bands);
          float bandOffset = mod(band, 2.0) * 0.05;
          float jag = sin(uv.y * 100.0 + progress * 10.0) * 0.02;

          // Moving window edges
          float head = 1.5 - progress + bandOffset + jag;              // right jagged edge
          float tail = head - bandWidth;                               // left jagged edge

          // Inside the band: draw black
          if (uv.x > tail && uv.x < head) {
              return vec4(0.0, 0.0, 0.0, 1.0);
          }

          // Else: fully transparent
          return vec4(0.0, 0.0, 0.0, 0.0);
      }`
    )
  })

  go('game')
}

if(typeof window !== 'undefined') initScene()

function App() {
  const [bg, setBg] = useState({})
  const [position, setPosition] = useState([])
  const positionRef = useRef(null)
  const [timerToAct, setTimerToAct] = useState({})
  const spriteRef = useRef([])
  const [activeUnits, setActiveUnit] = useState([])
  const next = useMemo(() => activeUnits.length? activeUnits.find(a => a < 5) : -1, [activeUnits])
  const [pointedTarget, setPointedTarget] = useState(-1)
  const skillRef = useRef([])

  const gameWidth = useSelector(state => state.setting.width)
  const gameHeight = useSelector(state => state.setting.height)
  const units = useSelector(state => state.game.units)
  const wave = useSelector(state => state.game.wave)
  const tension = useSelector(state => state.game.tension)
  const currentActivePlayer = useSelector(state => state.game.currentActivePlayer)

  const dispatch = useDispatch()

  const atbRef = useRef(null)

  // #region Scale UI
  // Reference from: https://jslegenddev.substack.com/p/how-to-display-an-html-based-ui-on
  const scaleUI = () => {
    const value = Math.min(
      window.innerWidth / gameWidth,
      window.innerHeight / gameHeight
    )

    dispatch(
      setScale(value)
    )
    
    document.documentElement.style.setProperty("--scale", value);
  }

  useEffect(() => {
    window.addEventListener('resize', scaleUI)
    // Fire the function on the first time
    scaleUI()

    // Game init
    setBg(add([sprite('field'), pos(gameWidth * -0.25, gameHeight * -0.5), scale(6)]))

    // Cleanup: Remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', scaleUI)
    }
  }, [])

  // Calculate positions when the background is displayed
  useEffect(() => {
    if(Object.entries(bg).length){
      wait(1, () => {
        // Set position rects
        const playerPositions = []
        const enemyPositions = []
        const playerPositionRef = [
          // x, y
          [0.7, 0.6], [0.7, 0.7], [0.8, 0.55], [0.8, 0.65], [0.8, 0.75]
        ]
        const enemyPositionRef = [
          // x, y
          [0.22, 0.6], [0.22, 0.7], [0.12, 0.55], [0.12, 0.65], [0.12, 0.75]
        ]

        const size = gameWidth * 0.1

        for(let i=0; i < 5; i++){
          playerPositions.push(
            add([
              pos(gameWidth * playerPositionRef[i][0], gameHeight * playerPositionRef[i][1]),
              rect(size, size),
              opacity(0.5),
              area()
            ])
          )

          enemyPositions.push(
            add([
              pos(gameWidth * enemyPositionRef[i][0], gameHeight * enemyPositionRef[i][1]),
              rect(size, size),
              opacity(0.5),
              area()
            ])
          )      
        }

        setPosition([playerPositions, enemyPositions])        
      })
    }
  }, [bg])
  // #endregion

  // #region Draw characters
  useEffect(() => {
    // The max number needs to be change by the battle
    if(position.length === 2 && !units.length){
      console.log('position')

      // Update position ref
      if(!positionRef.current) positionRef.current = position
      else return

      drawCharacters()
    }
  }, [position])

  const drawCharacters = () => {
    const zoom = 1.5
    let player = []

    for(let i=0; i < position.length; i++){
      const currentSets = position[i]
      for(let j=0; j < currentSets.length; j++){
        const set = currentSets[j]
        console.log(set.pos)
        const { x, y } = set.pos
        let data = null
        const index = (i > 0)? j + 5 : j

        if(wave.current > 1){
          const units = store.getState().game.units
          if(!units[index]) return
          data = JSON.parse(JSON.stringify(units[index]))
          if(i > 0){
            // Refill the hp and mp
            data.attribute.hp = data.attribute.maxHp
            data.attribute.mp = data.attribute.maxMp
          }
        }else{
          data = (i > 0)? unit.enemy[j] : unit.player[j]
        }

        if(data){
          // 128px is the height of the sprite
          // 20px is the height of the rect
          player.push({...data})
          if(wave.current === 1){
            spriteRef.current.push(
              add([
                sprite('player', { flipX: (i > 0)? false : true }), 
                pos(x - (128 / 2), y - (128 + 20)), 
                scale(zoom),
                opacity(1),
                area(),
                // tag
                "unit",
                `index_${index}`
              ])
            )          
          }else{
            // Recreate enemy sprite if destoryed
            if(!spriteRef.current[index] && i > 0){
              spriteRef.current[index] = add([
                sprite('player', { flipX: (i > 0)? false : true }), 
                pos(x - (128 / 2), y - (128 + 20)), 
                scale(zoom),
                opacity(1),
                area(),
                // tag
                "unit",
                `index_${index}`
              ])
            }
          }
        }else break
      }              
    }     
    // console.log('dispath', player)
    dispatch(
      setUnits(player)            
    )

    // Set ATB bars 
    player.forEach((p, index) => {
      if(atbRef.current){
        atbRef.current.loopConstructor(index, p, position)
      }
    })
  }

  // #eng regin

  // #region Enemy AI
  const enemyAI = (unit, index) => {
    const actions = [ 'attack', 'skill', 'item', 'defense', 'change', 'escape' ]
              
    const rng = Math.random() * actions.length

    const action = actions[Math.floor(rng)]

    const input = {
      action: null,
      callback: () => {
        console.log(unit.name, 'callback loop')
        const unitData = store.getState().game.units[index]
        if(unitData.attribute.hp > 0){
          if(atbRef.current) atbRef.current.loopConstructor(index, unit, positionRef.current)
        }
      }
    }

    // Keep tracking action
    dispatch(
      updateUnit({ name: unit.name, attribute: unit.attribute, action })
    )

    // TODO - Call the action
    switch (action) {
      case 'attack':{
          // Choose a player
          const target = Math.round(Math.random() * 4)
          const units = store.getState().game.units
          input.action = function(){ controller(() => attack(unit, units[target], index, target), index ) } 
        }
        break
      case 'skill':
        input.action = function(){ controller(async() => { console.log('Enemy skill')}, index ) } 
        break
      case 'item':
        input.action = function(){ controller(async() => { console.log('Enemy item')}, index ) } 
        break
      case 'defense':
        input.action = function(){ controller(async() => { console.log('Enemy defense')}, index ) } 
        break
      case 'change':
        input.action = function(){ controller(async() => { console.log('Enemy change')}, index ) } 
        break
      case 'escape':
        input.action = function(){ controller(async() => { console.log('Enemy escape')}, index ) } 
        break
    }

    setActiveUnit(prevState => prevState.filter(a => a !== index))

    if(atbRef.current){
      atbRef.current.waitConstructor(index, unit, input.action, input.callback)
    }
  }
  // #endregion

  // #region Shared actions
  const controller = (actionFunction, index, actionCallBack = null) => {
    // Pause timers of the other units
    setTimerToAct({ index, value: true })
    
    actionFunction().then(() => {
      if(actionCallBack) actionCallBack()
      // Resume timers of the other units
      setTimerToAct({ index, value: false }) 
    })
  }

  const getAvailableTargets = (target ,tindex, start, end) => {
    // Get latest state
    const units = store.getState().game.units

    // Check if the target is in the field
    if(units[tindex].attribute.hp === 0){
      // Change target if any
      let nextTarget = null
      for(let i=start; i < end; i++){
        if(units[i] && units[i].attribute.hp > 0){
          nextTarget = units[i]
          break
        }
      }

      if(nextTarget) target = nextTarget

      return nextTarget
    }else{
      return target
    }
  }

  /**
   * Attack function
   * @param {Object} unit - Who performs the attack
   * @param {Object} target - Who takes damage 
   * @param {number} uindex - The index of the player unit in the unitSprites array
   * @param {number} tindex - The index of the enemy unit in the unitSprites array
   */
  const attack = async (unit, target, uIndex, tindex) => {
    target = getAvailableTargets(target, tindex, 5, 10)

    if(!target) return

    let dmg = (unit.attribute.inFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100))) - Math.round(target.attribute.def * (target.attribute.def / 100))
    dmg += Math.round(dmg * (tension.current / 100)) // Add tension bonus

    const crit = unit.attribute.luck / 100

    const rng = Math.random()

    if(rng <= crit){
      dmg = Math.round(dmg * 1.5)
    }

    // If the target take defense
    if(target.action === 'defense') dmg = Math.round(dmg / 2)    

    const attribute = JSON.parse(JSON.stringify(target.attribute))
    attribute.hp -= (dmg > attribute.hp)? attribute.hp : dmg
    
    dispatch(
      updateUnit({ name: target.name, attribute: attribute, action: target.action })
    )

    showText(unit, dmg, rng, crit, tindex, attribute)
  }

    /**
   * Skill function
   * @param {Object} unit - Who performs the attack
   * @param {Object} target - Who takes damage 
   * @param {number} uindex - The index of the player unit in the unitSprites array
   * @param {number} tindex - The index of the enemy unit in the unitSprites array
   * @param {Object} skill - The skill object
   */
  const castSkill = async (unit, target, uIndex, tindex, skill) => {
    if(skill.type !== 'Support'){
        target = getAvailableTargets(target, tindex, 5, 10)
        if(!target) return

        if(skill.type === 'InFight'){
          let dmg = (unit.attribute.inFight + Math.round(unit.attribute.inFight * (unit.attribute.inFight / 100))) - Math.round(target.attribute.def * (target.attribute.def / 100))
          dmg += Math.round(dmg * (tension.current / 100)) // Add tension bonus
      
          const crit = unit.attribute.luck / 100
      
          const rng = Math.random()
      
          if(rng <= crit){
            dmg = Math.round(dmg * 1.5)
          }
      
          // If the target take defense
          if(target.action === 'defense') dmg = Math.round(dmg / 2)    
      
          const attribute = JSON.parse(JSON.stringify(target.attribute))
          attribute.hp -= (dmg > attribute.hp)? attribute.hp : dmg
          
          dispatch(
            updateUnit({ name: target.name, attribute: attribute, action: target.action })
          )
      
          showText(unit, dmg, rng, crit, tindex, attribute)          
        }

        if(skill.type === 'GunFight'){}

        if(skill.type === 'Super'){}
    }else{
        target = getAvailableTargets(target, tindex, 0, 5)
        if(!target) return
    }
  }

  const showText = (unit, number, rng, crit, tindex, attribute) => {
    // Create text
    const resultText = add([
      text(number, { size: (rng <= crit)? 48 : 36 }),
      pos(spriteRef.current[tindex].pos.x + (128 / 2), spriteRef.current[tindex].pos.y - 10),
      opacity(1),
      color((rng <= crit)? YELLOW : WHITE),
      outline(1, BLACK)
    ])

    // Animate the text
    tween(
      resultText.pos, 
      vec2(resultText.pos.x, resultText.pos.y - 50), 
      0.5,
      (pos) => resultText.pos = pos,
      easings.easeInOutQuad
    ).onEnd(() => {
      resultText.destroy()

      if(unit.ation === 'attack') {
        if(attribute.hp === 0) {
          unitLoseHandle(tindex)
        }else{
          dispatch(
            setTension({ current: 1 })
          )
        }        
      }

      if(unit.action === 'skill') {
        const skill = skillRef.current.find(s => s.unit.name === unit.name)
        if(skill.type !== 'Support'){
          if(attribute.hp === 0) {
            unitLoseHandle(tindex)
          }else{
            dispatch(
              setTension({ current: 1 })
            )
          }    
        }
      }
    })
  }

  const unitLoseHandle = (tindex) => {
    // TODO - Unit lose animation
    tween(
      spriteRef.current[tindex].opacity, 
      0, 
      0.5,
      (o) => spriteRef.current[tindex].opacity = o, 
      easings.linear
    ).onEnd(() => {
      // Remove sprite
      spriteRef.current[tindex].destroy()
    })

    dispatch(
      setTension({ current: 5 })
    )

    // Remove the atb bar of the unit
    if(atbRef.current) atbRef.current.removeBar(tindex)
    
    // TODO - If no more enemy in the scene
    let remain = 0
    // TODO - Need to set the starting number as the length of players
    for(let i=5; i < units.length; i++){
      // In case if the state is not update yet
      if(units[i].attribute.hp > 0 && i !== tindex) remain += 1
    }

    if(!remain){
      // STOP timers
      Array.from([0, 1, 2, 3 ,4]).forEach(i => atbRef.current.removeBar(i))
      // Empty activeUnit stack
      setActiveUnit([])          
      // Reset pointer
      setPointedTarget(-1)
      dispatch(setCurrentActivePlayer(-1))
      wait(0.3, () => {
        if(wave.current !== wave.max){
          console.log('next wave?')
          dispatch(setWave(1))
        }else{
          // TODO - End of the battle
        }        
      })
    }

    console.log('remaing', remain)
  }
  // #endregion

  // #region Player actions
  /** 
   * Change the ui state and enable sprite hover and click events
  */

  const playerAction = (action, unit, skill=null) => {
    if(unit === undefined) return

    dispatch(
      updateUnit({ name: unit.name, attribute: unit.attribute, action })
    )

    switch (action) {
      case 'attack': {
        spriteHoverEvent.paused = false
        spriteClickEvent.paused = false
        // Find available target
          for(let i=5; i < 10; i++){
            if(units[i] && units[i].attribute.hp > 0){
              setPointedTarget(i - 5)
              break
            }
          }
        }
        break
      case 'skill': {
        if(skill){
          skillRef.current.push({
            unit,
            skill
          })
          spriteHoverEvent.paused = false
          spriteClickEvent.paused = false     
          
          if(skill.type !== 'Support'){ 
            // Find available target
            for(let i=5; i < 10; i++){
              if(units[i] && units[i].attribute.hp > 0){
                setPointedTarget(i - 5)
                break
              }
            }      
          }else{
            // Find available target
            for(let i=0; i <= 4; i++){
              if(units[i] && units[i].attribute.hp > 0){
                setPointedTarget(i)
                break
              }
            }               
          }
        }
      }
        break
      case 'item':
        // TODO - Display avialable items
        break
      case 'defense':
        // TODO - Switch to defense sprite / animation
        break
      case 'change':
        // TODO - Font line to back, back to front line
        break
      case 'escape':
        // TODO - Get the possiblity to success
        break
    } 
  }

  const spriteClickEvent = onClick('unit', (sprite) => {
    // Get the latest state
    const currentActivePlayer = store.getState().game.currentActivePlayer

    if(currentActivePlayer < 0) {
      console.log('current active player error', currentActivePlayer)
      return
    }

    // Get the index of the clicked sprite
    const target = Number(sprite.tags.find((tag) => tag.includes('index_')).split('_')[1])

    // Get the latest state
    const units = store.getState().game.units
    const unit = store.getState().game.units[currentActivePlayer] 

    if(unit && !unit.action.length) {
      console.log('unit action lost', unit)
      return
    }

    const input = {
      action: null,
      callback: () => {
        if(atbRef.current) atbRef.current.loopConstructor(currentActivePlayer, unit, positionRef.current)
      }
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
        const skill = skillRef.current.find(s => s.unit.name === unit.name)
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
    }

    setPointedTarget(-1)
    spriteHoverEvent.paused = true
    spriteClickEvent.paused = true        

    setActiveUnit((prevState) => prevState.filter((a) => a !== currentActivePlayer))
    if(atbRef.current){
      atbRef.current.waitConstructor(currentActivePlayer, unit, input.action, input.callback)
    }    
    dispatch(setCurrentActivePlayer(-1))
    // Reset action value
    dispatch(updateUnit({ name: unit.name, attribute: unit.attribute, action: '' }))
  })
  // Default to paused
  spriteClickEvent.paused = true

  const spriteHoverEvent = onHover('unit', (unit) => {
    // Get the latest state
    const currentActivePlayer = store.getState().game.currentActivePlayer
    const units = store.getState().game.units[currentActivePlayer]

    if(currentActivePlayer < 0 || units && !units.action.length) return

    // console.log('currentActivePlayer ', currentActivePlayer)

    switch(units.action){
      case 'attack': {
        const target = Number(unit.tags.find((tag) => tag.includes('index_')).split('_')[1])
        if(target > 4) setPointedTarget(target - 5)
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
      if(next !== undefined){
        console.log('Set the next acting player ', activeUnits)
        const unit = store.getState().game.units[next]
        // Update unit state only when the action value is empty
        if(!unit.action.length) dispatch(setCurrentActivePlayer(next))
        else dispatch(updateUnit({name: unit.name, attribute: unit.attribute, action: ''}))
      }   
    }
  }, [activeUnits])
  // #endregion

  // #region ATB
  const onAtbBarFinished = (unit, index) => {
    if(activeUnits.find(a => a === index) !== undefined) return
    setActiveUnit((prevState) => [...prevState, index])
    if(index > 4){
      const unitData = store.getState().game.units[index]
      if(unitData.attribute.hp > 0){
        // Set enemy action after 1 to 3 seconds most
        wait(Math.round(Math.random() * 2) + 1, () => {
          enemyAI(unit, index)
        })        
      }
    }
  }
  // #endregion

  // #region wave transition
  useEffect(() => {
    if(wave.current > 1 && wave.current < wave.max){
      let time = 0
      const transiiton = onDraw(() => {
        time += dt()

        if(time >= 3){
          transiiton.cancel()
          // transiiton.destroy()
        }else{
          drawUVQuad({
            width: gameWidth * 2,
            height: gameHeight,
            shader: 'waveTransition',
            uniform: {
              "u_time": time,
            }
          })          
        }
      })

      wait(1, () => {
        drawCharacters()
      })
    }
  }, [wave])
  // #endregion

  return (
    <>
      {
        // Add your UI here
      }
      <BattleCounter />

      <ATB 
        activeUnits={activeUnits} 
        notifyParent={onAtbBarFinished} 
        ref={atbRef}
        pause={timerToAct}
      />

      <UnitArrow 
        currentActivePlayer={currentActivePlayer}
        pointedTarget={pointedTarget}
        position={position}   
      />

      <Command 
        currentActivePlayer={currentActivePlayer}
        notifyParent={playerAction}
      />
    </>
  )
}

export default App