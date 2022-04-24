let fs = require('fs')

let current = {
  wep: null,
  chance: null,
  setup: null,
  dir: null,
  type: null,
  mod: null,
  bounces: []
}

let FLAGS = {
  HOLD: 1 << 0,
  TICK: 1 << 1,
  REVERSE: 1 << 2,
  MOVEUP: 1 << 3,
  RELOAD: 1 << 4
}
FLAGS.NEUTRAL = FLAGS.HOLD + FLAGS.TICK + FLAGS.REVERSE

function getBounceDir (setup) {
  let buttons = [...new Set(setup.split(''))].filter(x => x.trim() && ['J', 'D', 'S', 'N', 'W', 'A', '>'].every(y => y !== x)).sort().join('')
  switch (buttons) {
    case 'F': return 8
    case 'B': return 2
    case 'L': return 4
    case 'R': return 6
    case 'FL': return 7
    case 'FR': return 9
    case 'BL': return 1
    case 'BR': return 3
    case '': return 5
    default: throw Error('Invalid direction somewhere')
  }
}

function getBounceType (setup) {
  let after = setup.split('>').map(x => x.trim())[1].split('').sort().filter(x => ['J', 'D', 'S'].some(y => x === y)).join('')
  return after === 'DJS' ? 'JDS' : after
}

function getBounceMod (setup) {
  let [before, after] = setup.split('>').map(x => x.split('').filter(x => ['J', 'D', 'S', 'N', 'W', 'A'].every(y => y !== x)).sort().join('').trim())
  let mod = []

  if (!after && !before) mod.push('NEUTRAL')
  else if (before === after) mod.push('HOLD')
  else if (before && !after) mod.push('REVERSE')
  else if (!before && after) mod.push('TICK')

  if (setup.indexOf('W') !== -1) mod.push('MOVEUP')
  if (setup.indexOf('A') !== -1) mod.push('RELOAD')

  return mod
}

function getFlags (mod) {
  let f = 0
  for (let m of mod) {
    if (FLAGS[m]) f += FLAGS[m]
  }
  return f
}

function addBounces (file, weapon) {
  let data = fs.readFileSync(file, 'utf-8')
  let lines = data.split('\n')

  for (let line of lines) {
    let m = line.match(/\[(\d+)\] (.*)/)
    if (m) {
      if (current.setup) {
        let f = BOUNCES[current.type].findIndex(x => x.dir === current.dir && x.weapon === current.wep)
        if (f === -1) BOUNCES[current.type].push({ weapon: current.wep, dir: current.dir })
        let b = BOUNCES[current.type].at(f)
        if (!b.bounces) b.bounces = []
        b.bounces.push(...current.bounces)
      }

      current.wep = weapon
      current.chance = Number(m[1])
      current.setup = m[2]
      current.dir = getBounceDir(current.setup)

      current.type = getBounceType(current.setup)
      current.real = current.type
      if (['DS', 'S'].includes(current.type)) current.type = 'SPECIAL'

      current.mod = getBounceMod(current.setup)
      current.bounces = []

      if (!BOUNCES[current.type]) BOUNCES[current.type] = []
    } else if (current.setup) {
      m = line.match(/(\d+) > ([\d.]+), ([\d.]+), ([\d.]+)/)
      let pack = {
        text: current.setup,
        mod: getFlags(current.mod),
        chance: Number(m[1]) * 100 / current.chance,
        speedo: Number(m[2]),
        vel: Number(m[3]),
        offs: Number(m[4])
      }
      if (current.setup.indexOf('D') > 0) pack.crouched = true
      current.bounces.push(pack)
    }
  }
}

let BOUNCES = {}

addBounces('stock.log', 'Stock')
addBounces('ori.log', 'Original')

fs.writeFileSync('bounces.json', JSON.stringify(BOUNCES, null, 2))
