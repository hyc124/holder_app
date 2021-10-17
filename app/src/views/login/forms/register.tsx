import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Row, Col, message } from 'antd'
import {
  ShakeOutlined,
  LockOutlined,
  VerifiedOutlined,
  InboxOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import '../login.less'
import md5 from 'md5'
import { loginSystem, getAccountInfo, queryInvitationState, formSubmitEnable } from './loginForm'

interface Props extends PageProps {
  sendOrgInfo: (arr: any) => void
  showRegisterForm: (value: boolean) => void
  optionWindow: (str: string, flag?: boolean) => void
  saveThisUserInfo: (userInfo: any) => void
  checkedKey: string
  isWeChatLogin: boolean
}

const ForgetPwdForms: React.FC<Props> = (props: any) => {
  const { loginToken, weChatUserInfo } = $store.getState()
  const { checkedKey, showRegisterForm, isWeChatLogin } = props
  const [count, setCount] = useState(-1)
  const [form] = Form.useForm()
  // 账号
  const [account, setAccount] = useState('')
  // 验证码
  const [code, setCode] = useState('')
  const [btnLoading, setBtnLoading] = useState(false)
  const [, forceUpdate] = useState<any>()
  const mountedRef = useRef(true)

  useEffect(() => {
    ;(async function() {
      //默认确认按钮为不可点击状态
      await forceUpdate({})
    })()

    return () => {
      mountedRef.current = false
    }
  }, [])
  useEffect(() => {
    // 切换注册方式清空表单信息
    form.resetFields()
    setCode('')
  }, [checkedKey])

  const registerAndLogin = (values: any) => {
    setBtnLoading(true)
    if (!mountedRef.current) return null
    const _info = checkedKey === 'PHONE' ? values.telphone : values.email
    codeVerification(_info, values.verifycode)
      .then(resData => {
        if (resData.returnCode === 0) {
          register(values)
        } else {
          message.error('校验验证码失败，请重试')
        }
      })
      .catch(err => {
        message.error(err.returnMessage)
        setBtnLoading(false)
      })
  }

  const register = (values: any) => {
    // 0 手机注册 1邮箱注册
    const _type = checkedKey === 'PHONE' ? 0 : 1
    const _info = checkedKey === 'PHONE' ? values.telphone : values.email
    const param: any = {
      info: _info,
      type: _type,
      name: values.text,
      password: md5(values.repassword),
    }
    if (isWeChatLogin) {
      param.weChatUnionId = weChatUserInfo.weChatUnionId
      param.headimgurl = weChatUserInfo.headimgurl
      param.nickname = weChatUserInfo.nickname
    }
    $api
      .request('/team/register/register', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnCode === 0) {
          loginSystem(_info, values.repassword)
            .then(resData => {
              //保存token
              setBtnLoading(false)
              $store.dispatch({ type: 'SET_REQUESET_TOKEN', data: { token: resData.loginToken } })
              //查询用户信息
              getAccountInfo(resData.data, resData.loginToken)
                .then(res => {
                  const userData = res.data
                  props.saveThisUserInfo(userData)
                  // 跳转之前校验当前账号企业邀请状态
                  queryInvitationState(resData.data, resData.loginToken).then((res: any) => {
                    const invitalist = res.dataList || []
                    props.sendOrgInfo(invitalist)
                    //不存在企业邀请
                    if (invitalist.length === 0) {
                      //跳转创建页
                      props.optionWindow('createGuide')
                    } else {
                      //存在企业邀请
                      props.optionWindow('invitation')
                    }
                  })
                })
                .catch(err => {
                  message.error(err.returnMessage || '查询个人信息失败')
                  setBtnLoading(false)
                })
            })
            .catch(err => {
              message.error(err.returnMessage || '登录失败')
              setBtnLoading(false)
            })
        } else {
          message.error(resData.returnMessage)
        }
      })
      .catch(resData => {
        message.error(resData.returnMessage)
        setBtnLoading(false)
      })
  }
  return (
    <Form
      form={form}
      name="normal_login"
      className="login-form register-form"
      initialValues={{ remember: true }}
      onFinish={registerAndLogin}
    >
      <div className="login_tit">手机号注册</div>
      {checkedKey === 'PHONE' && (
        <Form.Item
          className="phoneItem"
          validateTrigger="onBlur"
          name="telphone"
          rules={[
            { required: true, message: '请输入账号' },
            {
              pattern: /^1(3|4|5|6|7|8|9)\d{9}$/,
              message: '请输入正确的手机号',
            },
          ]}
          getValueFromEvent={e => {
            return e.target.value.replace(/[^0-9]/gi, '')
          }}
        >
          <Input
            placeholder="手机号码"
            size="large"
            type="text"
            maxLength={11}
            // minLength={11}
            prefix={
              <div>
                {/* <ShakeOutlined className="site-form-item-icon" /> */}
                <span className="phone_icon"></span>
                <span>+86</span>
                <span className="addon_bright"></span>
              </div>
            }
            onChange={checkAccount}
          />
        </Form.Item>
      )}

      {/* {checkedKey === 'EMAIL' && (
        <Form.Item
          className="email-inp"
          validateTrigger="onBlur"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱号' },
          ]}
        >
          <Input
            prefix={<InboxOutlined className="site-form-item-icon" />}
            placeholder="邮箱号"
            size="large"
            onChange={checkAccount}
          />
        </Form.Item>
      )} */}

      <Form.Item
        // validateTrigger="onBlur"
        name="verifycode"
        rules={[
          { required: true, message: '请输入验证码' },
          {
            pattern: /^\d{6}$/,
            message: '请输入正确的验证码',
          },
        ]}
      >
        <Row gutter={16} justify="space-between">
          <Col span={15}>
            <Input
              prefix={<span className="prefix_icon verifi_code_icon"></span>}
              placeholder="请输入验证码"
              size="large"
              maxLength={6}
              // minLength={6}
              onChange={registeCode}
              type="verifycode"
              value={code}
              onBlur={e => {
                if (e.target.value.length < 6) {
                }
              }}
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
        name="text"
        rules={[
          { required: true, message: '请输入姓名' },
          { pattern: /^[\u4e00-\u9fa50-9a-zA-Z]+$/gi, message: '请输入正确的姓名' },
        ]}
      >
        <Input
          // prefix={<UserSwitchOutlined className="site-form-item-icon" />}
          prefix={<span className="prefix_icon username_icon"></span>}
          type="text"
          placeholder="姓名"
          size="large"
          maxLength={16}
        />
      </Form.Item>
      <Form.Item
        validateTrigger="onBlur"
        name="repassword"
        rules={[
          { required: true, message: '请输入密码' },
          {
            pattern: /^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$).{8,20}$/,
            message: '格式不正确，8-20位字母、数字或特殊符号中的2种',
          },
        ]}
      >
        <Input
          prefix={<span className="prefix_icon password_icon"></span>}
          type="password"
          placeholder="密码（8-20位，字母、数字或特殊符号中的2种）"
          maxLength={20}
          // minLength={8}
          size="large"
        />
      </Form.Item>
      <Form.Item className="register-btn">
        <Button
          type="primary"
          htmlType="submit"
          className="login-form-button"
          loading={btnLoading}
          // disabled={
          //   !form.isFieldsTouched([checkedKey === 'PHONE' ? 'telphone' : 'email', 'text', 'repassword'], true) ||
          //   form.getFieldsError().filter(({ errors }) => errors.length).length !== 0
          // }
          // disabled={formSubmitEnable({ parentNode: '#normal_login', submitNode: '.login-form-button' })}
        >
          {props.isWeChatLogin ? '注册并绑定' : '注册'}
        </Button>
      </Form.Item>
      <div className="register-box">
        <span>已有账户？</span>
        <span className="link" onClick={() => showRegisterForm(false)}>
          登录
        </span>
      </div>
    </Form>
  )
  function checkAccount(e: any) {
    setAccount(e.target.value)
  }

  function registeCode(e: any) {
    let _val = e.target.value
    if (_val.length == 1) {
      _val = e.target.value.replace(/[^0-9]/g, '')
    } else {
      _val = e.target.value.replace(/\D/g, '')
    }
    setCode(_val)
  }

  async function onCheck() {
    try {
      if (props.checkedKey === 'PHONE') {
        await form.validateFields(['telphone']).then(() => {
          accountCheck(0)
        })
      } else {
        await form.validateFields(['email']).then(() => {
          accountCheck(1)
        })
      }
    } catch (errorInfo) {
      console.log('Failed:', errorInfo)
    }
  }

  // 校验账号是否注册
  function accountCheck(type: number) {
    const param = {
      type: type,
      info: account,
    }
    $api
      .request('/team/register/status', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnMessage === '0') {
          message.error('该账号已注册，请重新输入')
        } else {
          requestVerification(type)
        }
      })
  }

  // 账号未注册，发送验证码
  function requestVerification(type: number) {
    const param = {
      type: type,
      info: account,
    }
    $api
      .request('/tools/verification/requestVerification', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        if (resData.returnMessage !== 0) {
          handleTime()
        }
      })
      .catch(resData => {
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
}

export default ForgetPwdForms

// 校验验证码是否正确
export const codeVerification = (account: string, code: string) => {
  const { loginToken } = $store.getState()
  return new Promise<any>((resolve, reject) => {
    $api
      .request(
        '/tools/verification/validateVerification',
        {
          info: account,
          code: code,
        },
        { headers: { loginToken: loginToken }, formData: true }
      )
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
