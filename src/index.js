import {
  trackKeys
} from './utils'
import DOMDisplay from './DOMdisplay'
import CanvasDisplay from './CanvasDisplay'
import Level from './level'
import State from './State'
import GAME_PLAN from './plan'

const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);
/**
 * 
 *
 * @param {*} frameFunc
 */
const runAnimation = (frameFunc) => {
  let lastTime = null

  const frame = (time) => {
    if (lastTime != null) {
      let timeStep = Math.min(time - lastTime, 100) / 1000
      if (frameFunc(timeStep) === false) {
        console.log('游戏结束');
        return;
      }
    }
    lastTime = time
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}


const runLevel = (level, Display, life) => {
  const display = new Display(document.querySelector('.game-box'), level)
  let state = State.start(level, life)
  let ending = .5  // 当游戏结束时, 留给玩家 0.5 秒的反应时间
  return new Promise((resolve, reject) => {
    runAnimation(time => {
      state = state.update(time, arrowKeys)
      display.syncState(state)
      if (state.status === 'playing') {
        return true
      } else if (ending > 0) {
        ending -= time
      } else {
        display.clear()
        resolve(state.status)
        return false
      }
    })
  })
}

async function runGame(plans, Display) {
  let life = 3
  for (let level = 0; life > 0 && level < plans.length;) {
    let status = await runLevel(new Level(plans[level]), Display, life)
    if (status === 'won') {
      level++
    } else {
      life--
    }
  }
  const finallyStatus = life > 0 ? 'win' : 'lose'
  console.log(finallyStatus);
}


const toArray = (st) => {
  return st.trim().split('\n').map(row => [...row.trim()])
}
const plans = GAME_PLAN.map(st => toArray(st))
// runGame(plans, DOMDisplay)
runGame(plans, CanvasDisplay)