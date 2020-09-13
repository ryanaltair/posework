/* eslint-env browser */
/* global posenet */
import { setupCamera } from './camera.mjs'
// import {drawBoundingBox, drawKeypoints, drawSkeleton, isMobile, toggleLoadingUI, tryResNetButtonName, tryResNetButtonText, updateTryResNetButtonDatGuiCss} from './demo_util';

import { drawBoundingBox, drawKeypoints, drawSkeleton } from './ulti.mjs'
const videoSize = 640

const logger = document.querySelector('#info')
function log () {
  logger.innerHTML = [...arguments]
}
async function loadVideo () {
  const video = await setupCamera({
    videoWidth: videoSize,
    videoHeight: videoSize
  })
  video.play()

  return video
}
function buildCanvas () {
  const canvas = document.getElementById('output')
  const ctx = canvas.getContext('2d')

  canvas.width = videoSize
  canvas.height = videoSize
  return ctx
}
function drawVideo (video, ctx) {
  ctx.clearRect(0, 0, videoSize, videoSize)
  if (1) {
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-videoSize, 0)
    ctx.drawImage(video, 0, 0, videoSize, videoSize)
    ctx.restore()
  }
}
function updateEntity (keypoints) {
  const ids = [
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
  // const table = []
  const scale = 0.01
  for (const keypoint of keypoints) {
    if (ids.includes(keypoint.part)) {
      document.querySelector(`#${keypoint.part}`).object3D.position.x =
        keypoint.position.x * scale
      document.querySelector(`#${keypoint.part}`).object3D.position.y =
        -1 * keypoint.position.y * scale + 4
      document.querySelector(`#${keypoint.part}`).object3D.position.z = -5
      // table.push(
      //   `${keypoint.part} x:${keypoint.position.x}  y:${keypoint.position.y} /r`
      // )
      // console.log(...table)
    } else {
      // console.log('not match', keypoint)
    }
  }
}
function detectPoseInRealTime (video, net, ctx) {
  // since images are being fed from a webcam, we want to feed in the
  // original image and then just flip the keypoints' x coordinates. If instead
  // we flip the image, then correcting left-right keypoint pairs requires a
  // permutation on all the keypoints.
  const flipPoseHorizontal = true
  let lastMs = Date.now()
  async function poseDetectionFrame () {
    // Begin monitoring code for frames per second
    log('frame time', Date.now() - lastMs)
    lastMs = Date.now()
    const minPoseConfidence = 0.1
    const minPartConfidence = 0.5

    const pose = await net.estimateSinglePose(video, {
      flipHorizontal: flipPoseHorizontal,
      decodingMethod: 'single-person'
    })
    drawVideo(video, ctx)
    // For each pose (i.e. person) detected in an image, loop through the poses
    // and draw the resulting skeleton and keypoints if over certain confidence
    // scores
    // poses.forEach(({ score, keypoints }) => {
    const { score, keypoints } = pose
    if (score >= minPoseConfidence) {
      updateEntity(keypoints)
      // if (guiState.output.showPoints) {
      drawKeypoints(keypoints, minPartConfidence, ctx)
      // }
      // if (guiState.output.showSkeleton) {
      drawSkeleton(keypoints, minPartConfidence, ctx)
      // }
      // if (guiState.output.showBoundingBox) {
      drawBoundingBox(keypoints, ctx)
      // }
    }

    requestAnimationFrame(poseDetectionFrame)
  }

  poseDetectionFrame()
}

async function bindPage () {
  const video = await loadVideo()
  const ctx = buildCanvas()
  console.log('loading net')
  const net = await posenet
    .load({
      architecture: 'ResNet50', // one of ['MobileNetV1','ResNet50']
      outputStride: 16,
      inputResolution: { width: videoSize, height: videoSize }
      // modelUrl: './vendor/model-stride16.json',
      // multiplier: 0.75
    })
    .catch(err => {
      console.error(err)
    })
  window.netUsing = net
  console.log('loading net done', net)
  //   setupGui([], net)
  //   setupFPS()
  detectPoseInRealTime(video, net, ctx)
}
bindPage()
