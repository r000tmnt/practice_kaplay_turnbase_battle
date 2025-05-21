import { useEffect, useRef, useState, useMemo } from 'react'
import './App.css'
import k from './lib/kaplay';

// store
import { useSelector, useDispatch } from 'react-redux';
import {
  setUnits,
} from './store/game';

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
  shader,
  outline,
  wait, 
  loop,
  opacity,
  rotate,
  animate,
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
  const uiRef = useRef(null);

  const [_scale, setScale] = useState(0)
  const [bg, setBg] = useState({})
  const [position, setPosition] = useState([])
  const [atbBarToAct, setAtbBarToAct] = useState({})
  const [timerToAct, setTimerToAct] = useState({})
  const [timerToKeep, setTimerToKeep] = useState({})
  const [unitSprites, setunitSprites] = useState([])
  const [activeUnits, setActiveUnit] = useState([])
  const previousActiveUnits = useMemo(() => activeUnits, [activeUnits])
  const currentActivePlayer = useMemo(() => activeUnits.find((a) => a < 5), [activeUnits])
  const [action, setAction] = useState({})

  const gameWidth = useSelector(state => state.setting.width)
  const gameHeight = useSelector(state => state.setting.height)
  const units = useSelector(state => state.game.units)

  const dispatch = useDispatch()

  // #region Scale UI
  // Reference from: https://jslegenddev.substack.com/p/how-to-display-an-html-based-ui-on
  const scaleUI = () => {
    console.log(uiRef)
    if(uiRef.current){
      const ui = uiRef.current;

      const value = Math.min(
        window.innerWidth / ui.offsetWidth,
        window.innerHeight / ui.offsetHeight
      )

      setScale(value)
      
      document.documentElement.style.setProperty("--scale", value);
    }
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
  }, [position, dispatch, units])
  // #eng regin

  // #region Enemy AI
  const enemyAI = ($el, unit, index) => {
    const actions = [ 'attack', 'skill', 'item', 'defense', 'change', 'escape' ]
              
    const rng = Math.random() * actions.length

    const action = actions[Math.floor(rng)]

    const controller = (actionFunction, actionCallBack = null) => wait(unit.attribute.act * 10, () => {
      // Pause timers of the other units
      setTimerToAct({ index, value: true })
      // TODO - Call the attack function
      console.log('Enemy attack function')
      actionFunction()

      if(actionCallBack) actionCallBack()
      // Resume timers of the other units
      setTimerToAct({ index, value: false })
      // Resume atb bar
      $el.children[0].classList.remove('done')
      $el.children[0].style.width = '0px'
      $el.children[0].style.display = 'block'
      setAtbBarToAct({$el, unit, index})
    }) 
    // Display atb bar
    $el.style.display = 'block'

    // TODO - Call the action
    switch (action) {
      case 'attack':
        setTimerToKeep(
          {
            index,
            controller: controller(() => { console.log('Enemy attack') })
          }
        )
        break
      case 'skill':
        setTimerToKeep(
          {
            index,
            controller: controller(() => { console.log('Enemy skill') })
          }
        )
        break
      case 'item':
        setTimerToKeep(
          {
            index,
            controller: controller(() => { console.log('Enemy item') })
          }
        )
        break
      case 'defense':
        setTimerToKeep(
          {
            index,
            controller: controller(() => { console.log('Enemy defense') })
          }
        )
        break
      case 'change':
        setTimerToKeep(
          {
            index,
            controller: controller(() => { console.log('Enemy change') })
          }
        )
        break
      case 'escape':
        setTimerToKeep(
          {
            index,
            controller: controller(() => { console.log('Enemy escape') })
          }
        )
        break
      default:
        setTimerToKeep(
          {
            index,
            controller: controller(() => { console.log('Enemy attack') })
          }
        )    
        break
    }    
  }
  // #endregion

  // #region Player actions
  const playerAction = (action, unit) => {
    if(unit === undefined) return
    setAction({
      action,
      unit
    })

    switch (action) {
      case 'attack':
        // TODO - Display avialable targets
        break
      case 'skill':
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
  }
  // #endregion

  // #region ATB
  const onAtbBarFinished = ($el, unit, index) => {
    if(!$el) return
    setActiveUnit((prevState) => [...prevState, index])
    if(index > 4){
      enemyAI($el, unit, index)
    }
  }
  // #endregion

  // #region Arrow-Down

  // #endregion

  return (
    <>
    <div className="ui" ref={uiRef}>
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
        timer={timerToKeep}
      />

      {
        // Arrow
      }
      <UnitArrow 
        currentActivePlayer={currentActivePlayer}
        position={position}   
      />

      <Command 
        currentActivePlayer={currentActivePlayer}
        notifyParent={playerAction}
      />
    </div>
    </>
  )
}

export default App