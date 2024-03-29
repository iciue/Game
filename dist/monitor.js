'use strict';

/**
 * 用于存储及计算坐标
 */
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }
  times(factor) {
    return new Vector(this.x * factor, this.y * factor)
  }
}

/**
 * 计算 a1 a2 是否重叠
 */
const overlap = (a1, a2) => {
  return a1.pos.x + a1.size.x > a2.pos.x &&  // a1 底部 是否与 a2 重叠
    a1.pos.x < a2.pos.x + a2.size.x &&       // a1 顶部 是否与 a2 重叠
    a1.pos.y + a1.size.y > a2.pos.y &&       // a1 右侧 是否与 a2 重叠
    a1.pos.y < a2.pos.y + a2.size.y         // a2 左侧 是否与 a2 重叠
};

/**
 * 生成事件对象, 并绑定事件
 */
const trackKeys = (keys) => {
  if(!keys) return {}

  const down = Object.create(null);
  const track = (e) => {
    console.log('outer',e);
    console.log(keys.includes(e.key), );
    if (keys.includes(e.key)) {
      e.preventDefault();
      console.log('inner',e.key, e.type);
      down[e.key] = (e.type === 'keydown');
      console.log(down);
    }
  };

  window.addEventListener('keydown', track);
  window.addEventListener('keyup', track);

  return down
};

/**
 * 翻转 Y 轴
 */
const flipHorizontally = (context, around) => {
  context.translate(around, 0);
  context.scale(-1, 1);
  context.translate(-around, 0);
};


const addEventListenerOnce = (target, eventType, callback) => {
  function handler(e) {
    callback(e);
    target.removeEventListener(eventType, handler);
  }
  target.addEventListener(eventType, handler);
};

/**
 * 生成 DOM 元素
 * @param {string} name, 标签名
 * @param {object} attrs, 对象, 表示属性
 * @param {array} children, 数组, 表示子元素
 * @returns 返回 DOM 元素
 */
const elt = (name, attrs, ...children) => {
  const dom = document.createElement(name);
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  for (let child of children) {
    dom.appendChild(child);
  }
  return dom
};

class DOMDisplay {
  constructor(parent, level) {
    this.dom = elt('div', {
      class: 'game'
    }, drawGrid(level));

    this.actorsLayer = null;
    parent.appendChild(this.dom);

    this.width = this.dom.clientWidth;
    this.height  = this.dom.clientHeight;
    this.margin = this.width / 3;
  }

  clear() {
    this.dom.remove();
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
  if (this.actorsLayer) this.actorsLayer.remove();
  this.actorsLayer = drawActors(state.actors);
  this.dom.appendChild(this.actorsLayer);
  this.dom.className = `game ${state.status}`;
  window.dom = this.actorsLayer;
  this.scrollPlayerIntoView(state);
};

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
  const width = this.dom.clientWidth;
  const height  = this.dom.clientHeight;
  const margin = width / 3; // 玩家在视口边缘 1/3 的位置时需要转动视角

  const left = this.dom.scrollLeft;
  const right = left + width; 
  const top = this.dom.scrollTop;
  const bottom = top + height;

  const player = state.player;
  const center = player.pos.plus(player.size.times(0.5)).times(scale); // 玩家中心的坐标
  if (center.x < left + margin) {  
    // console.log(`左滚`);
    this.dom.scrollLeft = center.x - margin;
    
  }else if (center.x > right - margin) { 
    // console.log(`右滚`);
    this.dom.scrollLeft = center.x + margin - width;
  }

  if (center.y < top + margin) {
    // console.log(`上滚`);
    this.dom.scrollTop = center.y - margin;
  } else if (center.y > bottom - margin) {
    // console.log(`下滚`);
    this.dom.scrollTop = center.y - margin;
  }

};

const scale = 20;
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
  });

  return elt('table', {
    class: 'background',
    style: `width: ${level.width * scale}px`
  }, ...grid)
};


const drawActors = (actors) => {
  const actorsRect = actors.map(actor => {
    const rect = elt('div', {class: `actor ${actor.type}`}, );
    rect.style.width = `${actor.size.x * scale}px`;
    rect.style.height = `${actor.size.y * scale}px`;
    rect.style.left = `${actor.pos.x * scale}px`;
    rect.style.top = `${actor.pos.y * scale}px`;
    return rect
  });
  return elt('div', {}, ...actorsRect)
};

/**
 * 绘制
 * drawBackground
 * drawActors
 * clear
 * syncState 
 */

const scale$1 = 20;

class CanvasDisplay {
  constructor(parent, level) {
    console.log(level);
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.min(650, level.width * scale$1);
    this.canvas.height = Math.min(450, level.height * scale$1);
    this.ctx = this.canvas.getContext('2d');
    window.ctx = this.ctx;
    parent.appendChild(this.canvas);

    // 为了方便与 level 计算 此处宽高需要转换为缩放前的大小
    this.viewPortInfo = {
      top: 0,
      left: 0,
      width: this.canvas.width / scale$1,
      height: this.canvas.height / scale$1
    };

    this.flipPlayer = false;
    
  }

  clear() {
    this.canvas.remove();
  }

}

/**
 * 以最新的数据绘制游戏
 */
CanvasDisplay.prototype.syncState = function (state) {
  this.updateViewPort(state);
  this.clearDisplay(state.status);
  this.drawBackground(state.level, state.life);
  this.drawActors(state.actors);
};

CanvasDisplay.prototype.updateViewPort = function (state) {
  const view = this.viewPortInfo;
  const margin = view.width / 3;

  const player = state.player;
  const center = player.pos.plus(player.size.times(0.5));

  if (center.x < view.left + margin) {
    //左移
    view.left = Math.max(center.x - margin, 0);
  } else if (center.x > view.left + view.width - margin) {
    // 右移
    view.left = Math.min(center.x + margin - view.width, state.level.width - view.width);
  }

  if (center.y < view.top + margin) {
    // 上移
    view.top = Math.max(center.y - margin, 0);
  } else if (center.y > view.top + view.height - margin) {
    // 下移
    view.top = Math.min(center.y + margin - view.height, state.level.height - view.height);
  }

};

CanvasDisplay.prototype.clearDisplay = function (status) {
  switch (status) {
    case 'won':
      this.ctx.fillStyle = 'rgb(68, 191, 255)';
      break;

    case 'lost':
      this.ctx.fillStyle = 'rgb(44, 136, 214)';
      break;

    default:
      this.ctx.fillStyle = 'rgb(52, 166, 251)';
      break;
  }
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

const img = document.createElement('img');
img.src = 'src/imgs/sprites.png';
CanvasDisplay.prototype.drawBackground = function (level, life) {
  const { left, top, width, height } = this.viewPortInfo;

  const xStart = Math.floor(left);
  const xEnd = Math.ceil(left + width);
  const yStart = Math.floor(top);
  const yEnd = Math.ceil(top + height);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const here = level.rows[y][x];
      if (here === 'empty') continue
      const screenX = (x - left) * scale$1;
      const screenY = (y - top) * scale$1;
      const offsetX = here == 'lava' ? scale$1 * 2 : 0;

      this.ctx.drawImage(img,
        offsetX, 0, scale$1, scale$1,
        screenX, screenY, scale$1, scale$1);
    }
  }

  this.ctx.font = `22px serif`;
  this.ctx.fillStyle = 'red';
  this.ctx.fillText(`life: ${life}`, 10, 20, 500);
};


CanvasDisplay.prototype.drawActors = function (actors) {
  for (let actor of actors) {
    const width = actor.size.x * scale$1;
    const height = actor.size.y * scale$1;
    const x = (actor.pos.x - this.viewPortInfo.left) * scale$1;
    const y = (actor.pos.y - this.viewPortInfo.top) * scale$1;
    if (actor.type === 'player') {
      this.drawPlayer(actor, x, y, width, height);
    } else {
      const offsetX = (actor.type === 'coin' ? 2 : 1) * scale$1 * 2;
      this.ctx.drawImage(img, offsetX, 0, width, height, x, y, width, height);
    }
  }
};


const playerSprites = document.createElement('img'); // 素材小人儿的高 30, 宽 24
playerSprites.src = 'src/imgs/player.png';
const playerXOverlap = 4;
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
  width = 24;
  height = 30;
  x -= playerXOverlap;

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
    const playerPosCenter = x + width / 2;
    flipHorizontally(this.ctx, playerPosCenter);
  }

  let offsetX = count * width;
  this.ctx.drawImage(playerSprites, offsetX, 0, width, height, x, y, width, height);
  this.ctx.restore();

};

/**
 * 游戏的状态, 用于判断游戏的输赢
 */
class State {
  constructor(level, actors, status, life) {
    this.level = level;
    this.actors = actors;
    this.status = status;
    this.life = life;
  }

  static start(level ,life) {
    return new State(level, level.actors, 'playing', life)
  }

  get player() {
    return this.actors.find(a => a.type === 'player')
  }
}
/**
 * 更新活动元素的数据
 * @param {*} time
 * @param {*} keys
 */
State.prototype.update = function (time, keys) {
  const actors = this.actors.map(actor => actor.update(time, this, keys));  //更新活动元素位置
  let newState = new State(this.level, actors, this.status, this.life); // 根据新活动元素的位置生成 State
  if (newState.status !== 'playing') return newState
  const player = newState.player;
  if (this.level.touches(player.pos, player.size, 'lava')) return new State(this.level, actors, 'lost', this.life)
  for (let actor of actors) {
    if (actor.type !== 'player' && overlap(actor, player)) {
      newState = actor.collide(newState);
    }
  }
  return newState
};

/**
 * 硬币, 硬币可以在垂直方向上小幅度的抖动
 * wobble 属性用来记录硬币的抖动幅度
 * wobble 和 basePos 共同决定了 pos 所在的实际位置
 */
class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
  }

  get type() {
    return 'coin'
  }

  static create(pos) {
    const basePos = pos.plus(new Vector(0.2, 0.1));
    return new Coin(basePos, basePos, Math.random() * Math.PI * 2)
  }
}
Coin.prototype.size = new Vector(0.6, 0.6);

/**
 *
 *
 * @param {*} state
 */
Coin.prototype.collide = function (state) {
  console.log('get coin');
  const filteredActor = state.actors.filter(a => a !== this); //剔除得到的硬币
  let status = state.status;
  if (!filteredActor.some(a => a.type == 'coin')) status = 'won';
  return new State(state.level, filteredActor, status, state.life)
};

const wobbleSpeed = 8;
const wobbleDist = 0.07;
Coin.prototype.update = function (time) {
  const wobble = this.wobble + time * wobbleSpeed;
  const wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(this.basePos.plus(new Vector(0, wobblePos)), this.basePos, wobble)
};

/**
 * 有 3 种不同类型的熔岩
 * = 在水平方向上来回移动的熔岩, 撞到障碍物会回弹
 * | 在垂直方向上运动的容颜,  撞到障碍物会回弹
 * v 在垂直方向上运动, 撞到障碍物会直接出现在起始位置, 然后继续下落
 */
class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() {
    return 'lava'
  }

  static create(pos, ch) {
    if (ch === '=') return new Lava(pos, new Vector(2, 0))
    if (ch === '|') return new Lava(pos, new Vector(0, 2))
    if (ch === 'v') return new Lava(pos, new Vector(0, 3), this.reset)
  }
}
Lava.prototype.size = new Vector(1, 1);
Lava.prototype.collide = function (state) {
  return new State(state.level, state.actors, "lost", state.life);
};

/**
 * 
 * @param {*} state
 * @param {*} time
 * @returns
 */
Lava.prototype.update = function (time, state) {
  const newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, 'wall')) return new Lava(newPos, this.speed, this.reset)
  if (this.reset) return new Lava(this.reset, speed, rest)
  return new Lava(this.pos, this.speed.times(-1))
};

/**
 * 玩家类, 存储玩家的坐标, 速度
 * @class Player
 */
class Player {
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
  }
  get type() {
    return 'player'
  }

  static create(pos) {
    return new Player(pos.plus(new Vector(0, -0.5)), new Vector(0, 0))
  }
}
//每个 actor 实例的 size 都是相同的, 为了避免不必要的 new vector 所以放在原型上
Player.prototype.size = new Vector(0.8, 1.5);

/**
 * 
 */
const PlayerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;
Player.prototype.update = function (time, state, keys) {

  let xSpeed = 0;

  if (keys.ArrowLeft) xSpeed -= PlayerXSpeed;
  if (keys.ArrowRight) xSpeed += PlayerXSpeed;

  let pos = this.pos;
  const movedX = pos.plus(new Vector(xSpeed * time, 0));
  if (!state.level.touches(movedX, this.size, 'wall')) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;

  let movedY = pos.plus(new Vector(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, 'wall')) { // 脚下有墙
    pos = movedY;
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } else {
    ySpeed = 0;
  }

  return new Player(pos, new Vector(xSpeed, ySpeed))
};

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
};

/**
 * 关卡类
 * this 上保存了关卡的宽高, 表示地图的二维数组, 存储活动元素信息的数组
 * 构造函数接受一个用于表示表示关卡的二维数组
 * 遍历 plan, 生成用于整个关卡, 如果 ch 是 '.' 表示空, 如果是活动元素, 则根据坐标生成 对应活动元素 的实例
 *  
 */
class Level {
  constructor(plan) {
    this.width = plan[0].length;
    this.height = plan.length;
    this.actors = [];

    // 左上角开始, 第 y 行, 第 x 列
    this.rows = plan.map((row, y) => {
      return row.map((ch, x) => {
        const type = activeChar[ch];
        if (typeof type === 'string') return type
        this.actors.push(type.create(new Vector(x, y), ch));
        return 'empty'
      })
    });
  }
}
/**
 * 判断下一次指定的矩形块 出现到的位置是否接触到了 targetType 类型的物体
 * 用于判断 熔岩/玩家 是否碰到墙壁
 * @param {Vector} pos 矩形的坐标
 * @param {Vector} size 矩形的宽高
 * @param {string} targetType 是否接触到的网格
 * @return(boolean)
 */
Level.prototype.touches = function (pos, size, targetType) {
  const xStart = Math.floor(pos.x);
  const yStart = Math.floor(pos.y);
  const xEnd = Math.ceil(pos.x + size.x);
  const yEnd = Math.ceil(pos.y + size.y);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
      const here = isOutside ? 'wall' : this.rows[y][x];
      if (here === targetType) return true
    }
  }
  return false
};

const GAME_PLAN = [`                                                    
................................................................................
................................................................................
................................................................................
................................................................................
................................................................................
................................................................................
..................................................................###...........
...................................................##......##....##+##..........
....................................o.o......##..................#+++#..........
.................................................................##+##..........
...................................#####..........................#v#...........
............................................................................##..
..##......................................o.o................................#..
..#.....................o....................................................#..
..#......................................#####.............................o.#..
..#..........####.......o....................................................#..
..#..@.......#..#................................................#####.......#..
..############..###############...####################.....#######...#########..
..............................#...#..................#.....#....................
..............................#+++#..................#+++++#....................
..............................#+++#..................#+++++#....................
..............................#####..................#######....................
................................................................................
................................................................................
`, `                                                                     
................................................................................
................................................................................
....###############################.............................................
...##.............................##########################################....
...#.......................................................................##...
...#....o...................................................................#...
...#................................................=.......................#...
...#.o........################...................o..o...........|........o..#...
...#.........................#..............................................#...
...#....o....................##########.....###################....##########...
...#..................................#+++++#.................#....#............
...###############....oo......=o.o.o..#######.###############.#....#............
.....#...............o..o.............#.......#......#........#....#............
.....#....................#############..######.####.#.########....########.....
.....#.............########..............#...........#.#..................#.....
.....#..........####......####...#####################.#..................#.....
.....#........###............###.......................########....########.....
.....#.......##................#########################......#....#............
.....#.......#................................................#....#............
.....###......................................................#....#............
.......#...............o...........................................#............
.......#...............................................o...........#............
.......#########......###.....############.........................##...........
.............#..................#........#####....#######.o.........########....
.............#++++++++++++++++++#............#....#.....#..................#....
.............#++++++++++++++++++#..........###....###...####.o.............#....
.............####################..........#........#......#.....|.........#....
...........................................#++++++++#......####............#....
...........................................#++++++++#.........#........@...#....
...........................................#++++++++#.........##############....
...........................................##########...........................
................................................................................
`, `
......................................#++#........................#######....................................#+#..
......................................#++#.....................####.....####.................................#+#..
......................................#++##########...........##...........##................................#+#..
......................................##++++++++++##.........##.............##...............................#+#..
.......................................##########++#.........#....................................o...o...o..#+#..
................................................##+#.........#.....o...o....................................##+#..
.................................................#+#.........#................................###############++#..
.................................................#v#.........#.....#...#........................++++++++++++++##..
.............................................................##..|...|...|..##............#####################...
..............................................................##+++++++++++##............v........................
...............................................................####+++++####......................................
...............................................#.....#............#######........###.........###..................
...............................................#.....#...........................#.#.........#.#..................
...............................................#.....#.............................#.........#....................
...............................................#.....#.............................##........#....................
...............................................##....#.............................#.........#....................
...............................................#.....#......o..o.....#...#.........#.........#....................
...............#######........###...###........#.....#...............#...#.........#.........#....................
..............##.....##.........#...#..........#.....#.....######....#...#...#########.......#....................
.............##.......##........#.o.#..........#....##...............#...#...#...............#....................
.....@.......#.........#........#...#..........#.....#...............#...#...#...............#....................
....###......#.........#........#...#..........#.....#...............#...#####...######......#....................
....#.#......#.........#.......##.o.##.........#.....#...............#.....o.....#.#.........#....................
++++#.#++++++#.........#++++++##.....##++++++++##....#++++++++++.....#.....=.....#.#.........#....................
++++#.#++++++#.........#+++++##.......##########.....#+++++++##+.....#############.##..o.o..##....................
++++#.#++++++#.........#+++++#....o.................##++++++##.+....................##.....##.....................
++++#.#++++++#.........#+++++#.....................##++++++##..+.....................#######......................
++++#.#++++++#.........#+++++##.......##############++++++##...+..................................................
++++#.#++++++#.........#++++++#########++++++++++++++++++##....+..................................................
++++#.#++++++#.........#++++++++++++++++++++++++++++++++##.....+..................................................
`, `
..............................................................................................................
..............................................................................................................
..............................................................................................................
..............................................................................................................
..............................................................................................................
........................................o.....................................................................
..............................................................................................................
........................................#.....................................................................
........................................#.....................................................................
........................................#.....................................................................
........................................#.....................................................................
.......................................###....................................................................
.......................................#.#.................+++........+++..###................................
.......................................#.#.................+#+........+#+.....................................
.....................................###.###................#..........#......................................
......................................#...#.................#...oooo...#.......###............................
......................................#...#.................#..........#......#+++#...........................
......................................#...#.................############.......###............................
.....................................##...##......#...#......#................................................
......................................#...#########...########..............#.#...............................
......................................#...#...........#....................#+++#..............................
......................................#...#...........#.....................###...............................
.....................................##...##..........#.......................................................
......................................#...#=.=.=.=....#............###........................................
......................................#...#...........#...........#+++#.......................................
......................................#...#....=.=.=.=#.....o......###.......###..............................
.....................................##...##..........#.....................#+++#.............................
..............................o...o...#...#...........#.....#................##v........###...................
......................................#...#...........#..............#.................#+++#..................
.............................###.###.###.###.....o.o..#++++++++++++++#...................v#...................
.............................#.###.#.#.###.#..........#++++++++++++++#........................................
.............................#.............#...#######################........................................
.............................##...........##.........................................###......................
..###.........................#.....#.....#.........................................#+++#................###..
..#.#.........................#....###....#..........................................###.................#.#..
..#...........................#....###....#######........................#####.............................#..
..#...........................#...........#..............................#...#.............................#..
..#...........................##..........#..............................#.#.#.............................#..
..#.......................................#.......|####|....|####|.....###.###.............................#..
..#................###.............o.o....#..............................#.........###.....................#..
..#...............#####.......##..........#.............................###.......#+++#..........#.........#..
..#...............o###o.......#....###....#.............................#.#........###..........###........#..
..#................###........#############..#.oo.#....#.oo.#....#.oo..##.##....................###........#..
..#......@..........#.........#...........#++#....#++++#....#++++#....##...##....................#.........#..
..#############################...........#############################.....################################..
..............................................................................................................
..............................................................................................................
`, `
..................................................................................................###.#.......
......................................................................................................#.......
..................................................................................................#####.......
..................................................................................................#...........
..................................................................................................#.###.......
..........................o.......................................................................#.#.#.......
.............................................................................................o.o.o###.#.......
...................###................................................................................#.......
.......+..o..+................................................#####.#####.#####.#####.#####.#####.#####.......
.......#.....#................................................#...#.#...#.#...#.#...#.#...#.#...#.#...........
.......#=.o..#............#...................................###.#.###.#.###.#.###.#.###.#.###.#.#####.......
.......#.....#..................................................#.#...#.#...#.#...#.#...#.#...#.#.....#.......
.......+..o..+............o..................................####.#####.#####.#####.#####.#####.#######.......
..............................................................................................................
..........o..............###..............................##..................................................
..............................................................................................................
..............................................................................................................
......................................................##......................................................
...................###.........###............................................................................
..............................................................................................................
..........................o.....................................................#......#......................
..........................................................##.....##...........................................
.............###.........###.........###.................................#..................#.................
..............................................................................................................
.................................................................||...........................................
..###########.................................................................................................
..#.........#.o.#########.o.#########.o.##................................................#...................
..#.........#...#.......#...#.......#...#.................||..................#.....#.........................
..#..@......#####...o...#####...o...#####.....................................................................
..#######.....................................#####.......##.....##.....###...................................
........#=..................=................=#...#.....................###...................................
........#######################################...#+++++++++++++++++++++###+++++++++++++++++++++++++++++++++++
..................................................############################################################
..............................................................................................................
`];

const PLANS = GAME_PLAN.map(st => st.trim().split('\n').map(row => [...row.trim()]));  //格式化游戏地图

const keydown = new Event('keydown');
keydown.key = 'ArrowUp';

const keyUp = new Event('keyup');
keyUp.key = 'ArrowUp';

let arrowKeys = trackKeys(); // 事件对象
let isPause = false;

/**
 * 利用 rAF 绘制动画
 * @param {*} frameFunc
 */
const runAnimation = (frameFunc) => {
  let lastTime = null;

  const frame = (time) => {
    if (lastTime != null) {
      let timeStep = Math.min(time - lastTime, 100) / 1000;

      if (frameFunc(timeStep) === false) {
        console.log('游戏结束');
        return;
      }
    }
    lastTime = time;
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

const runLevel = (level, Display, life) => {
  const display = new Display(document.querySelector('.game-box'), level);
  let state = State.start(level, life);
  let endingWaiting = .5; // 当游戏结束时, 留给玩家 0.5 秒的反应时间
  return new Promise((resolve, reject) => {
    runAnimation(time => {
      if (isPause) return;
      state = state.update(time, arrowKeys);
      display.syncState(state);
      if (state.status === 'playing') {
        return true
      } else if (endingWaiting > 0) {
        endingWaiting -= time;
      } else {
        display.clear();
        resolve(state.status);
        return false
      }
    }, );
  })
};

async function runGame(PLANS, Display) {
  let life = 3;

  for (let level = 1; life > 0 && level < PLANS.length;) {
    let status = await runLevel(new Level(PLANS[level]), Display, life);
    if (status === 'won') {
      level++;
    } else {
      life--;
    }
  }
  initialGameDisplay();
}

const startGameBtn = document.querySelector('.start');
const pauseGameBtn = document.querySelector('.pause');


/**
 *
 *
 */
const initialGameDisplay = () => {
  let alreadyStart = false;

  runGame(PLANS, CanvasDisplay);

  addEventListenerOnce(startGameBtn, 'click', (e) => {
    if (alreadyStart) return;
    alreadyStart = true;
    arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);
    window.dispatchEvent(keydown);
    setTimeout(() => {
      window.dispatchEvent(keyUp);
    }, 0);

    pauseGameBtn.addEventListener('click', (e) => {
      e.target.textContent = isPause ? '暂停游戏' : '继续游戏';
      isPause = !isPause;
    });
  });

};

initialGameDisplay();
