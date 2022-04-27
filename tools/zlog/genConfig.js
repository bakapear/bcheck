let ITERS = 100
let DELAY = 0.2

let PREFIX = 'z'
let NEXT = 'zlog_next'
let CMD = 'sm_zlog'

let i = 1
let num = x => x < 10 ? '0' + x : x

let add = (a, b, c) => {
  CFG.push(`alias ${PREFIX}_${num(i)} "alias ${NEXT} ${PREFIX}_${num(++i)}; ${CMD} ${a} ${b} ${c} ${ITERS}"`)
}
let echo = (a, b) => {
  CFG.push('', `alias ${PREFIX}_${num(i)} "hud_reloadscheme; wait 500; ${PREFIX}_${num(++i)}; wait 50; con_logfile zlog_${a}-${b}.log"`, '')
}

let CFG = ['sv_allow_wait_command 1', 'cl_autoreload 0', 'sdr_spew_level 0', `alias ${NEXT} ${PREFIX}_${num(i)}`]

let DIRS = ['N', 'F', 'B', 'L', 'R', 'FL', 'FR', 'BL', 'BR']
let TYPES = ['S', 'DS', 'JS', 'JDS']

let MODS = ['', 'W', 'A', 'WA']

for (let mod of MODS) {
  let dirs = DIRS.map(x => mod + x)
  if (!mod) mod = 'N'

  for (let type of TYPES) {
    echo(mod + '_HOLD', type)

    for (let dir of dirs) {
      let start = type === 'DS' ? dir + 'D' : dir
      add(start, DELAY, dir + type)
    }
  }

  for (let type of TYPES) {
    echo(mod + '_TICK', type)

    for (let dir of dirs) {
      let start = type === 'DS' ? 'ND' : 'N'
      add(start, DELAY, dir + type)
    }
  }

  for (let type of TYPES) {
    echo(mod + '_REVERSE', type)

    for (let dir of dirs) {
      let start = type === 'DS' ? dir + 'D' : dir
      add(start, DELAY, type)
    }
  }
}

CFG.push('', `alias ${PREFIX}_${num(i)} "wait 50; con_logfile console.log"`)

CFG.push('', NEXT, '')

process.chdir(__dirname)
require('fs').writeFileSync('zlog.cfg', CFG.join('\n'))
