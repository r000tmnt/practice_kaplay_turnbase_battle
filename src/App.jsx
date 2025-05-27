import { useEffect, useState, useMemo } from 'react'
import './App.css'
import k from './lib/kaplay';

// store
import { useSelector, useDispatch } from 'react-redux';
import {
  setUnits,
  updateUnit,
  setAction,
} from './store/game';
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
  shader,
  outline,
  wait, 
  loop,
  opacity,
  rotate,
  animate,
  tween,
  easings,
  vec2,
  WHITE,
  RED,
  width,
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
    loadShader('outline', null,
      `uniform vec3 u_color;

      vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
          vec4 outlineColor = vec4(vec3(u_color) / 255.0, 1.0);
          vec2 textureSize = vec2(2048, 2048);
          vec4 pixel = texture2D(tex, uv);
          const float EPSILON = 0.0001;
          if(pixel.a < EPSILON)
          {
              vec2 offset = vec2(1.0 / textureSize.x, 0.0);
              float left = texture2D(tex, uv - offset).a;
              float right = texture2D(tex, uv + offset).a;
          
              offset.x = 0.0;
              offset.y = 1.0 / textureSize.y;
              float up = texture2D(tex, uv - offset).a;
              float down = texture2D(tex, uv + offset).a;
          
              float a = step(EPSILON, left + right + up + down);
              pixel = mix(pixel, outlineColor, a);
          }
          return pixel;
      }`
    )
  })

  go('game')
}

if(typeof window !== 'undefined') initScene()

function App() {
  const [bg, setBg] = useState({})
  const [position, setPosition] = useState([])
  const [atbBarToAct, setAtbBarToAct] = useState({})
  const [timerToAct, setTimerToAct] = useState({})
  const [unitSprites, setunitSprites] = useState([])
  const [activeUnits, setActiveUnit] = useState([])
  const previousActiveUnits = useMemo(() => activeUnits, [activeUnits])
  const currentActivePlayer = useMemo(() => activeUnits.find((a) => a < 5), [activeUnits])
  const [pointedTarget, setPointedTarget] = useState(-1)

  const gameWidth = useSelector(state => state.setting.width)
  const gameHeight = useSelector(state => state.setting.height)
  const units = useSelector(state => state.game.units)
  const action = useSelector(state => state.game.action)

  const dispatch = useDispatch()

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
      const zoom = 1.5
      let player = []
      try {
        for(let i=0; i < position.length; i++){
          const currentSets = position[i]
          for(let j=0; j < currentSets.length; j++){
            const set = currentSets[j]
            console.log(set.pos)
            const { x, y } = set.pos
            const data = (i > 0)? unit.enemy[j] : unit.player[j]
            // 128px is the height of the sprite
            // 20px is the height of the rect
            player.push({...data})
            setunitSprites((prevState) => [
              ...prevState, 
              add([
                sprite('player', { flipX: (i > 0)? false : true }), 
                pos(x - (128 / 2), y - (128 + 20)), 
                scale(zoom),
                area(),
                // tag
                "unit",
                `index_${(i > 0)? j + 5 : j}`
              ])
            ] )
          }              
        }     
        console.log('dispath', player)
        dispatch(
          setUnits(player)            
        )
      } catch (error) {
        console.log('Error:', error)
      }
    }
  }, [position, dispatch])
  // #eng regin

  // #region Enemy AI
  const enemyAI = (unit, index) => {
    const actions = [ 'attack', 'skill', 'item', 'defense', 'change', 'escape' ]
              
    const rng = Math.random() * actions.length

    const action = actions[Math.floor(rng)]

    const input = {
      unit, index,
      display: false,
      controller: {},
      callback: () => setAtbBarToAct({unit, index, display: true})
    }

    // TODO - Call the action
    switch (action) {
      case 'attack':
        input.controller = () => controller(() => { console.log('Enemy attack'), index })
        break
      case 'skill':
        input.controller = () => controller(() => { console.log('Enemy skill'), index })
        break
      case 'item':
        input.controller = () => controller(() => { console.log('Enemy item'), index })
        break
      case 'defense':
        input.controller = () => controller(() => { console.log('Enemy defense'), index })
        break
      case 'change':
        input.controller = () => controller(() => { console.log('Enemy change'), index })
        break
      case 'escape':
        input.controller = () => controller(() => { console.log('Enemy escape'), index })
        break
      default:
        input.controller = () => controller(() => { console.log('Enemy attack'), index })
        break
    }    

    setAtbBarToAct(input)
  }
  // #endregion

  // #region Shared actions
  const controller = (actionFunction, index, actionCallBack = null) => {
    // Pause timers of the other units
    setTimerToAct({ index, value: true })
    // TODO - Call the attack function
    console.log('Enemy attack function')
    actionFunction()

    if(actionCallBack) actionCallBack()
    // Resume timers of the other units
    setTimerToAct({ index, value: false })
  }

  /**
   * Attack function
   * @param {Object} unit - Who performs the attack
   * @param {Object} target - Who takes damage 
   * @param {number} index - The index of the unit in the unitSprites array
   */
  const attack = (unit, target, index) => {
    let dmg = unit.attribute.inFight - (unit.attribute.inFight * (target.attribute.def / 100))

    const crit = unit.attribute.luck / 100

    const rng = Math.random()

    if(rng <= crit){
      dmg = Math.floor(dmg * 1.5)
    }

    const attribute = JSON.parse(JSON.stringify(target.attribute))
    attribute.hp -= (dmg > attribute.hp)? attribute.hp : dmg
    
    updateUnit({ name: target.name, attribute: attribute })
    
    // Create text
    const dmgText = add([
      text(dmg),
      pos(unitSprites[index].pos.x, unitSprites[index].pos.y - 50),
      opacity(1)
    ])

    // Animate the damage text
    tween(
      dmgText.pos, 
      vec2(unitSprites[index].pos.x, unitSprites[index].pos.y - 100), 
      0.5,
      (pos) => {
        dmgText.pos = pos
      },
      easings.easeInOutQuad
    ).onEnd(() => {
      dmgText.destroy()

      if(attribute.hp === 0) {
        // TODO - Unit lose animation
      }

      // Restart the ATB bar for the unit
      setAtbBarToAct({ unit, index: currentActivePlayer, display: true })
    })
  }
  // #endregion

  // #region Player actions
  /** 
   * Change the ui state and enable sprite hover and click events
  */

  const playerAction = (action, unit, index) => {
    if(unit === undefined) return
    dispatch(
      setAction({ action, unit })
    )

    switch (action) {
      case 'attack': {
        spriteHoverEvent.paused = false
        spriteClickEvent.paused = false
        // Find available target
          let target = -1
          for(let i=5; i < 10; i++){
            if(units[i].attribute.hp > 0){
              target = i
              break
            }
          }

          if(target >= 0) setPointedTarget(target - 5)
        }
        break
      case 'skill': {
        spriteHoverEvent.paused = false
        spriteClickEvent.paused = false
      }
        // TODO - Display avialable skills
        break
      case 'item':
        // TODO - Display avialable items
        break
      case 'defense':
        
        break
      case 'change':
        
        break
      case 'escape':

        break
    } 
    
    setActiveUnit((prevState) => prevState.filter((a) => a !== index))
  }

  const spriteClickEvent = onClick('unit', () => {
    if(atbBarToAct.index && currentActivePlayer && atbBarToAct.index === currentActivePlayer ) return
    if(pointedTarget < 0) return

    const unit = units[currentActivePlayer]

    const input = {
      unit: unit, 
      index: currentActivePlayer,
      display: false,
      controller: {},
      callback: () => setAtbBarToAct({unit: unit, index: currentActivePlayer, display: true})
    }

    switch(action.action){
      case 'attack':{
          input.controller = () => controller(() => attack(unit, units[pointedTarget + 5], pointedTarget + 5), currentActivePlayer)
          setPointedTarget(-1)
          spriteHoverEvent.paused = false
          spriteClickEvent.paused = true
      }
      break;
    }

    setAtbBarToAct(input)
  })
  // Default to paused
  spriteClickEvent.paused = true

  const spriteHoverEvent = onHover('unit', (unit) => {
    if(atbBarToAct.index === currentActivePlayer) return

    switch(action.action){
      case 'attack': case 'skill': {
        const target = Number(unit.tags.find((tag) => tag.includes('index_')).split('_')[1])
        if(target >= 0) setPointedTarget(target - 5)
      }
      break;
    }
  })
  // Default to paused
  spriteHoverEvent.paused = true

  useEffect(() => {
    console.log('Action changed:', action)
  }, [action])
  // #endregion

  // #region ATB
  const onAtbBarFinished = (unit, index) => {
    setActiveUnit((prevState) => [...prevState, index])
    if(index > 4){
      enemyAI(unit, index)
    }
  }
  // #endregion

  // #region Arrow-Down

  // #endregion

  return (
    <>
      {
        // Add your UI here
      }
      <BattleCounter />

      {
        // ATB bars
      }
      <ATB 
        position={position} 
        previousActiveUnits={previousActiveUnits} 
        notifyParent={onAtbBarFinished} 
        reStart={atbBarToAct}
        pause={timerToAct}
      />

      {
        // Arrow
      }
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