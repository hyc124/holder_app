import React, { useEffect, useState } from 'react'
import { Spin } from 'antd'
import './appLoading.less'
export let setAppLoading: any = null
/**
 * loading加载全局使用
 * @param props
 */
const AppLoading = () => {
  const [loadState, setLoadState] = useState(false)
  useEffect(() => {
    setAppLoading = (flag: boolean) => {
      setLoadState(flag)
    }
  }, [])
  return (
    <div className={`appMainLoadingBox h100 ${loadState ? '' : 'forcedHide'}`}>
      <Spin spinning={loadState} wrapperClassName="appMainLoading h100">
        <div className="appSpinIn"></div>
      </Spin>
    </div>
  )
}

export default AppLoading
