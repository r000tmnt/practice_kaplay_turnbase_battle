import k from '../lib/kaplay'

import store from '../store/store'; // Assuming RootState is defined in your store
import {
  setUnits,
  setActiveUnits,
  setPointedTarget,
  setCurrentActivePlayer,
  setAllToStop,
} from '../store/game';
import { GameObj } from 'kaplay';

// Units data
import unit from '../data/unit';
// import skill from '../data/skill.json'

// type
import { Unit } from '../model/unit';
import { loopConstructor, removeBar } from '../utils/ATB';
import { SkillRef } from '../model/skill';
import { ItemRef } from '../model/item';

// Fragment shader
const loadFragmentShader = async(path: string) => {
  try {
    const res = await fetch(path)
    if(!res.ok) return
    const fragCode = await res.text()
    return fragCode
  } catch (error) {
    console.log('Error while loading fragment shader')
    return    
  }
}

const wave_transition = await loadFragmentShader(`http://${window.location.host}/shaders/wave_transition.frag`)

const { 
    add, 
    pos, 
    sprite,
    scale,
    rect,
    area,
    scene, 
    loadSprite, 
    loadSpriteAtlas,
    loadShader,
    go, 
    setLayers,
    getLayers,
    layer,
    loadFont,
    onDraw,
    shader,
    // outline,
    wait, 
    // time,
    loop,
    opacity,
    // rotate,
    // animate,
    tween,
    vec2,
    easings,
    // BLACK,
    // WHITE,
    // RED,
    // YELLOW,
    // drawUVQuad,
    uvquad,
    // width,
    dt,
    setData
  } = k

export const positionRef : GameObj[][] = []
export const spriteRef : GameObj[] = []
export const skillRef : SkillRef[] = []
export const itemRef : ItemRef[] = []

export const playerPositionRef = [
  // x, y in percentage
  [0.7, 0.6], [0.7, 0.7], [0.8, 0.55], [0.8, 0.65], [0.8, 0.75]
]
const enemyPositionRef = [
  // x, y in percentage
  [0.22, 0.6], [0.22, 0.7], [0.12, 0.55], [0.12, 0.65], [0.12, 0.75]
]
let bg = {} as GameObj

export const stopEverything = () => {
  // STOP timers
  Array.from([0, 1, 2, 3 ,4, 5, 6, 7, 8, 9]).forEach(i => {
    removeBar(i)
  })
  // STOP changing position if set
  setData('changing', false)
  // Empty activeUnit stack
  store.dispatch(setActiveUnits([]))        
  // Reset pointer
  store.dispatch(setPointedTarget(-1)) 
  store.dispatch(setCurrentActivePlayer(-1))
  spriteRef.forEach((s: GameObj) => s.destroy())
  spriteRef.splice(0)
  skillRef.splice(0)
  itemRef.splice(0)
}

// region Draw characters
const drawCharacters = (wave: { current: number, max: number }) => {
  const zoom = 1.5
  let player : Unit[] = []

  for(let i=0; i < positionRef.length; i++){
    const currentSets = positionRef[i]
    for(let j=0; j < currentSets.length; j++){
      const set = currentSets[j]
      console.log(set.pos)
      const { x, y } = set.pos
      let data : Unit | null = null
      const index = (i > 0)? j + 5 : j

      if(wave.current > 1){
        const units : Unit[] = store.getState().game.units
        if(i === 0){
          if(units[index].attribute.hp > 0) data = JSON.parse(JSON.stringify(units[index]))
        }else{
          data = JSON.parse(JSON.stringify(units[index]))
        }
        
        if(data){
          // Reset action
          data.action = ''
          // Keep index for reference
          data.index = index
        }
        if(i > 0 && data){
          // Refill the hp and mp of the enemy
          data.attribute.hp = data.attribute.maxHp
          data.attribute.mp = data.attribute.maxMp
        }
      }else{
        data = (i > 0)? unit.enemy[j] : unit.player[j]
        // Keep index for reference
        data.index = index
      }

      // 67px is the height of the sprite
      // 20px is the height of the rect
      if(data){
        player.push({...data})

        spriteRef.push(
          add([
            sprite('player', { flipX: (i > 0)? false : true }), 
            pos(x, y - (67/2)), 
            scale(zoom),
            opacity(1),
            area(),
            layer('game'),
            // tag
            "unit",
            `index_${index}`,
            `name_${data.name}`
          ])
        )  
        
        spriteRef[spriteRef.length - 1].play('idle')
      }  
    }              
  }     
  // console.log('dispath', player)
  store.dispatch(
    setUnits(player)            
  )

  const conditionLoop = loop(1, () => {
    if(!store.getState().game.stopAll){
      // check sprites
      if(spriteRef.length !== player.length) return
      if(spriteRef.findIndex(s => s.opacity === 0) >= 0) return
      conditionLoop.cancel()

      // Set ATB bars 
      player.forEach((p, i) => {
        // Get the real index
        const index = p.index?? spriteRef[i].tags.find(t => t.includes('index_'))?.split('index_')[1]
        loopConstructor(Number(index), p, positionRef, null, null)
      })            
    }      
  })
}      
// endregion

/**
 * Switch sprite position on command "Change"
 * Frontline to backline vice versa
 * @param index - The number before change
 * @returns 
 */
export const changeSpritePosition = async(index: number) => {
  const gameWidth = store.getState().setting.width
  const gameHeight = store.getState().setting.height
  const units = JSON.parse(JSON.stringify(store.getState().game.units))
  const frontLineUnit: Unit[] = []
  const backLineUnits: Unit[] = []
  const frontLine : number[][] = [] 
  const backLine : number[][] = [] 
  const newPositionRef : GameObj[] = []
  const enemies = units.splice(5, units.length - 5)
  playerPositionRef.filter((p, i) => {
    if(p[0] === 0.7){
      frontLineUnit.push(units[i])
      frontLine.push(p)
    }

    if(p[0] === 0.8){
      backLineUnits.push(units[i])
      backLine.push(p)
      newPositionRef.push(positionRef[0][i])
    }
  })

  // Form a new positionRef for player
  frontLine.forEach((p, i) => {
    newPositionRef.push(positionRef[0][i])
  })

  positionRef[0] = newPositionRef

  // Change unit order
  const newUnitOrder = backLineUnits.concat(frontLineUnit, enemies)
  console.log('newUnitOrder', newUnitOrder)
  store.dispatch(
      setUnits(newUnitOrder)
  )  

  // Change x axist
  frontLine.forEach((p) => p[0] = 0.8)
  backLine.forEach((p) => p[0] = 0.7)

  // Switch order
  const newOrder: number[][] = backLine.concat(frontLine)

  try {
    newOrder.forEach((p, i) => {
      const s = spriteRef[i]
      const oldIndex = Number(s.tags.find(t => t.includes('index_'))?.split('index_')[1])
      const newIndex = oldIndex + frontLine.length

      // Remove & add tag
      s.untag(`index_${oldIndex}`)
      s.tag(`index_${newIndex}`)

      const newPosition = [gameWidth * p[0], gameHeight * p[1]]

      tween(
        positionRef[0][i].pos,
        vec2(newPosition[0], newPosition[1]),
        0.5,
        (pos) => positionRef[0][i].pos = pos,
        easings.easeInOutQuad
      )

      // Move sprite
      tween(
        s.pos,
        vec2(newPosition[0] - (67 / 2), newPosition[1] - (67 + 20)),
        0.5,
        (pos) => s.pos = pos,
        easings.easeInOutQuad
      )
    })

    // Replace playerPositionRef with the new array
    playerPositionRef.splice(0, playerPositionRef.length, ...newOrder)

    // Return the index after change
    return (index < frontLine.length)? index + backLine.length : index - frontLine.length 
  } catch (error) {
    console.log('Error occured while changing sprite position ' + error)
    return -1
  }
}

// region Wave transition
export const waveTransition = (gameWidth, gameHeight) => {
  let time = 0
  const uvQuads = add([
    uvquad(gameWidth * 2, gameHeight),
    shader('waveTransition', { "u_time": time }),
    layer("fg")
  ])
  const transition = onDraw(() => {
    time += dt()
    if(time >= 3){
      transition.cancel()
      // transition.destroy()
      uvQuads.destroy()
      wait(1, () => {
        store.dispatch(setAllToStop(false))
        drawCharacters(store.getState().game.wave)
      })          
    }else{
      // drawUVQuad({
      //   width: gameWidth * 2,
      //   height: gameHeight,
      //   shader: 'waveTransition',
      //   uniform: {
      //     "u_time": time,
      //   }
      // })  
      if(uvQuads.uniform) uvQuads.uniform["u_time"] = time
    }
  })
}
// endregion

// region Init Game
export default function initGame(){
  const gameWidth = store.getState().setting.width
  const gameHeight = store.getState().setting.height
  const wave = store.getState().game.wave

    // Scenes can accept argument from go()

  // Define layers
  const layers = getLayers()
  if(!layers) setLayers(['bg', 'game', "fg"], "game")

  scene('game', () => {
    // Load sprites
    loadSprite('field', 'bg/nature_2/orig.png')
    // loadSprite('player', 'battle/Animations/Defensive_Stance_mini.png')
    const playerSprite = loadSpriteAtlas('battle/Animations/player_spritesheet.png', 'battle/Animations/player_spritesheet.json')
    console.log('playerSprite', playerSprite)


    // Font
    const bebasNeue = loadFont('bebasNeue_regular', 'font/BebasNeue-Regular.ttf', { outline: 4 })
    console.log('bebasNeue', bebasNeue)

    // Shader
    // Reference from: https://github.com/kaplayjs/kaplay/issues/394
    loadShader('waveTransition', null, wave_transition)

    setData('changing', false)

    bg = add([
      sprite('field'), 
      pos(gameWidth * -0.25, gameHeight * -0.5), 
      scale(6),
      layer('bg') // Assign the layer to draw
    ]) 

    // Calculate positions when the background is displayed
    wait(1, () => {
      const size = gameWidth * 0.1
      positionRef.push([]) // playerPositions       
      positionRef.push([]) // enemyPositions      

      for(let i=0; i < 5; i++){
        // playerPositions 
        positionRef[0].push(
          add([
            pos(gameWidth * playerPositionRef[i][0], gameHeight * playerPositionRef[i][1]),
            rect(size, size),
            opacity(0.5),
            area(),
            layer('game')
          ])
        )
        // enemyPositions 
        positionRef[1].push(
          add([
            pos(gameWidth * enemyPositionRef[i][0], gameHeight * enemyPositionRef[i][1]),
            rect(size, size),
            opacity(0.5),
            area(),
            layer('game')
          ])
        )      
      }
      
      drawCharacters(wave)
    })    
  })

  go('game')
};
// #endregion