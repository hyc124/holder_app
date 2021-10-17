import moment from 'moment'
import { message } from 'antd'

/**
 * 格式化日期
 * @param d
 * @param format 'YYYY-MM-DD H:I:S.MS'
 */
export function formatDate(date: Date = new Date(), format = 'YYYY-MM-DD H:I:S.MS') {
  const obj = {
    YYYY: fixedStringLength(date.getFullYear(), 4),
    MM: fixedStringLength(date.getMonth() + 1, 2),
    DD: fixedStringLength(date.getDate(), 2),
    H: fixedStringLength(date.getHours(), 2),
    I: fixedStringLength(date.getMinutes(), 2),
    S: fixedStringLength(date.getSeconds(), 2),
    MS: fixedStringLength(date.getMilliseconds(), 3),
  }

  return format.replace(/(YYYY|MM|DD|H|I|S|MS)/g, (_, $1) => {
    return obj[$1]
  })
}

/**
 * 固定字符串长度
 * @param n 要转换的内容
 * @param p 固定长度
 * @param r 补齐字符
 */
export function fixedStringLength(n: number | string, p?: number, r = '0'): string {
  let str = String(n)
  if (p && str.length !== p) {
    if (str.length >= p) {
      str = str.replace(new RegExp(`^(.{${p}})(.*)$`), '$1')
    } else {
      const lost = p - str.length
      if (lost > 0) {
        for (let i = 0; i < lost; i++) {
          str = r + str
        }
      }
    }
  } else {
    str = String(n)
  }

  return str
}

/** 获取 url 参数 */
export function getQuery(search: string): AnyObj {
  const query: AnyObj = {}

  search
    .substr(1)
    .split('&')
    .forEach(str => {
      const strArr = str.split('=')
      const key = strArr[0]

      if (!key) return query

      let val = decodeURIComponent(strArr[1])

      try {
        val = JSON.parse(val)
      } catch (err) {}

      query[key] = val
    })
  return query
}

/** 转换成 url search */
export function toSearch(obj: AnyObj): string {
  const arr = Object.keys(obj).map(key => {
    let val = obj[key]

    if (typeof val !== 'string') {
      try {
        val = JSON.stringify(val)
      } catch (err) {}
    }

    return `${key}=${encodeURIComponent(val)}`
  })
  return '?' + arr.join('&')
}

/***
 * 转义字符转回实体符
 * @param str
 * @returns {*}
 */
export function htmlDecodeByRegExp(str: string) {
  let s = ''
  if (!str || str.length == 0) return ''
  s = str.replace(/&amp;/g, '&')
  s = s.replace(/&lt;/g, '<')
  s = s.replace(/&gt;/g, '>')
  // s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/&quot;/g, '"')
  return s
}

export function htmlDecodeByRegExpContentHtml(str: string) {
  let s = ''
  if (!str || str.length == 0) return ''
  s = str.replace(/&amp;/g, '&')
  s = s.replace(/(?<!\\)\u003c/g, '&lt;')
  s = s.replace(/(?<!\\)\u003e/g, '&gt;')
  // s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/&quot;/g, '"')
  return s
}

/**
 * 替换指定位置字符
 */
export function replaceChat(source: string, pos: number, newChar: string, posLen: number) {
  if (pos < 0 || pos >= source.length || source.length == 0) {
    return 'invalid parameters...'
  }
  const iBeginPos = 0
  const sFrontPart = source.substr(iBeginPos, pos)
  const sTailPart = source.substr(pos + posLen, source.length)
  const sRet = sFrontPart + newChar + sTailPart
  return sRet
}

//补0操作
export function getzf(num: number) {
  let newNum = num + ''
  if (num < 10) {
    newNum = '0' + num
  }
  return newNum
}

// 光标移动到最后
export function moveEnd(obj: any) {
  if (window.getSelection) {
    //ie11 10 9 ff safari
    obj.focus() //解决ff不获取焦点无法定位问题
    const range = window.getSelection() //创建range
    if (range) {
      range.selectAllChildren(obj) //range 选择obj下所有子内容
      range.collapseToEnd() //光标移至最后
    }
  }
}

//格式化时间
export function getMyDate(str?: string | number | Date, flag?: any, hasSec?: boolean) {
  const flags = flag ? flag : '/'
  const oDate = str ? new Date(str) : new Date()
  const oYear = oDate.getFullYear()
  const oMonth = oDate.getMonth() + 1
  const oDay = oDate.getDate()
  const oHour = oDate.getHours()
  const oMin = oDate.getMinutes()
  const oSec = oDate.getSeconds()
  let oTime =
    oYear +
    flags +
    $tools.getzf(oMonth) +
    flags +
    $tools.getzf(oDay) +
    ' ' +
    $tools.getzf(oHour) +
    ':' +
    $tools.getzf(oMin) //最后拼接时间
  if (hasSec) {
    oTime += ':' + $tools.getzf(oSec)
  }
  return oTime
}

/**
 * 对象判空
 * @param obj
 */
export function isEmptyObject(obj: any) {
  for (const name in obj) {
    return false
  }
  return true
}

/**
 * 是否是json字符串
 */
export function isJsonString(str: string) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

/***
 * 将时间戳转换为时分
 * @param d 时间戳
 * @returns {string}
 */
export function formatDateToHourMinute(d: string | number | Date) {
  const now = new Date(d)
  let hour: string | number = now.getHours()
  let minute: string | number = now.getMinutes()
  hour = hour < 10 ? '0' + hour : hour
  minute = minute < 10 ? '0' + minute : minute
  return hour + ':' + minute
}

/**
 * 根据fileKey和dir获取图片地址
 */
export const getUrlByKey = async (key: string, dir: string) => {
  return new Promise<string>(resolve => {
    const { loginToken } = $store.getState()
    const param = {
      dir: dir,
      fileName: key,
    }
    $mainApi
      .request('/tools/oss/get/url', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then((resData: any) => {
        resolve(resData.data)
      })
  })
}

//获取等待时间
export const getWaitTime = (item: any, receiveTime?: any) => {
  if (!item) {
    return ''
  }
  if (receiveTime) {
    if (new Date(receiveTime) > new Date()) {
      return ''
    }
  }
  if (item.day === 0 && item.hour === 0 && item.minute === 0) {
    return '刚刚'
  } else if (item.day === 0 && item.hour === 0 && item.minute !== 0) {
    return `已等待${item.minute}分钟`
  } else if (item.day === 0 && item.hour !== 0 && item.minute !== 0) {
    return `已等待${item.hour}小时${item.minute}分钟`
  } else {
    return `已等待${item.day}天`
  }
}

//通用时间处理，展示为刚刚 x分钟前  x小时前  昨天  月/日  年/月/日
export const handleTimeToUse = (timeStr: string) => {
  const timeLocalString = new Date(timeStr)
  const timeReducer = new Date().getTime() - timeLocalString.getTime()
  const nowYear = new Date().getFullYear()
  const timeYear = timeLocalString.getFullYear()
  const timeMonth = timeLocalString.getMonth() + 1
  const timeDay = timeLocalString.getDate()
  if (timeReducer < 60 * 1000) {
    //小于一分钟
    return '刚刚'
  } else if (timeReducer < 60 * 60 * 1000) {
    //小于一小时
    return `${parseInt((timeReducer / 60000).toString())}分钟前`
  } else if (timeReducer < 24 * 60 * 60 * 1000) {
    //小于一天
    return `${parseInt((timeReducer / 3600000).toString())}小时前`
  } else if (timeReducer < 48 * 60 * 60 * 1000) {
    //小于两天
    return '昨天'
  } else if (nowYear === timeYear) {
    //今年
    return `${timeMonth < 10 ? '0' + timeMonth : timeMonth}/${timeDay < 10 ? '0' + timeDay : timeDay}`
  } else {
    return `${timeYear}/${timeMonth < 10 ? '0' + timeMonth : timeMonth}/${
      timeDay < 10 ? '0' + timeDay : timeDay
    }`
  }
}

//计算等待时间
export const waitingTime = (timeStr: string | number) => {
  if (!timeStr) return
  const hours = moment().diff(timeStr, 'hours')
  if (!hours) {
    // 不足一小时展示分钟
    return `${moment().diff(timeStr, 'minutes')}分钟`
  } else if (hours > 0 && hours < 24) {
    // 1小时以上，不足24小时，展示**小时**分钟
    const hours = moment().diff(timeStr, 'minute')
    const h = Math.floor(hours / 60)
    const m = hours % 60
    return `${h}小时${m}分钟`
  } else {
    //一天以上展示天
    return `${moment().diff(timeStr, 'days')}天`
  }
}

//转换金额大写
export const ArabiaToChinese = (Num: number) => {
  // console.log(Num)
  if (isNaN(Num)) {
    //验证输入的字符是否为数字
    message.error('请检查小写金额是否正确')
    return ''
  }
  //---字符处理完毕，开始转换，转换采用前后两部分分别转换---//
  const part = String(Num).split('.')
  let newchar = ''
  //小数点前进行转化
  for (let i = part[0].length - 1; i >= 0; i--) {
    if (part[0].length > 10) {
      message.error('位数过大，无法计算')
      return ''
    } //若数量超过拾亿单位，提示
    let tmpnewchar = ''
    const perchar = part[0].charAt(i)
    console.log(perchar)
    switch (perchar) {
      case '0':
        tmpnewchar = '零' + tmpnewchar
        break
      case '1':
        tmpnewchar = '壹' + tmpnewchar
        break
      case '2':
        tmpnewchar = '贰' + tmpnewchar
        break
      case '3':
        tmpnewchar = '叁' + tmpnewchar
        break
      case '4':
        tmpnewchar = '肆' + tmpnewchar
        break
      case '5':
        tmpnewchar = '伍' + tmpnewchar
        break
      case '6':
        tmpnewchar = '陆' + tmpnewchar
        break
      case '7':
        tmpnewchar = '柒' + tmpnewchar
        break
      case '8':
        tmpnewchar = '捌' + tmpnewchar
        break
      case '9':
        tmpnewchar = '玖' + tmpnewchar
        break
      case '-':
        tmpnewchar = '负' + tmpnewchar
        break
    }

    switch (part[0].charAt(i) !== '-' && part[0].length - i - 1) {
      case 0:
        tmpnewchar = tmpnewchar + '元'
        break
      case 1:
        if (parseInt(perchar) != 0) tmpnewchar = tmpnewchar + '拾'
        break
      case 2:
        if (parseInt(perchar) != 0) tmpnewchar = tmpnewchar + '佰'
        break
      case 3:
        if (parseInt(perchar) != 0) tmpnewchar = tmpnewchar + '仟'
        break
      case 4:
        tmpnewchar = tmpnewchar + '万'
        break
      case 5:
        if (parseInt(perchar) != 0) tmpnewchar = tmpnewchar + '拾'
        break
      case 6:
        if (parseInt(perchar) != 0) tmpnewchar = tmpnewchar + '佰'
        break
      case 7:
        if (parseInt(perchar) != 0) tmpnewchar = tmpnewchar + '仟'
        break
      case 8:
        tmpnewchar = tmpnewchar + '亿'
        break
      case 9:
        tmpnewchar = tmpnewchar + '拾'
        break
    }
    newchar = tmpnewchar + newchar
  }
  //小数点之后进行转化
  if (String(Num).indexOf('.') != -1) {
    if (part[1].length > 2) {
      part[1] = part[1].substr(0, 2)
    }
    for (let i = 0; i < part[1].length; i++) {
      let tmpnewchar = ''
      const perchar = part[1].charAt(i)
      switch (perchar) {
        case '0':
          tmpnewchar = '零' + tmpnewchar
          break
        case '1':
          tmpnewchar = '壹' + tmpnewchar
          break
        case '2':
          tmpnewchar = '贰' + tmpnewchar
          break
        case '3':
          tmpnewchar = '叁' + tmpnewchar
          break
        case '4':
          tmpnewchar = '肆' + tmpnewchar
          break
        case '5':
          tmpnewchar = '伍' + tmpnewchar
          break
        case '6':
          tmpnewchar = '陆' + tmpnewchar
          break
        case '7':
          tmpnewchar = '柒' + tmpnewchar
          break
        case '8':
          tmpnewchar = '捌' + tmpnewchar
          break
        case '9':
          tmpnewchar = '玖' + tmpnewchar
          break
      }
      if (i == 0) tmpnewchar = '零' + tmpnewchar + '角'
      if (i == 1) tmpnewchar = tmpnewchar + '分'
      newchar = newchar + tmpnewchar
    }
  }

  console.log('newcharnewchar', newchar)

  //替换所有无用汉字
  while (newchar.search('零零') != -1) newchar = newchar.replace('零零', '零')
  newchar = newchar.replace('零亿', '亿')
  newchar = newchar.replace('亿万', '亿')
  newchar = newchar.replace('零万', '万')
  // newchar = newchar.replace('零元', '元')
  newchar = newchar.replace('零角', '')
  newchar = newchar.replace('零分', '')

  if (newchar.charAt(newchar.length - 1) == '元') newchar = newchar + '整'
  return newchar
}
/**
 * 战术防抖
 * @param callBack
 * @param t
 */
export const debounce = (callBack: any, t: number) => {
  const time = Date.now()
  setTimeout(() => {
    if (Date.now() - time >= t) {
      callBack
    }
  }, t)
}

/**
 * 节流处理
 */
export function throttle(fn: any, delay = 3000) {
  let preTime = Date.now()

  return function(this: any, event: { persist: () => any }) {
    event.persist && event.persist() //保留事件引用
    const doTime = Date.now()
    if (doTime - preTime >= delay) {
      fn.apply(this)
      preTime = Date.now()
    }
  }
}
/**
 * 字符串值再指定字符串中第n次出现的位置
 */
export function findstr(str: any, cha: any, num: number) {
  //find(str,'o',1)找o第二次出现的位置
  //字符串 要匹配的字符 第几次出现
  let x = str.indexOf(cha)
  for (let i = 0; i < num; i++) {
    if (str.indexOf(cha, x + 1) != -1) {
      x = str.indexOf(cha, x + 1)
    }
  }
  return x
}

export function isInArray(arr: any[], val: any) {
  let isIn = false
  $.each(arr, (i, item) => {
    if (item == val) {
      isIn = true
      return
    }
  })
  return isIn
}

export function isInArr(arr: any[], val: any) {
  let isIn = false
  $.each(arr, (i, item) => {
    if (item.userId == val) {
      isIn = true
      return
    }
  })
  return isIn
}

export const toFixedTool = (data: any, len: number) => {
  let hasminus = false
  const dataStr = data.toString()
  if (dataStr.indexOf('-') != -1) {
    hasminus = true
  }
  const rm = hasminus ? dataStr.replace(/-/g, '') : dataStr
  const number = Number(rm)
  if (isNaN(number) || number >= Math.pow(10, 21)) {
    const _rn = !hasminus ? number.toString() : `-${number.toString()}`
    return _rn
  }
  if (typeof len === 'undefined' || len === 0) {
    const _rnm = !hasminus ? Math.round(number).toString() : `-${Math.round(number).toString()}`
    return _rnm
  }
  let result = number.toString()
  const numberArr = result.split('.')

  if (numberArr.length < 2) {
    // 整数的情况
    const _r = !hasminus ? padNum(result) : `-${padNum(result)}`
    return _r
  }
  const intNum = numberArr[0] // 整数部分
  const deciNum = numberArr[1] // 小数部分
  const lastNum = deciNum.substr(len, 1) // 最后一个数字

  if (deciNum.length === len) {
    // 需要截取的长度等于当前长度
    return !hasminus ? result : `-${result}`
  }
  if (deciNum.length < len) {
    // 需要截取的长度大于当前长度 1.3.toFixed(2)
    const r = !hasminus ? padNum(result) : `-${padNum(result)}`
    return r
  }
  // 需要截取的长度小于当前长度，需要判断最后一位数字
  result = `${intNum}.${deciNum.substr(0, len)}`
  if (parseInt(lastNum, 10) >= 5) {
    // 最后一位数字大于5，要进位
    const times = Math.pow(10, len) // 需要放大的倍数
    let changedInt = Number(result.replace('.', '')) // 截取后转为整数 2 3  2.000    2.45  3  2.450
    changedInt++ // 整数进位
    changedInt /= times // 整数转为小数，注：有可能还是整数
    result = padNum(`${changedInt}`)
  }
  return !hasminus ? result : `-${result}`
  // 对数字末尾加0
  function padNum(num: any) {
    let newNum: any = num
    const dotPos = num.indexOf('.')
    if (dotPos === -1) {
      // 整数的情况
      newNum += '.'
      for (let i = 0; i < len; i++) {
        newNum += '0'
      }
      return newNum
    } else {
      // 小数的情况
      const need = len - (newNum.length - dotPos - 1)
      for (let j = 0; j < need; j++) {
        newNum += '0'
      }
      return newNum
    }
  }
}
