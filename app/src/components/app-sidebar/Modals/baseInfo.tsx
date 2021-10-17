import React, { useState, useEffect } from 'react'
import { Spin, message, Input, Radio, Button, Avatar } from 'antd'
import CropperModal from '@/src/components/CropperModal/index'
import { refreshDeskHeader } from '@/src/views/myWorkDesk/myWorkDeskHeader'
import { refreshDeskAvater } from '../app-sidebar'

interface PostProps {
  main: number
  departName: string
  postName: string
}

interface UserModelProps {
  post: PostProps[]
  leaderInfo: string
  time: string
}

function UserCenter() {
  const { loginToken, nowAccount } = $store.getState()
  // loading状态
  const [loading, setLoading] = useState(false)
  // 用户的基本信息
  const [userInfo, setUserInfo] = useState<any>('')
  const { id, username, email, sex, account, phoneNumber, profile, registerType, thumbsUpNum } = userInfo
  // 公司信息
  const [companyInfo, setCompanyInfo] = useState([])
  // 修改更新的值
  const [value, setValue] = useState<any>('')
  // 修改更新的类型
  const [type, setType] = useState('')
  // 图片裁剪窗口
  const [modalVisible, setModalVisible] = useState(false)

  async function onChange(e: any, type: string) {
    await setValue(e.target.value)
    await setType(type)
    if (type === 'sex') {
      updateUserInfo(e.target.value)
    }
  }

  // 校验
  function validate() {
    // 初始化时 没有改变值没有type ,或者初始化后改变了性别type为sex
    if (!type || type === 'sex') return false
    if (type === 'email') {
      const reg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/
      if (value === '') {
        message.warn('没有输入邮箱信息')
        return false
      } else if (value === email) {
        return false
      } else if (!reg.test(value)) {
        message.warn('邮箱格式错误')
        return false
      }
    } else if (type === 'phoneNumber') {
      const reg = /^[1][3,4,5,7,8][0-9]{9}$/
      if (value === '') {
        message.warn('没有输入手机信息')
        return false
      } else if (value === phoneNumber) {
        return false
      } else if (!reg.test(value)) {
        message.warn('手机号码格式错误')
        return false
      }
    } else if (type === 'username') {
      if (value === '') {
        message.warn('没有输入姓名信息')
        return false
      } else if (value === username) {
        return false
      }
    }
  }

  function updateUserInfo(sexValue?: any, newPropFile?: { profile: string }) {
    // 当不是改变性别时校验改变的值格式是否正确
    if (sexValue === undefined && validate() === false) return
    const params = {
      email,
      id,
      phoneNumber,
      profile: newPropFile ? newPropFile.profile : profile,
      sex,
      username,
    }
    if (sexValue === 0 || sexValue === 1) {
      params['sex'] = sexValue
    } else {
      params[type] = value.replace(/(^\s*)|(\s*$)/g, '')
    }
    console.log(params)
    $mainApi
      .request('/team/user/updateUserInfo', params, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          loginToken: loginToken,
        },
      })
      .then(
        () => {
          setLoading(false)
          message.success('修改成功')
          // if (newPropFile || type === 'username') {
          // }
          getUserInfo()
        },
        (res: any) => {
          setLoading(false)
          message.error(res.returnMessage)
        }
      )
  }

  // 查询企业信息
  function fetchCompanyList() {
    setLoading(true)
    $mainApi
      .request(
        '/team/enterpriseInfo/findEnterpriseList',
        {
          account: nowAccount,
          isUserInfo: 1,
        },
        {
          headers: {
            loginToken: loginToken,
          },
          formData: true,
        }
      )
      .then(res => {
        setLoading(false)
        setCompanyInfo(res.dataList)
      })
      .catch(function(res) {
        setLoading(false)
        message.error(res.returnMessage)
      })
  }

  function getUserInfo() {
    $mainApi
      .request(
        '/team/user/find/account',
        { account: nowAccount, system: 'oa' },
        {
          headers: {
            loginToken: loginToken,
          },
          formData: true,
        }
      )
      .then(
        res => {
          setUserInfo(res.data)
          $store.dispatch({
            type: 'SET_USER_INFO',
            data: res.data,
          })

          $store.dispatch({
            type: 'ACTION_LOGIN',
            data: {
              username: res.data.username,
              account: res.data.account,
              userId: res.data.id,
              userAvatar: res.data.profile,
              isLogin: true,
            },
          })
          console.log(res.data)

          refreshDeskAvater && refreshDeskAvater({ newAvatar: res.data.profile, sex: res.data.sex })
        },
        err => {
          message.error(err.returnMessage)
        }
      )
  }

  const uploadSuccess = (profile: string) => {
    updateUserInfo('', { profile })
    setModalVisible(false)
  }

  useEffect(() => {
    getUserInfo()
    fetchCompanyList()
  }, [])

  return (
    <Spin spinning={loading}>
      {userInfo && (
        <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
          <div className="userHead">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* {profile ? <Avatar size={64} src={profile} /> : <span className="noProfile">{username}</span>} */}
              <Avatar
                size={64}
                src={profile}
                className="user-avatar"
                style={{ color: '#fff', fontSize: '14px', backgroundColor: '#4285f4' }}
              >
                {username && username.substr(-2, 2)}
              </Avatar>
              <div className="btns">
                <div>
                  <Button onClick={() => setModalVisible(true)}>{profile ? '更换头像' : '上传头像'}</Button>
                  {profile && (
                    <Button
                      onClick={() => {
                        updateUserInfo('', { profile: '' })
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      恢复头像
                    </Button>
                  )}
                </div>
                <div style={{ marginTop: '8px' }}>仅支持JPG、PNG格式上传</div>
              </div>
            </div>
            {/* 点赞数 */}
            <div>
              <img src={$tools.asAssetsPath('/images/company/figure_icon.png')} />
              <div>{thumbsUpNum}</div>
            </div>
          </div>

          <div className="infoContent">
            <div className="infoDetail">
              <div>
                <span>姓名</span>
                <Input
                  defaultValue={username}
                  // value={type === 'username' ? value : username}
                  onChange={e => onChange(e, 'username')}
                  onBlur={() => {
                    updateUserInfo()
                  }}
                  onPressEnter={() => {
                    updateUserInfo()
                  }}
                  maxLength={16}
                />
              </div>
              <div>
                <span>邮箱</span>
                {registerType === 1 ? (
                  <span>{type === 'email' ? value : email}</span>
                ) : (
                  <Input
                    disabled={registerType === 1 ? true : false}
                    defaultValue={email}
                    // value={type === 'email' ? value : email}
                    onChange={e => onChange(e, 'email')}
                    onBlur={() => {
                      updateUserInfo()
                    }}
                    onPressEnter={() => {
                      updateUserInfo()
                    }}
                  />
                )}
              </div>
              <div>
                <span>性别</span>
                <Radio.Group value={type === 'sex' ? value : sex} onChange={e => onChange(e, 'sex')}>
                  <Radio value={0}>男</Radio>
                  <Radio value={1}>女</Radio>
                </Radio.Group>
              </div>
              <div>
                <span>注册账号</span>
                {account}
              </div>
              <div>
                <span>手机</span>
                {registerType === 0 ? (
                  <span>{type === 'phoneNumber' ? value : phoneNumber}</span>
                ) : (
                  <Input
                    disabled={registerType === 0 ? true : false}
                    defaultValue={phoneNumber}
                    // value={type === 'phoneNumber' ? value : phoneNumber}
                    onChange={e => onChange(e, 'phoneNumber')}
                    onBlur={() => updateUserInfo()}
                    onPressEnter={() => {
                      updateUserInfo()
                    }}
                    maxLength={11}
                  />
                )}
              </div>
            </div>

            {companyInfo &&
              companyInfo.map((item: { id: number; shortName: string; userModel: UserModelProps }) => {
                const post = item.userModel.post
                const { departName = '', postName = '', main = '' } = post.length > 0 ? post[0] : {}
                return (
                  <div key={item.id} className="infoDetail">
                    <div className="companyName">{item.shortName}</div>
                    <div>
                      <span>所属部门/岗位</span>
                      {main === 1 && <em>主</em>}
                      {departName}-{postName}
                    </div>
                    <div>
                      <span>直接上级</span>
                      {item.userModel.leaderInfo ? item.userModel.leaderInfo : '-'}
                    </div>
                    <div>
                      <span>入职日期</span>
                      {item.userModel.time}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {modalVisible && (
        <CropperModal
          uploadSuccess={uploadSuccess}
          visible={modalVisible}
          closeModal={() => setModalVisible(false)}
        />
      )}
    </Spin>
  )
}

export default UserCenter
