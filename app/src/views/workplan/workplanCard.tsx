import React, { useState, useEffect, useContext, useImperativeHandle, useRef } from 'react'
import { Table, Menu, Dropdown, message, Input } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { useDrag, useDrop } from 'react-dnd'
import $c from 'classnames'
import { CheckAvatar } from '@/src/views/task/task-com/TaskCom'

// import { DragableComp } from './DragableComp'
import NoneData from '@/src/components/none-data/none-data'
import { queryPlanList, planReadHandle } from './workPlanApi'
import { findEditMember } from '../workplan/WorkPlanOpt'
import {
  addFolder,
  editFolderName,
  topedFolder,
  cancelTopedFolder,
  editPlanName,
  moveToDirSave,
} from './WorkPlanOpt'
import { cutName } from '../../common/js/common'
import { planContext } from './workplan'
// import { planCount } from '../work-plan-mind/work-plan-mind'
const { SubMenu } = Menu
// 规划模式上下文数据
// 注：state设置为异步，上下文里数据用的state可能还没及时更改，所以加载完成后的操作才适合用此数据
let planContextObj: any
let nameStateList: any = []
/**
 * 时间规范
 */
const standardCreateTime = (createTime: any) => {
  const nowTime = new Date()
  const createTimes = new Date(createTime)
  const dates = nowTime.getTime() - createTimes.getTime() //时间差的毫秒数
  let createText = createTime.split('/')[1] + '/' + createTime.split('/')[2]
  //计算出相差天数
  const days = Math.floor(dates / (24 * 3600 * 1000))
  //计算出小时数
  const hours = Math.floor(dates / (3600 * 1000))
  //计算相差分钟数
  const minutes = Math.floor(dates / (60 * 1000))
  //相差的秒数
  const seconds = Math.round(dates / 1000)
  //获取年份
  const Yearnow = new Date().getFullYear()
  const Year = new Date(createTime).getFullYear()
  if (seconds <= 60 && seconds > 0) {
    createText = '刚刚'
  }
  if (minutes <= 60 && minutes > 0) {
    createText = minutes + '分钟前'
  }
  if (hours < 48 && hours > 0) {
    createText = '昨天' + `${createTime.split(' ')[1]}`
  }
  if (hours < 24 && hours > 0) {
    createText = hours + '小时前'
  }
  if (days < 365 && days > 0) {
    createText = createTime.split('/')[1] + '/' + createTime.split('/')[2]
  }
  if (Yearnow != Year) {
    createText = `${createTime.split(' ')[0]}`
  }
  return createText
}
/**
 * 获取任务类型标签
 */
const TaskTypeTag = (props: any) => {
  const paramObj = props.infoObj ? props.infoObj : {}
  let objSpn: any
  switch (Number(props.type || 0)) {
    case 1:
      objSpn = <span className={`taskTypeLabel boardXm ${paramObj.attachClass || ''}`}>项目</span>
      break
    default:
      objSpn = <span className={`taskTypeLabel boardRw ${paramObj.attachClass || ''}`}>任务</span>
      break
    // case 0:
    //   objSpn = <span className={`taskTypeLabel boardMb ${paramObj.attachClass || ''}`}>目标</span>
    //   break
    // case 1:
    //   objSpn = <span className={`taskTypeLabel boardLs ${paramObj.attachClass || ''}`}>临时</span>
    //   break
    // case 2:
    //   objSpn = <span className={`taskTypeLabel boardZn ${paramObj.attachClass || ''}`}>职能</span>
    //   break
    // case 3:
    //   objSpn = <span className={`taskTypeLabel boardXm ${paramObj.attachClass || ''}`}>项目</span>
    //   break
  }
  return objSpn
}
/**
 * 菜单点击事件
 * viewType：0规划菜单 1文件夹菜单
 */
const menuClick = (menuProp: any, item: any, attachObj: any) => {
  // 隐藏按钮菜单
  if (attachObj.setMoreBtnShow) {
    attachObj.setMoreBtnShow({ moreMenuShow: false, rigMenuShow: false })
  }
  // 文件夹操作
  if (item.viewType == 1) {
    switch (menuProp.key) {
      case '0': //重命名文件夹
        if (attachObj.showNameInpParam) {
          showNameInp(attachObj.showNameInpParam)
        }
        break
      case '1': //置顶/取消置顶文件夹
        if (item.topId) {
          //取消置顶
          cancelTopedFolder(
            {
              optType: 1,
              topId: item.topId,
            },
            {
              planContextObj: planContextObj,
            }
          )
        } else {
          topedFolder(
            //置顶
            {
              optType: 0,
              type: item.viewType,
              typeId: item.id,
              zone: planContextObj.planType,
            },
            {
              planContextObj: planContextObj,
            }
          )
        }
        // 列表模式下文件夹置顶，收起按钮
        if (planContextObj.planMode == 1) {
          if (attachObj.setExpKeys) {
            attachObj.setExpKeys(item.id)
          }
        }
        break
      case '2': //删除文件夹
        planContextObj.setDelPlanModalShow(true)
        $store.dispatch({
          type: 'WORKPLAN_MODAL',
          data: {
            sourceItem: delItemTsxSouer(item) || {},
          },
        })
        break
      default:
        break
    }
  } else {
    //规划操作
    switch (menuProp.key) {
      case '1': //重命名规划
        if (attachObj.showNameInpParam) {
          showNameInp(attachObj.showNameInpParam)
        }
        break
      case '2': //置顶/取消置顶规划
        if (item.topId) {
          //取消置顶
          cancelTopedFolder(
            {
              optType: 1,
              topId: item.topId,
            },
            {
              planContextObj: planContextObj,
            }
          )
        } else {
          topedFolder(
            //置顶
            {
              optType: 0,
              type: item.viewType,
              typeId: item.id,
              zone: planContextObj.planType,
            },
            {
              planContextObj: planContextObj,
            }
          )
        }

        break
      case '3': //移动规划
        planContextObj.setMoveToFolderShow(true)
        $store.dispatch({
          type: 'WORKPLAN_MODAL',
          data: {
            sourceItem: delItemTsxSouer(item) || {},
          },
        })
        break
      case '4': //删除规划
        planContextObj.setDelPlanModalShow(true)
        $store.dispatch({
          type: 'WORKPLAN_MODAL',
          data: {
            sourceItem: delItemTsxSouer(item) || {},
          },
        })
        break
      case '5': //共享到人
        $store.dispatch({
          type: 'WORKPLAN_MODAL',
          data: {
            sourceItem: delItemTsxSouer(item) || {},
          },
        })
        // 显示选人弹框
        planContextObj.setMemberOrgShow(true, 'shareToUser')
        break
      case '6': //共享到群
        planContextObj.setShareToRoomModalShow(true)
        $store.dispatch({
          type: 'WORKPLAN_MODAL',
          data: {
            sourceItem: delItemTsxSouer(item) || {},
            shareFormType: 'workPlan',
          },
        })
        break
      case '7': //编辑权限
        $store.dispatch({
          type: 'WORKPLAN_MODAL',
          data: {
            sourceItem: delItemTsxSouer(item) || {},
          },
        })
        // 显示选人弹框
        planContextObj.setMemberOrgShow(true, 'editMemberAuth')
        break
      default:
        break
    }
  }
}
//解决点击右键按钮因item对象有tsx对象而存储过程报错
const delItemTsxSouer = (item: any) => {
  const sourceitem = Object.assign({}, item) //浅拷贝
  for (const i in sourceitem) {
    if (i == 'liableUserCol' || i == 'planNameCol' || i == 'operateCol' || i == 'endTimeCol') {
      delete sourceitem[i]
    }
  }
  return sourceitem
}
// 判断按钮权限
const getPlanBtnAuth = (code: number, item: any): boolean => {
  // const loginUserId = $store.getState().nowUserId
  let auth = true
  const nowPos = planContextObj.folderPosList[planContextObj.folderPosList.length - 1]
  switch (code) {
    // 置顶按钮-我的规划中,根目录下的才有置顶功能
    case 0: //置顶/取消置顶
      if (planContextObj.isMyPlan) {
        if (
          (planContextObj.planMode == 0 && !nowPos.id) ||
          (planContextObj.planMode == 1 && !nowPos.id && !item.childLevel)
        ) {
          auth = true
        } else {
          auth = false
        }
      } else {
        auth = false
      }
      break
    case 1: //重命名
      // if (item.viewType != 1 && (item.liableUser == loginUserId || item.createUser == loginUserId)) {
      if (item.viewType != 1 && item.hasAuth == 1) {
        auth = true
      } else {
        auth = false
      }
      break
    case 2: //移动
      if (planContextObj.isMyPlan) {
        auth = true
      } else {
        auth = false
      }
      break
    case 3: //删除
      if (item.viewType != 1 && item.status != 2) {
        auth = true
      } else {
        auth = false
      }
      break
    default:
      break
  }
  return auth
}
/**
 * 工作规划菜单
 * @param props
 * ptProps:父节点属性
 * attachObj：附加参数
 */
const PlanMenu = (props: any, attachObj: any) => {
  const item = props.itemData || {}
  let moreMenu: any

  if (item.viewType == 1) {
    //文件夹
    moreMenu = (
      <Menu
        className="myDropMenu planOptBtnMenu workPlanDirMenu"
        style={attachObj.listModeRig ? attachObj.tmpStyle : {}}
        onClick={(menuProp: any) => {
          menuClick(menuProp, item, attachObj)
        }}
      >
        <Menu.Item key="0">
          <div className="myMenuItem">
            <span>重命名</span>
          </div>
        </Menu.Item>
        <Menu.Item key="1" className={`${getPlanBtnAuth(0, item) ? '' : 'forcedHide'}`}>
          <div className="myMenuItem">
            <span>{item.topId ? '取消置顶' : '置顶'}</span>
          </div>
        </Menu.Item>
        <Menu.Item key="2">
          <div className="myMenuItem">
            <span>删除</span>
          </div>
        </Menu.Item>
      </Menu>
    )
  } else {
    moreMenu = (
      <Menu
        className="myDropMenu workPlanMenu planListRightMenu"
        style={attachObj.listModeRig ? attachObj.tmpStyle : {}}
        onClick={(menuProp: any) => {
          menuClick(menuProp, item, attachObj)
        }}
        forceSubMenuRender={true}
      >
        {/* <SubMenu
          title="编辑权限"
          key="7"
          popupClassName="myDropMenu subMenu"
          onTitleClick={(menuProp: any) => {
            menuClick(menuProp, item, attachObj)
          }}
        ></SubMenu> */}
        {/* <SubMenu
          title="共享"
          key="sub2"
          popupClassName="myDropMenu subMenu"
          onTitleClick={(menuProp: any) => {
            menuClick(menuProp, item, attachObj)
          }}
        >
          <Menu.Item key="5">
            <div className="myMenuItem">
              <span>共享到人</span>
            </div>
          </Menu.Item>
          <Menu.Item key="6">
            <div className="myMenuItem">
              <span>共享到群</span>
            </div>
          </Menu.Item>
        </SubMenu> */}
        <Menu.Item key="1" className={`${getPlanBtnAuth(1, item) ? '' : 'forcedHide'}`}>
          <div className="myMenuItem">
            <span>重命名</span>
          </div>
        </Menu.Item>
        <Menu.Item key="2" className={`${getPlanBtnAuth(0, item) ? '' : 'forcedHide'}`}>
          <div className="myMenuItem">
            <span>{item.topId ? '取消置顶' : '置顶'}</span>
          </div>
        </Menu.Item>
        <Menu.Item key="3" className={`${getPlanBtnAuth(2, item) ? '' : 'forcedHide'}`}>
          <div className="myMenuItem">
            <span>移动</span>
          </div>
        </Menu.Item>
        <Menu.Item key="4" className={`${getPlanBtnAuth(3, item) ? '' : 'forcedHide'}`}>
          <div className="myMenuItem">
            <span>删除</span>
          </div>
        </Menu.Item>
      </Menu>
    )
  }
  return moreMenu
}
/**
 * 规划-卡片模式列表数据展示
 * @param params
 * viewType:1 文件夹 0规划
 */
const CardModeList = (props: any) => {
  // 获取规划上下文数据
  planContextObj = useContext(planContext)
  const paramProp = props.param
  const actionProp = props.action
  const cardDirList = paramProp.cardDirList || []
  const cardPlanList = paramProp.cardPlanList || []
  const filterSearchStatus = paramProp.filterSearchStatus || ''
  return (
    <section className={`workPlanList_card ${paramProp.planMode == 0 ? '' : 'forcedHide'}`}>
      <div
        className={`workPlanCardTopsBox flex wrap center-v planTopsBox ${
          cardDirList.length > 0 || paramProp.newAddFolder ? '' : 'forcedHide'
        }`}
      >
        {cardDirList.length > 0 &&
          cardDirList.map((item: any, i: number) => {
            return (
              <CardModeItem
                key={i}
                viewType={item.viewType}
                itemData={item}
                onClick={() => {
                  actionProp.inFolder(item)
                }}
                ptProps={props}
              />
            )
          })}
        {/* 新增文件夹卡片 */}
        {paramProp.newAddFolder ? <NewFolderItem ptProps={props} /> : ''}
      </div>
      <div className={`workPlanCardPlansBox plan_pad20 ${cardPlanList.length > 0 ? '' : 'forcedHide'}`}>
        <div className="workPlanCardPlans flex wrap">
          {cardPlanList.length > 0 &&
            cardPlanList.map((item: any, i: number) => {
              return (
                <CardModeItem
                  key={i}
                  viewType={item.viewType}
                  itemData={item}
                  onClick={() => {
                    actionProp.inFolder(item)
                  }}
                  ptProps={props}
                />
              )
            })}
        </div>
      </div>
      {cardDirList.length == 0 && cardPlanList.length == 0 ? (
        props.param.planType != 3 ? (
          <NoneData
            className={`threePosition`}
            searchValue={filterSearchStatus}
            imgSrc={
              props.param.planType == 2
                ? $tools.asAssetsPath(`/images/noData/okr_distribute.png`)
                : $tools.asAssetsPath(`/images/noData/no_okr_card_1.png`)
            }
            showTxt={props.param.planType == 2 ? '目前还没有你负责的哟' : '目前你尚未负责任何OKR哦~'}
            containerStyle={{ zIndex: 0 }}
            textStyle={{ fontSize: 16, marginLeft: -82 }}
          />
        ) : (
          <NoneData
            className={`threePosition no_changjian`}
            containerStyle={{ zIndex: 0 }}
            searchValue={filterSearchStatus}
            imgSrc={$tools.asAssetsPath(`/images/noData/no_okr_card_2.png`)}
            showTxt={
              <div className="create_okr_tips_1">
                <p className="create_OKR_tips">
                  {!filterSearchStatus ? '快去创建你的OKR吧~' : '你搜索到一处未知的领域~'}
                </p>
                {/* {!filterSearchStatus && (
                  <div
                    className="create-btn"
                    style={{ margin: '0 auto' }}
                  >
                    创建目标
                  </div>
                )} */}
              </div>
            }
          />
        )
      ) : (
        ''
      )}
      {/* {cardDirList.length == 0 && cardPlanList.length == 0 ? <NoneData className="no_select" /> : ''} */}
    </section>
  )
}

/**
 * 点击重命名按钮后
 */
const showNameInp = (paramObj: { setNameInpShow: (flag: boolean) => void }) => {
  paramObj.setNameInpShow(true)
}

/**
 * 文件夹重命名处理
 * @param e
 */
const editFolderNameSet = (e: any, eItem: any, attachObj: any) => {
  // const listParamProp = attachObj.ptParamProp
  const folderPosList = planContextObj.folderPosList || []
  const newName = e.currentTarget.value
  const oldName = e.currentTarget.dataset.oldname
  if (newName == '' || oldName == newName) {
    attachObj.setNameInpShow(false)
  } else {
    attachObj.setNameInpShow(false)
    const param: any = {
      id: eItem.id,
      name: newName,
      zone: planContextObj.planType,
    }
    if (folderPosList.length > 1) {
      param.parentId = folderPosList[folderPosList.length - 1].id
    }
    editFolderName(param, {
      planContextObj: planContextObj,
    })
  }
}

/**
 * 文件夹重命名处理
 * @param e
 */
const editPlanNameSet = (e: any, eItem: any, attachObj: any) => {
  const newName = e.currentTarget.value
  const oldName = e.currentTarget.dataset.oldname
  if (newName == '' || oldName == newName) {
    attachObj.setNameInpShow(false)
  } else {
    attachObj.setNameInpShow(false)
    const param: any = {
      id: eItem.id,
      parentId: eItem.id,
      name: newName,
      typeId: eItem.typeId,
    }
    editPlanName(param, {
      planContextObj: planContextObj,
    })
  }
}

/**
 * 文件夹初始名字设置
 */
const folderInitName: any = (folderPosList: any, folderDataList: any) => {
  // 当前层级，最多创建10层
  const nowLevel = folderPosList.length + 1
  if (nowLevel >= 10) {
    message.error('最多可创建10层文件夹，不可再创建！')
    return
  }
  // 获取当前新建文件夹后缀数字
  let newNum = 0
  // 获取已存在新建文件夹后缀数字
  const numList: any = []
  // 是否使用过已知范围所有数字
  let allUser = true
  folderDataList.map(function(item: any) {
    if (item.viewType == 1 && item.name.includes('新建文件夹')) {
      // .replace(/\ +/g, '')
      const nameSplit = item.name.split('新建文件夹')
      const thisNum = Number(nameSplit[1])
      if (nameSplit[1] && thisNum) {
        numList.push(thisNum)
      }
    }
  })
  // 在最大和最小数字间查找未使用过的数字
  let maxNum = Math.max.apply(null, numList)
  let minNum = Math.min.apply(null, numList)

  if (minNum > 1) {
    minNum = 1
    maxNum = minNum
  }
  for (let n = minNum; n <= maxNum; n++) {
    newNum = n
    if (numList.indexOf(n) == -1) {
      //出现范围内未使用过的数字
      allUser = false
      break
    }
  }

  if (allUser) {
    //所有数字都被使用，则取最大值加1
    newNum++
  }
  const name = '新建文件夹' + newNum
  return name
}
/**
 * 新增文件夹模块渲染
 * @param props
 */
const NewFolderItem = (props: any) => {
  const ptProps = props.ptProps
  const paramProp = ptProps.param
  const actionProp = ptProps.action
  const [planName, setPlanName] = useState('')
  const [nameInpShow, setNameInpShow] = useState(true)
  // 名字输入框节点
  // const [nameRef, setNameRef] = useState(null)
  // 按钮菜单显示隐藏
  const [menuBtnShow, setMoreBtnShow] = useState({ moreMenuShow: false, rigMenuShow: false })
  const isNewFolder = paramProp.newAddFolder
  // 新增文件夹
  const moreMenu = (
    <Menu className="myDropMenu planOptBtnMenu workPlanDirMenu newPlanDirMenu">
      <Menu.Item key="2">
        <div
          className="myMenuItem"
          onClick={() => {
            setNewFolderShow(false)
            setMoreBtnShow({ moreMenuShow: false, rigMenuShow: false })
          }}
        >
          <span>删除</span>
        </div>
      </Menu.Item>
    </Menu>
  )

  /**
   * 设置新增文件夹模块显示隐藏
   * @param flag
   */
  const setNewFolderShow = (flag: boolean) => {
    actionProp.setNewAddFolder(flag)
  }
  // 检测新增文件夹时则获取输入框焦点
  useEffect(() => {
    if (nameInpShow) {
      const folderDataList = [...(paramProp.cardDirList || []), ...(paramProp.cardPlanList || [])]
      const getInitName = folderInitName(planContextObj.folderPosList, folderDataList)
      setPlanName(getInitName)
    }
  }, [isNewFolder])
  /**
   * 新建文件夹处理
   * @param e
   */
  const setNewFolder = (e: any) => {
    const newName = e.currentTarget.value
    if (newName == '') {
      setNameInpShow(false)
    } else {
      setNewFolderShow(false)
      const param: any = {
        name: newName,
        zone: planContextObj.planType,
      }
      if (planContextObj.folderPosList.length > 1) {
        param.parentId = planContextObj.folderPosList[planContextObj.folderPosList.length - 1].id
      }
      addFolder(param, {
        planContextObj: planContextObj,
      })
    }
  }
  // 更多按钮菜单显示隐藏
  const moreMenuVisibleChange = (flag: boolean) => {
    setMoreBtnShow({ moreMenuShow: flag, rigMenuShow: false })
  }
  // 右键菜单显示隐藏
  const rigMenuVisibleChange = (flag: boolean) => {
    setMoreBtnShow({ moreMenuShow: false, rigMenuShow: flag })
  }
  const { moreMenuShow, rigMenuShow } = { ...menuBtnShow }
  return (
    <Dropdown
      overlay={moreMenu}
      trigger={['contextMenu']}
      placement="bottomRight"
      visible={rigMenuShow}
      onVisibleChange={rigMenuVisibleChange}
    >
      <div className={`planTopItem workPlanDocItem ${isNewFolder ? '' : 'forcedHide'}`}>
        <div className="planDocImgBox relative">
          <div
            className={`plan_opt_btn_out ${moreMenuShow ? 'disHover' : ''}`}
            onClick={e => {
              e.stopPropagation()
            }}
          >
            <Dropdown
              overlay={moreMenu}
              trigger={['click']}
              placement="bottomRight"
              onVisibleChange={e => {
                moreMenuVisibleChange(e)
              }}
            >
              <em className="plan_more_icon"></em>
            </Dropdown>
            <ul className="myDropMenu more_btn_box"></ul>
          </div>
          <span className={'img_icon plan_doc_icon null'}></span>
        </div>
        <div className={`plan_doc_txt my_ellipsis dir_name_show ${nameInpShow ? 'forcedHide' : ''}`}>
          {planName}
        </div>
        <input
          autoFocus
          className={`plan_doc_inp ${nameInpShow ? '' : 'forcedHide'}`}
          // ref={(el: any) => setNameRef(el)}
          value={planName}
          maxLength={255}
          onBlur={(e: any) => {
            setNewFolder(e)
          }}
          onChange={(e: any) => {
            setPlanName(e.currentTarget.value)
          }}
        />
      </div>
    </Dropdown>
  )
}
/**
 * 跳转到脑图
 * @param item 规划数据
 */
const toMindMap = (item: any) => {
  const { fromPlanTotype } = $store.getState()
  // const mindMaptype = $store.getState().mindMapData.form
  $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 }) //工作台或者工作规划数据点击
  $store.dispatch({ type: 'MINDMAPDATA', data: item })
  $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
  $store.dispatch({
    type: 'MYPLAN_ORG',
    data: { cmyId: '', curType: -1, cmyName: '', curId: '' },
  })
  $tools.createWindow('workplanMind')
  // 更新左侧导航工作计划统计
  // planCount()
  if (!item.isRead) {
    planReadHandle({
      url: '/task/work/plan/readWorkPlan',
      param: {
        id: item.id,
        userId: $store.getState().nowUserId,
      },
    }).then((res: any) => {
      planContextObj.refreshData({ optType: '' })
    })
  }
}

/**
 * 规划-卡片模式单项数据展示
 * @param params
 * viewType:1 文件夹 0规划
 */
const CardModeItem = (props: any) => {
  // const nowUserId = $store.getState().nowUserId
  const item = props.itemData || {}
  const ptProps = props.ptProps
  const ptActionProp = ptProps.action
  const ptParamProp = ptProps.param

  // ==============state相关 开始===================//

  // 输入框的值
  const [inpName, setInpName] = useState(item.name)
  // 是否显示输入框
  const [nameInpShow, setNameInpShow] = useState(false)
  // 名字input节点设置
  const [nameRef, setNameRef] = useState(null)
  // 按钮菜单显示隐藏
  const [menuBtnShow, setMoreBtnShow] = useState({ moreMenuShow: false, rigMenuShow: false })
  const showNameInpParam = {
    setNameInpShow: setNameInpShow,
    nameRef: nameRef,
  }
  const menuObj = {
    showNameInpParam: showNameInpParam,
    findPlanList: ptActionProp.findPlanList,
    planContextObj: planContextObj,
    ptProps: ptProps,
    setMoreBtnShow: setMoreBtnShow,
  }
  //规划
  const moreMenu: any = PlanMenu(props, menuObj)
  // 检测重命名文件夹时则获取输入框焦点
  useEffect(() => {
    const ref: any = nameRef
    // 获取焦点
    if (ref) {
      ref.focus()
    }
    setInpName(item.name)
  }, [nameInpShow])
  // ==============state相关 结束===================//
  // 更多按钮菜单显示隐藏
  const moreMenuVisibleChange = (flag: boolean, id: number, viewType?: number) => {
    // setMoreBtnShow({ moreMenuShow: false, rigMenuShow: false })
    //文件夹不需要请求接口
    if (viewType == 1) {
      setMoreBtnShow({ moreMenuShow: flag, rigMenuShow: false })
      return
    }
    findEditMember({
      id: id,
      mainId: '',
    }).then((res: any) => {
      if (res && res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          if (res[i].id == $store.getState().nowUserId) {
            setMoreBtnShow({ moreMenuShow: flag, rigMenuShow: false })
            break
          } else {
            setMoreBtnShow({ moreMenuShow: false, rigMenuShow: false })
          }
        }
      }
    })
  }
  // 右键菜单显示隐藏
  const rigMenuVisibleChange = (flag: boolean, id: number, viewType?: number) => {
    //文件夹不需要请求接口
    if (viewType == 1) {
      setMoreBtnShow({ moreMenuShow: false, rigMenuShow: flag })
      return
    }
    findEditMember({
      id: id,
      mainId: '',
    }).then((res: any) => {
      if (res && res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          if (res[i].id == $store.getState().nowUserId) {
            setMoreBtnShow({ moreMenuShow: false, rigMenuShow: flag })
            break
          } else {
            setMoreBtnShow({ moreMenuShow: false, rigMenuShow: false })
          }
        }
      }
    })
  }
  const { moreMenuShow, rigMenuShow } = { ...menuBtnShow }

  // ************************拖动功能 start**********************//
  let sourceItem: any = {}
  let targetItem: any = {}
  const dragRef: any = useRef(null)
  // // 使用 useDrag拖拽

  const [_, drager] = useDrag({
    item: { type: 'planDragItem', itemData: item },
    // begin: (m: any) => {
    //   // dragPreview(<div>adf</div>)
    //   // DragPreviewImage({ connect: <div>adf</div> })
    // },
    canDrag: () => {
      let drag = true
      if (
        nameInpShow ||
        (dragRef &&
          $(dragRef.current)
            .find('.plan_doc_inp')
            .is(':visible'))
      ) {
        drag = false
      }
      return drag
    },
  })
  // 第一个参数是 collect 方法返回的对象，第二个参数是一个 ref 值，赋值给 drop 元素
  const [collectProps, droper] = useDrop({
    // accept 是一个标识，需要和对应的 drag 元素中 item 的 type 值一致，否则不能感应
    accept: 'planDragItem',
    // collect 函数，返回的对象会成为 useDrop 的第一个参数，可以在组件中直接进行使用
    collect: minoter => ({
      isOver: minoter.isOver(),
    }),
    drop: (dragItem, minoter) => {
      sourceItem = minoter.getItem().itemData
      targetItem = JSON.parse(dragRef.current.dataset.itemdata)
      if (sourceItem.id == targetItem.id) {
        return
      }
      moveToDirSave(
        {
          id: targetItem.id, //目标文件夹id
          type: sourceItem.viewType,
          typeId: sourceItem.id, //被移动对象id
        },
        {
          optType: 'drag',
          planContextObj: planContextObj,
        }
      )
    },
  })
  // 文件夹既可以被拖拽也可以接收拖拽元素，故使用 drag 和 drop 包装 ref
  if (item.viewType == 1) {
    droper(drager(dragRef))
  }
  // dragPreview(<div>adf</div>)
  const dragHover = collectProps.isOver ? 'drag_hover' : ''
  // ************************拖动功能 end**********************//

  if (props.viewType == 1) {
    //正常渲染文件夹
    //文件夹
    return (
      <Dropdown
        overlay={moreMenu}
        trigger={['contextMenu']}
        placement="bottomRight"
        visible={rigMenuShow}
        onVisibleChange={e => {
          rigMenuVisibleChange(e, item.id, props.viewType)
        }}
      >
        <div
          className={`planTopItem workPlanDocItem ${dragHover}`}
          data-itemdata={JSON.stringify(item)}
          ref={dragRef}
          onClick={() => {
            props.onClick(item)
          }}
        >
          <div className="planDocImgBox relative">
            <span className={`planToped ${item.topId ? '' : 'forcedHide'}`}>置顶</span>
            <div
              className={`plan_opt_btn_out ${moreMenuShow ? 'disHover' : ''}`}
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <Dropdown
                overlay={moreMenu}
                trigger={['click']}
                placement="bottomRight"
                onVisibleChange={e => {
                  moreMenuVisibleChange(e, item.id, props.viewType)
                }}
              >
                <em className="plan_more_icon"></em>
              </Dropdown>
              <ul className="myDropMenu more_btn_box"></ul>
            </div>
            <span className={$c('img_icon plan_doc_icon', item.folderCount ? '' : 'null')}></span>
          </div>
          <div className={`plan_doc_txt my_ellipsis dir_name_show ${nameInpShow ? 'forcedHide' : ''}`}>
            {item.name}
          </div>
          <input
            className={`plan_doc_inp ${nameInpShow ? '' : 'forcedHide'}`}
            ref={(el: any) => setNameRef(el)}
            value={inpName}
            maxLength={255}
            data-oldname={item.name}
            onClick={(e: any) => {
              e.stopPropagation()
            }}
            onChange={(e: any) => {
              setInpName(e.currentTarget.value)
            }}
            onBlur={(e: any) => {
              editFolderNameSet(e, item, {
                setNameInpShow: setNameInpShow,
                ptActionProp: ptActionProp,
                ptParamProp: ptParamProp,
              })
            }}
            onKeyUp={(e: any) => {
              if (e.keyCode == 13) {
                editFolderNameSet(e, item, {
                  setNameInpShow: setNameInpShow,
                  ptActionProp: ptActionProp,
                  ptParamProp: ptParamProp,
                })
              }
            }}
          />
        </div>
      </Dropdown>
    )
  } else {
    const showUserName = cutName(item.liableUsername || '', 2, -1) || ''
    let editAuth = false
    // 别人创建的计划不可编辑
    if (item.hasAuth != 0) {
      editAuth = true
    }
    let profile = item.liableUserProfile || ''
    if (!item.liableUsername && !item.liableUserProfile) {
      profile = $tools.asAssetsPath('/images/workplan/head_def.png')
    }
    //status:1未派发 4已派发 3部分已派发 2审核中 5已完成
    let statusTxt = '',
      statusClass = 'blue'
    const status = item.status
    const rank = item.ascriptionType //0岗位级 2企业级 3部门级
    let rankText = ''
    let rankClass = ''
    // 任务状态
    if (status == 4) {
      statusTxt = '已派发'
    } else if (status == 3) {
      statusTxt = '部分派发'
    } else if (status == 2) {
      statusTxt = '审核中'
    } else if (status == 5) {
      statusTxt = '已完成'
      statusClass = 'green'
    } else {
      statusTxt = '草稿'
      statusClass = 'gray'
    }
    // 归属类型
    if (rank == 0) {
      rankText = '岗位级'
      rankClass = 'review'
    } else if (rank == 2) {
      rankText = '企业级'
      rankClass = 'yes_disb'
    } else if (rank == 3) {
      rankText = '部门级'
      rankClass = 'finish'
    } else {
      //ascriptionType = -1没有归属的情况
      rankText = '--'
      rankClass = 'none_tag'
    }
    // 来源
    const fromType = item.isCreate == 0 ? '派发' : '创建'
    //开始时间
    const createTime = standardCreateTime(item.createTime || '')
    return (
      <Dropdown
        overlay={moreMenu}
        trigger={['contextMenu']}
        placement="bottomRight"
        visible={rigMenuShow}
        onVisibleChange={e => {
          rigMenuVisibleChange(e, item.id)
        }}
      >
        <div
          className="workPlanItem"
          ref={drager}
          onClick={() => {
            toMindMap(item)
          }}
        >
          <div className={`status_bar_top ${rankClass}`}></div>
          <span className={`plan_status_sign ${rankClass}`}>{rankText}</span>
          <div className="plan_top_rig flex end center-v">
            {item.type == 2 ? '' : <TaskTypeTag type={item.taskType} />}
            {item.hasAuth == 1 && (
              <span
                className="img_icon edit_auth_btn"
                onClick={(e: any) => {
                  e.stopPropagation()
                  menuClick({ key: '7' }, item, menuObj)
                }}
              >
                编辑权限
              </span>
            )}
            <div
              className={`plan_opt_btn_out ${editAuth ? '' : 'forcedHide'}`}
              onClick={e => {
                e.stopPropagation()
              }}
            >
              <Dropdown
                overlay={moreMenu}
                trigger={['click']}
                placement="bottomRight"
                onVisibleChange={e => {
                  moreMenuVisibleChange(e, item.id)
                }}
              >
                <em className="plan_more_icon"></em>
              </Dropdown>
              <ul className="optBtnMenu more_btn_box"></ul>
            </div>
          </div>

          <div className="plan_cont_row plan_name_row">
            <span className="plan_user_head">
              <span className={item.isRead == 0 ? 'plan_red_dot' : 'forcedHide'}></span>
              {/* <Tooltip title={item.liableUsername}>
                {profile ? (
                  <Avatar src={profile} className="oa-avatar">
                    {showUserName}
                  </Avatar>
                ) : (
                  <Avatar className="oa-avatar">{showUserName}</Avatar>
                )}
              </Tooltip> */}
              {[1].map(() => {
                return (
                  <CheckAvatar
                    key={item.id}
                    profile={profile || ''}
                    headName={showUserName}
                    tips={item.liableUsername}
                  />
                )
              })}
            </span>
            <p className={`tit_name ${nameInpShow ? 'forcedHide' : ''}`}>{item.name}</p>
            <input
              className={`plan_doc_inp ${nameInpShow ? '' : 'forcedHide'}`}
              ref={(el: any) => setNameRef(el)}
              value={inpName}
              maxLength={255}
              data-oldname={item.name}
              onClick={(e: any) => {
                e.stopPropagation()
              }}
              onChange={(e: any) => {
                setInpName(e.currentTarget.value)
              }}
              onBlur={(e: any) => {
                editPlanNameSet(e, item, {
                  setNameInpShow: setNameInpShow,
                  ptActionProp: ptActionProp,
                  ptParamProp: ptParamProp,
                })
              }}
              onKeyUp={(e: any) => {
                if (e.keyCode == 13) {
                  editPlanNameSet(e, item, {
                    setNameInpShow: setNameInpShow,
                    ptActionProp: ptActionProp,
                    ptParamProp: ptParamProp,
                  })
                }
              }}
            />
          </div>
          <div className="progress_out">
            <div className="progress_box">
              <div className="progress_bar">
                <span className="progress_bar_in" style={{ width: `${item.process || 0}%` }}></span>
              </div>
              <span className="progress_num">{item.process || 0}%</span>
            </div>
          </div>
          <div className="limit_time">
            截止时间：{item.endTime || ''}
            <span className="residue_txt fright">
              剩余<i>{item.day || 0}</i>天
            </span>
          </div>
          <div className="plan_from">
            <span className="from_name inline-flex center-v">
              <em className="img_icon form_icon"></em>
              <span>
                来源：{createTime} {item.createUsername || ''} {fromType}
              </span>
            </span>

            <span className={`status_txt type_btn small fright ${statusClass}`}>{statusTxt}</span>
          </div>
          <span className={`planToped ${item.topId ? '' : 'forcedHide'}`}>置顶</span>
        </div>
      </Dropdown>
    )
  }
}

/**
 * 责任人列html
 * @param props
 */
const LiableUserCol = (props: any): any => {
  const item = props.itemData || {}
  return <div>责任人：{item.liableUsername || ''}</div>
}
/**
 * 截止时间列html
 * @param props
 */
const EndTimeCol = (props: any): any => {
  const item = props.itemData || {}
  return <div>截止时间：{item.endTime || ''}</div>
}
// 判断是否已经存在对象
const findRepeat = (param: any): number => {
  const ret: number = param.list.findIndex((v: any) => {
    if (param.json) {
      return v[param.keyName] == param.keyVal
    }
  })
  return ret
}

// ****************************规划-列表模式表格展示***************************//
let showNameInpParam: any
// 新增文件夹模块行
const newAddFolderTrItem = (paramObj: any) => {
  const listModeData = paramObj.listModeData || []
  const getInitName = folderInitName(planContextObj.folderPosList, listModeData)
  const nameInpShow = true
  /**
   * 新建文件夹处理
   * @param e
   */
  const setNewFolder = (e: any) => {
    paramObj.setNewFolderShow(false)
    const newName = e.currentTarget.value
    const param: any = {
      name: newName,
      zone: planContextObj.planType,
    }
    if (planContextObj.folderPosList.length > 1) {
      param.parentId = planContextObj.folderPosList[planContextObj.folderPosList.length - 1].id
    }
    addFolder(param, {
      planContextObj: planContextObj,
    })
  }

  let newName = getInitName
  const setNewName = (name: string) => {
    newName = name
  }
  const NewAddTr = () => {
    const [inpName, setInpName] = useState(getInitName)
    // 检测重命名文件夹时则获取输入框焦点
    const [nameRef, setNameRef] = useState(null)
    useEffect(() => {
      const ref: any = nameRef
      // 获取焦点
      if (ref) {
        ref.focus()
      }
      setInpName(getInitName)
    }, [nameRef])
    return (
      <div className="cellCont flex between">
        <div className="rowLeft flex center-v flex-1 overflow_hidden">
          <div className="row_content flex center-v overflow_hidden">
            <em className="img_icon dir_icon flex_shrink_0"></em>
            <span className="dir_name_show my_ellipsis">
              <span className={`dir_name plan_doc_txt ${nameInpShow ? 'forcedHide' : ''}`}>{getInitName}</span>
            </span>
            <Input
              className={`plan_doc_inp flex-1 ${nameInpShow ? '' : 'forcedHide'}`}
              value={inpName}
              maxLength={255}
              ref={(el: any) => setNameRef(el)}
              data-oldname={getInitName}
              onChange={(e: any) => {
                setInpName(e.currentTarget.value)
                setNewName(e.currentTarget.value)
              }}
              onBlur={(e: any) => {
                setNewFolder(e)
              }}
              onKeyUp={(e: any) => {
                if (e.keyCode == 13) {
                  setNewFolder(e)
                }
              }}
            />
          </div>
        </div>
      </div>
    )
  }
  const item = {
    id: 0,
    key: 0,
    viewType: 1,
    name: newName,
    planNameCol: <NewAddTr />,
    liableUserCol: '',
    endTimeCol: '',
    operateCol: '',
  }
  listModeData.unshift(item)
  return listModeData
}

/**
 * 操作列html
 * @param props
 */
const OperateCol = (props: any): any => {
  const ptActionProp = props.tbProps.action
  const item = props.itemData
  // 展开行
  const setExpKeys = props.setExpKeys
  const menuObj = {
    showNameInpParam: showNameInpParam,
    findPlanList: ptActionProp.findPlanList,
    planContextObj: planContextObj,
    ptProps: props,
    setExpKeys: setExpKeys,
  }
  const moreMenu: any = PlanMenu(props, menuObj)
  return (
    <div className="cellCont flex end center-v">
      {item.hasAuth == 1 && (
        <span
          className={`img_icon edit_auth_btn ${item.viewType == 1 ? 'forcedHide' : ''}`}
          onClick={(e: any) => {
            e.stopPropagation()
            menuClick({ key: '7' }, item, menuObj)
          }}
        >
          编辑权限
        </span>
      )}
      <span className="divider_v"></span>
      {item.hasAuth == 1 && (
        <Dropdown overlay={moreMenu} trigger={['click']} placement="bottomRight">
          <span className="more_menu_btn">
            更多 <DownOutlined />
            {/* <em className="img_icon tri_down_icon"></em> */}
          </span>
        </Dropdown>
      )}
    </div>
  )
}

/**
 * 规划-列表模式表格展示
 * @param params
 * viewType:1 文件夹 0规划
 */
const ListModeTable = (tbProps: any) => {
  // 规划上下文
  planContextObj = useContext(planContext)
  const filterSearchStatus = tbProps.filterSearchStatus || ''
  /**
   * 规划-列表模式单行数据展示
   * @param params
   * viewType:1 文件夹 0规划
   */
  const ListModeNameCol = (props: any): any => {
    const ptParamProp = props.tbProps.param
    const ptActionProp = props.tbProps.action
    const item = props.itemData || {}
    // 输入框的值
    const [inpName, setInpName] = useState(item.name)
    // 是否显示输入框
    const [nameInpShow, setNameInpShow] = useState(false)
    const [nameRef, setNameRef] = useState(null)

    showNameInpParam = {
      setNameInpShow: setNameInpShow,
      nameRef: nameRef,
    }
    // 判断设置任务名相关的方法是否重复
    const isRepeat = findRepeat({
      json: true,
      keyName: 'id',
      keyVal: item.id,
      list: nameStateList,
    })
    if (isRepeat == -1) {
      const thisState: any = {
        id: item.id,
        nameRef: nameRef,
        setNameRef: setNameRef,
        nameInpShow: nameInpShow,
        setNameInpShow: setNameInpShow,
      }
      nameStateList.push(thisState)
    }

    // 检测重命名文件夹时则获取输入框焦点
    useEffect(() => {
      const ref: any = nameRef
      // 获取焦点
      if (ref) {
        ref.focus()
      }
    }, [nameInpShow])
    let nameHtml: any
    if (props.viewType == 1) {
      nameHtml = (
        <div className="cellCont flex between">
          <div className={`topedTriangle ${item.topId ? '' : 'forcedHide'}`}></div>
          <div className="rowLeft flex center-v flex-1 overflow_hidden">
            <div className="row_content flex center-v overflow_hidden">
              <em className="img_icon dir_icon flex_shrink_0"></em>
              <span className="dir_name_show my_ellipsis">
                <span className={`dir_name plan_doc_txt ${nameInpShow ? 'forcedHide' : ''}`}>{item.name}</span>
              </span>
              <Input
                autoFocus
                className={`plan_doc_inp flex-1 ${nameInpShow ? '' : 'forcedHide'}`}
                ref={(el: any) => setNameRef(el)}
                value={inpName}
                maxLength={255}
                // defaultValue={inpName}
                data-oldname={item.name}
                onClick={(e: any) => {
                  e.stopPropagation()
                }}
                onChange={(e: any) => {
                  setInpName(e.currentTarget.value)
                }}
                onBlur={(e: any) => {
                  editFolderNameSet(e, item, {
                    setNameInpShow: setNameInpShow,
                    ptActionProp: ptActionProp,
                    ptParamProp: ptParamProp,
                  })
                }}
                onKeyUp={(e: any) => {
                  if (e.keyCode == 13) {
                    setNameInpShow(false)
                    // editFolderNameSet(e, item, {
                    //   setNameInpShow: setNameInpShow,
                    //   ptActionProp: ptActionProp,
                    //   ptParamProp: ptParamProp,
                    // })
                  }
                }}
              />
            </div>
          </div>
        </div>
      )
    } else {
      //status:1未派发 4已派发 3部分已派发 2审核中 5已完成
      let statusTxt = '',
        statusClass = 'blue'
      const status = item.status
      const rank = item.ascriptionType //0岗位级 2企业级 3部门级
      let rankText = ''
      let rankClass = ''
      // 任务状态
      if (status == 4) {
        statusTxt = '已派发'
      } else if (status == 3) {
        statusTxt = '部分派发'
      } else if (status == 2) {
        statusTxt = '审核中'
      } else if (status == 5) {
        statusTxt = '已完成'
        statusClass = 'green'
      } else {
        statusTxt = '草稿'
        statusClass = 'gray'
      }
      // 归属类型
      if (rank == 0) {
        rankText = '岗位级'
        rankClass = 'green'
      } else if (rank == 2) {
        rankText = '企业级'
        rankClass = 'blue'
      } else if (rank == 3) {
        rankText = '部门级'
        rankClass = 'blue'
      }
      // 来源
      const fromType = item.isCreate == 0 ? '派发' : '创建'
      //开始时间
      const createTime = standardCreateTime(item.createTime || '')
      nameHtml = (
        <div
          className="cellCont flex between workPlanItem"
          onClick={() => {
            toMindMap(item)
          }}
        >
          <div className={`topedTriangle ${item.topId ? '' : 'forcedHide'}`}></div>
          <div className="rowLeft flex center-v flex-1">
            <div className="comUserHead flex_shrink_0"></div>
            <div className="row_content flex-1">
              <div className="plan_cont_top flex center-v">
                <em className="img_icon plan_icon flex_shrink_0"></em>
                <span className={item.isRead == 0 ? 'plan_red_dot' : 'forcedHide'}></span>
                <span className={`tit_name plan_name my_ellipsis ${nameInpShow ? 'forcedHide' : ''}`}>
                  {item.name}
                </span>
                <input
                  className={`plan_doc_inp ${nameInpShow ? '' : 'forcedHide'}`}
                  ref={(el: any) => setNameRef(el)}
                  value={inpName}
                  maxLength={255}
                  data-oldname={item.name}
                  onClick={(e: any) => {
                    e.stopPropagation()
                  }}
                  onChange={(e: any) => {
                    setInpName(e.currentTarget.value)
                  }}
                  onBlur={(e: any) => {
                    editPlanNameSet(e, item, {
                      setNameInpShow: setNameInpShow,
                      ptActionProp: ptActionProp,
                      ptParamProp: ptParamProp,
                    })
                  }}
                  onKeyUp={(e: any) => {
                    if (e.keyCode == 13) {
                      setNameInpShow(false)
                    }
                  }}
                />

                <span className={`plan_rank type_btn small ${rankClass}`}>{rankText}</span>
              </div>
              <div className="plan_cont_bot flex center-v">
                <span className={`status_txt type_btn small ${statusClass}`}>{statusTxt}</span>
                {item.type == 2 ? '' : <TaskTypeTag type={item.taskType} />}
                <span className="from_name inline-flex center-v">
                  <em className="img_icon form_icon"></em>
                  <span>
                    来源：{createTime} {item.createUsername || ''} {fromType}
                  </span>
                </span>
                <span className="remain_time inline-flex center-v">
                  <em className="img_icon remain_icon"></em>
                  <span>
                    剩余<span className="remain_time_num">{item.day || 0}</span>天
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return nameHtml
  }

  const ptParamProp = tbProps.param
  // 处理单元格合并
  const renderContent = (value: any, row: any) => {
    const obj: any = {
      children: value,
      props: {},
    }
    // type为1（文件夹）的名字列合并，其他列设置为0不显示
    if (row.viewType == 1) {
      obj.props.colSpan = 0
    }
    return obj
  }
  const columns = [
    {
      title: '名称',
      dataIndex: 'planNameCol',
      className: 'planName',
      key: 'name',
      ellipsis: true,
      fixed: true,
      render: (value: any, row: any) => {
        const obj: any = {
          children: value,
          props: {},
        }
        // type为1（文件夹）的名字列合并，其他列设置为0不显示
        if (row.viewType == 1) {
          obj.props.colSpan = 3
        }
        return obj
      },
    },
    {
      title: '责任人',
      dataIndex: 'liableUserCol',
      key: 'liableUserName',
      width: '15%',
      render: renderContent,
    },
    {
      title: '截止时间',
      dataIndex: 'endTimeCol',
      key: 'limitTime',
      className: 'dealinetime',
      width: '20%',
      render: renderContent,
    },
    {
      title: '操作',
      dataIndex: 'operateCol',
      key: 'operate',
      width: '15%',
    },
  ]
  // 列表数据
  const [listModeData, setListModeData] = useState<any>([])
  // 列表展开的行
  const [expKeys, setExpKeys] = useState<any>([])

  const isNewFolder = ptParamProp.newAddFolderTr
  /**
   * 设置新增文件夹模块显示隐藏
   * @param flag
   */
  const setNewFolderShow = (flag: boolean) => {
    ptParamProp.setNewAddFolder(flag)
  }
  // 每次更新数据props.dataList都刷新
  useEffect(() => {
    nameStateList = []
    const getData = ptParamProp.dataList || []
    const listDatas = setTreeTableData(getData, false)
    setListModeData([...listDatas])
  }, [ptParamProp.dataList])
  // 监听新增文件夹事件触发
  useEffect(() => {
    if (isNewFolder) {
      const afterAddData = newAddFolderTrItem({
        listModeData: listModeData,
        setNewFolderShow: setNewFolderShow,
      })
      setListModeData([...afterAddData])
    }
  }, [isNewFolder])

  /**
   * 处理单个数组数据为表格树可用数据
   * childLevel：是否是子级数据（除第一层都是子级）
   */
  const setTreeTableData = (data: any, childLevel: boolean) => {
    return data.map((item: any) => {
      item.childLevel = childLevel
      item.key = item.id
      const liableUserCol = (
        <LiableUserCol key={item.id} viewType={item.viewType} itemData={item} tbProps={tbProps} />
      )
      const endTimeCol = <EndTimeCol key={item.id} viewType={item.viewType} itemData={item} tbProps={tbProps} />
      const planNameCol = (
        <ListModeNameCol key={item.id} viewType={item.viewType} itemData={item} tbProps={tbProps} />
      )
      const operateCol = (
        <OperateCol
          key={item.id}
          viewType={item.viewType}
          itemData={item}
          tbProps={tbProps}
          setExpKeys={(key: string) => {
            const index = expKeys.indexOf(key)
            if (index != -1) {
              expKeys.splice(index, 1)
            } else {
              expKeys.push(key)
            }
            setExpKeys([...expKeys])
          }}
        />
      )
      if (item.folderCount > 0) {
        item.children = []
      }
      return {
        ...item,
        liableUserCol,
        planNameCol,
        operateCol,
        endTimeCol,
      }
    })
  }
  /**
   * 给树形表格添加新数据
   * @param list
   * @param id
   * @param children
   */
  const updateTreeChild = (list: any, attachObj: any) => {
    return list.map((item: any) => {
      if (item.id === attachObj.findId) {
        item.children = attachObj.children
        // return {
        //   ...item,
        //   children,
        // }
      } else if (item.children) {
        return {
          ...item,
          children: updateTreeChild(item.children, attachObj),
        }
      }
      return item
    })
  }
  /**
   * 点击展开图标时触发
   * @param expanded
   * @param row
   */
  const expandNode = (expanded: any, row: any) => {
    if (expanded) {
      expKeys.push(row.key)
    } else {
      const index = expKeys.indexOf(row.key)
      if (index != -1) {
        expKeys.splice(index, 1)
      }
    }
    setExpKeys([...expKeys])
    if (!expanded || row.children.length > 0) {
      return
    }
    const param = ptParamProp.listParam({
      onlyData: true,
      dirId: row.id,
      listModeChild: true,
    })
    queryPlanList(param).then(res => {
      const dataObj = res.data.obj || {}
      if (res.success) {
        const childData = [...(dataObj.top || []), ...(dataObj.bottom || [])]
        const newChilds = setTreeTableData(childData, true)
        updateTreeChild(listModeData, {
          findId: row.id,
          children: newChilds,
          childLevel: false,
        })
        // 不能直接传listModeData，必须新插入一个数组[...listModeData]，否则无法及时更新节点上的数据
        setListModeData([...listModeData])
      }
    })
  }
  /**
   * 展开折叠参数
   */
  const expandable: any = {
    //自定义展开折叠按钮
    expandIcon: ({ expanded, onExpand, record }: any) => {
      if ((record.children && record.children.length > 0) || record.folderCount) {
        if (expanded) {
          return <span className="treeTableIcon img_icon expanded" onClick={e => onExpand(record, e)}></span>
        } else {
          return <span className="treeTableIcon img_icon collapsed" onClick={e => onExpand(record, e)}></span>
        }
      } else {
        return <span className="treeTableIcon" onClick={e => onExpand(record, e)}></span>
      }
    },
    indentSize: 20, //自定义缩进值
  }

  // *********************列表模式右键菜单**********************//
  const [rightMenuItem, setRightMenuItem] = useState({ display: 'none', pageX: 0, pageY: 0, row: {} })
  const [listModeShowNameInpParamState, setRigMenu] = useState({})
  const ListModeRigMenu = () => {
    const { display, pageX, pageY, row } = { ...rightMenuItem }
    const tmpStyle: any = {
      position: 'fixed',
      left: `${pageX}px`,
      top: `${pageY}px`,
      display: display,
    }
    const moreMenu: any = PlanMenu(
      { itemData: row },
      {
        showNameInpParam: listModeShowNameInpParamState,
        planContextObj: planContextObj,
        listModeRig: true,
        tmpStyle: tmpStyle,
        rightMenuItem: rightMenuItem,
        setExpKeys: (key: string) => {
          const index = expKeys.indexOf(key)
          if (index != -1) {
            expKeys.splice(index, 1)
          } else {
            expKeys.push(key)
          }
          setExpKeys([...expKeys])
        },
      }
    )
    return moreMenu
  }

  // 列表上右键事件
  const rightClick = (e: any, row: any) => {
    setRightMenuItem({
      display: 'block',
      pageX: e.pageX,
      pageY: e.pageY,
      row: row,
    })
    const thisState = nameStateList.find((v: any) => {
      return v.id == row.id
    })
    const listModeShowNameInpParam: any = {
      setNameInpShow: thisState.setNameInpShow,
      nameRef: thisState.nameRef,
    }
    setRigMenu(listModeShowNameInpParam)
  }
  // 隐藏菜单
  const hideAllMenu = () => {
    setRightMenuItem({ display: 'none', pageX: 0, pageY: 0, row: {} })
    document.removeEventListener('click', hideAllMenu)
  }
  // *********************列表模式数据刷新**********************//
  // 递归重命名
  const renderRename = (list: any, id: string, newName: any) => {
    for (const i in list) {
      const item: any = list[i]
      if (id == item.id) {
        item.name = newName
        item.planNameCol = (
          <ListModeNameCol key={item.id} viewType={item.viewType} itemData={item} tbProps={tbProps} />
        )
        break
      } else if (item.children) {
        renderRename(item.children || [], id, newName)
      }
    }
  }
  // 递归删除
  const renderDel = (list: any, id: string, pItem: any) => {
    for (const i in list) {
      const item: any = list[i]
      if (id == item.id) {
        if (pItem && pItem.children && pItem.children.length == 1) {
          pItem.folderCount = 0
          pItem.children = false
        }
        list.splice(i, 1)
        break
      } else if (item.children) {
        renderDel(item.children || [], id, item)
      }
    }
  }
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(tbProps.onRef, () => ({
    // 暴露给父组件的方法
    // 递归重命名
    renderRename: (paramObj: any) => {
      renderRename(listModeData, paramObj.id, paramObj.newName)
      setListModeData([...listModeData])
    },
    // 递归删除
    renderDel: (paramObj: any) => {
      renderDel(listModeData, paramObj.id, null)
      setListModeData([...listModeData])
    },
  }))
  return (
    <section
      className={`workPlanList_list ${listModeData.length == 0 ? 'bordernone' : ''}`}
      style={ptParamProp.planMode == 1 ? {} : { display: 'none' }}
    >
      {listModeData && listModeData.length > 0 && (
        <Table
          className="workPlanListTable"
          columns={columns}
          dataSource={listModeData}
          showHeader={false}
          onExpand={expandNode}
          expandable={expandable}
          pagination={false}
          expandedRowKeys={expKeys}
          onRow={(row: any) => {
            return {
              onContextMenu: event => {
                if (row.hasAuth == 0) {
                  return
                }
                rightClick(event, row)
                document.addEventListener('click', hideAllMenu)
              },
            }
          }}
        />
      )}
      {listModeData && listModeData?.length == 0 && planContextObj.planType != 3 && (
        <NoneData
          className={`margTop12 threePosition`}
          searchValue={filterSearchStatus}
          imgSrc={$tools.asAssetsPath(`/images/noData/no_okr_card_1.png`)}
          showTxt={'目前你尚未负责任何OKR哦~'}
          containerStyle={{ zIndex: 0 }}
          textStyle={{ fontSize: 16, marginLeft: -82 }}
        />
      )}
      {listModeData && listModeData?.length == 0 && planContextObj.planType == 3 && (
        <NoneData
          className={`okr-model full_okr `}
          imgSrc={$tools.asAssetsPath(`/images/noData/xl_okr.png`)}
          showTxt={
            <div className="create-okr">
              <div className="title">快速创建目标</div>
              <div className="title-max">目标层层对齐，信息全面穿透</div>
              <div className="sub-title">一起体验团队敏捷协作的爽感吧~</div>
              <div className="sub-title-max">快速创建目标，一起体验团队敏捷协作的爽感吧~</div>
              <div
                className="create-btn "
                onClick={(e: any) => {
                  e.stopPropagation()
                  tbProps.action.createPlan({ key: '0' })
                }}
              >
                <div className="div-btn">创建目标</div>
              </div>
            </div>
          }
          addPlugs={<img className="right-img" src={$tools.asAssetsPath('/images/noData/single.png')} alt="" />}
        />
      )}
      {/* 列表右键菜单 */}
      {rightMenuItem.display == 'block' ? <ListModeRigMenu /> : ''}
    </section>
  )
}

export { CardModeList, ListModeTable, standardCreateTime, TaskTypeTag }
