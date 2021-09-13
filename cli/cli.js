let bcheck = require('../src/bcheck.js')
let data = require('../src/bounces.json')
let { bounces, list } = bcheck.formatBounceJSON(data)

function formatSetup (setup) {
  let parts = setup.map(x => {
    if (['JDS', 'JS', 'SHOOT'].includes(x)) return x
    if (x === 'SIDE') return 'Left/Right'
    return x[0].toUpperCase() + x.substr(1).toLowerCase()
  })
  let str = ''
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'SHOOT') continue
    if (i !== 0) {
      str += (i === 2 && parts.length > 3) ? '+' : ' '
    }
    str += parts[i]
  }
  return str
}

function formatText (bounce) {
  return (bounce.weapon ? `(${bounce.weapon}) ` : '') +
    (bounce.text || formatSetup(bounce.setup)) +
    (bounce.speedo ? ` <${bounce.speedo} u/s>` : '') +
    (bounce.ang && bounce.ang.length ? ` <${bounce.ang[0]} - ${bounce.ang[1]}>` : '') +
    (bounce.double ? ' [double]' : '')
}

function formatBounces (height, bounces, land) {
  let strs = []

  let res = bcheck.getBounces(height, bounces, land)
  for (let bounce of res) strs.push(formatText(bounce))

  return strs.join('\n')
}

let args = process.argv.slice(2)
let height = Number(args[0])
let types = args[1] && args[1].split(',')
let weapons = args[2] && args[2].split(',')

if (args[0] === 'find') {
  args = args.slice(1)
  if (args.length < 2) console.log('bfind <height> <bounce> [type] | types: UNCROUCHED,CROUCHED,JUMPBUG')
  else seek(Number(args[0]), args[1], (args[2] || '').toUpperCase())
} else {
  if (!args.length) console.log('bcheck <height> [type] [weapon] | bcheck <types/weapons>')
  else {
    if (args[0] === 'types') console.log('Types:', list.types.join(', '))
    else if (args[0] === 'weapons') console.log('Weapons:', list.weapons.join(', '))
    else check(height, types, weapons)
  }
}

function check (height, types = ['default'], weapons = []) {
  if (!Array.isArray(types)) types = [types]
  if (!Array.isArray(weapons)) weapons = [weapons]
  types = types.map(x => x.toLowerCase())
  weapons = weapons.map(x => x.toLowerCase())

  let c = (x, y) => !y || (!x.length || x.includes(y.toLowerCase()))
  let m = '-'.repeat(5)

  let set = Object.entries(bounces).filter(x => c(types, x[0])).map(x => x[1].filter(x => c(weapons, x.weapon))).flat()

  console.log([
    `BCHECK: ${height}` + '\n',
    `${m} UNCROUCHED ${m}`, formatBounces(height, set, bcheck.UNCROUCHED) + '\n',
    `${m} CROUCHED ${m}`, formatBounces(height, set, bcheck.CROUCHED) + '\n',
    `${m} JUMPBUG ${m}`, formatBounces(height, set, bcheck.JUMPBUG) + '\n'
  ].join('\n'))
}

function seek (height, txt, type) {
  let set = []

  let strs = Object.entries(bounces).map(x => {
    x[1] = x[1].map(x => formatText(x))
    return x
  })
  for (let sl of strs) {
    let b = sl[1].findIndex(x => x.toLowerCase().indexOf(txt.toLowerCase()) >= 0)
    if (b !== -1) {
      set.push(bounces[sl[0]][b])
      break
    }
  }

  let z = false
  let h = height
  let i = 0
  let res = []
  while (true) {
    if (i > 10000) return console.log('Nothing found!')
    z = !z
    i++
    let o = h + (z ? i : -i)
    let b = {}
    if (type) {
      b[type] = formatBounces(o, set, type).split('\n')
    } else {
      b.UNCROUCHED = formatBounces(o, set, bcheck.UNCROUCHED).split('\n')
      b.CROUCHED = formatBounces(o, set, bcheck.CROUCHED).split('\n')
      b.JUMPBUG = formatBounces(o, set, bcheck.JUMPBUG).split('\n')
    }
    for (let type in b) {
      if (b[type].filter(x => x).length) res.push(`${type} - ${b[type][0]}`)
    }
    if (res.length) break
  }
  console.log('Height:', h + (z ? i : -i))
  console.log(res.join('\n'))
}
