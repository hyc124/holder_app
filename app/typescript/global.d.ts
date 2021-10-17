interface AnyObj {
  /* eslint-disable */
  [key: string]: any
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'none'
    BUILD_ENV?: 'dev' | 'prod' | ''

    /** API 协议 */
    API_PROTOCOL: string
    /** API 域名 */
    API_HOST: string
    /** API 根路径 */
    API_BASE_PATH: string
  }
}

declare const nodeRequire: NodeRequire
declare module 'draft-js-mention-plugin'
declare module 'jsmind'
declare module 'react-raphael'
declare module 'diff'
declare module 'react-summernote'
declare module 'react-cropper'
declare module 'jspdf'
declare module 'html-to-react'
declare module 'react-electron-web-view'
declare module 'adm-zip'
declare module 'socket.io-client'
declare module 'electron-tiny-updater'
declare module 'react-pdf'
declare module 'echarts/lib/echarts'
