import React from 'react'
import { Redirect } from 'react-router-dom'
import { ipcRenderer, remote } from 'electron'
import { withStore } from '@/src/components'
import LoginForm from './forms/loginForm'
import QrCode from './forms/qrCode'
import ForgetPwdForm from './forms/forgetPwd'
import Rigister from './forms/register'
import './login.less'
import { AutoUpdateModal } from '@/src/components/auto-updater/autoUpdater'
import { findUserUnReadMuc } from '../chat-Tip-Win/getData'
import WeChatLogins from './forms/wechatLogin'
import InvitationOrg from './forms/org-invitation'
import { checkSqliteTable, findUser } from '../chatwin/getData/ChatInputCache'
import { HandleSqliteDB } from '@/src/common/js/sqlite3Db'
import { langTypeHandle, loadLocales } from '@/src/common/js/intlLocales'
import { createDeskTable } from '../workdesk/workDeskLocal'
// import { makeDraggable } from '@/src/common/js/common'
// const { TabPane } = Tabs
//数据库对象
const db = HandleSqliteDB.getInstance()
interface LoginProps extends PageProps, StoreProps {
  isLogin: StoreStates['isLogin']
}

interface LoginState {
  isLoginForm: boolean
  isQr: boolean
  isForgetPwd: boolean
  isRegister: boolean
  checkedKey: string
  sqliteDb: any
  installVisible: boolean
  isShowLoginWrap: boolean
  userState: string
  inviOrgList: Array<any>[]
  userData: {
    //存储一份登录时候获取的用户信息 避免再次请求接口
    username: string
    account: string
    userId: number
    userAvatar: string
    password: string
  }
  isWeChat: boolean
  isWeChatLogin: boolean
  langLoaded?: boolean
}

@withStore(['isLogin'])
export default class Login extends React.Component<LoginProps, LoginState> {
  constructor(props: LoginProps) {
    super(props)
    this.state = {
      isLoginForm: true,
      isQr: false,
      isForgetPwd: false,
      isRegister: false,
      checkedKey: 'PHONE',
      sqliteDb: null,
      installVisible: false,
      isShowLoginWrap: true, //是否显示登录组件
      userState: 'createOrg', //invitation邀请 createGuide创建引导 createOrg创建企业
      inviOrgList: [], //邀请企业列表
      userData: {
        //存储一份登录时候获取的用户信息 避免再次请求接口
        username: '',
        account: '',
        userId: 0,
        userAvatar: '',
        password: '',
      },
      isWeChat: false,
      isWeChatLogin: false,
      langLoaded: false,
    }
  }

  componentDidMount() {
    // 提前创建本地数据库所有表格
    createDeskTable()
    // 清空语言版本缓存，恢复默认
    langTypeHandle({ type: 1, isDef: true })
    // 多语言初始化
    loadLocales().then(() => {
      this.setState({ ...this.state, langLoaded: true })
    })
    // mac自定义可拖拽窗口
    // process.platform == 'darwin' && makeDraggable('#login-container')
  }

  // 初始化数据
  initData = () => {
    const { nowUserId, nowAccount, nowUser, nowAvatar } = $store.getState()
    db.db.serialize(function() {
      /***************创建表之前先校验本地数据库是否存在该表*********************/
      //1.校验聊天室chat_room
      const roomSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'chat_room'`
      checkSqliteTable(roomSql).then((num: any) => {
        if (!num) {
          // 创建聊天室数据表(聊天室roomId为主键,不自增)
          db.run(
            'CREATE TABLE chat_room (userId	INTEGER, roomId	INTEGER,ascriptionName	TEXT, ascriptionId	INTEGER,isTop	INTEGER,isAtMe	INTEGER,roomJid	TEXT, profile	TEXT,remindType	INTEGER,roomName	TEXT,timeStamp	INTEGER, type	INTEGER,typeId	INTEGER,unreadCount	INTEGER,windowClose	INTEGER,leaveTimestamp	INTEGER,PRIMARY KEY(roomId))'
            // 'CREATE TABLE chat_room (roomId primary key INTEGER, ascriptionName	TEXT, ascriptionId	INTEGER, isTop INTEGER, isAtMe INTEGER,roomJid TEXT,profile TEXT, remindType TEXT, roomName	TEXT, timeStamp INTEGER, type INTEGER,typeId INTEGER,unreadCount INTEGER,windowClose INTEGER,userId	INTEGER)'
          )
        }
      })

      //2.校验聊天室消息表chat_message
      const messageSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'chat_message'`
      checkSqliteTable(messageSql).then((num: any) => {
        if (!num) {
          // 创建聊天消息数据表
          db.exec(
            'CREATE TABLE chat_message (msgUuid TEXT,serverTime	INTEGER,type	INTEGER,roomId	INTEGER, messageJson	NUMERIC,isRecall	INTEGER,fromUser	TEXT,stamp	INTEGER,emoticonOperationList	TEXT,sendStatus TEXT,PRIMARY KEY(msgUuid))'
          )
        }
      })
      //2.校验用户表holder_user
      const userSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'holder_user'`
      checkSqliteTable(userSql).then((num: any) => {
        if (!num) {
          // 创建用户表
          db.exec(
            'CREATE TABLE if not exists holder_user (id integer primary key autoincrement, userId integer, userAccount varchar(128), userName varchar(128), userAvatar text)'
          )
        }
      })
      // 缓存用户信息
      findUser(nowUserId, nowAccount).then(res => {
        if (!res) {
          db.run(
            'INSERT INTO holder_user (id, userId, userAccount, userName, userAvatar) VALUES (?, ?, ?, ?, ?)',
            [null, nowUserId, nowAccount, nowUser, nowAvatar]
          )
        }
      })

      //本地创建一张人员头像表，用于缓存聊天室成员ID与头像
      const profileSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'profile_user'`
      checkSqliteTable(profileSql).then((num: any) => {
        if (!num) {
          // 创建沟通头像表
          db.exec('CREATE TABLE profile_user (userId	INTEGER,profile	TEXT,PRIMARY KEY(userId))')
        }
      })
      //沟通聊天室简略消息表
      const briefSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'brief_message'`
      checkSqliteTable(briefSql).then((num: any) => {
        if (!num) {
          // 创建沟通聊天室简略消息表
          db.exec(
            'CREATE TABLE brief_message (msgUuid varchar(128),type INTEGER,fromUser TEXT,messageJson TEXT,serverTime INTEGER,roomId INTEGER,roomType INTEGER,isRecall INTEGER,userId INTEGER,PRIMARY KEY(roomId))'
          )
        }
      })
      //聊天室草稿表
      // room_draft
      const draftfSql = `SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'room_draft'`
      checkSqliteTable(draftfSql).then((num: any) => {
        if (!num) {
          // 创建沟通聊天室简略消息表
          db.exec(
            'CREATE TABLE room_draft (roomId INTEGER,roomJid varchar(128),userId INTEGER,manuscript TEXT,PRIMARY KEY(roomId))'
          )
        }
      })
    })

    // 查询未读闪烁
    findUserUnReadMuc().then((list: any) => {
      if (list.length > 0) {
        ipcRenderer.send('change_tray_icon')
      }
    })

    //请求附件token
    // $store.dispatch({
    //   type: 'FILE_TOKEN',
    //   data: getChatToken(_tokenPatam),
    // })
  }

  render() {
    const { isLogin: loginStatus } = this.props
    // const leftBgImg = $tools.asAssetsPath('/images/login/new_bg-l.png')
    // const rightBgImg = $tools.asAssetsPath('/images/login/new_bg-r.png')
    // const logoImg = $tools.asAssetsPath('/images/login/goalgo.png')
    // const leftBgAll = $tools.asAssetsPath('/images/login/login_left_all.png')
    const logo = $tools.asAssetsPath('/images/login/holder_logo.png')
    const loginBt = $tools.asAssetsPath('/images/login/login_bg3.png')

    const loginBgPart1 = $tools.asAssetsPath('/images/login/login_bg_part1.png')
    const loginBgPart2 = $tools.asAssetsPath('/images/login/login_bg_part2.png')
    const loginBgPart3 = $tools.asAssetsPath('/images/login/login_bg_part3.png')
    const loginBgPart4 = $tools.asAssetsPath('/images/login/login_bg_part4.png')
    const loginBgAnt1 = $tools.asAssetsPath('/images/login/login_bg_ant1.png')
    const loginBgAnt2 = $tools.asAssetsPath('/images/login/login_bg_ant2.png')
    const {
      isLoginForm,
      isQr,
      isForgetPwd,
      isRegister,
      checkedKey,
      isShowLoginWrap,
      userState,
      userData,
      inviOrgList,
      isWeChat,
      isWeChatLogin,
    } = this.state
    if (loginStatus) {
      // 已登录连接im
      $xmpp.LoginXmpp.getInstance()
      // 已登录连接websocket
      $websocket.LoginWebSocket.getInstance()
      this.initData()
      const currentWindow = remote.getCurrentWindow()
      currentWindow.webContents.send('dom-ready', { showSidebar: true, isMain: true })
      // 打开或显示聊天窗口
      ipcRenderer.send('show_commuciate_muc', 'login')
      $tools.createWindow('fileWindow', { sendOptions: 'login' })
      return <Redirect to="/workdesk" />
    }
    const nowTime = getTimeRolate()
    return (
      <div id="login-container" className="login-container">
        {/* holder图标 */}
        <div className="img_icon holder_logo_bg">
          {/* <span className="holder_logo"></span> */}
          <img className="holder_logo" src={logo} alt="" />
        </div>
        <span className="img_icon holder_bg1"></span>
        <span className="img_icon holder_bg2"></span>
        <span className="img_icon holder_bg_top_rig"></span>
        {/* {isShowLoginWrap && (
          <div className="left-cont" style={{ display: isWeChat ? 'none' : 'block' }}>
            <div className="tips-txt">
              <p>目标规划、任务执行、团队协作、工作台视窗，提升经营管理效率，改善业务品质</p>
            </div>
            <div className="left-cont-icon">
              <img src={leftBgImg} alt="" />
            </div>
          </div>
        )} */}
        {isShowLoginWrap && (
          <div className="right-cont flex center-v center-h">
            {isWeChatLogin && (
              <div
                className="cancle_weChatLogin"
                onClick={() => {
                  this.setState({ isWeChatLogin: false, isLoginForm: true, isWeChat: false, isRegister: false })
                }}
              ></div>
            )}
            {/* <div className="logo_box">
              <img src={logoImg} alt="" />
            </div> */}
            {/* <div className="right-cont-bg">
              <img src={rightBgImg} alt="" />
            </div> */}
            <section className="loginContent flex relative">
              <div className="contentLeft">
                {/* <img src={leftBgAll} alt="" /> */}
                <div className="contentLeftIn">
                  <img src={loginBgPart1} alt="" className="login_bg_part login_bg_part1" />
                  <img src={loginBgPart2} alt="" className="login_bg_part login_bg_part2" />
                  <img src={loginBgPart3} alt="" className="login_bg_part login_bg_part3" />
                  <img src={loginBgPart4} alt="" className="login_bg_part login_bg_part4" />
                  <div className="switch_box flex center-v">
                    <span className="switch_handle"></span>
                  </div>
                  {/* 钟表 */}
                  <div className="watch_box">
                    <span className="hour_hand" style={{ transform: `rotate(${nowTime.hourAngle}deg)` }}></span>
                    <span
                      className="minute_hand"
                      style={{ transform: `rotate(${nowTime.minAngle}deg)` }}
                    ></span>
                    <span className="circle_dot"></span>
                  </div>
                  <div className="login_bg_ant login_bg_ant1">
                    {/* loginBgTopAnt */}
                    {/* <img src={loginBgAnt1} alt="" className="loginBgTopAnt" /> */}
                    <svg width="124" height="122" xmlns="http://www.w3.org/2000/svg">
                      <image width="124" height="122" stroke="black" href={loginBgAnt1}>
                        <animate
                          attributeName="x"
                          dur="8s"
                          values="0; 40; 10; 10; 0; 0; 0"
                          keyTimes="0; .15; .5; .6; .75;.9; 1"
                          calcMode="spline"
                          keySplines=" 0 0 1 1; 0 0 1 1; .5 0 .5 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="y"
                          dur="8s"
                          values="-30; -20; -10; -10; 0; -30; -30"
                          keyTimes="0; .15; .5; .6; .75;.9; 1"
                          calcMode="spline"
                          keySplines=".5 0 .5 1; 0 0 1 1; .5 0 .5 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                          repeatCount="indefinite"
                        />
                      </image>
                    </svg>
                  </div>
                  <div className="login_bg_ant login_bg_ant2">
                    {/* <img src={loginBgAnt2} alt="" className="loginBgBotAnt" /> */}
                    <svg width="259" height="187" xmlns="http://www.w3.org/2000/svg">
                      <image width="259" height="187" href={loginBgAnt2}>
                        <animate
                          attributeName="x"
                          dur="8s"
                          values="70; 30; 10; 0; 5; 70; 70"
                          keyTimes="0; .15; .5; .6; .75;.9; 1"
                          calcMode="spline"
                          keySplines=".5 0 .5 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="y"
                          dur="8s"
                          values="30; 40; 20; 0; 5; 30; 30"
                          keyTimes="0; .15; .5; .6; .75; .9;1"
                          calcMode="spline"
                          keySplines=".5 0 .5 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1; 0 0 1 1"
                          repeatCount="indefinite"
                        />
                      </image>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="contentRight flex center-v center-h flex-1 relative">
                <div className={isRegister ? 'content register-content' : 'content'}>
                  {/* 登录表单 */}
                  {isLoginForm && (
                    <LoginForm
                      {...this.props}
                      sendOrgInfo={this.sendOrgInfo} //企业列表信息
                      optionWindow={this.optionWindow}
                      saveThisUserInfo={this.saveThisUserInfo} //存储用户账号
                      hideLoginForm={this.hideLoginForm}
                      showForgetPwdForm={this.showForgetPwdForm}
                      showRegisterForm={this.showRegisterForm}
                      showWeChatForm={this.showWeChatForm}
                      showWeChatLogin={this.showWeChatLogin}
                      isWeChatLogin={isWeChatLogin}
                    />
                  )}
                  {/* 二维码登录 */}
                  {isQr && (
                    <QrCode
                      {...this.props}
                      hideQr={this.hideQr}
                      sendOrgInfo={this.sendOrgInfo} //企业列表信息
                      optionWindow={this.optionWindow}
                      saveThisUserInfo={this.saveThisUserInfo} //存储用户账号
                      showRegisterForm={this.showRegisterForm}
                    />
                  )}
                  {/* 忘记密码 */}
                  {isForgetPwd && (
                    <ForgetPwdForm
                      {...this.props}
                      showForgetPwdForm={this.showForgetPwdForm}
                      sendOrgInfo={this.sendOrgInfo} //企业列表信息
                      optionWindow={this.optionWindow}
                      saveThisUserInfo={this.saveThisUserInfo} //存储用户账号
                    />
                  )}
                  {/* 注册 */}
                  {isRegister && (
                    // <Tabs defaultActiveKey="1" onChange={this.tabChange} className="tabPaneBox">
                    // {/* <TabPane tab="手机号注册" key="PHONE"> */}
                    <Rigister
                      {...this.props}
                      sendOrgInfo={this.sendOrgInfo}
                      optionWindow={this.optionWindow}
                      saveThisUserInfo={this.saveThisUserInfo}
                      showRegisterForm={this.showRegisterForm}
                      checkedKey={checkedKey}
                      isWeChatLogin={isWeChatLogin}
                    />
                    // {/* </TabPane> */}
                    //       {/* <TabPane tab="邮箱注册" key="EMAIL">
                    //   <Rigister {...this.props} showRegisterForm={this.showRegisterForm} checkedKey={checkedKey} />
                    // </TabPane> */}
                    // </Tabs>
                  )}
                  {isWeChat && (
                    <WeChatLogins
                      {...this.props}
                      showRegisterForm={this.showRegisterForm}
                      showWeChatLogin={this.showWeChatLogin}
                      isWeChatLogin={isWeChatLogin}
                    />
                  )}
                </div>
              </div>
              <img className="login_bt_icon" src={loginBt} alt="" />
            </section>
          </div>
        )}
        {/*登录注册引导*/}
        {!isShowLoginWrap && (
          <InvitationOrg
            {...this.props}
            userState={userState}
            optionWindow={this.optionWindow}
            userData={userData}
            inviOrgList={inviOrgList}
          />
        )}
        {/* 安装包安装弹框显示 */}
        {process.env.BUILD_ENV != 'dev' && <AutoUpdateModal />}
        {/* 自动升级测试 */}
        <span
          className="checkForUpdates forcedHide"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            // ipcRenderer.send('checkForUpdates', {
            //   remoteVersion: '5.0.7',
            //   currentVersion: '5.0.6',
            //   productName: 'holder-test',
            // })
            // ipcRenderer.send('checkForUpdates', { currentVersion: '5.1.0', productName: 'holder-test' })
            // 显示下载安装包弹框
            ipcRenderer.send('upgrade_error', true)
          }}
        >
          自动升级测试
        </span>
        {/* 开发者工具 */}
        <span
          className="openDevTools forcedHide"
          style={{ cursor: 'pointer', margin: '0 0 0 10px' }}
          onClick={() => {
            ipcRenderer.send('openDevTools')
          }}
        >
          f12
        </span>
      </div>
    )
  }
  //控制企业邀请,引导创建,创建模块隐藏显示
  optionWindow = (str: string, flag?: boolean) => {
    this.setState({
      isShowLoginWrap: flag ? true : false,
      userState: str,
    })
  }

  //存储邀请企业列表信息
  sendOrgInfo = (arr: any) => {
    this.setState({
      inviOrgList: arr,
    })
  }

  //点击登录后存储一份用户信息
  saveThisUserInfo = (userInfo: any) => {
    this.setState({
      userData: userInfo,
    })
    $store.dispatch({
      type: 'SET_USER_INFO',
      data: userInfo,
    })
  }

  hideLoginForm = () => {
    this.setState({
      isLoginForm: false,
      isQr: true,
      isWeChatLogin: false,
    })
  }

  hideQr = () => {
    this.setState({
      isQr: false,
      isLoginForm: true,
      isWeChatLogin: false,
    })
  }

  showForgetPwdForm = (value: boolean) => {
    this.setState({
      isForgetPwd: value,
      isLoginForm: !value,
      isWeChatLogin: false,
    })
  }

  showRegisterForm = (value: boolean, type?: string) => {
    this.setState({
      isRegister: value,
      isLoginForm: !value,
      isQr: false,
      checkedKey: 'PHONE',
      isWeChatLogin: type && type === 'weChatLogin' ? true : false,
      isWeChat: false,
    })
  }

  showWeChatForm = (value: boolean) => {
    this.setState({
      isLoginForm: !value,
      isWeChat: value,
      isWeChatLogin: value,
    })
  }
  showWeChatLogin = (value: boolean) => {
    this.setState({
      isLoginForm: value,
      isWeChat: !value,
      isWeChatLogin: value,
    })
  }

  tabChange = (value: string) => {
    this.setState({
      checkedKey: value,
      isWeChatLogin: false,
    })
  }
}
/**
 * 获取钟表时间旋转角度
 */
export const getTimeRolate = () => {
  // 获取当前时刻
  const date = new Date()
  const sec = date.getSeconds()
  const min = date.getMinutes()
  const hour = date.getHours()
  // 计算各指针对应的角度
  // const secAngle = sec * 6 - 90 // s*6-90
  const minAngle = min * 6 + sec * 0.1 - 90 // m*6+s*0.1-90
  const hourAngle = hour * 30 + min * 0.5 - 90 // h*30+m*0.5 - 90
  return {
    hourAngle,
    minAngle,
  }
}
