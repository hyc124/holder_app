import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Row, Col, message, AutoComplete } from 'antd'
import { ShakeOutlined, LockOutlined, VerifiedOutlined, LeftOutlined } from '@ant-design/icons'
import '../login.less'
import { codeVerification } from './register'
import {
  loginSystem,
  getAccountInfo,
  queryInvitationState,
  formSubmitEnable,
  findLocalLoginMsg,
  upateLocalLoginMsg,
  cipher,
  inserteLocalLoginMsg,
} from './loginForm'
import md5 from 'md5'
interface Props extends PageProps {
  showForgetPwdForm: (value: boolean) => void
  sendOrgInfo: (arr: any) => void
  optionWindow: (str: string, flag?: boolean) => void
  saveThisUserInfo: (userInfo: any) => void
}

const ForgetPwdForms: React.FC<Props> = (props: any) => {
  const { loginToken, nowUserId } = $store.getState()
  const [btnLoading, setBtnLoading] = useState(false)
  const [, forceUpdate] = useState({})
  const mountedRef = useRef(true)
  const [count, setCount] = useState(-1)

  const [form] = Form.useForm()
  const { showForgetPwdForm } = props
  // 0 手机 1邮箱
  const [isType, setType] = useState(0)
  // 账号
  const [account, setAccount] = useState('')
  // 用户名
  const [username, setName] = useState('')
  // 用户id
  const [userid, setUserid] = useState(0)
  const [password, setPassword] = useState<{ [propName: string]: any }>({
    password: '',
    againPassword: '',
    passwordShow: false,
    againPasswordShow: false,
  })
  // 验证码
  const [code, setCode] = useState('')
  useEffect(() => {
    ;(async function() {
      //默认确认按钮为不可点击状态
      await forceUpdate({})
    })()

    return () => {
      mountedRef.current = false
    }
  }, [])
  const resetPass = (values: any) => {
    setBtnLoading(true)
    if (!mountedRef.current) return null
    console.log(values)
    codeVerification(values.username, values.verifycode)
      .then(resData => {
        reset(values.username, values.password)
      })
      .catch(err => {
        message.error(err.returnMessage)
        setBtnLoading(false)
      })
  }
  return (
    <Form
      form={form}
      name="normal_login"
      className="login-form"
      initialValues={{ remember: true }}
      onFinish={resetPass}
    >
      <div className="login_tit" onClick={() => showForgetPwdForm(false)}>
        {/* <LeftOutlined className="icon-back" /> */}
        <div className="back_btn">
          <em className="img_icon back_icon"></em>
        </div>
        忘记密码
      </div>
      <Form.Item
        validateTrigger="onBlur"
        name="username"
        rules={[
          { required: true, message: '请输入您的注册账号' },
          {
            validator: (_, value) => {
              const regPhone = /^1\d{10}$/
              const regEmail = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/
              if (!value || regPhone.test(value) || regEmail.test(value)) {
                setType(regPhone.test(value) ? 0 : 1)
                return Promise.resolve()
              }
              return Promise.reject('请输入正确的注册账号')
            },
          },
        ]}
        getValueFromEvent={e => {
          // 禁止输入空格（检测到输入空则则替换空格）
          const _val = e.target.value
          const _rpx = /\s+/g
          if (_rpx.test(_val)) {
            return e.target.value.replace(/\s+/g, '')
          } else {
            return e.target.value
          }
        }}
      >
        {/* <AutoComplete allowClear clearIcon={<span className="input_clear_icon"></span>}> */}
        <Input
          // prefix={<ShakeOutlined className="site-form-item-icon" />}
          prefix={<span className="phone_icon"></span>}
          placeholder="请输入您的注册账号"
          size="large"
          // allowClear
          suffix={
            <span
              className="input_clear_icon account_clear_icon"
              onClick={(e: any) => {
                form.setFieldsValue({
                  username: '',
                })
              }}
            ></span>
          }
          onChange={checkAccount}
        />
        {/* </AutoComplete> */}
      </Form.Item>
      <Form.Item
        validateTrigger="onBlur"
        name="verifycode"
        rules={[
          { required: true, message: '请填写验证码' },
          {
            pattern: /^\d{6}$/,
            message: '验证码不正确',
          },
        ]}
      >
        <Row gutter={16} justify="space-between">
          <Col span={15}>
            <Input
              // prefix={<VerifiedOutlined className="site-form-item-icon" />}
              prefix={<span className="verifi_code_icon"></span>}
              placeholder="请填写验证码"
              size="large"
              maxLength={6}
              onChange={reCode}
              type="verifycode"
              value={code}
            />
          </Col>
          <Col span={9}>
            <Button
              type="primary"
              size="large"
              onClick={onCheck}
              className="send-code-btn"
              disabled={count > -1 ? true : false}
            >
              {count < 0 ? '发送验证码' : `${count}s后重发`}
            </Button>
          </Col>
        </Row>
      </Form.Item>

      <Form.Item
        validateTrigger="onBlur"
        name="password"
        rules={[
          {
            required: true,
            message: '请输入密码!',
          },
          {
            pattern: /^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$).{8,20}$/,
            message: '格式不正确，8-20位字母、数字或特殊符号中的2种',
          },
        ]}
      >
        <Input
          // prefix={<LockOutlined className="site-form-item-icon" />}
          prefix={<span className="password_icon"></span>}
          type={password.passwordShow ? 'text' : 'password'}
          placeholder="新密码（8-20位，字母、数字或特殊符号中的2种）"
          maxLength={20}
          // minLength={8}
          size="large"
          suffix={
            <>
              <span
                className="input_clear_icon pass_clear_icon"
                onClick={() => {
                  form.setFieldsValue({
                    password: '',
                  })
                }}
              ></span>
              {password.passwordShow ? (
                <span
                  className="pass_show_icon"
                  onClick={() => {
                    setPassword({ ...password, passwordShow: false })
                  }}
                ></span>
              ) : (
                <span
                  className="pass_hide_icon"
                  onClick={() => {
                    setPassword({ ...password, passwordShow: true })
                  }}
                ></span>
              )}
            </>
          }
          onChange={e => {
            newPassword(e.target.value, 0)
          }}
        />
      </Form.Item>
      <Form.Item
        validateTrigger="onBlur"
        name="confirm"
        dependencies={['password']}
        // hasFeedback
        rules={[
          {
            required: true,
            message: '请确认密码!',
          },
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
        <Input
          // prefix={<LockOutlined className="site-form-item-icon" />}
          prefix={<span className="password_icon"></span>}
          type={password.againPasswordShow ? 'text' : 'password'}
          placeholder="再次输入密码"
          maxLength={20}
          // minLength={8}
          size="large"
          suffix={
            <>
              <span
                className="input_clear_icon pass_clear_icon"
                onClick={() => {
                  form.setFieldsValue({
                    confirm: '',
                  })
                }}
              ></span>
              {password.againPasswordShow ? (
                <span
                  className="pass_show_icon"
                  onClick={() => {
                    setPassword({ ...password, againPasswordShow: false })
                  }}
                ></span>
              ) : (
                <span
                  className="pass_hide_icon"
                  onClick={() => {
                    setPassword({ ...password, againPasswordShow: true })
                  }}
                ></span>
              )}
            </>
          }
          onChange={e => {
            newPassword(e.target.value, 1)
          }}
        />
      </Form.Item>

      <Form.Item className="resetPassItem">
        <Button
          type="primary"
          htmlType="submit"
          className="login-form-button"
          loading={btnLoading}
          // disabled={formSubmitEnable({ parentNode: '#normal_login', submitNode: '.login-form-button' })}
        >
          重置密码
        </Button>
      </Form.Item>
    </Form>
  )

  async function checkAccount(e: any) {
    setAccount(e.target.value)
  }
  async function reCode(e: any) {
    setCode(e.target.value)
  }
  async function newPassword(value: any, type: number) {
    if (type === 0) {
      setPassword({ ...password, password: value })
    } else {
      setPassword({ ...password, againPassword: value })
    }
  }
  async function onCheck() {
    try {
      await form.validateFields(['username']).then(() => {
        getUser()
        // handleTime()
      })
    } catch (errorInfo) {
      console.log('Failed:', errorInfo)
    }
  }

  // 获取用户信息
  function getUser() {
    const param = {
      account: account,
      type: isType,
    }
    $api
      .request('/team/register/findRegisterUser', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode == 0) {
          setName(resData.data.userName)
          requestVerification()
        }
      })
      .catch(resData => {
        message.error(resData.returnMessage)
      })
  }

  // 检测电话或邮箱是否正确，正确发送验证码
  function requestVerification() {
    const param = {
      type: isType,
      info: account,
      name: username,
    }
    console.log('发送验证码')
    $('#sendCodeBtn').attr('disabled', 'true')
    $api
      .request('/team/register/find', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode == 0) {
          setUserid(resData.data)
          handleTime()
        } else {
          $('#sendCodeBtn').removeClass('disabled')
        }
      })
      .catch(resData => {
        $('#sendCodeBtn').removeClass('disabled')
        message.error(resData.returnMessage)
      })
  }

  function handleTime() {
    let data = 60
    setCount(data)
    const timer = setInterval(() => {
      data--
      setCount(data)
      if (data <= -1) {
        data = 60
        clearInterval(timer)
      }
    }, 1000)
  }

  // 重置密码
  function reset(account: string, password: string) {
    const param = {
      userId: userid,
      password: md5(password),
    }
    $api
      .request('/team/register/reset', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode == 0) {
          // 登录
          loginSystem(account, password)
            .then(resData => {
              //保存token
              $store.dispatch({ type: 'SET_REQUESET_TOKEN', data: { token: resData.loginToken } })
              //查询用户信息
              getAccountInfo(resData.data, resData.loginToken)
                .then(res => {
                  const userData = res.data
                  props.saveThisUserInfo(userData)
                  setBtnLoading(false)

                  // 校验记住密码本地数据库是否有当前数据
                  findLocalLoginMsg(userData.account).then((localRes: any) => {
                    const _data = {
                      userName: userData.username || '', //名字
                      userAccount: userData.account, //账号
                      password: cipher(password), //密码(存用户输入的密码)
                      rember: true,
                      loginTime: new Date().valueOf(),
                    }
                    if (localRes && localRes.length > 0 && Boolean(localRes[0].rember)) {
                      // 当数据存在且勾选记住密码，做UPDATE操作
                      upateLocalLoginMsg(_data)
                    } else {
                      // 当数据不存在时，做INSERTE操作
                      inserteLocalLoginMsg(_data)
                    }
                  })
                  //跳转之前校验当前账号企业邀请状态
                  queryInvitationState(resData.data, resData.loginToken).then((res: any) => {
                    const invitalist = res.dataList || []
                    props.sendOrgInfo(invitalist)
                    const _INVILEN = invitalist.length
                    const _TEAMLEN = res.obj || 0
                    //不存在企业邀请
                    if (_INVILEN === 0) {
                      if (_TEAMLEN !== 0) {
                        //路由跳转
                        setTimeout(() => {
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
                        }, 3000)
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
                .catch(err => {
                  console.log(err)
                  message.error(err.returnMessage || '查询个人信息失败')
                })
            })
            .catch(err => {
              message.error(err.returnMessage || '登录失败')
              setBtnLoading(false)
            })
        }
      })
      .catch(resData => {
        message.error(resData.returnMessage)
        setBtnLoading(false)
      })
  }
}

export default ForgetPwdForms
