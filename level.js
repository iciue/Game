/**
 * 用于存储及计算坐标
 */
class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }
  times(factor) {
    return new Vector(this.x * factor, this.y * factor)
  }
}

/**
 * 玩家类, 存储玩家的坐标, 速度
 * @class Player
 */
class Player {
  constructor(pos, speed) {
    this.pos = pos
    this.speed = speed
  }
  get type() {
    return 'player'
  }

  static create(pos) {
    return new Player(pos.plus(new Vector(0, -0.5)), new Vector(0, 0))
  }
}
//每个 player 实例的 size 都是相同的, 为了避免不必要的 new vector 所以放在原型上
Player.prototype.size = new Vector(0.8, 1.5)

/**
 * 
 */
const PlayerXSpeed = 7
const gravity = 30
const jumpSpeed = 17
Player.prototype.update = function (time, state, keys) {
  let xSpeed = 0
  if (keys.ArrowLeft) xSpeed -= PlayerXSpeed
  if (keys.ArrowRight) xSpeed += PlayerXSpeed

  let pos = this.pos
  const movedX = pos.plus(new Vector(xSpeed * time, 0))
  if (!state.level.touches(movedX, this.size, 'wall')) {
    pos = movedX
  }

  let ySpeed = 0
  const movedY = pos.plus(new Vector(0, ySpeed * time))
  if (!state.level.touches(movedY, this.size, 'wall')) {
    pos = movedY
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed
  } else {
    ySpeed = 0
  }

  return new Player(pos, new Vector(xSpeed, ySpeed))
}

/**
 * 有 3 种不同类型的熔岩
 * = 在水平方向上来回移动的熔岩, 撞到障碍物会回弹
 * | 在垂直方向上运动的容颜,  撞到障碍物会回弹
 * v 在垂直方向上运动, 撞到障碍物会直接出现在起始位置, 然后继续下落
 */
class Lava {
  constructor(pos, speed, rest) {
    this.pos = pos
    this.speed = speed
    this.rest = rest
  }

  get type() {
    return 'lava'
  }

  static create(pos, ch) {
    if (ch === '=') return new Lava(pos, new Vector(2, 0))
    if (ch === '|') return new Lava(pos, new Vector(0, 2))
    if (ch === 'v') return new Lava(pos, new Vector(0, 3), pos)
  }
}
Lava.prototype.size = new Vector(1, 1)
Lava.prototype.collide = function (state) {
  return new State(state.level, state.actors, "lost");
}

/**
 * 
 * @param {*} state
 * @param {*} time
 * @returns
 */
Lava.prototype.update = function (time, state) {
  const newPos = this.pos.plus(this.speed.times(time))
  if (!state.level.touches(newPos, this.size, 'wall')) return new Lava(newPos, this.speed, 'wall')
  if (this.reset) return new Lava(this.reset, speed, rest)
  return new Lava(this.pos, this.speed.times(-1))
}



/**
 * 硬币, 硬币可以在垂直方向上小幅度的抖动
 * wobble 属性用来记录硬币的抖动幅度
 * wobble 和 basePos 共同决定了 pos 所在的实际位置
 */
class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos
    this.basePos = basePos
    this.wobble = wobble
  }

  get type() {
    return 'coin'
  }

  static create(pos) {
    const basePos = pos.plus(new Vector(0.2, 0.1))
    return new Coin(basePos, basePos, Math.random() * Math.PI * 2)
  }
}
Coin.prototype.size = new Vector(0.6, 0.6)

/**
 *
 *
 * @param {*} state
 */
Coin.prototype.collide = (state) => {
  const filter = state.actors.filter(a => a != this)
  const status = state.status
  if (!filter.some(a => a.type == 'coin')) status = 'won'
  return new State(state.level, filter, status)
}

const wobbleSpeed = 8
const wobbleDist = 0.07
Coin.prototype.update = function (time) {
  const wobble = this.wobble + time * wobbleSpeed
  const wobblePos = Math.sin(wobble) * wobbleDist
  return new Coin(this.basePos.plus(new Vector(0, wobblePos)), this.basePos, wobble)
}

/**
 * 活动元素 值指向活动元素类
 */
const activeChar = {
  '.': 'empty',
  '#': 'wall',
  '+': 'lava',
  '@': Player,
  'o': Coin,
  '=': Lava,
  '|': Lava,
  'v': Lava,
}

/**
 * 关卡类
 * this 上保存了关卡的宽高, 表示地图的二维数组, 存储活动元素信息的数组
 * 构造函数接受一个用于表示表示关卡的二维数组
 * 遍历 plan, 生成用于整个关卡, 如果 ch 是 '.' 表示空, 如果是活动元素, 则根据坐标生成 对应活动元素 的实例
 *  
 */
class Level {
  constructor(plan) {
    this.width = plan[0].length
    this.height = plan.length
    this.actors = []

    this.rows = plan.map((row, y) => {
      return row.map((ch, x) => {
        const type = activeChar[ch]
        if (typeof type === 'string') return type
        this.actors.push(type.create(new Vector(x, y), ch))
        return 'empty'
      })
    })
  }

}

/**
 * 游戏的状态, 用于判断游戏的输赢
 */
class State {
  constructor(level, actors, status) {
    this.level = level
    this.actors = actors
    this.status = status
  }

  static start(level) {
    return new State(level, level.actors, 'playing')
  }

  get player() {
    return this.level.actors.find(a => a.type === 'player')
  }
}


/**
 * 判断下一次矩形块出现到的位置是否接触到了 targetType 类型的物体
 * @param {Vector} pos 矩形的坐标
 * @param {Vector} size 矩形的宽高
 * @param {string} targetType 是否接触到的网格
 * @return(boolean)
 */
Level.prototype.touches = function (pos, size, targetType) {
  const xStart = ~~(pos.x)
  const yStart = ~~(pos.y)
  const xEnd = xStart + size.x
  const yEnd = yStart + size.y


  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height
      const here = isOutside ? 'wall' : this.rows[y][x]
      if (here === targetType) return true
    }
  }
  return false
}

const overlap = (a1, a2) => {
  return a1.pos.x + a1.size.x > a2.pos.x && // a1 右侧是否与 a2 重叠
    a1.pos.x < a2.pos.x + a2.pos.x && // a1 左侧是否与 a2 重叠
    a1.pos.y + a1.pos.y > a2.pos.y && // a1 底部是否与 a2 重叠
    a1.pos.y < a2.size.y + a2.pos.y // a2 顶部是否与 a2 重叠
}

/**
 * 
 * @param {*} time
 * @param {*} keys
 */
State.prototype.update = function (time, keys) {
  const actors = this.actors.map(actor => actor.update(time, this, keys))
  let newState = new State(this.level, actors, this.status)
  if (newState.status !== 'playing') return newState
  const player = newState.player
  if (this.level.touches(player.pos, player.size, 'lava')) return new State(this.level, actors, 'lost')
  for (let actor of actors) {
    if (actor.type !== 'player' && overlap(actor, player)) {
      newState = actor.collide(newState)
    }
  }
  return newState
}


const trackKeys = (keys) => {
  const down = Object.create(null)

  const track = (e) => {
    if (keys.includes(e.key)) {
      e.preventDefault()
      down[e.key] = e.type === 'keydown'
    }
  }

  window.addEventListener('keydown', track)
  window.addEventListener('keyup', track)

  return down
}


const runAnimation = (frameFunc) => {
  let lastTime = null

  const frame = (time) => {
    if (lastTime != null) {
      let timeStep = Math.min(time - lastTime, 100) / 1000
      // console.log(timeStep);
      if (frameFunc(timeStep) === false) return;
    }
    lastTime = time
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

const runLevel = (level, Display) => {
  const display = new Display(document.body, level)
  let state = State.start(level)
  let ending = 1
  return new Promise((resolve, reject) => {
    runAnimation(time => {
      // debugger
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
  for (let level = 0; level < plans.length;) {
    let status = await runLevel(new Level(plans[0]), Display)
    if (status === 'won') level++
  }
  console.log('you won');
}