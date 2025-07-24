import kaplay from 'kaplay'
import ATB from 'kaplay-atb-plugin'

// Initialize the game
const k = kaplay({
    width: 720,
    height: 1280,
    letterbox: true,
    background: '#000000',
    plugins: [ATB],
  })

export default k