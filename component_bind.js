const componentPrototype = {
  schema: {
    type: 'selector'
  },
  update: function () {
    console.log('this', this.data.object3D.position)
  },
  tick: function () {
    const target = this.data
    const targetPos = target.object3D.position
    this.el.object3D.lookAt(targetPos.x, targetPos.y, targetPos.z)
  }
}
AFRAME.registerComponent('bind', componentPrototype)
