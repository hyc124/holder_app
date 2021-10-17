import intl from 'react-intl-universal'
declare global {
  const $intl: typeof intl
  namespace NodeJS {
    interface Global {
      __$intl: typeof $intl
    }
  }
}
