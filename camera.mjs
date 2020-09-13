function isAndroid () {
  return /Android/i.test(navigator.userAgent)
}

function isiOS () {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isMobile () {
  return isAndroid() || isiOS()
}
/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera (config) {
  const { videoWidth, videoHeight } = config
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available'
    )
  }

  const video = document.getElementById('video')
  video.width = videoWidth
  video.height = videoHeight

  const mobile = isMobile()
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight
    }
  })
  video.srcObject = stream

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video)
    }
  })
}

export { setupCamera }
