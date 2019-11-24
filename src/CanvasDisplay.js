import {flipHorizontally} from './utils'

/**
 * 绘制
 * drawBackground
 * drawActors
 * clear
 * syncState 
 */

const scale = 20

class CanvasDisplay {
  constructor(parent, level) {
    console.log(level);
    this.canvas = document.createElement('canvas')
    this.canvas.width = Math.min(650, level.width * scale)
    this.canvas.height = Math.min(450, level.height * scale)
    this.ctx = this.canvas.getContext('2d')
    window.ctx = this.ctx
    parent.appendChild(this.canvas)

    // 为了方便与 level 计算 此处宽高需要转换为缩放前的大小
    this.viewPortInfo = {
      top: 0,
      left: 0,
      width: this.canvas.width / scale,
      height: this.canvas.height / scale
    }

    this.flipPlayer = false
    
  }

  clear() {
    this.canvas.remove()
  }

}

/**
 * 以最新的数据绘制游戏
 */
CanvasDisplay.prototype.syncState = function (state) {
  this.updateViewPort(state)
  this.clearDisplay(state.status)
  this.drawBackground(state.level, state.life)
  this.drawActors(state.actors)
}

CanvasDisplay.prototype.updateViewPort = function (state) {
  const view = this.viewPortInfo
  const margin = view.width / 3

  const player = state.player
  const center = player.pos.plus(player.size.times(0.5))

  if (center.x < view.left + margin) {
    //左移
    view.left = Math.max(center.x - margin, 0)
  } else if (center.x > view.left + view.width - margin) {
    // 右移
    view.left = Math.min(center.x + margin - view.width, state.level.width - view.width)
  }

  if (center.y < view.top + margin) {
    // 上移
    view.top = Math.max(center.y - margin, 0)
  } else if (center.y > view.top + view.height - margin) {
    // 下移
    view.top = Math.min(center.y + margin - view.height, state.level.height - view.height)
  }

}

CanvasDisplay.prototype.clearDisplay = function (status) {
  switch (status) {
    case 'won':
      this.ctx.fillStyle = 'rgb(68, 191, 255)'
      break;

    case 'lost':
      this.ctx.fillStyle = 'rgb(44, 136, 214)'
      break;

    default:
      this.ctx.fillStyle = 'rgb(52, 166, 251)'
      break;
  }
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
}

const img = document.createElement('img')
img.src = 'src/imgs/sprites.png'
CanvasDisplay.prototype.drawBackground = function (level, life) {
  const { left, top, width, height } = this.viewPortInfo

  const xStart = Math.floor(left)
  const xEnd = Math.ceil(left + width)
  const yStart = Math.floor(top)
  const yEnd = Math.ceil(top + height)

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const here = level.rows[y][x]
      if (here === 'empty') continue
      const screenX = (x - left) * scale
      const screenY = (y - top) * scale
      const offsetX = here == 'lava' ? scale * 2 : 0

      this.ctx.drawImage(img,
        offsetX, 0, scale, scale,
        screenX, screenY, scale, scale)
    }
  }

  this.ctx.font = `22px serif`
  this.ctx.fillStyle = 'red'
  this.ctx.fillText(`life: ${life}`, 10, 20, 500)
}


CanvasDisplay.prototype.drawActors = function (actors) {
  for (let actor of actors) {
    const width = actor.size.x * scale
    const height = actor.size.y * scale
    const x = (actor.pos.x - this.viewPortInfo.left) * scale
    const y = (actor.pos.y - this.viewPortInfo.top) * scale
    if (actor.type === 'player') {
      this.drawPlayer(actor, x, y, width, height)
    } else {
      const offsetX = (actor.type === 'coin' ? 2 : 1) * scale * 2
      this.ctx.drawImage(img, offsetX, 0, width, height, x, y, width, height)
    }
  }
}


const playerSprites = document.createElement('img') // 素材小人儿的高 30, 宽 24
playerSprites.src = 'src/imgs/player.png'
const playerXOverlap = 4
/**
 * player 为小人实例
 * x, y 为小人坐标(已scale)
* 每次绘制小人时, 先判断朝向确实是否需要翻转画布,
* 小人没有平移状态时, 显示第八张图片
* 小人坠落状态, 显示第九张图片
* 有平移状态时, 按 16 帧切换图片 1~7
* 
* 保存坐标点, 如果小人朝向不同则翻转坐标点 绘制小人, 恢复坐标点
* 
* speed.x 为 0 表示 x 方向静止
* speed.y 为 0 表示 y 方向静止
* speed.x < 0 表示左移
* speed.x > 0 表示右移
 */
CanvasDisplay.prototype.drawPlayer = function (player, x, y, width, height) {
  width = 24
  height = 30
  x -= playerXOverlap

  if (player.speed.x != 0) { 
    this.flipPlayer = player.speed.x < 0; 
  }

  let count = 8;                    // 静止状态时切换到第八张图片

  if (player.speed.y != 0) {          // 坠落状态切换到第九张图片
    count = 9;
  } else if (player.speed.x != 0) { // 左右平移时, 运动时, 按 16 帧切换图片 1 ~ 7 
    count = Math.floor(Date.now() / 60) % 8;
  }

  this.ctx.save();
  if (this.flipPlayer) {
    const playerPosCenter = x + width / 2
    flipHorizontally(this.ctx, playerPosCenter);
  }

  let offsetX = count * width;
  this.ctx.drawImage(playerSprites, offsetX, 0, width, height, x, y, width, height);
  this.ctx.restore();

}

export default CanvasDisplay