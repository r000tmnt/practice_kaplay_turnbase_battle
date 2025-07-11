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

const { 
    add, 
    pos, 
    sprite,
    scale,
    rect,
    area,
    scene, 
    loadSprite, 
    loadShader,
    go, 
    setLayers,
    getLayers,
    layer,
    // onUpdate,
    onDraw,
    shader,
    // outline,
    wait, 
    // time,
    loop,
    opacity,
    // rotate,
    // animate,
    // tween,
    // easings,
    // BLACK,
    // WHITE,
    // RED,
    // YELLOW,
    // drawUVQuad,
    uvquad,
    // width,
    dt,
  } = k

export const positionRef : GameObj[][] = []
export const spriteRef : GameObj[] = []
export const skillRef : SkillRef[] = []
export const itemRef : ItemRef[] = []

let bg = {} as GameObj

export const stopEverything = () => {
  // STOP timers
  Array.from([0, 1, 2, 3 ,4, 5, 6, 7, 8, 9]).forEach(i => {
    removeBar(i)
  })
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
        const units = store.getState().game.units
        if(!units[index]) break
        data = JSON.parse(JSON.stringify(units[index]))
        if(i > 0 && data){
          // Refill the hp and mp
          data.attribute.hp = data.attribute.maxHp
          data.attribute.mp = data.attribute.maxMp
        }
      }else{
        data = (i > 0)? unit.enemy[j] : unit.player[j]
      }

      // 128px is the height of the sprite
      // 20px is the height of the rect
      if(data){
        player.push({...data})

        spriteRef.push(
          add([
            sprite('player', { flipX: (i > 0)? false : true }), 
            pos(x - (128 / 2), y - (128 + 20)), 
            scale(zoom),
            opacity(1),
            area(),
            layer('game'),
            // tag
            "unit",
            `index_${index}`
          ])
        )          
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
      player.forEach((p, index) => {
        loopConstructor(index, p, positionRef, null, null)
      })            
    }      
  })
}      
// endregion

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

    bg = add([
      sprite('field'), 
      pos(gameWidth * -0.25, gameHeight * -0.5), 
      scale(6),
      layer('bg') // Assign the layer to draw
    ]) 

    // Calculate positions when the background is displayed
    wait(1, () => {
      // Set position rects
      const playerPositions : GameObj[] = []
      const enemyPositions : GameObj[] = []
      const playerPositionRef = [
        // x, y in percentage
        [0.7, 0.6], [0.7, 0.7], [0.8, 0.55], [0.8, 0.65], [0.8, 0.75]
      ]
      const enemyPositionRef = [
        // x, y in percentage
        [0.22, 0.6], [0.22, 0.7], [0.12, 0.55], [0.12, 0.65], [0.12, 0.75]
      ]

      const size = gameWidth * 0.1

      for(let i=0; i < 5; i++){
        playerPositions.push(
          add([
            pos(gameWidth * playerPositionRef[i][0], gameHeight * playerPositionRef[i][1]),
            rect(size, size),
            opacity(0.5),
            area(),
            layer('game')
          ])
        )

        enemyPositions.push(
          add([
            pos(gameWidth * enemyPositionRef[i][0], gameHeight * enemyPositionRef[i][1]),
            rect(size, size),
            opacity(0.5),
            area(),
            layer('game')
          ])
        )      
      }

      positionRef.push(playerPositions)       
      positionRef.push(enemyPositions)
      
      drawCharacters(wave)
    })    
  })

  go('game')
};
// #endregion