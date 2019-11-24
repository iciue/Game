import { trackKeys, addEventListenerOnce } from './utils'
import DOMDisplay from './DOMdisplay'
import CanvasDisplay from './CanvasDisplay'
import Level from './level'
import State from './State'
import GAME_PLAN from './plan'

const PLANS = GAME_PLAN.map(st => st.trim().split('\n').map(row => [...row.trim()]))  //格式化游戏地图

const keydown = new Event('keydown')
keydown.key = 'ArrowUp'

const keyUp = new Event('keyup')
keyUp.key = 'ArrowUp'

let arrowKeys = trackKeys(); // 事件对象
let isPause = false

/**
 * 利用 rAF 绘制动画
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
  let endingWaiting = .5 // 当游戏结束时, 留给玩家 0.5 秒的反应时间
  return new Promise((resolve, reject) => {
    runAnimation(time => {
      if (isPause) return;
      state = state.update(time, arrowKeys)
      display.syncState(state)
      if (state.status === 'playing') {
        return true
      } else if (endingWaiting > 0) {
        endingWaiting -= time
      } else {
        display.clear()
        resolve(state.status)
        return false
      }
    }, )
  })
}

async function runGame(PLANS, Display) {
  let life = 3

  for (let level = 1; life > 0 && level < PLANS.length;) {
    let status = await runLevel(new Level(PLANS[level]), Display, life)
    if (status === 'won') {
      level++
    } else {
      life--
    }
  }
  const finallyStatus = life > 0 ? 'win' : 'lose'
  initialGameDisplay()
}

const startGameBtn = document.querySelector('.start')
const pauseGameBtn = document.querySelector('.pause')


/**
 *
 *
 */
const initialGameDisplay = () => {
  let alreadyStart = false

  runGame(PLANS, CanvasDisplay)

  addEventListenerOnce(startGameBtn, 'click', (e) => {
    if (alreadyStart) return;
    alreadyStart = true
    arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"])
    window.dispatchEvent(keydown)
    setTimeout(() => {
      window.dispatchEvent(keyUp)
    }, 0);

    pauseGameBtn.addEventListener('click', (e) => {
      e.target.textContent = isPause ? '暂停游戏' : '继续游戏'
      isPause = !isPause
    })
  })

}

initialGameDisplay()