/**
 * 生成 DOM 元素
 * @param {string} name, 标签名
 * @param {object} attrs, 对象, 表示属性
 * @param {array} children, 数组, 表示子元素
 * @returns 返回 DOM 元素
 */
const elt = (name, attrs, ...children) => {
  const dom = document.createElement(name)
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr])
  }
  for (let child of children) {
    dom.appendChild(child)
  }
  return dom
}

class DOMDisplay {
  constructor(parent, level) {
    this.dom = elt('div', {
      class: 'game'
    }, drawGrid(level))

    this.actorsLayer = null
    parent.appendChild(this.dom)

    this.width = this.dom.clientWidth
    this.height  = this.dom.clientHeight
    this.margin = this.width / 3
  }

  clear() {
    this.dom.remove()
  }
}
/**
 * 接受 state 对象, 该对象的属性包括 level 实例, actors 数组, 游戏状态
 * 如果是非首次绘制, 则清除上一次绘制的结果
 * 否则则绘制活动元素, 添加到 DOM 上, 滚动 layer 层到视口位置
 *
 * @param {*} state
 * @returns
 */
DOMDisplay.prototype.syncState = function(state) {
  if (this.actorsLayer) this.actorsLayer.remove()
  this.actorsLayer = drawActors(state.actors)
  this.dom.appendChild(this.actorsLayer)
  this.dom.className = `game ${state.status}`
  window.dom = this.actorsLayer
  this.scrollPlayerIntoView(state)
}

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
  const width = this.dom.clientWidth
  const height  = this.dom.clientHeight
  const margin = width / 3 // 玩家在视口边缘 1/3 的位置时需要转动视角

  const left = this.dom.scrollLeft
  const right = left + width 
  const top = this.dom.scrollTop
  const bottom = top + height

  const player = state.player
  const center = player.pos.plus(player.size.times(0.5)).times(scale) // 玩家中心的坐标
  if (center.x < left + margin) {  
    // console.log(`左滚`);
    this.dom.scrollLeft = center.x - margin
    
  }else if (center.x > right - margin) { 
    // console.log(`右滚`);
    this.dom.scrollLeft = center.x + margin - width
  }

  if (center.y < top + margin) {
    // console.log(`上滚`);
    this.dom.scrollTop = center.y - margin
  } else if (center.y > bottom - margin) {
    // console.log(`下滚`);
    this.dom.scrollTop = center.y - margin
  }

}

const scale = 20
/**
 * 绘制关卡, 背景不变, 活动元素需要在每一帧都重绘
 * 用 table 标签作为背景, 
 * @param {*} level
 */
const drawGrid = (level) => {
  const grid = level.rows.map(row => {
    return elt('tr', {
      style: `height: ${scale}px`
    }, ...row.map(type => elt('td', {
      class: type
    })))
  })

  return elt('table', {
    class: 'background',
    style: `width: ${level.width * scale}px`
  }, ...grid)
}


const drawActors = (actors) => {
  const actorsRect = actors.map(actor => {
    const rect = elt('div', {class: `actor ${actor.type}`}, )
    rect.style.width = `${actor.size.x * scale}px`
    rect.style.height = `${actor.size.y * scale}px`
    rect.style.left = `${actor.pos.x * scale}px`
    rect.style.top = `${actor.pos.y * scale}px`
    return rect
  })
  return elt('div', {}, ...actorsRect)
}


export default DOMDisplay
