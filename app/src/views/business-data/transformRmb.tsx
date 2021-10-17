import { message } from 'antd'

let rmb: any = ''
let fixed: any = 0 //小数位
// const numMap = new Array('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖')
// //基本单位
// const rmbIntRadice = new Array('', '拾', '佰', '仟')
// //整数部分扩展单位
// const rmbIntUnits = new Array('', '万', '亿', '兆')
// //小数部分单位
// const rmbDecUnits = new Array('角', '分', '毫', '厘')

const numMap = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
//基本单位
const rmbIntRadice = ['', '拾', '佰', '仟']
//整数部分扩展单位
const rmbIntUnits = ['', '万', '亿', '兆']
//小数部分单位
const rmbDecUnits = ['角', '分', '毫', '厘']

// refreshFnInit

let _defaults: any = {
  rmbInteger: '整', //整数金额时后面跟的字符
  rmbIntLast: '元', //整型完以后的单位
  rmbHead: '负', //负值
  maxNum: 999999999999, //整数最大处理的数字
  integerNum: '', //金额整数部分
  decimalNum: '', //金额小数部分
  upperCaseNum: '', //输出的大写金额字符串
  rmbParts: '', //分离金额后用的数组，预定义
}

const checkRmb = (num: any, fix: any) => {
  //校验
  rmb = parseFloat(num)
  fixed = fix
  if (rmb == 0) {
    //零元
    _defaults.upperCaseNum = numMap[0] + _defaults.rmbIntLast + _defaults.rmbInteger
    return _defaults.upperCaseNum
  }
  if (rmb == '') {
    //是否为空
    return ''
  }
  if (rmb < 0) {
    //负数
    _defaults.upperCaseNum = _defaults.rmbHead
    rmb = rmb.toString().split('-')[1]
  }
  // 校验通过
  return transRmbNum()
}
const transRmbNum = () => {
  //获取整数和小数部分
  rmb = rmb.toString()
  if (rmb.indexOf('.') == -1) {
    //没有输入小数值
    _defaults.integerNum = rmb
    _defaults.decimalNum = ''
  } else {
    _defaults.rmbParts = rmb.split('.')
    _defaults.integerNum = _defaults.rmbParts[0]
    // _defaults.decimalNum =Math.round( _defaults.rmbParts[1].substr(0, 2))
    if (fixed == 0) {
      //0位小数（表单没有选择保留小数位数）
      if (_defaults.rmbParts[1] && Number(_defaults.rmbParts[1][0]) > 4) {
        //小数部分存在并判断小数第一位(四舍五入，整数部分)
        _defaults.integerNum = `${Number(_defaults.integerNum) + 1}`
      }
      _defaults.decimalNum = ''
    } else {
      const ToFixedNum: any = ToFixeds(rmb, fixed) // e.g: 0.99 保留小数向上取整，整数位应该加1

      if (ToFixedNum.toString().indexOf('.') != -1) {
        // e.g: 0.99 保留0位或者保留一位小数都是壹元整
        // _defaults.integerNum = `${Number(_defaults.integerNum) + Number(ToFixedNum.toString().split('.')[0])}`
        _defaults.integerNum = `${Number(ToFixedNum.toString().split('.')[0])}`
      }
      _defaults.decimalNum = ToFixedNum.toString().split('.')[1]
      // _defaults.decimalNum = Number(rmb).toFixed(fixed).split('.')[1]
    }
  }
  if (_defaults.integerNum > _defaults.maxNum) {
    //是否超出最大值
    if ($('#toast-container').length > 0) {
      return
    } else {
      message.error('金额已超出最大转换值')
    }
    return
  } else {
    return transRmbNumInt()
  }
}
const transRmbNumInt = () => {
  //处理转换
  //整数部分转换
  if (parseInt(_defaults.integerNum, 10) > 0) {
    let zeroCount = 0
    const IntLen = _defaults.integerNum.length
    // $.each(IntLen, (i, item) => {
    for (let i = 0; i < IntLen; i++) {
      const n = _defaults.integerNum.substr(i, 1)
      const p = IntLen - i - 1
      const q = p / 4
      const m = p % 4

      if (n == '0') {
        zeroCount++
      } else {
        if (zeroCount > 0) {
          _defaults.upperCaseNum += numMap[0]
        }
        //归零
        zeroCount = 0
        _defaults.upperCaseNum += numMap[parseInt(n)] + rmbIntRadice[m]
      }

      if (m == 0 && zeroCount < 4) {
        _defaults.upperCaseNum += rmbIntUnits[q]
      }
    }

    // })
    _defaults.upperCaseNum += _defaults.rmbIntLast
  }

  //小数部分
  if (_defaults.decimalNum != '') {
    const decLen = _defaults.decimalNum.length
    if (_defaults.integerNum != 0 && Number(_defaults.decimalNum) != 0) {
      //如果整数部分和小数部分不为0，则添加‘零’，eg:1.2 ===> 壹元‘零’贰角
      _defaults.upperCaseNum += numMap[0]
    }
    for (let i = 0; i < decLen; i++) {
      const n = _defaults.decimalNum.substr(i, 1)
      if (n != '0') {
        _defaults.upperCaseNum += numMap[Number(n)] + rmbDecUnits[i]
      }
    }
  } else {
    if (_defaults.integerNum == 0) {
      _defaults.upperCaseNum += numMap[0] + _defaults.rmbIntLast
    }
  }

  if (_defaults.upperCaseNum == '') {
    //输出的大写金额字符串是否为空
    _defaults.upperCaseNum += numMap[0] + _defaults.rmbIntLast
  } else if (_defaults.decimalNum == '0' || _defaults.decimalNum == '00' || _defaults.decimalNum == '') {
    //金额小数部分是否为空/是否为0/是否为00
    _defaults.upperCaseNum += _defaults.rmbInteger
  }
  return _defaults.upperCaseNum
}
/*保留小数（四舍五入）data:要保留的数，val:保留的位数*/
const ToFixeds = (dataValue: any, val: any) => {
  let data = dataValue
  let numbers = ''
  // 保留几位小数后面添加几个0
  for (let i = 0; i < val; i++) {
    numbers += '0'
  }
  const s: any = 1 + numbers
  // 如果是整数需要添加后面的0
  const spot = '.' + numbers
  //特殊处理：保留两位小数且小数位数大于2且小数位数第三位刚好等于5,将5替换成6（如果用5，js计算精度有问题）
  if (val == 2) {
    // 8.555
    if (data.toString().indexOf('.') != -1) {
      const len = data.toString().split('.')[1]
      if (len.length == 3 && len[len.length - 1] == '5') {
        data = data.toString()
        data = data.substr(0, data.length - 1) + '6'
      }
    }
  }
  // Math.round四舍五入
  //  parseFloat() 函数可解析一个字符串，并返回一个浮点数。
  let value: any = Math.round(parseFloat(data) * s) / s
  // 从小数点后面进行分割
  const d = value.toString().split('.')
  if (d.length == 1) {
    value = value.toString() + spot
    return value
  }
  if (d.length > 1) {
    if (d[1].length < 2) {
      value = value.toString() + '0'
    }
    return value
  }
}

const initParam = () => {
  rmb = ''
  fixed = 0
  _defaults = {
    rmbInteger: '整', //整数金额时后面跟的字符
    rmbIntLast: '元', //整型完以后的单位
    rmbHead: '负', //负值
    maxNum: 999999999999, //最大处理的数字
    integerNum: '', //金额整数部分
    decimalNum: '', //金额小数部分
    upperCaseNum: '', //输出的大写金额字符串
    rmbParts: '', //分离金额后用的数组，预定义
  }
}

const isOperator = (value: any) => {
  const operatorString = '+-*/()×÷'
  return operatorString.indexOf(value) > -1
}

const getPrioraty = (value: any) => {
  if (value == '-' || value == '+') {
    return 1
  } else if (value == '*' || value == '/' || value == '×' || value == '÷') {
    return 2
  } else {
    return 0
  }
}

const prioraty = (v1: any, v2: any) => {
  return getPrioraty(v1) <= getPrioraty(v2)
}

const outputRpn = (expValue: any) => {
  const inputStack: any = []
  const outputStack = []
  const outputQueue = []
  let firstIsOperator = false
  let exp = expValue
  exp.replace(/\s/g, '')
  if (isOperator(exp[0])) {
    exp = exp.substring(1)
    firstIsOperator = true
  }
  for (let i = 0, max = exp.length; i < max; i++) {
    if (!isOperator(exp[i]) && !isOperator(exp[i - 1]) && i != 0) {
      inputStack[inputStack.length - 1] = inputStack[inputStack.length - 1] + exp[i] + ''
    } else {
      inputStack.push(exp[i])
    }
  }
  if (firstIsOperator) {
    inputStack[0] = -inputStack[0]
  }
  while (inputStack.length > 0) {
    const cur = inputStack.shift()
    if (isOperator(cur)) {
      if (cur == '(') {
        outputStack.push(cur)
      } else if (cur == ')') {
        let po = outputStack.pop()
        while (po != '(' && outputStack.length > 0) {
          outputQueue.push(po)
          po = outputStack.pop()
        }
      } else {
        while (prioraty(cur, outputStack[outputStack.length - 1]) && outputStack.length > 0) {
          outputQueue.push(outputStack.pop())
        }
        outputStack.push(cur)
      }
    } else {
      outputQueue.push(Number(cur))
    }
  }
  if (outputStack.length > 0) {
    while (outputStack.length > 0) {
      outputQueue.push(outputStack.pop())
    }
  }
  return outputQueue
}

const calRpnExp = (rpnArr: any) => {
  const stack = []
  for (let i = 0, max = rpnArr.length; i < max; i++) {
    if (!isOperator(rpnArr[i])) {
      stack.push(rpnArr[i])
    } else {
      const num1 = stack.pop()
      const num2 = stack.pop()
      let num = 0
      if (rpnArr[i] == '-') {
        num = num2 - num1
      } else if (rpnArr[i] == '+') {
        num = num2 + num1
      } else if (rpnArr[i] == '*' || rpnArr[i] == '×') {
        num = num2 * num1
      } else if (rpnArr[i] == '/' || rpnArr[i] == '÷') {
        num = num2 / num1
      }
      stack.push(num)
    }
  }
  return stack[0]
}

const calCommonExp = (exp: any) => {
  const rpnArr = outputRpn(exp)
  return calRpnExp(rpnArr)
}
/**
 * 中文转数字
 * @param num
 * @returns
 */
const changeStrToNum = (num: any) => {
  // const numArray = new Array()
  const numArray = []
  const unit = '亿万元$'
  for (let i = 0; i < unit.length; i++) {
    const re: any = new RegExp((numArray[i - 1] ? unit.charAt(i - 1) : '') + '(.*)' + unit.charAt(i))
    if (num.match(re)) {
      numArray[i] = num.match(re)[1].replace(/^拾/, '壹拾')
      numArray[i] = numArray[i].replace(/[零壹贰叁肆伍陆柒捌玖]/g, function($1: any) {
        return '零壹贰叁肆伍陆柒捌玖'.indexOf($1)
      })
      numArray[i] = numArray[i]
        .replace(/[分角拾佰仟]/g, function($1: any) {
          return '*' + Math.pow(10, '分角 拾佰仟'.indexOf($1) - 2) + '+'
        })
        .replace(/^\*|\+$/g, '')
        .replace(/整/, '0')
      numArray[i] = '(' + numArray[i] + ')*' + Math.ceil(Math.pow(10, (2 - i) * 4))
    } else {
      numArray[i] = 0
    }
  }
  return calCommonExp(numArray.join('+').replace(/\(\)/g, '0'))
}

export const init = (num: any, fix: any) => {
  initParam()
  return checkRmb(num, fix ? fix : 0)
}
export const newToFix = (num: any, fix: any) => {
  const newFixVal = ToFixeds(num, fix)
  return newFixVal
}
export const changeWordToNum = (str: any) => {
  return changeStrToNum(str)
}
