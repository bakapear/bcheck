let bcheck = require('../src/bcheck.js')
let data = require('../src/bounces.json')
let { bounces, list } = bcheck.formatBounceJSON(data)

function formatSetup (setup) {
  let parts = setup.map(x => {
    if (['JDS', 'JS', 'SHOOT'].includes(x)) return x
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

function formatBounces (height, bounces, land) {
  let strs = []

  let res = bcheck.getBounces(height, bounces, land)
  for (let bounce of res) {
    strs.push(
      (bounce.weapon ? `(${bounce.weapon}) ` : '') +
      (bounce.text || formatSetup(bounce.setup)) +
      (bounce.speedo ? ` <${bounce.speedo} u/s>` : '') +
      (bounce.ang.length ? ` <${bounce.ang[0]} - ${bounce.ang[1]}>` : '') +
      (bounce.double ? ' [double]' : '')
    )
  }

  return strs.join('\n')
}

let args = process.argv.slice(2)
let height = Number(args[0])
let types = args[1] && args[1].split(',')
let weapons = args[2] && args[2].split(',')

if (!args.length) console.log('bcheck <height> [type] [weapon] | bcheck <types/weapons>')
else {
  if (args[0] === 'types') console.log('Types:', list.types.join(', '))
  else if (args[0] === 'weapons') console.log('Weapons:', list.weapons.join(', '))
  else main(height, types, weapons)
}

function main (height, types = ['default'], weapons = []) {
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
