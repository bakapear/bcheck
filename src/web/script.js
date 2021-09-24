let bcheck = window.bcheck
let BOUNCES = bcheck.formatBounceJSON(window.BOUNCES)
let STATE = { height: null, folds: {}, teleheight: 1 }
let OPTIONS = { wepicons: true }
let LIST = {}

Object.defineProperty(STATE, 'set', {
  enumerable: false,
  value: function (prop, value) {
    this[prop] = value
    updateBounces()
  }
})

window.STATE = STATE

window.onload = () => {
  LIST = {
    uncrouched: document.getElementById('list_uncrouched'),
    crouched: document.getElementById('list_crouched')
  }

  let opts = 'options'
  loadSettings()
  addSetting(opts, 'ang', 'Custom Angle', [40, 89, 60])
  addSetting(opts, 'hidelow', 'Hide bounces with lower probability')
  addSetting(opts, 'wepicons', 'Use weapon icons')
  // addSetting(opts, 'hell', 'Activate Light Mode')
  handleSettings('button_settings')

  handleInput('input_height', 'button_check')

  addTags('switch_types', BOUNCES.list.types)
  addTags('switch_weps', BOUNCES.list.weapons, true)
  handleSwitches('switch_types', 'types', 1)
  handleSwitches('switch_weps', 'weapons')

  handleJumpbug('switch_jb', 1)

  updateSettings()
}

function loadSettings () {
  let opts = JSON.parse(window.localStorage.getItem('opts'))
  for (let o in opts) OPTIONS[o] = opts[o]
}

function saveSettings () {
  window.localStorage.setItem('opts', JSON.stringify(OPTIONS))
}

function updateSettings () {
  saveSettings()

  let weps = document.getElementById('switch_weps')
  if (OPTIONS.wepicons) weps.classList.add('wepicons')
  else weps.classList.remove('wepicons')

  updateBounces()
}

function addSetting (box, prop, text, range) {
  box = document.getElementById(box)

  let item = document.createElement('div')
  item.className = 'item'

  let check = document.createElement('input')
  check.type = 'checkbox'

  let span = document.createElement('span')
  span.innerText = text

  item.appendChild(check)
  item.appendChild(span)

  if (range) {
    let [slider, val] = createAngSlider(range[0], range[1], OPTIONS[prop] || range[2])
    slider.oninput = () => {
      val.innerText = slider.value
      if (check.checked) OPTIONS[prop] = Number(slider.value)
    }
    slider.onchange = updateSettings

    item.appendChild(slider)
    item.appendChild(val)

    check.onclick = () => {
      OPTIONS[prop] = check.checked ? Number(slider.value) : false
      updateSettings()
    }
  } else {
    check.onclick = () => {
      OPTIONS[prop] = check.checked
      updateSettings()
    }
  }

  if (OPTIONS[prop]) check.click()

  box.appendChild(item)
}

function createAngSlider (min, max, def) {
  let slider = document.createElement('input')
  slider.type = 'range'
  slider.min = min
  slider.max = max
  slider.value = def
  let val = document.createElement('span')
  val.className = 'deg'
  val.innerText = def
  return [slider, val]
}

function handleSettings (button) {
  button = document.getElementById(button)
  button.onclick = () => button.parentElement.classList.toggle('open')
}

function addTags (node, tags, imgs) {
  let parent = document.getElementById(node)

  for (let tag of tags) {
    let button = document.createElement('button')
    button.className = 'button disabled'
    button.setAttribute('data-id', tag)

    let text = tag.split(' ').pop()

    let span = document.createElement('span')
    span.innerText = text
    button.appendChild(span)

    if (imgs) {
      let img = document.createElement('img')
      img.alt = tag
      img.src = `icons/${text.toLowerCase()}.png`
      button.appendChild(img)
    }

    parent.appendChild(button)
  }
}

function handleInput (input, button) {
  input = document.getElementById(input)
  button = document.getElementById(button)

  let forward = () => {
    let val = input.value.trim()
    STATE.set('height', val === '' ? null : Number(val))
  }

  button.onclick = forward
  input.onkeydown = e => {
    if (e.keyCode === 69) return false
    if (e.keyCode === 13) forward()
  }
}

function handleSwitches (switches, prop, def) {
  switches = Array.from(document.getElementById(switches).children)
  switches.forEach(s => {
    s.onclick = e => {
      if (e.ctrlKey) switches.forEach(t => t.classList.add('disabled'))
      s.classList.toggle('disabled')
      let sws = switches.filter(x => !x.classList.contains('disabled'))
      STATE.set(prop, sws.map(x => x.getAttribute('data-id')))
    }
  })

  if (def) {
    if (Array.isArray(def)) def.forEach(d => switches[d - 1].click())
    else switches[def - 1].click()
  }
}

function handleJumpbug (types, def) {
  types = Array.from(document.getElementById(types).children)
  types.forEach(s => {
    s.onclick = () => {
      types.forEach(s => {
        s.classList.add('disabled')
        s.tabIndex = 0
      })
      s.tabIndex = -1
      s.classList.remove('disabled')
      STATE.set('jumpbug', s.getAttribute('data-type') === 'JUMPBUG')
    }
  })
  if (def) types[def - 1].click()
}

function updateBounces () {
  LIST.uncrouched.innerHTML = ''
  LIST.crouched.innerHTML = ''

  if (STATE.height === null) return

  let bounces = getBounces(STATE.height, STATE.types, STATE.weapons, STATE.jumpbug)

  let type = null

  for (let t of Object.keys(LIST)) {
    for (let bounce of bounces[t]) {
      if (type !== bounce.type) {
        type = bounce.type
        LIST[t].appendChild(createSeparator(type))
      }
      LIST[t].appendChild(createBounceItem(bounce))
    }
    if (!LIST[t].children.length) {
      let none = document.createElement('div')
      none.className = 'none'
      none.innerText = '- No bounces found -'
      LIST[t].appendChild(none)
    }
    type = null
  }

  handleSeparators()
}

function makeCustomAngles (ang) {
  let res = bcheck.formatBounceJSON({
    ANGLES: [{
      weapon: '*',
      text: `Custom Angle (${ang})`,
      ang
    },
    {
      weapon: '*',
      crouched: true,
      text: `Custom Angle Crouched (${ang})`,
      ang
    }]
  }, BOUNCES.list.weapons)
  return res.bounces.ANGLES
}

function getBounces (height, types = [], weapons = [], jumpbug) {
  let bounces = JSON.parse(JSON.stringify(BOUNCES.bounces))
  if (OPTIONS.ang) bounces.ANGLES.unshift(...makeCustomAngles(OPTIONS.ang))

  let set = []
  for (let type in bounces) {
    if (!types.length || types.includes(type)) {
      for (let bounce of bounces[type]) {
        if (OPTIONS.hidelow && bounce.alt) continue
        if (!bounce.weapon || !weapons.length || weapons.includes(bounce.weapon)) set.push({ ...bounce, type })
      }
    }
  }

  let uncrouched = bcheck.getBounces(height, set, STATE.jumpbug ? bcheck.JUMPBUG : bcheck.UNCROUCHED, STATE.teleheight)
  let crouched = bcheck.getBounces(height, set, bcheck.CROUCHED, STATE.teleheight)
  return { uncrouched, crouched }
}

function addBounceItemTag (parent, name, content, overwrite, title) {
  if (Array.isArray(content) && !content.length) return
  if (!content) return
  let node = document.createElement('span')
  node.className = name
  if (Array.isArray(content)) node.innerHTML = `<span>${Number(content[0]).toFixed(2)}</span><span>${Number(content[1]).toFixed(2)}</span>`
  else node.innerText = overwrite || content
  if (title) node.title = title
  parent.appendChild(node)
  return node
}

function formatBounceSetup (setup) {
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

function formatBounceText (bounce) {
  return (bounce.weapon ? `(${bounce.weapon}) ` : '') +
    (bounce.text || formatBounceSetup(bounce.setup)) +
    (bounce.speedo ? ` <${bounce.speedo} u/s>` : '') +
    (bounce.ang && bounce.ang.length ? ` <${bounce.ang[0]} - ${bounce.ang[1]}>` : '') +
    (bounce.double ? ' [double]' : '')
}

function createSeparator (type) {
  type = type.toUpperCase()
  let sep = document.createElement('button')
  sep.className = 'separator'
  sep.innerText = type
  sep.setAttribute('data-type', type)
  return sep
}

function createBounceItem (bounce) {
  let item = document.createElement('div')
  item.className = 'item'

  let w = bounce.weapon
  if (w) w = w.split(' ').pop()[0]
  addBounceItemTag(item, 'weapon', bounce.weapon, w, bounce.weapon)

  let normal = addBounceItemTag(item, 'normal', bounce.text || formatBounceSetup(bounce.setup))
  normal.onclick = () => navigator.clipboard.writeText(formatBounceText(bounce))

  if (bounce.ang) addBounceItemTag(item, 'angle', bounce.ang, null, Math.abs(bounce.ang[0] - bounce.ang[1]).toFixed(2))

  let speedo = addBounceItemTag(item, 'speedo', bounce.speedo, null, bounce.chance ? bounce.chance + '%' : null)
  if (speedo) speedo.style.webkitFilter = `saturate(${Math.min(bounce.chance * 1.8, 150)}%)`

  if (!bounce.setup) addBounceItemTag(item, 'double', bounce.double, 'D', 'Double Bhop')

  return item
}

function handleSeparators () {
  let all = Array.from(document.getElementsByClassName('separator'))

  all.forEach(s => {
    s.onclick = e => {
      s.classList.toggle('pressed')
      let folded = s.classList.contains('pressed')
      let next = s
      let c = 0
      while (true) {
        next = next.nextElementSibling
        if (!next || !next.classList.contains('item')) break
        next.classList.toggle('hidden')
        c++
      }

      if (folded) s.innerText += ` (${c})`
      else s.innerText = s.innerText.substr(0, s.innerText.indexOf('('))

      if (e.isTrusted) {
        for (let t of Object.keys(LIST)) {
          let seps = Array.from(LIST[t].getElementsByClassName('separator'))
          for (let sep of seps) {
            STATE.folds[t][sep.getAttribute('data-type')] = sep.classList.contains('pressed')
          }
        }
      }
    }
  })

  for (let t of Object.keys(LIST)) {
    if (!STATE.folds[t]) STATE.folds[t] = {}
    Array.from(LIST[t].getElementsByClassName('separator')).forEach(s => {
      if (STATE.folds[t][s.getAttribute('data-type')] === true) s.click()
    })
  }
}
