import React, { useState, useEffect } from 'react'
import '../login.less'
import { message, Tooltip } from 'antd'
import { getAccountInfo, queryInvitationState } from './loginForm'
import axios from 'axios'

interface Props extends PageProps {
  hideQr: () => void
  sendOrgInfo: (arr: any) => void
  optionWindow: (str: string, flag?: boolean) => void
  saveThisUserInfo: (userInfo: any) => void
  showRegisterForm: any
}

const QrForm: React.FC<Props> = (props: any) => {
  const { loginToken } = $store.getState()
  // const pcIcon = $tools.asAssetsPath('/images/login/pcIcon.png')
  const pcIcon = $tools.asAssetsPath('/images/login/to_pc.png')
  const codeImg = $tools.asAssetsPath('/images/login/qr.png')
  const [qrCodeImg, setQrCodeImg] = useState(codeImg)
  // const refreshIcon = $tools.asAssetsPath('/images/login/refurbish.png')
  const refreshQrcode = $tools.asAssetsPath('/images/login/refresh_qrcode.png')
  const [isVisible, setVisible] = useState(true)
  const protocol = process.env.API_PROTOCOL
  const host = process.env.API_HOST

  let timer: any = null

  useEffect(() => {
    $store.dispatch({
      type: 'LOGINOUT_INFO',
      data: { isLoginOut: false },
    })
    createQRCode()
    setVisible(false)
    return () => {
      timer && clearTimeout(timer)
    }
  }, [])

  const createQRCode = () => {
    $api
      .request('/createQRCode', {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode == 0) {
          setVisible(false)
          setQrCodeImg(protocol + host + '/getQRCode?token=' + resData.returnMessage)
          timer = setTimeout(() => {
            queryQRstate(resData.returnMessage)
          }, 2000)
        } else {
          message.error(resData.returnMessage)
          setVisible(true)
        }
      })
      .catch(resData => {
        message.error(resData.returnMessage)
        setVisible(true)
      })
  }

  async function queryQRstate(token: string) {
    await axios({
      method: 'post',
      url: `${protocol}${host}/checkQRCode?token=${token}`,
      headers: {
        loginToken: $store.getState().loginToken,
      },
      // formData: true,
    }).then((res: any) => {
      const resData = res.data
      //正常
      if (resData.returnCode == 0) {
        timer = setTimeout(() => {
          queryQRstate(token)
        }, 2000)
      }
      //已扫描
      if (resData.returnCode == 1) {
        //保存token
        $store.dispatch({ type: 'SET_REQUESET_TOKEN', data: { token: token } })
        getAccountInfo(resData.returnMessage, token).then(resData => {
          const userData = resData.data
          props.saveThisUserInfo(userData)
          // 提前加载报告、审批、公告独立页面
          $tools.windowsInit(['WorkReport', 'Approval', 'AddModalWin'])
          //跳转之前校验当前账号企业邀请状态
          queryInvitationState(userData.account, token).then((res: any) => {
            const invitalist = res.dataList || []
            props.sendOrgInfo(invitalist)
            const _INVILEN = invitalist.length
            const _TEAMLEN = res.obj || 0
            //不存在企业邀请
            if (_INVILEN === 0) {
              if (_TEAMLEN !== 0) {
                //路由跳转
                $store.dispatch({
                  type: 'ACTION_LOGIN',
                  data: {
                    username: userData.username,
                    account: userData.account,
                    userId: userData.id,
                    userAvatar: userData.profile,
                    isLogin: true,
                  },
                })
              } else {
                //跳转创建页
                props.optionWindow('createGuide')
              }
            } else {
              //存在企业邀请
              props.optionWindow('invitation')
            }
          })
        })
      }
      //已过期
      if (resData.returnCode == -1) {
        message.error('QR已过期，请点击重试')
        setVisible(true)
      }
    })
  }

  return (
    <div className="qr-code-cont">
      <Tooltip placement="left" title="账号登录" color="#4285F4">
        <div className="qrCode" onClick={props.hideQr}>
          <img src={pcIcon} alt="" />
        </div>
      </Tooltip>

      <div className="login_tit">扫码登录</div>
      <div className="qr-tips">请使用Holder移动端扫描二维码</div>
      <div className="qr-cont">
        <img src={qrCodeImg} alt="" />
        <div className="mask-layer" onClick={createQRCode} style={{ display: isVisible ? 'block' : 'none' }}>
          <div>
            <img src={refreshQrcode} className="refurbish-img" />
          </div>
          <p className="error-message">生成QR码失败，请点击重试</p>
        </div>
      </div>
      {/* <div className="register-box">
        <span>还没有账号?</span>
        <span className="link" onClick={() => props.showRegisterForm(true)}>
          注册新账户
        </span>
      </div> */}
    </div>
  )
}

export default QrForm
