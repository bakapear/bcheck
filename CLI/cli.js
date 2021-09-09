let bcheck = require('../src/bcheck.js')

let data = require('../src/bounces.json')
let { bounces, list } = bcheck.formatBounceJSON(data)

function formatBounces (bounces, types, weapons, land) {
  let check = (x, y) => !y || (!x.length || x.includes(y.toLowerCase()))

  let strs = []

  for (let type in bounces) {
    if (check(types, type)) {
      let res = bcheck.getBounces(height, bounces[type], land)
      for (let bounce of res) {
        if (check(weapons, bounce.weapon)) {
          strs.push(
            (bounce.weapon ? `(${bounce.weapon}) ` : '') +
            bounce.text +
            (bounce.ang.length ? ` <${bounce.ang[0]} - ${bounce.ang[1]}>` : '') +
            (bounce.double ? ' [double]' : '')
          )
        }
      }
    }
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

  console.log([
    `BCHECK: ${height}` + '\n',
    `${'-'.repeat(5)} UNCROUCHED ${'-'.repeat(5)}`, formatBounces(bounces, types, weapons, bcheck.UNCROUCHED) + '\n',
    `${'-'.repeat(5)} CROUCHED ${'-'.repeat(5)}`, formatBounces(bounces, types, weapons, bcheck.CROUCHED) + '\n',
    `${'-'.repeat(5)} JUMPBUG ${'-'.repeat(5)}`, formatBounces(bounces, types, weapons, bcheck.JUMPBUG) + '\n'
  ].join('\n'))
}
