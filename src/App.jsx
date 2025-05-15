import { useEffect, useRef, useState } from 'react'
import './App.css'
import k from './lib/kaplay';

// Setting store
import settingStore from './store/setting';
import { useSelector } from 'react-redux';

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

  const gameWidth = useSelector(state => state.width)
  const gameHeight = useSelector(state => state.height)

  const [bg, setBg] = useState({})
  const [wave, setWave] = useState({ current: 1, max: 3 })
  const [turn, setTurn] = useState(0)
  // Player and enemy position (rect)
  const [position, setPosition] = useState([])
  const [units, setUnits] = useState([])
  const [activeUnits, setActiveUnits] = useState([])
  const [tension, setTension] = useState({ current: 0, max: 10 })

  // #region Scale UI
  // Reference from: https://jslegenddev.substack.com/p/how-to-display-an-html-based-ui-on
  const scaleUI = () => {
    console.log(uiRef)
    if(uiRef.current){
      const ui = uiRef.current;
      
      document.documentElement.style.setProperty(
        "--scale",
        Math.min(
          window.innerWidth / ui.offsetWidth,
          window.innerHeight / ui.offsetHeight
        )
      );
    }
  }

  const init = () => {
    setBg(add([sprite('field'), pos(gameWidth * -0.25, gameHeight * -0.25), scale(5)]))
    // bg.worldPos(gameWidth * 0.25, gameHeight * 0.25)

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

    position.push(playerPositions)
    position.push(enemyPositions)
  }

  useEffect(() => {
    window.addEventListener('resize', scaleUI)
    // Fire the function on the first time
    scaleUI()

    // Game init
    init()

    // Cleanup: Remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', scaleUI)
    }
  }, [])
  // #endregion

  // #region Draw characters
  useEffect(() => {
    // The max number needs to be change by the battle
    if(position.length === 2 && units.length < 10){
      const zoom = 1.5

      for(let i=0; i < position.length; i++){
        const currentSets = position[i]
        for(let j=0; j < currentSets.length; j++){
          const set = currentSets[j]
          console.log(set.pos)
          const { x, y } = set.pos
          // 128px is the height of the sprite
          // 20px is the height of the rect
          setUnits((prevState) => [ ...prevState, add([sprite('player', { flipX: (i > 0)? false : true }), pos(x - (128 / 2), y - (128 + 20)), scale(zoom)]) ])
        }              
      }
    }
  }, [position])
  // #eng regin

  // #region ATB
  // useEffect(() => {
  //   // Wait till all the units ready
  //   if(units.length == 10){

  //   }
  // }, [units])
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

      <div className='command flex'>
        <div className='avatar'>
          {/* <img></img> */}
          <div className='meter'>
            <label>
              HP
              <div></div>
            </label>
            <label>
              MP
              <div></div>
            </label>
          </div>
        </div>
        <div className='action flex'>
          <div>ATTACK</div>
          <div>SKILL</div>
          <div>ITEM</div>
          <div>ESCAPE</div>
        </div>
      </div>
    </div>
    </>
  )
}

export default App