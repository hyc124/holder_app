import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Form, Row, Col, Input, message } from 'antd'
import { codeVerification } from '@/src/views/login/forms/register'
import md5 from 'md5'
import {
  bindWeChat,
  findRegisterUser,
  queryUserInfo,
  registerfind,
  registerReset,
  removeWeChatBind,
  weChatLogin,
} from '@/src/views/workdesk/getData'
import axios from 'axios'
import { ipcRenderer } from 'electron'
import {
  cipher,
  findLocalLoginMsg,
  inserteLocalLoginMsg,
  upateLocalLoginMsg,
} from '@/src/views/login/forms/loginForm'
const protocol = process.env.API_PROTOCOL
const host = process.env.API_HOST

let timerWeChat: any = null //防止轮询多次调用

function AccountSet() {
  const { nowAccount, nowUserId, weChatUserInfo, nowUser } = $store.getState()
  const [count, setCount] = useState(-1)
  const [form] = Form.useForm()
  const [userInfo, setUserInfo] = useState<any>('') // 用户的基本信息
  const mountedRef = useRef(true)
  const [isParams, setIsParams] = useState({
    isType: 0, // 0 手机 1邮箱
    isBind: false, //解绑弹窗
    isChange: false, //修改密码弹窗
    showModal: false, //弹窗显示
    unBind: false, // true 绑定微信  false:解绑微信
  })
  const [password, setPassword] = useState({
    password: '',
    againPassword: '',
    code: '',
  })
  const _QUERYPARAMS = {
    account: nowAccount,
    system: 'oa',
  }
  useEffect(() => {
    queryUserInfo(_QUERYPARAMS).then((data: any) => {
      setUserInfo(data.data)
      isAccountType(data.data.account)
    })

    //监听微信弹窗关闭 清空轮询
    ipcRenderer
      .removeListener('clear_wechat_request', () => {
        timerWeChat && clearInterval(timerWeChat)
      })
      .on('clear_wechat_request', () => {
        timerWeChat && clearInterval(timerWeChat)
      })

    return () => {
      mountedRef.current = false
      timerWeChat && clearInterval(timerWeChat)
    }
  }, [])

  const closePasswordChange = () => {
    setIsParams({ ...isParams, showModal: false })
  }

  async function onCheck() {
    try {
      await form.validateFields(['username']).then(() => {
        const param = {
          account: userInfo.account,
          type: isParams.isType,
        }
        findRegisterUser(param)
          .then(() => {
            const params = {
              type: isParams.isType,
              info: userInfo.account,
              name: userInfo.username,
            }
            registerfind(params)
              .then(() => {
                handleTime()
              })
              .catch(resData => {
                message.error(resData.returnMessage)
              })
          })
          .catch(err => {
            message.error(err.returnMessage)
          })
      })
    } catch (errorInfo) {
      console.log('Failed:', errorInfo)
    }
  }

  // 判断是邮箱还是手机号
  const isAccountType = (str: string) => {
    const regPhone = /^1\d{10}$/
    const regEmail = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/
    if (regPhone.test(str)) {
      setIsParams({ ...isParams, isType: 0 })
    }
    if (regEmail.test(str)) {
      setIsParams({ ...isParams, isType: 1 })
    }
  }

  const handleTime = () => {
    let data = 60
    setCount(data)
    const timers = setInterval(() => {
      data--
      setCount(data)
      if (data <= -1) {
        data = 60
        clearInterval(timers)
      }
    }, 1000)
  }

  async function newPassword(e: any, type: number) {
    if (type === 0) {
      setPassword({
        ...password,
        password: e.target.value,
      })
    } else {
      setPassword({
        ...password,
        againPassword: e.target.value,
      })
    }
  }

  const resetPass = (values: any) => {
    if (!mountedRef.current) return null
    codeVerification(userInfo.account, values.verifycode)
      .then(resData => {
        if (isParams.isChange) {
          registerReset({
            userId: userInfo.id,
            password: md5(values.password),
          })
            .then(() => {
              if (resData.returnCode == 0) {
                message.success('修改成功')
                setIsParams({ ...isParams, showModal: false })
                // 校验本地数据库是否有当前数据
                const _data = {
                  userName: userInfo.username || '', //名字
                  userAccount: userInfo.account, //账号
                  password: cipher(values.password), //密码(存用户输入的密码)
                  rember: true,
                  loginTime: new Date().valueOf(),
                }
                findLocalLoginMsg(userInfo.account).then((localRes: any) => {
                  if (localRes && localRes.length > 0 && Boolean(localRes[0].rember)) {
                    // 当数据存在且勾选记住密码，做UPDATE操作
                    upateLocalLoginMsg(_data)
                  } else {
                    // 当数据不存在时，做INSERTE操作
                    inserteLocalLoginMsg(_data)
                  }
                })
              }
            })
            .catch(err => {
              message.error(err.returnMessage)
            })
        } else {
          if (isParams.unBind) {
            // 绑定微信
            const wechatParam = {
              userId: userInfo.id,
              userAccount: userInfo.account,
              password: '',
              weChatUnionId: weChatUserInfo.weChatUnionId,
              headimgurl: weChatUserInfo.headimgurl,
              nickname: weChatUserInfo.nickname,
            }
            bindWeChat(wechatParam)
              .then((res: any) => {
                message.success(res.returnMessage)
                setIsParams({ ...isParams, showModal: false })
                ipcRenderer.send('close_we_chat_scan')
              })
              .catch(err => {
                message.error(err.returnMessage)
              })
          } else {
            // 解绑微信
            removeWeChatBind({
              userId: userInfo.id,
            })
              .then((res: any) => {
                message.success('解绑成功')
                setIsParams({ ...isParams, showModal: false })
                queryUserInfo({ account: nowAccount, system: 'oa' }).then((data: any) => {
                  setUserInfo(data.data)
                })
              })
              .catch(err => {
                message.error(err.returnMessage)
              })
          }
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }

  // const wechatBind = () => {
  //     //工作报告
  //     weChatLogin().then((res: any) => {
  //         if (res.returnCode === 0) {
  //             clearTimeout(timerWeChat)
  //             const state = res.data.split('&state=')[1].split('&style=')[0]
  //             //微信扫码窗口
  //             $store.dispatch({
  //                 type: 'WE_CHAT_SCAN_STATE',
  //                 data: { state: state, imgUrl: res.data },
  //             })
  //             $tools.createWindow('WeChatScan').finally(() => {
  //                 timerWeChat && clearInterval(timerWeChat)
  //                 timerWeChat = setInterval(() => {
  //                     queryQRstate(state)
  //                 }, 2000)
  //             })
  //             // $tools.createWindow('WeChatScan')
  //             // timerWeChat = setTimeout(() => {
  //             //     queryQRstate(state)
  //             // }, 1000)
  //         }
  //     }).catch((resData: any) => {
  //         console.log(resData)
  //     })
  // }

  const wechatBind = async () => {
    //获取微信登录二维码
    weChatLogin()
      .then((res: any) => {
        if (res && res.returnCode === 0) {
          const state = res.data.split('&state=')[1].split('&style=')[0]
          //微信扫码窗口
          $store.dispatch({
            type: 'WE_CHAT_SCAN_STATE',
            data: { state: state, imgUrl: res.data },
          })
          $tools.createWindow('WeChatScan').finally(() => {
            timerWeChat && clearInterval(timerWeChat)
            timerWeChat = setInterval(() => {
              queryQRstate(state)
            }, 2000)
          })
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  const queryQRstate = (state: string) => {
    const formData = new FormData()
    formData.append('state', state)
    formData.append('account', nowAccount)
    axios({
      method: 'post',
      url: `${protocol}${host}/team/weChatLogin/getWeChatLoginInfo`,
      headers: {
        loginToken: $store.getState().loginToken,
      },
      data: formData,
    }).then((res: any) => {
      const resData = res.data
      //已失效
      if (resData.returnCode == -1) {
        timerWeChat && clearInterval(timerWeChat)
        message.error(resData.returnMessage)
        ipcRenderer.send('close_we_chat_scan')
      }
      if (resData.returnCode == -999) {
        message.error(resData.returnMessage)
        ipcRenderer.send('close_we_chat_scan')
      }
      //绑定成功并登录
      if (resData.returnCode == 1) {
        timerWeChat && clearInterval(timerWeChat)
        ipcRenderer.send('close_we_chat_scan')
        message.error(resData.returnMessage)
      }
      // 未绑定用户
      if (resData.returnCode == 2) {
        timerWeChat && clearInterval(timerWeChat)
        ipcRenderer.send('close_we_chat_scan')
        $store.dispatch({
          type: 'WE_CHAT_USER_INFO',
          data: {
            weChatUnionId: resData.data.weChatUnionId,
            headimgurl: resData.data.headImgUrl,
            nickname: resData.data.nickname,
          },
        })
        const wechatParam = {
          userId: nowUserId,
          userAccount: nowAccount,
          password: '',
          weChatUnionId: resData.data.weChatUnionId,
          headimgurl: resData.data.headImgUrl,
          nickname: resData.data.nickname,
        }
        bindWeChat(wechatParam)
          .then((res: any) => {
            message.success('绑定成功')
            queryUserInfo({ account: nowAccount, system: 'oa' }).then((data: any) => {
              setUserInfo(data.data)
            })
          })
          .catch(err => {
            message.error(err.returnMessage)
          })
      }
    })
  }

  const _CODERULES = [
    { required: true, message: '请输入验证码' },
    { pattern: /^\d{6}$/, message: '请输入正确的验证码' },
  ]
  const _PWRULES = [
    { required: true, message: '请输入密码!' },
    {
      pattern: /^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$).{8,20}$/,
      message: '格式不正确，8-20位字母、数字或特殊符号中的2种',
    },
  ]
  return (
    <div className="accountSet-box">
      <div className="content-box">
        <span className="img-box"></span>
        <div className="item-list account-register">
          <span className="title">注册账号</span>
          <span className="cont">{userInfo.account}</span>
        </div>
        <div className="item-list password-set">
          <span className="title">密码</span>
          <span
            className="cont"
            onClick={async () => {
              await setIsParams({ ...isParams, showModal: true, isBind: false, isChange: true })
              await setPassword({ code: '', againPassword: '', password: '' })
              form.resetFields()
            }}
          >
            修改
          </span>
        </div>
        <div className="item-list account-bind">
          <span className="title">账号绑定</span>
          {!userInfo.weChatOpenId && (
            <span
              className="cont"
              onClick={() => {
                wechatBind()
              }}
            >
              绑定
            </span>
          )}
          {userInfo.weChatOpenId && (
            <div>
              <span className="bindcont">微信</span>
              <span className="name-tit"> 已绑定：{userInfo.weChatNickname}</span>
              <span
                className="unbindWechat"
                onClick={() => {
                  setIsParams({ ...isParams, showModal: true, isChange: false, isBind: true })
                  setPassword({ ...password, code: '' })
                }}
              >
                解绑
              </span>
            </div>
          )}
        </div>
      </div>
      {isParams.showModal && (
        <Modal
          title={isParams.isBind ? '解除绑定' : '修改密码'}
          width={400}
          centered
          visible={isParams.showModal}
          onCancel={closePasswordChange}
          className="change-password-modal"
          maskClosable={false}
          footer={false}
        >
          {isParams.isBind && <span className="tips">解绑微信账号后，将无法继续使用它登录该goalgo账号</span>}
          <Form
            form={form}
            className="change-form"
            initialValues={{ remember: true }}
            onFinish={resetPass}
            name="normal_login"
          >
            <Form.Item className="change-form-titles">
              <label htmlFor="">
                验证账号<span> {userInfo.account}</span>
              </label>
            </Form.Item>
            <Form.Item
              className="verifycode-btnCode"
              validateTrigger="onBlur"
              name="verifycode"
              rules={_CODERULES}
            >
              <Row justify="space-between">
                <Input
                  placeholder="请输入验证码"
                  size="large"
                  maxLength={6}
                  onChange={e => setPassword({ ...password, code: e.target.value })}
                  type="verifycode"
                  value={password.code}
                />
                <Button
                  type="primary"
                  size="large"
                  onClick={onCheck}
                  className="send-code-btn"
                  disabled={count > -1 ? true : false}
                >
                  {count < 0 ? '发送验证码' : `${count}s后重发`}
                </Button>
              </Row>
            </Form.Item>
            {!isParams.isBind && (
              <Form.Item className="title title-tips">
                <label htmlFor="">新登录密码</label>
              </Form.Item>
            )}
            {!isParams.isBind && (
              <Form.Item validateTrigger="onBlur" name="password" rules={_PWRULES}>
                <Input.Password
                  placeholder="新密码（8-20位，字母、数字或特殊符号中的2种）"
                  maxLength={20}
                  // minLength={8}
                  size="large"
                  onChange={e => newPassword(e, 0)}
                />
              </Form.Item>
            )}
            {!isParams.isBind && (
              <Form.Item className="title title-tips">
                <label htmlFor="">再次输入密码</label>
              </Form.Item>
            )}
            {!isParams.isBind && (
              <Form.Item
                validateTrigger="onBlur"
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码!' },
                  ({ getFieldValue }) => ({
                    validator(rule, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject('两次密码不一致')
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="再次输入密码"
                  maxLength={20}
                  // minLength={8}
                  size="large"
                  onChange={e => newPassword(e, 1)}
                />
              </Form.Item>
            )}
            <Form.Item className="formbtn-box">
              <Row justify="end">
                <Col>
                  <Button type="default" className="cancle-button" onClick={closePasswordChange}>
                    取消
                  </Button>
                </Col>
                <Col>
                  <Button type="primary" htmlType="submit" className="submit-button">
                    确定
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  )
}

export default AccountSet
