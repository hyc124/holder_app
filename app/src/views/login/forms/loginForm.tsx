import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Checkbox, Row, Col, message, AutoComplete, Tooltip } from 'antd'
import { SelectProps } from 'antd/lib/select'
// import { ShakeOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import md5 from 'md5'
import path from 'path'
import fs from 'fs'
import CryptoJs from 'crypto-js'
import { ipcRenderer } from 'electron'
import '../login.less'
import axios from 'axios'
const protocol = process.env.API_PROTOCOL
const host = process.env.API_HOST

import { bindWeChat, initModuleTagSetting, weChatLogin } from '../../workdesk/getData'
import { HandleSqliteDB } from '@/src/common/js/sqlite3Db'
//下载字体需要
import fse from 'fs-extra'
import compressing from 'compressing'
import request from 'request'
const { npm_package_version: version } = process.env
//数据库对象
const db = HandleSqliteDB.getInstance()

interface LoginFormProps extends PageProps {
  sendOrgInfo: (arr: any) => void
  optionWindow: (str: string, flag?: boolean) => void
  saveThisUserInfo: (userInfo: any) => void
  hideLoginForm: () => void
  showForgetPwdForm: (value: boolean) => void
  showRegisterForm: (value: boolean) => void
  showWeChatForm: (value: boolean) => void
  showWeChatLogin: (value: boolean) => void
  isWeChatLogin?: boolean
}

let timerWeChat: any = null
let newOptions: any = []

const LoginForms: React.FC<LoginFormProps> = (props: any) => {
  const [, forceUpdate] = useState({})
  const [btnLoading, setBtnLoading] = useState(false)
  const [options, setOptions] = useState<SelectProps<object>['options']>([])
  const mountedRef = useRef(true)
  // const [rember, setIsRemember] = useState(false)
  // 密码显示隐藏
  const [passVisible, setPassVisible] = useState(false)
  const isWin = process.platform === 'win32'

  const loginKeyDown = (e: any) => {
    const { keyCode } = e
    if (keyCode == 13) {
      form.validateFields()
      loginIn(form.getFieldsValue())
      e.preventDefault()
    }
  }

  // 本地文件操作
  const _path = isWin
    ? path.join('C:\\oa', './', 'ap.bar')
    : path.join('/Applications/holder.app/Contents/Resources/ap.bar')
  useEffect(() => {
    $store.dispatch({
      type: 'LOGINOUT_INFO',
      data: { isLoginOut: false },
    })
    ;(async function() {
      //默认确认按钮为不可点击状态
      await forceUpdate({})
    })()
    // 微信登陆并绑定不默认填入
    if (!props.isWeChatLogin) {
      // 创建本地缓存记住密码表
      db.exec(
        'CREATE TABLE if not exists login_message (id integer primary key autoincrement, userAccount,userName,password,rember,loginTime)'
      )
      findLocalLoginMsg().then(localRes => {
        if (!localRes) {
          // 当本地数据库不存在数据时，读取本地C:\oa\ap.bar
          // readFile()
          console.log('当本地数据库不存在数据时，读取本地C:oa ap.bar')
        } else {
          // 当本地数据库存在数据时，读取本地数据库数据
          handleMessage(localRes)
        }
      })
      // enter登录
      window.addEventListener('keydown', loginKeyDown)
    }
    //提前初始化微信窗口
    // $tools.createWindow('WeChatScan', { createConfig: { autoShow: false, init: true } })
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
      window.removeEventListener('keydown', loginKeyDown)
    }
  }, [])

  // 处理读取后的值
  const handleMessage = (mydata: any) => {
    // setIsRemember(mydata[0].rember)
    form.setFieldsValue({
      rember: Boolean(mydata[0].rember),
      account: mydata[0].userAccount,
      password: decipher(mydata[0].password),
    })
    const newArr = mydata.map((item: any, i: number) => {
      return renderItem(item.userAccount, item.userName, item.password, item.rember, i)
    })
    newOptions = newArr
    setOptions(newArr)
  }

  const renderItem = (account: string, userAccount: any, password: string, rember: boolean, i: number) => {
    return {
      value: account,
      password: password,
      rember: rember,
      label: (
        <div className="select-account-box" key={account + '_' + i}>
          <span className="account">{account}</span>
          <span className="user_name">{userAccount || ''}</span>
          <span
            className="user-del-icon"
            onClick={e => {
              delAccount(e, { uaername: userAccount, account: account })
            }}
          ></span>
        </div>
      ),
    }
  }

  function delAccount(e: any, data: any) {
    // 删除文件中账号
    e.stopPropagation()
    e.target.remove()
    const account = $.trim(data.account)
    // 更新下拉列表
    newOptions?.map((item: any, i: number) => {
      if (item.value === account) {
        newOptions.splice(i, 1)
        return false
      }
    })
    setOptions([...newOptions])
    deleteLocalLoginMsg(account)
  }

  //根据账号获取密码
  const getPasswordByAccount = (account: string) => {
    options?.map(item => {
      if (item.value === account) {
        // setIsRemember(item.rember)
        form.setFieldsValue({
          rember: item.rember,
          account: item.value,
          password: decipher(item.password),
        })
        form.validateFields()
        return false
      }
    })
  }

  //登录操作
  const onFinishLogin = (values: any) => {
    // 过期登出之后还原默认值
    if (props.isWeChatLogin) {
      const { weChatUserInfo } = $store.getState()
      const wechatParam = {
        userId: '',
        userAccount: values.account,
        password: md5(values.password),
        weChatUnionId: weChatUserInfo.weChatUnionId,
        headimgurl: weChatUserInfo.headimgurl,
        nickname: weChatUserInfo.nickname,
      }
      bindWeChat(wechatParam)
        .then(() => {
          loginIn(values)
        })
        .catch(err => {
          message.error(err.returnMessage)
        })
    } else {
      loginIn(values)
    }
  }

  const loginIn = (values: any, isWeChat?: string) => {
    if (values.account == '' || values.password == '') {
      return false
    }
    $store.dispatch({
      type: 'LOGINOUT_INFO',
      data: { isLoginOut: false },
    })
    setBtnLoading(true)
    if (!mountedRef.current) return null
    //登录接口
    loginSystem(values.account, values.password, isWeChat)
      .then(resData => {
        if (!mountedRef.current) return null
        const loginToken = resData.loginToken
        //保存token
        $store.dispatch({ type: 'SET_REQUESET_TOKEN', data: { token: loginToken } })
        //查询用户信息
        getAccountInfo(values.account, loginToken)
          .then(async resData => {
            if (!mountedRef.current) return null
            const userData = resData.data
            props.saveThisUserInfo(userData)
            //跳转之前校验当前账号企业邀请状态
            queryInvitationState(values.account, loginToken).then((res: any) => {
              const invitalist = res.dataList || []
              props.sendOrgInfo(invitalist)
              const _INVILEN = invitalist.length
              const _TEAMLEN = res.obj || 0
              //不存在企业邀请
              if (_INVILEN === 0) {
                if (_TEAMLEN !== 0) {
                  // 跳转工作台
                  setTimeout(async () => {
                    await $store.dispatch({
                      type: 'ACTION_LOGIN',
                      data: {
                        username: userData.username,
                        account: userData.account,
                        userId: userData.id,
                        userAvatar: userData.profile,
                        password: userData.password,
                        isLogin: true,
                      },
                    })
                    setBtnLoading(false)
                  }, 2500)
                } else {
                  //跳转创建页
                  setBtnLoading(false)
                  props.optionWindow('createGuide')
                }
              } else {
                //存在企业邀请
                setBtnLoading(false)
                props.optionWindow('invitation')
              }

              // 登录成功，初始标签配置
              initModuleTagSetting({
                userId: userData.id,
              })
            })
            // 登录成功清空轮询
            timerWeChat && clearInterval(timerWeChat)
            // 登录成功关闭二维码扫码窗口
            ipcRenderer.send('close_we_chat_scan')
            // 微信扫码登录，不记录至本地
            if (!isWeChat) {
              folderCheck({
                password: values.password,
                userAccount: values.account,
                userName: userData.username,
                rember: form.getFieldsValue().rember,
              })
            }
            // }
            // 登录成功进入系统后提前创建一些必要的窗口 初始化窗口
            // $tools.windowsInit()
            // 提前加载报告、审批、公告独立页面
            $tools.windowsInit(['WorkReport', 'Approval', 'AddModalWin'])
            //下载字体包
            if (process.platform != 'darwin') {
              downloadFontsZip()
            }
          })
          .catch(err => {
            message.error(err?.returnMessage || '查询个人信息失败')
            setBtnLoading(false)
          })
      })
      .catch(err => {
        setBtnLoading(false)
        message.error(err.returnMessage || '登录失败')
      })
  }

  //是否记住密码
  const onChangeRemember = (e: { target: { checked: any } }) => {
    form.setFieldsValue({
      rember: e.target.checked,
    })
    // setIsRemember(e.target.checked)
  }

  // 记住密码处理
  const folderCheck = (userData: any) => {
    writeAccount(userData)
  }

  const writeAccount = (userData: any) => {
    /**
     * 写入账号密码
     * @param userData 写入的账密数据
     */
    const _data = {
      userName: userData.userName || '', //名字
      userAccount: userData.userAccount, //账号
      password: userData.rember ? cipher(userData.password) : '', //密码(勾上记住密码才存密码，否则只存账号)
      rember: Boolean(userData.rember),
      loginTime: new Date().valueOf(),
    }
    // 查本地数据库
    findLocalLoginMsg(userData.userAccount).then(localRes => {
      if (!localRes) {
        // 当数据不存在时，做INSERTE操作
        inserteLocalLoginMsg(_data)
      } else {
        // 当数据存在时，做UPDATE操作
        upateLocalLoginMsg(_data)
      }
    })
  }

  const weChatScan = async () => {
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
    axios({
      method: 'post',
      url: `${protocol}${host}/team/weChatLogin/getWeChatLoginInfo`,
      headers: {
        loginToken: $store.getState().loginToken,
      },
      data: formData,
      // formData: true,
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
        props.history.push('/login')
        const param = {
          password: resData.data.password,
          account: resData.data.account,
        }
        loginIn(param, 'isWeChat')
      }
      // 未绑定用户
      if (resData.returnCode == 2) {
        timerWeChat && clearInterval(timerWeChat)
        ipcRenderer.send('close_we_chat_scan')
        props.showWeChatForm(true)
        $store.dispatch({
          type: 'WE_CHAT_USER_INFO',
          data: {
            weChatUnionId: resData.data.weChatUnionId,
            headimgurl: resData.data.headImgUrl,
            nickname: resData.data.nickname,
          },
        })
      }
      return
    })
  }

  /**
   * 写入文件
   */
  function writeFile(cont: any) {
    fs.writeFile(_path, cont, function(err: any) {
      if (!err) {
        // throw err;
      }
    })
  }

  const handleChange = (value: string, option: any) => {
    // 账号改变
    if (value === undefined || !value || value === '' || value === null) {
      // setIsRemember(false)
      form.setFieldsValue({
        rember: false,
        password: '',
      })
    } else if (option && option.value !== undefined && value === option.value) {
      // setIsRemember(option.rember)
      form.setFieldsValue({
        rember: option.rember,
        account: option.value,
        password: decipher(option.password),
      })
    }
  }

  const qrLoginImg = $tools.asAssetsPath('/images/login/to_qrcode.png')
  const [form] = Form.useForm()

  return (
    <Form
      form={form}
      name="normal_login"
      className="login-form"
      onFinish={onFinishLogin}
      initialValues={form.getFieldsValue()}
    >
      {!props.isWeChatLogin && (
        <Tooltip placement="left" title="扫码登录" color="#4285F4">
          <div className="qrCode" onClick={props.hideLoginForm}>
            <img src={qrLoginImg} alt="" />
          </div>
        </Tooltip>
      )}
      <div className="login_tit">{$intl.get('loginTo')}</div>
      <Form.Item
        validateTrigger="onBlur"
        name="account"
        rules={[
          { required: true, message: '请输入账号' },
          {
            validator: (_, value) => {
              if (!value || $tools.regPhone.test(value) || $tools.regEmail.test(value)) {
                return Promise.resolve()
              }
              return Promise.reject('请输入正确的账号')
            },
          },
        ]}
        getValueFromEvent={e => {
          // 禁止输入空格（检测到输入空则则替换空格）
          if ($tools.regSpace.test(e)) {
            return e.replace($tools.regSpace, '')
          } else {
            return e
          }
        }}
      >
        <AutoComplete
          maxLength={25}
          className="user-list-droplist"
          dropdownClassName={'account-dropdown'}
          allowClear
          onClear={() => {
            form.setFieldsValue({
              password: '',
            })
          }}
          clearIcon={<span className="input_clear_icon"></span>}
          options={options}
          // value={form.getFieldValue('account')}
          filterOption={(inputValue: any, option: any) => {
            // console.log('filterOption:', inputValue)
            return option?.value?.toUpperCase()?.indexOf(inputValue?.toUpperCase()) !== -1
          }}
          onSelect={account => {
            getPasswordByAccount(account)
          }}
          onKeyUp={(e: any) => {
            const value: any = $(e.currentTarget)
              .find('input')
              .val()
            handleChange(value, options)
          }}
        >
          <Input
            // prefix={<ShakeOutlined className="site-form-item-icon" />}
            prefix={<span className="phone_icon"></span>}
            placeholder="请输入账号"
            size="large"
            maxLength={25}
          />
        </AutoComplete>
      </Form.Item>
      <Form.Item
        className="login_pass_item"
        validateTrigger="onBlur"
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          // {
          //   pattern: /^[0-9a-zA-Z]{6}$/,
          //   message: '密码格式不正确，请输入6位字母或数字',
          // },
        ]}
      >
        <Input
          className="login_pass_inp"
          // prefix={<LockOutlined className="site-form-item-icon" />}
          prefix={<span className="password_icon"></span>}
          type={passVisible ? 'text' : 'password'}
          placeholder="请输入密码"
          maxLength={20}
          // minLength={8}
          size="large"
          suffix={
            <>
              <span
                className="input_clear_icon pass_clear_icon"
                onClick={() => {
                  // setIsRemember(false)
                  form.setFieldsValue({
                    rember: false,
                    password: '',
                  })
                }}
              ></span>
              {passVisible ? (
                <span
                  className="pass_show_icon"
                  onClick={() => {
                    setPassVisible(false)
                  }}
                ></span>
              ) : (
                <span
                  className="pass_hide_icon"
                  onClick={() => {
                    setPassVisible(true)
                  }}
                ></span>
              )}
            </>
          }
        />
      </Form.Item>
      {!props.isWeChatLogin && (
        <Form.Item>
          <Row>
            <Col span={12}>
              {/* <Form.Item name="rember" noStyle>
                <Checkbox className="login-form-remenber" onChange={onChangeRemember} checked={Boolean(rember)}>
                  记住密码
                </Checkbox>
              </Form.Item> */}
              <Form.Item className="login-form-remenber" name="rember" valuePropName="checked" noStyle>
                <Checkbox onChange={onChangeRemember}>记住密码</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <span className="link" onClick={() => props.showForgetPwdForm(true)}>
                忘记密码
              </span>
            </Col>
          </Row>
        </Form.Item>
      )}
      {/* <Form.Item>
        <Form.Item name="rember" valuePropName="checked" noStyle>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <a className="login-form-forgot" href="">
          Forgot password
        </a>
      </Form.Item> */}

      <Form.Item shouldUpdate={true}>
        {() => (
          <Button
            className="login-form-button login-form-button8"
            type="primary"
            htmlType="submit"
            loading={btnLoading}
            // disabled={
            //   !form.isFieldsTouched(['account', 'password']) ||
            //   form.getFieldsError().filter(({ errors }) => errors.length).length !== 0
            // }
            // 不好用 去掉
            // disabled={formSubmitEnable({ parentNode: '#normal_login', submitNode: '.login-form-button' })}
          >
            {props.isWeChatLogin ? '登录并绑定' : '登录'}
          </Button>
        )}
      </Form.Item>
      {/* <div className="login-no-account">
        <div className="register-box">
          <span>使用其他方式登录</span>
          <span className="link" onClick={() => props.showRegisterForm(true)}>
            &nbsp;注册新账户
          </span>
        </div>
      </div> */}
      {/* mac 微信登录入口屏蔽 */}
      {!props.isWeChatLogin && process.platform != 'darwin' && (
        <div className="weChat-login">
          <Button
            icon={<img src={$tools.asAssetsPath('/images/login/weChatLoginIn.png')} />}
            className="weChat-login-link"
            onClick={() => {
              form.resetFields()
              weChatScan()
            }}
          ></Button>
        </div>
      )}
    </Form>
  )
}

//加密
export const cipher = function(buf: string) {
  // const str = JSON.stringify(buf) //明文
  const enc = CryptoJs.AES.encrypt(buf, 'ckckckckck007').toString()
  return enc
}

//解密
export const decipher = function(buf: any) {
  //buf是加密后的结果
  const secret = 'ckckckckck007'
  const decipher = CryptoJs.AES.decrypt(buf, secret)
  const dec = decipher.toString(CryptoJs.enc.Utf8)
  if (dec.length > 8 && $tools.isJsonString(dec)) {
    return JSON.parse(dec)
  } else {
    return dec
  }
}

//调用登录接口 isMd5:已经是加密
export const loginSystem = (account: string, password: string, isMd5?: string) => {
  // version
  return new Promise<any>((resolve, reject) => {
    const param = {
      username: account,
      password: isMd5 ? password : md5(password),
      system: 'oa',
    }
    $api
      .request('/login', param, { headers: { type: 'client' }, formData: true })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询个人信息
export const getAccountInfo = (account: string, loginToken: string) => {
  return new Promise<any>((resolve, reject) => {
    $api
      .request(
        '/team/user/find/account',
        {
          account: account,
          system: 'oa',
        },
        { headers: { loginToken: loginToken }, formData: true }
      )
      .then(async resData => {
        //登录后查询企业列表
        const { id, account } = resData.data
        await getNewTeamList(id, account, loginToken).then(data => {
          $store.dispatch({ type: 'SAVE_TEAM_LIST_INFO', data: data })
          //设置企业列表信息
          const nowDate = new Date().getTime()
          const paramData = data.map((item: any) => {
            return { ...item, timestamp: nowDate }
          })
          $store.dispatch({ type: 'SAVE_ORGINFO', data: { orgInfo: paramData } })
        })
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//查询当前账号企业邀请状态
export const queryInvitationState = (account: string, loginToken: string) => {
  return new Promise<any>((resolve, reject) => {
    $api
      .request(
        '/team/invite/findAllInviteInfoModel',
        {
          userAccount: account,
        },
        {
          headers: { loginToken: loginToken },
          formData: true,
        }
      )
      .then(resData => {
        if (resData.returnCode === 0) {
          resolve(resData)
        } else {
          reject(resData)
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}
//查询企业信息
export const findEnterpriseList = (account: string) => {
  const { loginToken } = $store.getState()
  return new Promise<any>((resolve, reject) => {
    $api
      .request(
        '/team/enterpriseInfo/findEnterpriseList',
        {
          account: account,
          isUserInfo: 1,
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

//查询企业信息
export const getNewTeamList = (userId: number, account: string, loginToken: string) => {
  return new Promise<any>((resolve, reject) => {
    const params = {
      type: -1,
      userId: userId,
      username: account,
    }
    $api
      .request('/team/enterpriseInfo/newQueryTeamList', params, {
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken,
        },
      })
      .then(resData => {
        resolve(resData.dataList)
      })
      .catch(err => {
        reject(err)
      })
  })
}

/**
 * 表单提交按钮是否可用
 */
export const formSubmitEnable = ({ parentNode, submitNode, onInput }: any): any => {
  let disable = false
  $(parentNode)
    .find('input:not(.ant-select-selection-search-input),textarea')
    .each((_: number, node: any) => {
      if ($(node)[0].type != 'file' && $(node).val() == '') {
        disable = true
      }
    })
  if (onInput) {
    if (disable) {
      $(submitNode).attr('disabled', 'true')
    } else {
      $(submitNode).removeAttr('disabled')
    }
  }

  return disable
}
export default LoginForms

// 根据用户名查询本地数据
export const findLocalLoginMsg = (userAccount?: any) => {
  return new Promise(resolve => {
    const _data = userAccount
      ? `SELECT * FROM login_message WHERE userAccount = '${userAccount}'`
      : 'SELECT * FROM login_message ORDER BY loginTime DESC'
    db.all(_data).then((resData: any) => {
      if (resData && resData.length) {
        // 已经存在数据
        resolve(resData)
      } else {
        // 没有数据
        resolve(null)
      }
    })
  })
}

// 插入数据
export const inserteLocalLoginMsg = (params: any) => {
  db.db.serialize(function() {
    db.run('BEGIN')
    const stmt = db.db.prepare(
      'INSERT INTO login_message (id,userAccount,userName, password,rember,loginTime) VALUES (?, ?, ?, ?,?,?)'
    )
    // for (let i = 0; i < params.length; i++) {
    stmt.run([null, params.userAccount, params.userName, params.password, params.rember, params.loginTime])
    // }
    stmt.finalize()
    db.run('COMMIT')
  })
}

// 更新数据
export const upateLocalLoginMsg = (params: any) => {
  db.run(`UPDATE login_message set userName=?,password=?,rember=?,loginTime=? WHERE userAccount=?`, [
    params.userName,
    params.password,
    params.rember,
    params.loginTime,
    params.userAccount,
  ])
    .then(() => {
      // 更新数据成功
      // console.log('更新数据成功')
    })
    .catch((err: any) => {
      // 更新数据失败
      // console.log('更新数据失败')
    })
}

// 删除数据
export const deleteLocalLoginMsg = (params: any) => {
  const _data = `DELETE FROM login_message WHERE userAccount = '${params}'`
  db.all(_data)
    .then((res: any) => {
      // 删除数据成功
    })
    .catch((err: any) => {
      //删除数据失败
    })
}
/**
 * 获取字体路径
 * 如果AppData不存在，就用根目录，如果根目录不存在，就用运行路径
 * @returns
 */
// const getFontsPath = () => {
//   let appdatapath = process.env.AppData
//   if (appdatapath == undefined) {
//     appdatapath = process.env.HOMEDRIVE ?? process.cwd()
//   }
//   return appdatapath
// }

export const downloadFontsZip = () => {
  const zipName = 'officeFonts.zip'
  // const parentPath = path.join(getFontsPath(), 'holder-officeFonts') //path.join(process.cwd(), 'officeFonts')
  const parentPath = path.join(process.cwd(), 'officeFonts')
  try {
    //创建存放字体文件的文件夹
    if (!fs.existsSync(parentPath)) {
      fs.mkdirSync(parentPath)
    }
    //字体下载成功文件
    const successFilePath = path.join(parentPath, 'success.txt')
    if (fs.existsSync(successFilePath)) {
      return
    }
    //字体压缩包路径
    const saveFilePath = path.join(parentPath, zipName)
    if (fs.existsSync(saveFilePath)) {
      fs.unlinkSync(saveFilePath)
    }
    //临时路径
    const zipUrl = `${process.env.API_FILE_HOST}/Fonts/officeFonts.zip`
    //请求下载
    const queryPrams: any = {
      method: 'GET',
      uri: zipUrl,
    }
    //创建临时文件
    if (!fse.existsSync(saveFilePath)) {
      fse.createFileSync(saveFilePath)
    }
    const req = request(queryPrams)

    //创建临时文件的文件流
    const out = fs.createWriteStream(saveFilePath)
    //写入文件流
    req.pipe(out)
    //下载完成
    req.on('end', function() {
      //下载完成后，将临时文件地址修改为正式的
      // fs.renameSync(tmpPath, saveFilePath)
      compressing.zip
        // .uncompress('officeFonts/' + zipName, 'officeFonts/')
        .uncompress(saveFilePath, parentPath)
        .then(() => {
          //这里解压很慢，解压后的操作可以放在这里
          fs.unlinkSync(saveFilePath)
          fse.writeFile(path.join(parentPath, 'success.txt'), 'Download font successfully')
        })
        .catch((err: any) => {
          console.log(err)
        })
    })
    //下载失败
    req.on('error', function(err: any) {
      console.log(err)
    })
  } catch (err) {
    console.log('下载字体出错啦')
    console.log(err)
  }
}
