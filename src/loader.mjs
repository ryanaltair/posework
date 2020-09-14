/* global fetch */

export async function load () {
  return new Promise((resolve, reject) => {
    const divEl = document.querySelector('#aframe_inside')
    const sceneUrl = divEl.getAttribute('url')
    console.log('loading', sceneUrl)
    fetch(sceneUrl)
      .then(response => response.text())
      .then(data => {
        // console.log('show xml', data)
        divEl.innerHTML = data
        // console.log('show sceneEl', divEl)
        resolve()
      })
      .catch(reason => {
        reject(reason)
      })
  })
}
