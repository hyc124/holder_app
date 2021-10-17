import enUS from '@/src/common/locales/en_US.json'
import zhCN from '@/src/common/locales/zh_CN.json'
/**
 * 获取语言版本或设置语言
 * isDef：设置为默认值
 * @param param0
 */
export const langTypeHandle = ({ type, value }: any): any => {
  if (type == 1) {
    //设置
    localStorage.langType = value || 'zhCN'
    // setCookie('langType', value)
    $store.dispatch({
      type: 'LANGTYPE',
      data: {
        langType: value,
      },
    })
    return value
  } else {
    // zhCN enUS
    // const lanType = getCookie('langType') ||'zhCN'
    let lanType = localStorage.langType || 'zhCN'
    if (!lanType) {
      lanType = 'zhCN'
    }
    return lanType
  }
}

/**
 * 加载语言
 */
export const loadLocales = () => {
  return new Promise(resolve => {
    const locLang = langTypeHandle({ type: 0 })
    const locales = {
      enUS: enUS, //英文
      zhCN: zhCN, //中文
    }
    $intl
      .init({
        currentLocale: locLang,
        locales,
      })
      .then(() => {
        resolve(true)
      })
  })
}
