import * as React from 'react'
import { useSelector } from 'react-redux'
import './none-data.less'

interface ONoneData {
  imgSrc?: string
  showTxt?: any
  addPlugs?: any
  className?: string
  searchValue?: string
  Okr?: OkrProps
  imgStyle?: any
  textStyle?: any
  containerStyle?: any
}
interface OkrProps {
  isFullScreen: boolean
  moduleType: number //1通屏 0二分屏
  imgSrcS: string
  imgSrcL: string
  imgSrcXL: string
}
// 针对OKr 不同屏幕 图片适配
const OKrImg = (
  moduleType: number,
  isFullScreen: boolean,
  imgSrcS: string,
  imgSrcL: string,
  imgSrcXL: string
) => {
  if (!isFullScreen) {
    if (moduleType === 0) {
      return imgSrcS
    }
    return imgSrcL
  }
  return imgSrcXL
}

const NoneData = (props: ONoneData) => {
  const networkStatus = useSelector((store: StoreStates) => store.networkStatus) //居中弹窗数据

  const normalImg = $tools.asAssetsPath('/images/common/none_data_icon.png')
  const networkImg = $tools.asAssetsPath('/images/noData/no_network_fail.png')
  const searchImg = $tools.asAssetsPath('/images/noData/no_search.png')
  const searchText = '你搜索到一处未知的领域~'
  const networkText = 'Sorry~网络加载失败'
  const normalTxt = '当前还没有数据哦~'
  const className = props.className || ''
  return (
    <div
      style={props.containerStyle}
      className={`show_none_data_container flex center column ${className} ${
        props.searchValue ? 'filterSearchStatus' : ''
      } ${networkStatus ? '' : 'networkErorr'} ${props.Okr && props.Okr.isFullScreen ? 'full_okr' : ''} ${
        props.Okr && !props.Okr.isFullScreen && props.Okr.moduleType === 0 ? 'small_okr' : ''
      }
       ${props.Okr && !props.Okr.isFullScreen && props.Okr.moduleType === 1 ? 'large_okr' : ''}
      `}
    >
      <img
        style={props.imgStyle}
        className="img"
        src={
          !networkStatus
            ? networkImg
            : props.searchValue
            ? searchImg
            : props.Okr
            ? OKrImg(
                props.Okr.moduleType,
                props.Okr.isFullScreen,
                props.Okr.imgSrcS,
                props.Okr.imgSrcL,
                props.Okr.imgSrcXL
              )
            : props.imgSrc || normalImg
        }
      />
      <div className="text_name" style={props.textStyle}>
        {!networkStatus ? networkText : props.searchValue ? searchText : props.showTxt || normalTxt}
      </div>
      {props.Okr && props.Okr.moduleType === 1 && !props.Okr.isFullScreen && props.addPlugs}
    </div>
  )
}

export default NoneData
