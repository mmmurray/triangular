import { createApp } from './app'

const start = () => {
  const root = document.getElementById('root')

  if (!root) {
    throw new Error('Failed to get root element')
  }

  const rootRect = root.getBoundingClientRect()
  const canvas = document.createElement('canvas')
  canvas.width = rootRect.width
  canvas.height = rootRect.height

  root.appendChild(canvas)

  const context = canvas.getContext('webgl', {
    antialias: true,
  })

  if (!context) {
    throw new Error('Failed to create canvas context')
  }

  const app = createApp(canvas, context)

  app.run()
}

start()
