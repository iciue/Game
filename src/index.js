import {trackKeys} from './utils'
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


const runLevel = (level, Display) => {
  const display = new Display(document.body, level)
  let state = State.start(level)
  let ending = 1
  return new Promise((resolve, reject) => {
    runAnimation(time => {
      state = state.update(time, arrowKeys)
      display.syncState(state)
      if (state.status === 'playing') {
        return true
      } else if (ending > 0) {
        console.log(ending);
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
  for (let level = 0; level < plans.length;) {
    let status = await runLevel(new Level(plans[1]), Display)
    if (status === 'won') level++
  }
  console.log('you won');
}


const toArray = (st) => {
  return st.trim().split('\n').map(row => [...row.trim()])
}
const plans = GAME_PLAN.map(st => toArray(st))
// runGame(plans, DOMDisplay)
runGame(plans, CanvasDisplay)