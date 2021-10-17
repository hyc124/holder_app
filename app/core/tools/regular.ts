// 图片类型集合
export const imgFormatArr = ['bmp', 'jpg', 'png', 'gif', 'jpeg']
export const fileFormatArr = ['ppt', 'pptx', 'xlsx', 'xls', 'doc', 'docx', 'pdf']
//支持的格式
export const fileImgSupportArr = [
  'ppt',
  'docx',
  'xlsx',
  'pdf',
  'mp4',
  'mp3',
  'zip',
  'rar',
  'doc',
  'pptx',
  'xls',
  'jpg',
  'gif',
  'png',
  'txt',
]

// 视频类型集合
export const videoFormatArr = [
  'mp4',
  'mpge',
  'avi',
  'navi',
  'afs',
  'mov',
  '3gp',
  'wmv',
  'divx',
  'xvid',
  'rm',
  'rmvb',
  'flv',
  'f4v',
]

// 音频类型集合
export const audioFormatArr = [
  'mp3',
  'aac',
  'wav',
  'wma',
  'cda',
  'flac',
  'm4a',
  'mid',
  'mka',
  'mp2',
  'mpa',
  'mpc',
  'ape',
  'ofr',
  'ogg',
  'ra',
  'wv',
  'tta',
  'ac3',
  'dts',
]

// 校验图片
export const regImg = /<img [^>]*src=['"]([^'"]+)[^>]*>/g
export const regImg1 = /<(?!img).*?>/gi
// const reg = /(<img.*?(?:>|\/>))/gi

// 校验截图
export const regScreenImg = /<img(.*?)>/g

// 校验@的人
export const regAtUser = /@([\u4e00-\u9fa5_a-zA-Z0-9()（）]+)(\s|&nbsp;{1})/gi
// export const regAtUser = /@(.*)(&nbsp;{1})/gi
export const regAtbutton = /<button[^>]*(data-peerid=\"(.+?)\")[^>]*>@(.+?)<\/[^>]*>/gm

// 校验表情
export const regEmoji = /\[bq_(\w+)\]/gi
export const regEmoji1 = /<img class="emoji_icon" [^>]*src=['"]([^'"]+)[^>]*>/gi

// 校验分隔字符
export const regCharacter = /\^\!\*/gi

// 校验button
export const regButton = /(<\/?button.*?>)/gi
// 校验span
export const regSpan = /<span\s*[^>]*>(.*?)<\/span>/gi ///<span[^>]*>(.+?)<\/span>/g

// 校验链接
// const regHttps = /(\b(http[s]{0,1}?|ftp|file|git):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
// const regHttps = /(((https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:[a-z].|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/ig
// const regHttps = /(http:\/\/|https:\/\/|[A-Za-z0-9]+[\-]?[A-Za-z0-9]+\.|[A-Za-z0-9]+\.)((\w|=|\?|\.|\/|&|-)*)/g
// const regHttps = /((https?|http|ftp|file｜)(:\/\/))?[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/
export const regHttps = /(((https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_#]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/gi
export const regHttps1 = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/
export const regHttps2 = /http[s]?:\/\/[\w.]+\.(com|org|net|cn)[^ ]*/g

// 校验手机号码
export const regPhone = /^1\d{10}$/

// 校验邮箱
export const regEmail = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/

// 校验空格
export const regSpace = /\s+/g
export const regSpace1 = /&nbsp;/gm
// export const regSpace2 = /( )/g

// 校验换行
export const regLineFeed = /\n/g
export const regLineFeed1 = /(\s+)?<br(\s+)?\/?>(\s+)?/g

// 校验div
export const regDiv = /<div\s*[^>]*>(.*?)<\/div>/gi
