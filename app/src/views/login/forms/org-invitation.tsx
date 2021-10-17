/**
  登录，注册后引导组件
  校验是否存在企业邀请是否已加入企业等一系列操作...
  chengzq(create by 2020/12/17)
 */
import React, { useState, useEffect } from 'react'
import { Button, List, Form, Input, Select, message, Tooltip, Avatar, Spin } from 'antd'
import { RightOutlined, CaretDownOutlined } from '@ant-design/icons'
import { useMergeState } from '../../chatwin/ChatWin'
import { acceptInvite } from '../../workdesk/getData'
import { ipcRenderer } from 'electron'
import { findEnterpriseList } from './loginForm'
import CropperModal from '@/src/components/CropperModal/index'
import $c from 'classnames'
import '../login.less'
import { getTimeRolate } from '../login'
import UploadFile from '@/src/components/upload-file'
const Option = Select.Option
const LAYOUT = { wrapperCol: { span: 20 }, labelCol: { span: 4 } }
// const code = ['createGuide', 'createOrg']
interface AvatarProps {
  imgSrc: string
  imgSize: number
}
interface Props extends PageProps {
  userState: string
  inviOrgList: any
  userData: any
  optionWindow: (str: string, flag?: boolean) => void
}
// 缓存当前输入框value
let _textArea = ''

//入口
const InvitationOrg: React.FC<Props> = (props: any) => {
  //注:(invitation=邀请,createGuide=创建引导,createOrg=创建企业)
  const { userState, userData, inviOrgList } = props
  const { loginToken } = $store.getState()
  const [form] = Form.useForm()
  //行业信息
  const [tradeData, setTradeData] = useState<any>([])
  //加载行业信息loading
  const [loading, setloading] = useState(false)
  //邀请企业列表
  const [inviData, setInviData] = useState<any>([])
  //邀请企业默认头像
  const defaltOrg = $tools.asAssetsPath(`/images/login/defalt-org.svg`)
  //创建企业默认头像
  const uploadIcon = $tools.asAssetsPath(`/images/login/upload-icon.png`)
  //图片裁剪窗口
  const [modalVisible, setModalVisible] = useState(false)
  //创建按钮加载loading
  const [btnLoading, setBtnLoading] = useState(false)
  //进入首页loading
  // const [jumpLoading, setJumpLoading] = useState(false)
  // 描述
  // const [describe, setDescribe] = useState('')
  //创建企业参数
  const [formData, setFormData] = useMergeState({
    id: '',
    logoPath: '', //企业logo地址
    name: '', //企业名称
    shortName: '', //企业简称
    trade: 1, //所属行业
    description: '', //企业描述
    responsibleUserId: userData.id, //企业负责人id
    responsibleUserName: userData.account, //企业负责人账号
    attachInfoId: '',
  })
  //进入动画状态设置
  const [animate, setAnimate] = useState(false)
  //初始化
  useEffect(() => {
    setInviData(inviOrgList)
    if (userState === 'createOrg') {
      setloading(true)
      queryTrade().then((res: any) => {
        const tradeList = res.dataList || []
        setTradeData(tradeList)
        setloading(false)
      })
    }
    if (userState === 'createGuide' || userState === 'invitation') {
      setAnimate(true)
    }
    // else {
    //   setAnimate(false)
    // }
  }, [userState])

  /**
   * 企业LOGO上传成功后的回调
   * @param logoPath 图片地址
   */
  const uploadSuccess = (logoPath: string) => {
    setFormData({ ...formData, logoPath })
    setModalVisible(false)
  }

  //进入首页前查询是否加入了企业
  const getInHome = () => {
    //进入首页之前校验是否加入了企业
    findEnterpriseList(userData.account).then((res: any) => {
      const list = res.dataList || []
      console.log('当前用户存在的企业个数', list.length)
      if (list.length === 0) {
        //企业创建引导页面
        props.optionWindow('createGuide')
      } else {
        jumpWorkDesk()
      }
    })
  }

  /**
   * 同意/拒绝加入企业操作
   * @param result 0同意,4拒绝
   * @param id 邀请企业ID
   */
  const joinTeam = (result: number, id: number) => {
    acceptInvite({
      id: id,
      result: result,
      userId: userData.id,
    }).then(
      (res: any) => {
        if (res.returnCode == 0) {
          changeDataState(id, result)
          if (!checkDataState(id)) {
            //跳转首页
            getInHome()
          }
          message.success(result === 0 ? `成功加入团队` : `拒绝加入团队`)
        }
      },
      err => {
        message.error(err.returnMessage)
        // 如果邀请失效,则移除当前邀请
        const _inviData = changeDataState(id, -1)
        //判断是否处理完毕
        if (
          _inviData.filter((item: any) => {
            return item.result == 5
          }).length == 0
        ) {
          getInHome()
        }
      }
    )
  }

  /**
   * 校验是否还有未处理的数据
   * @param id
   */
  const checkDataState = (id: number) => {
    const newData = [...inviData]
    let hasWait = false
    for (let i = newData.length; i--; ) {
      if (newData[i].id !== id && newData[i].result == 5) {
        //说明还有待处理的数据
        hasWait = true
        break
      }
    }
    return hasWait
  }

  /**
   * 同意/拒绝后同步更新DOM展示
   * @param id 邀请企业ID
   * @param result 0同意,1拒绝 -1已失效
   */
  const changeDataState = (id: number, result: number) => {
    const newData = [...inviData]

    for (let i = newData.length; i--; ) {
      if (newData[i].id === id) {
        if (result == -1) {
          newData.splice(i, 1)
        } else {
          newData[i].result = result
        }
        break
      }
    }
    setInviData(newData)
    return newData
  }

  //查询行业信息
  const queryTrade = () => {
    const _NULL: any = null
    return new Promise<any>((resolve, reject) => {
      $api
        .request('/team/enterpriseInfo/getTradeInfo', _NULL, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(data => {
          data.returnCode === 0 ? resolve(data) : reject(data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  //创建企业
  const createCompany = (params: any) => {
    const { loginToken } = $store.getState()
    const headers = {
      loginToken: loginToken,
      'Content-Type': 'application/json',
    }
    return new Promise((resolve, reject) => {
      $api
        .request('/team/enterpriseInfo/addEnterpriseInfo', params, {
          headers: headers,
        })
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  const createOrg = (values: any) => {
    const params: any = { ...formData, ...values }
    // params.description = $('.teamDescribe>textarea').text()
    params.description = _textArea
    setBtnLoading(true)
    createCompany(params).then(
      (res: any) => {
        if (res.returnCode === 0) {
          message.success('创建成功！')
          setBtnLoading(false)
          jumpWorkDesk()
          _textArea = ''
        }
      },
      err => {
        setBtnLoading(false)
        message.error(err.returnMessage)
      }
    )
  }

  //校验表单
  const checkFormFill = () => {
    // 触发表单验证
    form
      .validateFields()
      .then(values => {
        createOrg(values)
      })
      .catch(errorInfo => {
        // const { values } = errorInfo
        // const { name, shortName } = values
        // if (name == '' || shortName == '') {
        //   message.error('请输入必填项!')
        // }
      })
  }

  //跳转到工作台
  const jumpWorkDesk = () => {
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
    ipcRenderer.send('update_unread_num', ['']) //刷新工作台
  }

  //*===============企业邀请模块=======================*//
  const InvitationSub = () => {
    return (
      <div className="section">
        <div className="in-title flex between">
          <div>
            <div className="back_btn forcedHide" onClick={() => goBack()}>
              <em className="img_icon back_icon"></em>
            </div>

            <span>以下团队要邀请你加入</span>
          </div>
          <div className="in-home-link">
            <span onClick={() => getInHome()}>
              进入企业
              <RightOutlined />
            </span>
          </div>
        </div>
        <div className="in-org-list">
          <List
            dataSource={inviData}
            renderItem={(item: any, index: number) => (
              <div className="org-item" key={index}>
                <div className="org-info">
                  <AvatarPhoto imgSrc={!item.logo ? defaltOrg : item.logo} imgSize={42} />
                  <Tooltip placement="topLeft" title={item.dept}>
                    <div className="org-name">
                      {' '}
                      {item.dept.length > 10 ? item.dept.substring(0, 9) + '...' : item.dept}
                    </div>
                  </Tooltip>
                </div>
                {item.result === 5 && (
                  <div className="org-state">
                    <Button type="primary" onClick={() => joinTeam(0, item.id)}>
                      同意
                    </Button>
                    {/* <Button type="primary" ghost onClick={() => joinTeam(4, item.id)}>
                      {' '}
                      拒绝
                    </Button> */}
                  </div>
                )}
                {(item.result === 0 || item.result === 4) && (
                  <div className="org-state">
                    <span
                      className={$c({
                        agree: item.result === 0,
                        refuse: item.result === 4,
                      })}
                    >
                      {item.result === 0 ? '已同意' : '已拒绝'}
                    </span>
                  </div>
                )}
                {/* 拒绝 */}
                {item.result === 5 && (
                  <span
                    className="img_icon invit_refuse"
                    // onClick={() => joinTeam(4, item.id)}
                    onMouseEnter={e => {
                      refruseBoxVisible(e)
                    }}
                  ></span>
                )}

                {/* 拒绝二次提醒弹框 */}
                <div className="refuseInviteBox">
                  <div className="refuseInviteBoxIn">
                    <h3 className="refuseTit">拒绝加入该团队？</h3>
                    <div className="buttonGroup">
                      <button
                        className="opt_btn cancel_btn"
                        onClick={e => {
                          $('.refuseInviteBox').hide()
                        }}
                      >
                        取消
                      </button>
                      <button
                        className="opt_btn sure_btn"
                        onClick={() => {
                          $('.refuseInviteBox').hide()
                          joinTeam(4, item.id)
                        }}
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                  <span className="img_icon top_arrow"></span>
                </div>
              </div>
            )}
          ></List>
        </div>
      </div>
    )
  }

  const refruseBoxVisible = (e: any) => {
    $('.refuseInviteBox').hide()
    const offset: any = $(e.currentTarget).offset()
    $(e.currentTarget)
      .parents('.org-item')
      .find('.refuseInviteBox')
      .css({ left: offset.left + 44 + 'px', top: offset.top + 'px' })
      .show()
  }

  //*===============创建团队引导模块=======================*//
  const CreateGuideSub = () => {
    return (
      <div className="create-guide">
        <div className="create_guide_tit">
          <div className="back_btn" onClick={() => goBack()}>
            <em className="img_icon back_icon"></em>
          </div>
          <span>加入团队</span>
        </div>
        <div className="head-title">你还未加入任何团队，你可以请管理员把你加入一个团队</div>
        {/* <div className="guide-content" onClick={() => props.optionWindow('createOrg')}>
          <div className="guide-tips">
            <h3 className="guide_tip_h1">新团队创建后，你将成为管理员</h3>
            <div className="guide-tip-cont">可添加成员、管理组织构架，全面使用团队协作功能</div>
            <span className="guide_create_btn">创建新团队</span>
          </div>
        </div> */}
      </div>
    )
  }
  //*===============创建企业模块=======================*//
  const CreateOrgSub = () => {
    return (
      <Spin spinning={loading} tip="加载行业信息！请稍后..." wrapperClassName="createOrgLoad">
        <div className="create-org flex column center-h">
          <div className="contentTit">
            <div className="org-title">
              <div className="back_btn" onClick={() => goBack()}>
                <em className="img_icon back_icon"></em>
              </div>
              <span>创建团队</span>
            </div>
          </div>
          <div className="contentBox flex center-h">
            <div className="contentLeft flex-1">
              <div className="org-logo">
                <label className="team_logo_label ant-col-4">团队logo</label>
                <div className="flex center-v">
                  <UploadFile
                    fileModels={[]}
                    dir="team"
                    showText=""
                    showIcon={true}
                    showUploadList={false}
                    filesUploaded={(filesList: any) => {
                      uploadSuccess(filesList[0] ? filesList[0].imgUrl : '')
                    }}
                    fileIcon={
                      <div className="up-logo">
                        <AvatarPhoto imgSrc={formData.logoPath ? formData.logoPath : uploadIcon} imgSize={56} />
                        <span className="img-title">上传图片</span>
                      </div>
                    }
                  />
                  <div className="up-logo-tip">
                    {/* <div>团队logo</div> */}
                    <div>仅支持JPJ、PNG、BMP</div>
                  </div>
                </div>
              </div>
              <div className="org-form">
                <Form
                  {...LAYOUT}
                  name="nest-messages"
                  onFinish={createOrg}
                  form={form}
                  initialValues={formData}
                >
                  <Form.Item
                    name="name"
                    label="团队名称"
                    validateTrigger="onBlur"
                    rules={getRules('请输入团队名称')}
                  >
                    <Input
                      maxLength={32}
                      autoComplete="off"
                      className="baseInput"
                      placeholder="请输入团队名称"
                    />
                  </Form.Item>
                  <Form.Item
                    name="shortName"
                    label="团队简称"
                    validateTrigger="onBlur"
                    rules={getRules('请输入团队简称')}
                  >
                    <Input
                      maxLength={32}
                      autoComplete="off"
                      className="baseInput"
                      placeholder="请输入团队简称"
                    />
                  </Form.Item>
                  <Form.Item
                    name="trade"
                    label="所属行业"
                    validateTrigger="onBlur"
                    rules={getRules('请选择所属行业')}
                  >
                    <Select
                      placeholder="请选择所属行业"
                      suffixIcon={<CaretDownOutlined />}
                      dropdownClassName="tradeSelectOpn"
                    >
                      {tradeData.map((item: any, index: number) => {
                        return (
                          <Option value={item.code} key={index}>
                            {item.name}
                          </Option>
                        )
                      })}
                    </Select>
                  </Form.Item>
                </Form>
              </div>
            </div>
            <div className="contentRight">
              <Input.TextArea
                defaultValue={_textArea}
                className="teamDescribe"
                // value={describe}
                style={{ height: '309px' }}
                placeholder={$intl.get('inputCmyDesMsg')}
                maxLength={500}
                showCount={{
                  formatter: ({ count, maxLength }: { count: number; maxLength?: number }) => {
                    return count + '/' + maxLength
                  },
                }}
                onChange={e => {
                  _textArea = e.target.value
                }}
              ></Input.TextArea>
            </div>
          </div>
          <div className="create-btn">
            <Button
              id="invitationSubmit"
              type="primary"
              htmlType="submit"
              loading={btnLoading}
              onClick={checkFormFill}
            >
              创建
            </Button>
          </div>
        </div>
      </Spin>
    )
  }

  const goBack = () => {
    props.optionWindow('invitation', true)
  }
  const loginBgPart1 = $tools.asAssetsPath('/images/login/login_bg_part1.png')
  const loginBgPart2 = $tools.asAssetsPath('/images/login/login_bg_part2.png')
  const loginBgPart3 = $tools.asAssetsPath('/images/login/login_bg_part3.png')
  const loginBgPart4 = $tools.asAssetsPath('/images/login/login_bg_part4.png')
  const loginBgAnt2 = $tools.asAssetsPath('/images/login/login_bg_ant2.png')
  const bgMouse = $tools.asAssetsPath('/images/login/mouse.png')
  const nowTime = getTimeRolate()
  return (
    <div className="invitationWrap">
      {/* {code.includes(userState) && (
        <span className="go_back" onClick={() => goBack()}>
          <i></i>返回
        </span>
      )} */}
      <div className="invitation-container" id="invitationContainer">
        {userState !== 'createOrg' && (
          <div className="in-icon contentLeft">
            <div className="contentLeftIn">
              <img
                src={loginBgPart1}
                alt=""
                className={`login_bg_part login_bg_part1 ${animate ? 'personTopAnt' : ''}`}
              />
              <img
                src={loginBgPart2}
                alt=""
                className={`login_bg_part login_bg_part2 ${animate ? 'personTopAnt' : ''}`}
              />
              <img
                src={loginBgPart3}
                alt=""
                className={`login_bg_part login_bg_part3 ${animate ? 'personTopAnt' : ''}`}
              />
              <img src={loginBgPart4} alt="" className={`login_bg_part login_bg_part4`} />
              <img src={bgMouse} alt="" className="bg_mouse" />
              {/* 钟表 */}
              <div className={`watch_box ${animate ? 'clockAnt' : ''}`}>
                <span className="hour_hand" style={{ transform: `rotate(${nowTime.hourAngle}deg)` }}></span>
                <span className="minute_hand" style={{ transform: `rotate(${nowTime.minAngle}deg)` }}></span>
                <span className="circle_dot"></span>
              </div>
              <div className="login_bg_ant login_bg_ant2">
                <img src={loginBgAnt2} alt="" />
              </div>
            </div>
          </div>
        )}
        <div className="in-content contentRight flex center-h flex-1">
          {/* InvitationSub */}
          {userState === 'invitation' && <InvitationSub />}
          {userState === 'createGuide' && <CreateGuideSub />}
          {userState === 'createOrg' && <CreateOrgSub />}
        </div>
      </div>
      {/* 上传logo */}
      {modalVisible && (
        <CropperModal
          uploadSuccess={uploadSuccess}
          visible={modalVisible}
          closeModal={() => setModalVisible(false)}
        />
      )}
    </div>
  )
}

export default InvitationOrg
//方法抽离
export const getRules = (message: string) => {
  return [{ required: true, message: message }]
}
//抽离头像组件
export const AvatarPhoto = (props: AvatarProps) => {
  return <Avatar shape="square" src={props.imgSrc} size={props.imgSize}></Avatar>
}
