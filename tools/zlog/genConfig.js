let ITERS = 100
let DELAY = 0.4

let PREFIX = 'z'
let NEXT = 'zlog_next'
let CMD = 'sm_zlog'

let i = 0
let num = x => x < 10 ? '0' + x : x
let add = (a, b, c) => {
  CFG.push(`alias ${PREFIX}_${num(i)} "alias ${NEXT} ${PREFIX}_${num(++i)}; ${CMD} ${a} ${b} ${c} ${ITERS}"`)
}

let CFG = [`alias ${NEXT} ${PREFIX}_${num(i)}`]

let DIRS = ['N', 'F', 'B', 'L', 'R', 'FL', 'FR', 'BL', 'BR']
let TYPES = ['S', 'DS', 'JS', 'JDS']

for (let type of TYPES) {
  CFG.push('', '// HOLD ' + type)

  for (let dir of DIRS) {
    let start = type === 'DS' ? dir + 'D' : dir
    add(start, DELAY, dir + type)
  }
}

for (let type of TYPES) {
  CFG.push('', '// TICK ' + type)

  for (let dir of DIRS) {
    let start = type === 'DS' ? 'ND' : 'N'
    add(start, DELAY, dir + type)
  }
}

for (let type of TYPES) {
  CFG.push('', '// REVERSE ' + type)

  for (let dir of DIRS) {
    let start = type === 'DS' ? dir + 'D' : dir
    add(start, DELAY, type)
  }
}

CFG.push('', NEXT, '')

process.chdir(__dirname)
require('fs').writeFileSync('zlog.cfg', CFG.join('\n'))
