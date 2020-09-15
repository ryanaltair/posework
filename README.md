### posework

just a poc of grab image from cam,
and preview the pose with cylinder in a-scene.

grab pose with tensorflow.js and PoseNet

have fun to visit [GH-PAGE](https://ryanaltair.github.io/posework/)
> make sure GCP is available. 
### how to run
```
npm install serve
npx serve .
```
open localhost:5000 for preview

### notes
due to poseNet is only export pose position in 2D,calls keyPoints.

which means there is much works to do, to make a real 3D pose.

For example

turn 2D keypoint to 3d joint:

grasp skeleton data, especially bones

we could get unknown z axis, 

comparing the distance of related keyPoints in 2d to real bone length,

we could get bone rotation.

but due to the accurate, it's a real challenge.

#### update 2020-9-15
that will be cool to use rotation rather than position

calc the point joints rotation

and map it to bot skeleton.

have to figure out how to get joints' rotation in right way.

### poseNet settings 
using ResNet50
video: 640*640
outputStride: 16

> For now, poseNet is still slow and not accurate enough, 
> on MacBook Pro (13-inch, 2018) with 2.3 GHz quad core.

### refer

xbot model from https://github.com/mrdoob/three.js/blob/master/examples/models/gltf/Xbot.glb
soldier model from https://github.com/mrdoob/three.js/blob/master/examples/models/gltf/Soldier.glb