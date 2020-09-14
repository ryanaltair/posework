const config = {
  debug: false
}
function log () {
  if (config.debug) {
    console.log('webcam', ...arguments)
  }
}
function isAndroid () {
  return /Android/i.test(navigator.userAgent)
}

function isiOS () {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isMobile () {
  return isAndroid() || isiOS()
}
const componentPrototype = {
  dependencies: ['geometry', 'material'],
  schema: {
    width: { default: 640 },
    height: { default: 640 }
  },
  videoEl: undefined,
  init: function () {
    console.log('init webcam', this.el)
    const videoEl = document.createElement('video')
    this.videoEl = videoEl
    videoEl.id = 'webcamInput'
    const assetsEl = document.querySelector('a-assets')
    assetsEl.append(videoEl)
    videoEl.width = this.data.width
    videoEl.height = this.data.height
    window.webCamSource = videoEl
    const mobile = isMobile()
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: mobile ? undefined : this.data.width,
          height: mobile ? undefined : this.data.width
        }
      })
      .then(stream => {
        console.log('stream', stream)
        videoEl.srcObject = stream
      })
    const el = this.el

    videoEl.onloadedmetadata = () => {
      videoEl.play()
      el.emit('model-loaded', { el: videoEl })
      console.log('web cam loaded', videoEl)
      console.log('web cam loaded', el)
      el.setAttribute('geometry', {
        primitive: 'plane',
        height: 4,
        width: 4
      })
      el.setAttribute('material', {
        color: '#FFF',
        shader: 'flat',
        side: 'double',
        // src: '#webcamInput',
        transparent: true
      })
      el.setAttribute('material', {
        src: '#webcamInput'
      })
    }
  },

  pause: function () {},

  play: function () {},

  update: function (oldData) {},

  tick: function () {},

  remove: function () {
    if (this.videoEl) {
      this.videoEl.remove()
    }
  }
}
// const componentSchema = componentPrototype.schema
async function register (FRAME) {
  console.log('register', 'webcam')
  FRAME.registerComponent('webcam', componentPrototype)
}
export { register }
