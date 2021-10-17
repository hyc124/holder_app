import React from 'react'
import reactDom from 'react-dom'
import { ipcRenderer } from 'electron'
import '@/src/styles/index.less'
import { initRenderer } from '@/core/renderer.init'
import App from './app'

initRenderer()

ipcRenderer.on('dom-ready', (_, createConfig) => {
  reactDom.render(<App createConfig={createConfig} />, document.getElementById('app'))
})
