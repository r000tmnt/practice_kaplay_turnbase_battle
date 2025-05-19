import { useEffect, useRef, useState } from 'react'
import './App.css'
import k from './lib/kaplay';

// store
import { useSelector, useDispatch } from 'react-redux';
import {
  setUnits, 
  setActiveUnits,
  removeActiveUnit,
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
  drawRect,
  area,
  color,
  Color,
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

// Custom usehasChanged Hook
const useHasChanged = (value) => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

function App() {
  const uiRef = useRef(null);

  const [_scale, setScale] = useState(0)
  const [bg, setBg] = useState({})
  const [position, setPosition] = useState([])
  const [timers, setTimers] = useState([])
  const [unitSprites, setunitSprites] = useState([])

  const gameWidth = useSelector(state => state.setting.width)
  const gameHeight = useSelector(state => state.setting.height)

  const wave = useSelector(state => state.game.wave)
  const turn = useSelector(state => state.game.turn)
  const units = useSelector(state => state.game.units)
  const activeUnits = useSelector(state => state.game.activeUnits)
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
    setBg(add([sprite('field'), pos(gameWidth * -0.25, gameHeight * -0.25), scale(5)]))

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
          [0.7, 0.7], [0.7, 0.8], [0.8, 0.65], [0.8, 0.75], [0.8, 0.85]
        ]
        const enemyPositionRef = [
          // x, y
          [0.22, 0.7], [0.22, 0.8], [0.12, 0.65], [0.12, 0.75], [0.12, 0.85]
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

  // #region ATB
  const atbBarsAnimate = ($el, unit, index) => {
    console.log($el)
    // If the element exists
    if($el){
      // If the unit is in the active stack
      if(activeUnits.includes(index)) return

      // If the timer is set already
      if(timers.find((t) => t.index === index)) return

      // Wait for 1s
      wait(1, () => {
        const time = unit.attribute.act * 100
        let percentage = 0
        let count = 0

        // Loop in every 100ms
        const controller = () => loop(0.1, () => {
          count += 1
          percentage += Math.floor(100/time)
          console.log(unit.name, percentage)
          console.log('count', count)
          $el.children[0].style.width = `${percentage}%`
        }, time).onEnd(() => {
          console.log(unit.name, 'Done after', time * 0.1, 's')
          $el.children[0].style.width = '100%'
          $el.children[0].classList.add('done')

          // Push the unit to active units
          dispatch(
            setActiveUnits(index)
          )
          // Remove the timer
          setTimers((prevState) => prevState.filter((t) => t.index !== index))
        })

        // Save time controller
        setTimers((prevState) => {
          if(prevState && !prevState.find((t) => t.index === index)){
            return [ ...prevState,
              {
                index,
                controller
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

  useEffect(() => {
    if(timers.length === units.length){
      timers.forEach((t) => {
        // Init atb bar animation
        t.controller()
      })
    }
  }, [timers])


  const previousActiveUnits = useHasChanged(activeUnits);

  useEffect(() => {
    if (previousActiveUnits && previousActiveUnits[0] === activeUnits[0]) {
      return;
    }

    // If the lastest active unit is not a player
    if (activeUnits[activeUnits.length] > 4) {
      // TODO - Enemy ai
      const actions = [ 'attack', 'skill', 'item', 'defense', 'change', 'escape' ]

      const rng = Math.random() * actions.length

      const action = actions[Math.floor(rng)]
      console.log('Enemy action:', action)
    }
  }, [activeUnits, previousActiveUnits])
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
        (units.length === 10)?
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
          }): null
      }

      <div className={`command flex ${(activeUnits && activeUnits[0] < 4)? 'show' : 'hide'}`} >
        <div className='avatar'>
          <img src="battle/Animations/Defensive_Stance.png" alt="player"></img>
          <div className='meter'>
            <label className='bar hp'>
              HP
              <div>
                {/* { activeUnits[0]?.attribute.hp }/{ activeUnits[0]?.attribute.maxHp } */}
              </div>
            </label>
            <label className='bar mp'>
              MP
              <div>
                {/* { activeUnits[0]?.attribute.mp }/{ activeUnits[0]?.attribute.maxMp } */}
              </div>
            </label>
          </div>
        </div>
        <div className='action'>
          <div>
            <span>ATTACK</span>
          </div>
          <div>
            <span>SKILL</span>
          </div>
          <div>
            <span>ITEM</span>
          </div>
          <div>
            <span>DEFENSE</span>
          </div>
          <div>
            <span>CHANGE</span>
          </div>
          <div>
            <span>ESCAPE</span>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default App