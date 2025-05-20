import { useEffect, useRef, useState, useMemo, act } from 'react'
import './App.css'
import k from './lib/kaplay';

// store
import { useSelector, useDispatch } from 'react-redux';
import {
  setUnits,
} from './store/game';

// Units data
import unit from './data/unit';

const { 
  scene, 
  loadSprite, 
  add, 
  pos, 
  sprite, 
  go, 
  scale,
  rect,
  area,
  color,
  outline,
  wait, 
  loop,
  opacity,
  rotate,
  animate,
  vec2,
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
  })

  go('game')
}

if(typeof window !== 'undefined') initScene()

function App() {
  const uiRef = useRef(null);

  const [_scale, setScale] = useState(0)
  const [bg, setBg] = useState({})
  const [position, setPosition] = useState([])
  const [timers, setTimers] = useState([])
  const [unitSprites, setunitSprites] = useState([])
  const [activeUnits, setActiveUnit] = useState([])
  const previousActiveUnits = useMemo(() => activeUnits, [activeUnits])
  const previousSetTimers = useMemo(() => timers, [timers])
  const currentActivePlayer = useMemo(() => activeUnits.find((a) => a < 5), [activeUnits])

  const gameWidth = useSelector(state => state.setting.width)
  const gameHeight = useSelector(state => state.setting.height)

  const wave = useSelector(state => state.game.wave)
  const turn = useSelector(state => state.game.turn)
  const units = useSelector(state => state.game.units)
  const tension = useSelector(state => state.game.tension)

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
            setunitSprites((prevState) => [...prevState, add([sprite('player', { flipX: (i > 0)? false : true }), pos(x - (128 / 2), y - (128 + 20)), scale(zoom)])] )
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
      timers.forEach((t) => { if(t.index !== index) t.controller.paused = true })
      // TODO - Call the attack function
      console.log('Enemy attack function')
      actionFunction()

      if(actionCallBack) actionCallBack()
      // Resume timers of the other units
      timers.forEach((t) => { if(t.index !== index) t.controller.paused = false })
      // Resume atb bar
      $el.children[0].classList.remove('done')
      $el.children[0].style.width = '0px'
      $el.children[0].style.display = 'block'
      atbBarsAnimate($el, unit, index)
    }) 
    // Display atb bar
    $el.style.display = 'block'

    // TODO - Call the action
    switch (action) {
      case 'attack':
        setTimers((prevState) => [
          ...prevState,
          {
            index,
            controller: controller(() => { console.log('Enemy attack') })
          }
        ])
        break
      case 'skill':
        setTimers((prevState) => [
          ...prevState,
          {
            index,
            controller: controller(() => { console.log('Enemy skill') })
          }
        ])
        break
      case 'item':
        setTimers((prevState) => [
          ...prevState,
          {
            index,
            controller: controller(() => { console.log('Enemy item') })
          }
        ])
        break
      case 'defense':
        setTimers((prevState) => [
          ...prevState,
          {
            index,
            controller: controller(() => { console.log('Enemy defense') })
          }
        ])
        break
      case 'change':
        setTimers((prevState) => [
          ...prevState,
          {
            index,
            controller: controller(() => { console.log('Enemy change') })
          }
        ])
        break
      case 'escape':
        setTimers((prevState) => [
          ...prevState,
          {
            index,
            controller: controller(() => { console.log('Enemy escape') })
          }
        ])
        break
      default:
        setTimers((prevState) => [
          ...prevState,
          {
            index,
            controller: controller(() => { console.log('Enemy attack') })
          }
        ])        
        break
    }    
  }
  // #endregion

  // #region ATB
  const atbBarsAnimate = ($el, unit, index) => {
    // console.log($el)
    // If the element exists
    if($el){
      // If the unit is in the active stack
      if(previousActiveUnits.includes(index)) return

      // If the timer is set already
      if(previousSetTimers.find((t) => t.index === index)) return

      // Wait for 1s
      wait(1, () => {
        const time = unit.attribute.act * 100
        let percentage = 0
        let count = 0

        // Loop in every 100ms
        // Save time controller
        setTimers((prevState) => {
          if(prevState && !prevState.find((t) => t.index === index)){
            return [ ...prevState,
              {
                index,
                controller: loop(0.1, () => {
                  count += 1

                  if(count > time){
                    const theTimer = timers.find(t => t.index === index)
                    if(theTimer){
                      theTimer.controller.pause()
                      timerEndAction($el, unit, index)                      
                    }
                  }else{
                    percentage += Math.floor(100/time)
                    console.log(unit.name, percentage, count, time)
                    $el.children[0].style.width = `${percentage}%`                    
                  }
                }, time).onEnd(() => timerEndAction($el, unit, index))
              }
            ]
          }else{
            console.log('timer error', prevState)
            // Return the current timers if error
            return [ ...timers ]
          }
        })
      })
    }
  }

  const timerEndAction = ($el, unit, index) => {
    // console.log(unit.name, 'Done after', time * 0.1, 's')
    $el.children[0].style.width = '100%'
    $el.children[0].classList.add('done')

    // Push the unit to the stack
    setActiveUnit((prevState) => [...prevState, index])
    // Remove the timer
    setTimers((prevState) => prevState.filter((t) => t.index !== index))
    // Hide the bar
    $el.style.display = 'none'

    // If the unit is an enemy
    if (index > 4) {
      // TODO - Enemy ai
      enemyAI($el, unit, index)
    }    
  }
  // #endregion

  return (
    <>
    <div className="ui" ref={uiRef}>
      {
        // Add your UI here
      }
      <div className='wave'>
        WAVE { wave.current }/{ wave.max }
      </div>
      <div className='turn'>
        Turn { turn }
      </div>

      {
        // ATB bars
        units.map((u, index) => {
          const side = (index < 5)? 0 : 1
          const sideIndex = (index < 5)? index : index - 5
          return <div 
            className="atb bar" 
            data-index={index}
            ref={($el) => atbBarsAnimate($el, u, index)} 
            key={index}
            style={{
              width: `${gameWidth * 0.1}px`,
              height: `${(gameWidth * 0.1)/10}px`,
              position: 'absolute', 
              top:0, 
              left: 0, 
              transform: `translate(${position[side][sideIndex].pos.x}px, ${position[side][sideIndex].pos.y - (128 / 2) - 10}px)`}}>
                <div className='inner'></div>
              </div>
        })
      }

      <div className={`command ${currentActivePlayer >= 0? 'show' : 'hide'}`} >
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
            <button className='position-center'>ATTACK</button>
          </div>
          <div className='relative'>
            <button className='position-center'>SKILL</button>
          </div>
          <div className='relative'>
            <button className='position-center'>ITEM</button>
          </div>
          <div className='relative'>
            <button className='position-center'>DEFENSE</button>
          </div>
          <div className='relative'>
            <button className='position-center'>CHANGE</button>
          </div>
          <div className='relative'>
            <button className='position-center'>ESCAPE</button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default App