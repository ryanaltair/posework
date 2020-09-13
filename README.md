### posework

just a poc of grab image from cam,
and preview the pose with cylinder in a-scene.

grab pose with tensorflow.js and PoseNet

have fun to visit [GH-PAGE](https://ryanaltair.github.io/posework/)
### how to run
```
npm install serve
npx serve .
```
open localhost:5000 for preview

### notes
due to posenet is only export pose position in 2D,
which means there is much works to do, to make a real 3D pose.
For example, 
turn 2D position to 3d position, 
with the help of skeleton data, especially bones, we could get unknown z axis.
and with the help of how bone are connect, calc the point rotation.

For now, posenet is still slow and not accurate enough, 
on MacBook Pro (13-inch, 2018) with 2.3 GHz quad core.
