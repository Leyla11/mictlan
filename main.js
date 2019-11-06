class Player {
  //logica de los jugadores
  constructor(x) {
    this.health = 3
    this.score = 0
    this.x = x
  }

  move(distance, collisions) {
    let nextX = this.x + distance
    while (collisions.indexOf(nextX) !== -1) {
      nextX += distance
    }
    if (nextX >= 10 || nextX < 0) {
      return
    }
    this.x = nextX
    console.log(`Move to: ${nextX}`)
  }

  moveLeft(collisions = []) {
    this.move(-1, collisions)
  }

  moveRight(collisions = []) {
    this.move(1, collisions)
  }
}

class Sprite {
  //la laogica de las imagenes que esta dentro de este
  constructor({ path, width, height }) {
    this.loaded = false
    this.width = width
    this.height = height

    const image = new Image()
    image.src = path
    image.onload = () => {
      this.loaded = true
    }
    this.image = image
  }

  render(ctx, coords) {
    if (this.loaded === false) {
      return
    }

    const { width = this.width } = coords
    const { height = this.height } = coords
    ctx.drawImage(this.image, coords.x, coords.y, width, height)
  }
}

const sprites = {
  //imagenes que en este caso son sprites
  bonus: new Sprite({
    path: './images/bonus.png',
    width: 400,
    height: 400
  }),
  flor: new Sprite({
    path: './images/flor.png',
    width: 900,
    height: 600
  }),
  maiz: new Sprite({
    path: './images/maiz.png',
    width: 387,
    height: 550
  }),
  background: new Sprite({
    path: './images/mictlan-background.jpg',
    width: 1280,
    height: 960
  }),
  logo: new Sprite({
    path: './images/mictlan-logo.png',
    width: 656,
    height: 154
  }),
  p1win: new Sprite({
    path: './images/p1-win.png',
    width: 260,
    height: 89
  }),
  p2win: new Sprite({
    path: './images/p2-win.png',
    width: 260,
    height: 89
  }),
  enter: new Sprite({
    path: './images/press-enter.png',
    width: 415,
    height: 86
  }),
  pumpkin: new Sprite({
    path: './images/pumpkin.png',
    width: 4139,
    height: 2407
  }),
  winBackground: new Sprite({
    path: './images/win.jpg',
    width: 640,
    height: 557
  }),
  xolo: new Sprite({
    path: './images/xolo-player.png',
    width: 201,
    height: 456
  })
}

// Estos son metodos de la clase Mictlan
const screens = {
  logo: ['renderBackground', 'renderLogo', 'renderEnter'],
  instructions: ['renderBackground', 'renderInstructions'],
  gameplay: ['renderBackground', 'renderGameplay'],
  win: ['renderWin']
}

const items = [
  {
    name: 'Bonus',
    sprite: sprites.bonus,
    score: 1,
    probability: 2
  },
  {
    name: 'Flor',
    sprite: sprites.flor,
    score: 0,
    probability: 10
  },
  {
    name: 'Maiz',
    sprite: sprites.maiz,
    score: 0,
    probability: 18
  },
  {
    name: 'Pumpkin',
    sprite: sprites.pumpkin,
    score: -1,
    probability: 20
  }
]

class Gameplay {
  constructor() {
    this.reset()
  }

  reset() {
    this.stop()

    this.items = []
    this.players = [new Player(0), new Player(9)]
    this.settings = {
      newItemTimeout: 1000,
      updateItemsTimeout: 250,
      numCalabazas: 3,
      maxItemY: 10
    }
  }

  start() {
    const { newItemTimeout, updateItemsTimeout } = this.settings
    this.timeouts['newItem'] = setTimeout(() => this.newItem(), newItemTimeout)
    this.timeouts['updateItems'] = setTimeout(() => this.updateItems(), updateItemsTimeout)
  }

  stop() {
    if (typeof this.timeouts === 'object') {
      for (const timeout in this.timeouts) {
        clearTimeout(timeout)
      }
    }
    this.timeouts = {}
  }

  calabacear(x) {
    const { numCalabazas } = this.settings
    for (let i = 0; i < numCalabazas; i++) {
      const calabaza = this.generateItem({ number: 99999, x, y: -i })
      this.items.push(calabaza)
    }
  }

  generateItem(settings = {}) {
    let { number = Math.floor(Math.random() * 50) } = settings
    let i
    for (i = 0; i < items.length; i += 1) {
      const { probability } = items[i]
      if (probability < number) {
        break
      }
      number -= probability
    }
    if (i === items.length) {
      i -= 1
    }
    const { name, sprite, score } = items[i]
    const { x = Math.floor(Math.random() * 10) } = settings
    const { y = 0 } = settings
    return { name, sprite, score, x, y }
  }

  newItem() {
    const newItem = this.generateItem()
    this.items.push(newItem)
    const { newItemTimeout } = this.settings
    this.timeouts['newItem'] = setTimeout(() => this.newItem(), newItemTimeout)
  }

  updateItems() {
    const { maxItemY } = this.settings
    const itemsToScore = []
    this.items.forEach(item => {
      item.y += 1
      if (item.y === maxItemY) {
        itemsToScore.push(item)
      }
    })
    if (itemsToScore.length > 0) {
      const [p1, p2] = this.players
      itemsToScore.reverse()
      itemsToScore.forEach(item => {
        if (item.x === p1.x) {
          p1.score += item.score
        } else if (item.x === p2.x) {
          p2.score += item.score
        } else {
          this.calabacear(item.x)
        }
      })
      this.items = this.items.filter(({ y }) => y >= maxItemY)
    }
    const { updateItemsTimeout } = this.settings
    this.timeouts['updateItems'] = setTimeout(() => this.updateItems(), updateItemsTimeout)
  }

  onKeyDown({ keyCode }) {
    const collisions = this.players.map(({ x }) => x)
    switch (keyCode) {
      case 65: // A
        this.players[0].moveLeft(collisions)
        break

      case 68: // D
        this.players[0].moveRight(collisions)
        break

      case 37: // Left
        this.players[1].moveLeft(collisions)
        break

      case 39: // Right
        this.players[1].moveRight(collisions)
        break
    }
  }
}

class Mictlan {
  constructor() {
    this.ctx = document.getElementById('mictlan').getContext('2d')
    this.gameplay = new Gameplay()
    this.screen = 'logo'
    document.addEventListener('keydown', e => this.onKeyDown(e))
  }

  renderLogo() {
    const { logo } = sprites
    logo.render(this.ctx, { x: 0, y: 100 })
  }

  renderBackground() {
    const { background } = sprites
    background.render(this.ctx, { x: 0, y: 0, width: 640, height: 480 })
  }

  renderEnter() {
    const { enter } = sprites
    enter.render(this.ctx, { x: 110, y: 260 })
  }

  // TODO: Renderizar las instrucciones
  renderInstructions() {}

  renderWin() {
    const { winBackground } = sprites
    winBackground.render(this.ctx, { x: 0, y: 0, width: 640, height: 480 })
    const [p1, p2] = this.gameplay.players
    if (p1.score > 0) {
      const { p1win } = sprites
      p1win.render(this.ctx, { x: 110, y: 50 })
    } else if (p2.score > 0) {
      const { p2win } = sprites
      p2win.render(this.ctx, { x: 110, y: 50 })
    }
  }

  // TODO: Renderizar la jugabilidad
  renderGameplay() {
    //renderizando los jugadores
    const { players } = this.gameplay
    players.forEach(player => {
      const x = player.x * 64
      const { xolo } = sprites
      xolo.render(this.ctx, { x, y: 335, width: 64, height: 145 })
    })

    const { items } = this.gameplay
    items.forEach(item => {
      const x = item.x * 64
      const y = item.y * 32
      const { sprite } = item
      sprite.render(this.ctx, { x, y, width: 64, height: 64 })
    })
    // TODO: Renderizar las vidas
  }

  render() {
    //array con los metodos que vamos a llamar
    const renderMethods = screens[this.screen]
    renderMethods.forEach(method => this[method]())
    //esto es para repetir el render el siguiente frame (60 fps)
    window.requestAnimationFrame(() => this.render())
  }

  onKeyDown(event) {
    const { keyCode } = event
    switch (this.screen) {
      case 'gameplay':
        this.gameplay.onKeyDown(event)
        break

      case 'logo':
        if (keyCode === 13) {
          this.screen = 'gameplay'
          this.gameplay.start()
        }
    }
  }
}

const mictlan = new Mictlan()
mictlan.render()
