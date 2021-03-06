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
      //??????
      if (resData.returnCode == 0) {
        timer = setTimeout(() => {
          queryQRstate(token)
        }, 2000)
      }
      //?????????
      if (resData.returnCode == 1) {
        //??????token
        $store.dispatch({ type: 'SET_REQUESET_TOKEN', data: { token: token } })
        getAccountInfo(resData.returnMessage, token).then(resData => {
          const userData = resData.data
          props.saveThisUserInfo(userData)
          // ????????????????????????????????????????????????
          $tools.windowsInit(['WorkReport', 'Approval', 'AddModalWin'])
          //????????????????????????????????????????????????
          queryInvitationState(userData.account, token).then((res: any) => {
            const invitalist = res.dataList || []
            props.sendOrgInfo(invitalist)
            const _INVILEN = invitalist.length
            const _TEAMLEN = res.obj || 0
            //?????????????????????
            if (_INVILEN === 0) {
              if (_TEAMLEN !== 0) {
                //????????????
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
                //???????????????
                props.optionWindow('createGuide')
              }
            } else {
              //??????????????????
              props.optionWindow('invitation')
            }
          })
        })
      }
      //?????????
      if (resData.returnCode == -1) {
        message.error('QR???????????????????????????')
        setVisible(true)
      }
    })
  }

  return (
    <div className="qr-code-cont">
      <Tooltip placement="left" title="????????????" color="#4285F4">
        <div className="qrCode" onClick={props.hideQr}>
          <img src={pcIcon} alt="" />
        </div>
      </Tooltip>

      <div className="login_tit">????????????</div>
      <div className="qr-tips">?????????Holder????????????????????????</div>
      <div className="qr-cont">
        <img src={qrCodeImg} alt="" />
        <div className="mask-layer" onClick={createQRCode} style={{ display: isVisible ? 'block' : 'none' }}>
          <div>
            <img src={refreshQrcode} className="refurbish-img" />
          </div>
          <p className="error-message">??????QR???????????????????????????</p>
        </div>
      </div>
      {/* <div className="register-box">
        <span>????????????????</span>
        <span className="link" onClick={() => props.showRegisterForm(true)}>
          ???????????????
        </span>
      </div> */}
    </div>
  )
}

export default QrForm
