import { useEffect } from 'react'
import './App.css'
import initGame from './scene/game'

// store
import { useSelector, useDispatch } from 'react-redux';
import { setScale } from './store/setting';

import { stopEverything, waveTransition } from './scene/game';

// Components
import BattleCounter from './component/BattleCounter';
import UnitArrow from './component/UnitArrow';
import Command from './component/Command';

// Game init
initGame()

function App() {
  const gameWidth = useSelector(state => state.setting.width)
  const gameHeight = useSelector(state => state.setting.height)
  const stopAll = useSelector(state => state.game.stopAll)
  const wave = useSelector(state => state.game.wave)  
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

    // Cleanup: Remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', scaleUI)
    }
  }, [])
  // #endregion

  // region State watcher
  useEffect(() => {
    if(stopAll){
      stopEverything()
    }
  }, [stopAll])

  useEffect(() => {
    if(wave.current > 1 && wave.current < wave.max){
      waveTransition(gameWidth, gameHeight)
    }
  }, [wave])
  // endregion


  return (
    <>
      {
        // Add your UI here
      }
      <BattleCounter />

      <UnitArrow />

      <Command />
    </>
  )
}

export default App