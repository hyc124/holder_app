/**
 * 公用方法
 */

/**
 * 判断是否已经存在对象，查找目标元素，找到就返回该元素，找不到返回undefined
 * @param list
 * @param keyName
 * @param findVal
 */
export const findRepeat = (param: { list: any; keyName: string; keyVal: any }) => {
  const findObj: any = param.list.find((v: any) => {
    return v[param.keyName] == param.keyVal
  })
  return findObj
}
// 判断是否已经存在对象，查找目标元素，找到就返回元素的位置，找不到就返回-1
export const findRepeatIndex = (param: { list: any; keyName: string; keyVal: any }): number => {
  const ret: number = param.list.findIndex((v: any) => {
    return v[param.keyName] == param.keyVal
  })
  return ret
}

/**
 * 名字截取
 * name：名字字符串
 * len：截取长度
 * direction：0从左向右截取 -1右向左
 */
export const cutName = (name: string, len: number, direction: number) => {
  let newName = name
  if (name.length > len) {
    if (direction == 0) {
      newName = name.slice(0, len)
    } else {
      newName = name.slice(-len)
    }
  }
  return newName
}

//比较出2个数组中不一样的元素
export const diffArray = (arr1: any, arr2: any) => {
  const arr3: any = []
  for (let i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) === -1) arr3.push(arr1[i])
  }
  for (let j = 0; j < arr2.length; j++) {
    if (arr1.indexOf(arr2[j]) === -1) arr3.push(arr2[j])
  }
  return arr3
}
/**
 * 日期格式转换
 * @param {定义日期格式} format
 * @param {时间戳} getDate
 */
export const dateFormats = (getFormat: any, getDate?: any) => {
  let date: any = getDate,
    format: any = getFormat
  if (!getDate) {
    date = new Date()
  } else {
    date = new Date(date)
  }
  const Week = ['日', '一', '二', '三', '四', '五', '六']
  const o = {
    'y+': date.getYear(), //year
    'M+': date.getMonth() + 1, //month
    'd+': date.getDate(), //day
    'h+': date.getHours(), //hour
    'H+': date.getHours(), //hour
    'm+': date.getMinutes(), //minute
    's+': date.getSeconds(), //second
    'q+': Math.floor((date.getMonth() + 3) / 3), //quarter
    S: date.getMilliseconds(), //millisecond
    w: Week[date.getDay()],
  }
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return format
}

/**
 * 比较两个数组不同的元素（arr1比arr2多的元素）
 * @param {*} arr1
 * @param {*} arr2
 * json：对象数组
 * keyName：对象数组时比较某个键名为keyName的
 */
export const differArr = ({
  arr1,
  arr2,
  json,
  keyName,
}: {
  arr1: any
  arr2: any
  json?: boolean
  keyName: string
}) => {
  const a: any = []
  const b: any = []

  for (let i = 0; i < arr2.length; i++) {
    if (json) {
      a[arr2[i][keyName]] = true
    } else {
      a[arr2[i]] = true
    }
  }
  for (let i = 0; i < arr1.length; i++) {
    if (json) {
      if (!a[arr1[i][keyName]] && arr1[i][keyName] != null) {
        b.push(arr1[i])
      }
    } else {
      if (!a[arr1[i]] && arr1[i] != null) {
        b.push(arr1[i])
      }
    }
  }
  return b
}

//取出两个数组的不同元素
export const getArrDifference = function(arr1: any, arr2: any) {
  return arr1.concat(arr2).filter(function(v: any, arr: any) {
    if (arr) {
      return arr.indexOf(v) === arr.lastIndexOf(v)
    } else {
      return ''
    }
  })
}

/**
 * 比较两个字符串不同的字符
 */
export const differStr = (str1: string, str2: string) => {
  const re = new RegExp('(?=.*?)[^' + str1 + '](?=.*?)|(?=.*?)[^' + str2 + '](?=.*?)', 'g')
  let execChar: any
  let resArr: any = ''
  while ((execChar = re.exec(str1 + str2)) != null) {
    resArr += execChar
  }
  return resArr
}
/**
 * 根据某个键名对数组对象去重
 */
export const arrObjDuplicate = (arr: any[], keyName: string) => {
  if (arr.length == 0) return []
  const newArr = arr.reduce(
    (prev: any, cur: any) => (prev.some((item: any) => item[keyName] == cur[keyName]) ? prev : [...prev, cur]),
    []
  )
  return newArr
}

//判断图片是否存在
export const isImgUrl = (imgUrl: string) => {
  return new Promise(function(resolve) {
    const ImgObj = new Image() //判断图片是否存在
    ImgObj.src = imgUrl
    ImgObj.onload = function(res) {
      resolve(res)
    }
    ImgObj.onerror = function(err) {
      resolve(false)
    }
  }).catch(() => {})
}
//获取图片宽高
export const getImgSize = (imgUrl: string) => {
  return new Promise(function(resolve) {
    const ImgObj = new Image() //判断图片是否存在
    ImgObj.src = imgUrl
    ImgObj.onload = function() {
      const size = { width: ImgObj.width, height: ImgObj.height }
      resolve(size)
    }
  }).catch(() => {
    console.log('为获取到图片')
  })
}

/**
 * 移动光标到末尾
 * @param obj
 */
export const setCaretEnd = (obj: any) => {
  const doc: any = document
  $(obj).focus()
  //ie11 10 9 ff safari
  if (window.getSelection) {
    const range: any = window.getSelection() //创建range
    range.selectAllChildren($(obj)[0]) //range 选择obj下所有子内容
    range.collapseToEnd() //光标移至最后
  } else if (doc.selection) {
    const range: any = doc.selection.createRange() //创建选择对象
    range.moveToElementText($(obj)[0]) //range定位到obj
    range.collapse(false) //光标移至最后
    range.select()
  }
}

/**
 * 设置非输入框类型的可编辑节点（如div） 全选或移动光标到指定位置
 * @param obj
 * type:默认移动光标到指定位置（不传则移动到末尾） select:选中效果
 */
export const setNodeCaretPos = (paramObj: {
  node: any
  len?: number
  type?: string
  startPos?: number
  endPos?: number
}) => {
  const { type, node, len, startPos, endPos } = paramObj
  const length = len ? len : node[0].textContent.length
  // 选区开始结束位置
  const startOffset = startPos ? startPos : 0
  const endOffset = endPos ? endPos : length
  const doc: any = document
  const win: any = window
  $(node).focus()
  //ie11 10 9 ff safari
  if (win.getSelection) {
    const selection = win.getSelection()
    const range = selection.getRangeAt(0)
    range.setStart(node[0].lastChild, startOffset)
    range.setEnd(node[0].lastChild, endOffset)
    // 全选效果
    if (type == 'select') {
      return
    }
    // 收起选中效果重新定位光标
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  } else if (doc.selection) {
    const range: any = doc.selection.createRange() //创建选择对象
    range.select()
    if (type != 'select') {
      range.moveToElementText($(node)[0]) //range定位到obj
      range.collapse(false) //光标移至最后
    }
  }
}

/**
 * 设置输入框全选或移动光标到末尾（input或文本域用此方法比上面两个好用点）
 * @param obj
 * type:0默认全选效果 1移动光标到末尾
 */
export const setInpCaret = (paramObj: { node: any; len?: number; type?: number }) => {
  const { node, len, type } = paramObj
  const length = len ? len : node.value.length
  node.focus() // 获取焦点
  if (node.setSelectionRange) {
    //非ie
    if (type == 1) {
      node.setSelectionRange(-1, -1) // 设置选定区的开始和结束点,-1,-1是光标定位到末尾
    } else {
      node.setSelectionRange(0, length) // 设置选定区的开始和结束点
    }
  } else if (node.createTextRange) {
    const range = node.createTextRange() // 创建选定区
    range.collapse(true) // 设置为折叠,即光标起点和结束点重叠在一起
    range.moveEnd('character', len) // 移动结束点
    range.moveStart('character', 0) // 移动开始点
    range.select() // 选定当前区域
  }
}
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
 * 下载附件
 * downType下载类型
 */
export const downLoadFile = ({
  url,
  fileName,
  downType,
}: {
  url: string
  fileName: string
  downType?: number
}) => {
  const a = document.createElement('a')
  // 接口请求
  if (downType == 1) {
    a.href = url
    a.click()
  } else {
    //资源访问
    const x = new XMLHttpRequest()
    x.open('GET', url, true)
    x.responseType = 'blob'
    x.onload = function() {
      //会创建一个 DOMString，其中包含一个表示参数中给出的对象的URL。这个 URL 的生命周期和创建它的窗口中的 document 绑定。这个新的URL 对象表示指定的 File 对象或 Blob 对象。
      const src = window.URL.createObjectURL(x.response)
      a.href = src
      if (fileName) {
        a.download = fileName
      }
      a.click()
    }
    x.send()
  }
}

/**
 * 对象型数组排序
 * @param {*} property
 * property:要比较的键名
 * value1 - value2:正序,反之 倒序
 * type 0正序 1倒序
 */
export const compareSort = ({ property, type }: { property: string; type: number }) => {
  return function(a: any, b: any) {
    const value1 = parseInt(a[property])
    const value2 = parseInt(b[property])
    let newVal = value1 - value2
    if (type == 1) {
      newVal = value2 - value1
    }
    return newVal
  }
}
// electron-drag依赖不可用时
const makeDraggableFallback = (el: HTMLElement) => {
  let dragging = false
  let mouseX = 0
  let mouseY = 0
  el?.addEventListener('mousedown', e => {
    dragging = true
    const { pageX, pageY } = e
    mouseX = pageX
    mouseY = pageY
  })
  window.addEventListener('mouseup', () => {
    dragging = false
  })
  window.addEventListener('mousemove', (e: MouseEvent) => {
    if (dragging) {
      const { pageX, pageY } = e
      const win = require('electron').remote.getCurrentWindow()
      const pos = win.getPosition()
      pos[0] = pos[0] + pageX - mouseX
      pos[1] = pos[1] + pageY - mouseY
      win.setPosition(pos[0], pos[1], true)
    }
  })
}
/**
 * 对象型数组排序
 * @param {*} el
 * el:传入需要拖动的区域dom的id--#app-sider
 */
// export const makeDraggable = (el: HTMLElement | string) => {
//   let element: any = ''
//   if (typeof el === 'string') {
//     element = document.querySelector(el) as HTMLElement
//   }
//   try {
//     const drag = require('electron-drag')
//     if (drag.supported) {
//       drag(el)
//     } else {
//       makeDraggableFallback(element)
//     }
//   } catch (ex) {
//     makeDraggableFallback(element)
//   }
// }
