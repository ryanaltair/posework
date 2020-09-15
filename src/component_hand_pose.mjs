const config = {
  debug: false
}
const minPoseConfidence = 0.1
const minPartConfidence = 0.5
const flipHorizontal = false
const backendType = 'webgl'
const disableEstimate = false
function log () {
  if (config.debug) {
    console.log('hand_pose', ...arguments)
  }
}
const videoSize = 400
function drawVideo (video, ctx) {
  // console.log(ctx)
  ctx.clearRect(0, 0, videoSize, videoSize)
  if (1) {
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-videoSize, 0)
    ctx.drawImage(video, 0, 0, videoSize, videoSize)
    ctx.restore()
  }
}
function buildBone (id, length = 0.8, radius = 0.3) {
  const mesh = document.createElement('a-cylinder')
  const innerMesh = document.createElement('a-cylinder')
  mesh.append(innerMesh)
  mesh.id = id
  mesh.setAttribute('height', length / 4)
  mesh.setAttribute('radius', radius)
  mesh.setAttribute('position', { y: length / 2 })
  innerMesh.setAttribute('position', { z: length / 2 })
  innerMesh.setAttribute('rotation', { x: -90 })
  innerMesh.setAttribute('height', length)
  innerMesh.setAttribute('radius', radius)
  innerMesh.setAttribute('color', 'red')
  return mesh
}
const fingerNames = [
  'indexFinger',
  'middleFinger',
  'pinky',
  'ringFinger',
  'thumb'
]
const selectCache = {}
function cacheSelect (selector) {
  if (selectCache[selector]) {
    return selectCache[selector]
  }
  selectCache[selector] = document.querySelector(selector)
  return selectCache[selector]
}
function updateBallPos (annotations) {
  const scale = 0.03
  const palmBasePos = new THREE.Vector3().fromArray(annotations.palmBase[0])
  // console.log(annotations.palmBase, palmBasePos)
  cacheSelect('#palmBase').object3D.position.set(
    palmBasePos.x * scale,
    -palmBasePos.y * scale,
    palmBasePos.z * scale
  )
  for (const fingerName of fingerNames) {
    const posArray = annotations[fingerName]
    for (const index of [0, 1, 2, 3]) {
      const pos = new THREE.Vector3().fromArray(posArray[index])
      const selector = `#${fingerName}${index}`
      const selectorLast =
        index > 0 ? `#${fingerName}${index - 1}` : '#palmBase'
      // console.log(selector)
      cacheSelect(selector).object3D.position.set(
        pos.x * scale,
        -pos.y * scale,
        pos.z * scale
      )
      const lastFinger = cacheSelect(selectorLast).object3D
      cacheSelect(selector).object3D.lookAt(lastFinger.position)
    }
  }
}
function buildHandBalls () {
  const ballName = {
    indexFinger: -2,
    middleFinger: 0,
    pinky: 2,
    ringFinger: 4,
    thumb: 6
  }
  const hand = buildBone('handInside')
  const palmBase = buildBone('palmBase')
  hand.append(palmBase)
  for (const key in ballName) {
    const bone0 = buildBone(key + '0', 2.4)
    const bone1 = buildBone(key + '1', 1.2)
    const bone2 = buildBone(key + '2', 0.8)
    const bone3 = buildBone(key + '3', 0.8)
    console.log(bone1, bone2, bone3, bone0)
    // bone1.setAttribute('position', { x: ballName[key] })
    hand.append(bone0)
    hand.append(bone1)
    hand.append(bone2)
    hand.append(bone3)
    // bone0.setAttribute('bind', key + '1')
    // bone1.setAttribute('bind', key + '2')
    // bone2.setAttribute('bind', key + '3')
  }
  return hand
}

const componentPrototype = {
  dependencies: ['gltf-model'],
  schema: {
    input: { type: 'selector' },
    throttleMs: { default: 300 },
    output: {
      type: 'selector',
      default: '#output'
    }
  },
  bonesMap: {},
  net: undefined,
  throttledFunction: undefined,
  ctx: undefined,
  init: function () {
    console.log('input', this.data.input)
    const el = this.el
    const balls = document.querySelector('#handBallsPos')
    console.log('balls', balls)
    balls.append(buildHandBalls())
    window.bonesMap = this.bonesMap
    this.el.addEventListener('model-loaded', e => {
      console.log(e.detail.model)
      this.model = el.getObject3D('mesh')
      window.test = this.model
      this.model.traverse(object3D => {
        if (object3D.type === 'Bone') {
          this.updateBone(object3D)
        }
      })
    })
    // console.log('loading posenet', posenet)
    const outputCanvas = this.data.output
    const ctx = outputCanvas.getContext('2d')
    this.ctx = ctx
    outputCanvas.width = videoSize
    outputCanvas.height = videoSize

    tf.setBackend(backendType).then(() => {
      handpose
        .load({})
        .then(net => {
          console.log('net loaded')
          this.net = net
        })
        .catch(err => {
          console.error(err)
        })
    })
  },
  updatePose: function () {
    const video = webCamSource
    const ctx = this.ctx
    this.net
      .estimateHands(video, flipHorizontal)
      .then(poses => {
        // drawVideo(video, ctx)
        const pose = poses[0]
        if (pose) {
          // console.log('pose', pose)
          const { annotations } = pose
          updateBallPos(annotations)
        }
      })
      .catch(console.warn)
  },
  updateBone: function (bone) {
    const modelPrefix = 'mixamorig'
    const modelHandPrefix = 'LeftHand'
    // (1) index finger 食指
    // (2) middle finger 中指
    // (3) ring finger 無名指
    // (4) little finger 小指
    // (5) thumb 大拇指
    const interestWord = [
      'Thumb', // 拇指
      'Index', // 食指
      'Middle', // 中指
      'Ring', // 無名指
      'Pinky', // 小指
      '' // 手掌
    ]
    console.log(bone.name)
    for (const word of interestWord) {
      if (bone.name.startsWith(`${modelPrefix}${modelHandPrefix}${word}`)) {
        const realName = bone.name.substr(modelPrefix.length)

        this.bonesMap[realName] = bone
      }
    }
    this.throttledFunction = AFRAME.utils.throttle(
      this.updatePose,
      this.data.throttleMs,
      this
    )
  },
  pause: function () {},

  play: function () {},

  update: function (oldData) {},

  tick: function () {
    if (this.net === undefined || disableEstimate) {
      return
    }
    this.throttledFunction()
  },

  remove: function () {
    if (this.videoEl) {
      this.videoEl.remove()
    }
  }
}
// const componentSchema = componentPrototype.schema
async function register (FRAME) {
  console.log('register', 'hand_pose')
  FRAME.registerComponent('hand_pose', componentPrototype)
}
export { register }
