import { drawBoundingBox, drawKeypoints, drawSkeleton } from './ulti.mjs'
const config = {
  debug: false
}
const minPoseConfidence = 0.1
const minPartConfidence = 0.5
const knownKeyPoints = [
  'nose',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle'
]
const knownConnect = {
  nose: undefined,
  leftShoulder: 'leftElbow',
  rightShoulder: 'rightElbow',
  leftElbow: 'leftWrist',
  rightElbow: 'rightWrist',
  leftWrist: undefined,
  rightWrist: undefined,
  leftHip: 'leftShoulder',
  rightHip: 'rightShoulder',
  leftKnee: 'leftHip',
  rightKnee: 'rightHip',
  leftAnkle: 'leftKnee',
  rightAnkle: 'rightKnee'
}
function log () {
  if (config.debug) {
    console.log('posenet', ...arguments)
  }
}
const videoSize = 640
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
const componentPrototype = {
  dependencies: ['gltf-model'],
  schema: {
    input: { type: 'selector' },
    throttleMs: { default: 1000 },
    output: {
      type: 'selector',
      default: '#output'
    }
  },
  bonesMap: {},
  net: undefined,
  throttledFunction: undefined,
  kepMap: {
    Head: 'nose',
    Shoulder: 'Shoulder',
    Arm: 'Elbow',
    Hand: 'Wrist',
    Leg: 'Hip',
    Foot: 'Knee',
    ToeBase: 'Ankle'
  },
  ctx: undefined,
  init: function () {
    console.log('input', this.data.input)
    const el = this.el

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
    outputCanvas.width = 640
    outputCanvas.height = 640
    posenet
      .load({
        architecture: 'ResNet50', // one of ['MobileNetV1','ResNet50']
        outputStride: 32,
        // multiplier: 0.75,
        inputResolution: {
          width: 640,
          height: 640
        }
        // modelUrl: './vendor/model-stride16.json',
      })
      .then(net => {
        console.log('net loaded')
        this.net = net
      })
      .catch(err => {
        console.error(err)
      })
  },
  updatePose: function () {
    const flipPoseHorizontal = true

    const video = webCamSource
    const ctx = this.ctx
    this.net
      .estimateSinglePose(video, {
        flipHorizontal: flipPoseHorizontal,
        decodingMethod: 'single-person'
      })
      .then(pose => {
        drawVideo(video, ctx)
        // For each pose (i.e. person) detected in an image, loop through the poses
        // and draw the resulting skeleton and keypoints if over certain confidence
        // scores
        // poses.forEach(({ score, keypoints }) => {
        const { score, keypoints } = pose
        const poseMap = {}
        if (score >= minPoseConfidence) {
          drawSkeleton(keypoints, minPartConfidence, ctx)
          drawKeypoints(keypoints, minPartConfidence, ctx)
          drawBoundingBox(keypoints, ctx)
          for (const keypoint of keypoints) {
            if (
              knownKeyPoints.includes(keypoint.part) &&
              keypoint.score > minPartConfidence
            ) {
              // console.log(keypoint)
              poseMap[`${keypoint.part}`] = new THREE.Vector2()
              poseMap[`${keypoint.part}`].x = keypoint.position.x
              poseMap[`${keypoint.part}`].y = keypoint.position.y
            } else {
            }
          }
          for (const posKey in poseMap) {
            const currentJoint = poseMap[posKey].clone()
            const linkJointName = knownConnect[posKey]
            if (linkJointName) {
              const mesh = this.bonesMap[`${posKey}`]
              const angle = currentJoint.sub(poseMap[linkJointName]).angle()
              if (posKey === 'leftElbow') {
                console.log('posKey', posKey, angle * THREE.Math.RAD2DEG)
              }
              mesh.rotation.set(0, 0, 0)
              mesh.rotateZ(angle)
            }
          }
          // console.log('pose', pose)
        }
      })
      .catch(console.warn)
  },
  updateBone: function (bone) {
    const modelPrefix = 'mixamorig'
    const interestWord = [
      'Head',
      'Shoulder',
      'Arm',
      'Hand',
      'Leg',
      'Foot',
      'ToeBase'
    ]
    console.log(bone.name)
    for (const word of interestWord) {
      if (bone.name.endsWith(word)) {
        const realName = this.kepMap[word]
        if (word === 'Head') {
          this.bonesMap[realName] = bone
        } else {
          const prefix = bone.name.startsWith(`${modelPrefix}Left`)
            ? 'left'
            : 'right'
          if (realName) {
            this.bonesMap[`${prefix}${realName}`] = bone
          } else {
            console.log('failed', word, realName)
          }
        }
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
    if (this.net === undefined) {
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
  console.log('register', 'posenet')
  FRAME.registerComponent('posenet', componentPrototype)
}
export { register }
