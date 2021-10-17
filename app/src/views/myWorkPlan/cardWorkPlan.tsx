import React, { useState, useEffect, useContext, useRef } from 'react'
import { Table, Menu, Dropdown, message, Modal, Button } from 'antd'
import { useDrag, useDrop } from 'react-dnd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import {
  addFolder,
  modifyFolderNameNew,
  modifyPlanNameNew,
  planOperationBtn,
  moveToDirSave,
  delFolderNew,
  topFolderNew,
  cancelTopFolderNew,
  delPlanNew,
} from './NewPlanOpt'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { planContext, setMovePlanModal } from './myWorkPlan'
// import './myWorkPlan'
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
 * type：0规划菜单 1文件夹菜单
 *
 */
const menuClick = (menuProp: any, item: any, attachObj: any, props: any, setdelModel?: any) => {
  // 隐藏按钮菜单
  if (attachObj.setMoreBtnShow) {
    attachObj.setMoreBtnShow({ moreMenuShow: false, rigMenuShow: false })
  }
  const type = item.type
  //规划操作
  switch (menuProp.key) {
    case '200': // 重命名
      // 左侧列表 重命名
      // attachObj.setNameInpShow(item)
      attachObj.from == 'leftTree' ? attachObj.setNameInpShow(item) : showNameInp && showNameInp(attachObj)

      break
    case '201': //置顶/取消置顶规划
      if (item.topId) {
        //取消置顶
        cancelTopFolderNew({
          topId: item.topId,
        }).then(() => {
          // 调用刷新方法
          // attachObj.refreshLeftTree && attachObj.refreshLeftTree({ optType: 'all' })
          attachObj.refreshLeftTree &&
            attachObj.refreshLeftTree({
              optType: 'cancelTop',
              taskIds: [item.id],
              type,
            })
          // props.ptProps && props.ptProps.action && props.ptProps.action.btnSolveOpt('top', item) //返回父组件打开移动窗口进行处理
        })
      } else {
        topFolderNew({
          userId: $store.getState().nowUserId,
          type: item.type,
          typeId: item.id,
        }).then((res: any) => {
          // 调用刷新方法
          // attachObj.refreshLeftTree && attachObj.refreshLeftTree({ optType: 'all' })
          attachObj.refreshLeftTree &&
            attachObj.refreshLeftTree({
              optType: 'isTop',
              taskIds: [item.id],
              type,
            })
          // props.ptProps && props.ptProps.action && props.ptProps.action.btnSolveOpt('bootom', item) //返回父组件打开移动窗口进行处理
        })
      }

      break
    case '202': //移动规划
      // 弹框在菜单内部时，会导致冒泡自动选中左侧组织架构，故换用外部弹框
      // setdelModel && setdelModel('move', item, attachObj) //返回父组件打开移动窗口进行处理
      setMovePlanModal({
        visible: true,
        moveData: item,
        btnSolveOpt: attachObj.btnSolveOpt,
        refreshLeftTree: attachObj.refreshLeftTree,
      })
      break
    case '203': //删除文件夹
      if (item.type == 1) {
        //  setdelModel && setdelModel('delete', item)
        Modal.confirm({
          title: '提醒',
          icon: <ExclamationCircleOutlined />,
          content: '删除文件夹会连同脑图一起删除，且无法找回，确定删除该文件夹？',
          onOk() {
            // 文件夹
            delFolderNew({ id: item.id }).then((res: any) => {
              if (!res.success) return
              // 调用刷新方法-(刷新左侧)
              attachObj.refreshLeftTree &&
                attachObj.refreshLeftTree({ optType: 'del', taskIds: [item.id], type })
              // props.changeData && props.changeData('delete', item)
            })
          },
        })
      } else {
        //删除规划
        Modal.confirm({
          title: '提醒',
          icon: <ExclamationCircleOutlined />,
          content: '确定删除该规划？',
          onOk() {
            // 调用刷新方法
            delPlanNew({ id: item.id }).then((res: any) => {
              if (!res.success) return
              // 调用刷新方法--（适用于内容板块）
              attachObj.refreshLeftTree &&
                attachObj.refreshLeftTree({ optType: 'del', taskIds: [item.id], type })
              // props.changeData && props.changeData('delete', item)
            })
          },
        })
      }
      break
    default:
      break
  }

  // }
}

/**
 * 工作规划菜单
 * @param props
 * ptProps:父节点属性
 * attachObj：附加参数
 */
export const PlanMenu = (props: any, attachObj: any, arrList?: any) => {
  const item = props.itemData || {}
  const [delPlanModal, setdelPlanModal] = useState({
    delPlanModalShow: false,
    delData: {},
    planModelShow: false,
    getNowMoveData: {},
  })
  const getNowText = (val: any, status: number) => {
    let txtName: any = ''

    if (val == '200') {
      txtName = '重命名'
    } else if (val == '201') {
      if (status == 1) {
        txtName = '置顶'
      } else {
        txtName = '取消置顶'
      }
    } else if (val == '202') {
      txtName = '移动到'
    } else if (val == '203') {
      txtName = '删除'
    }
    return txtName
  }

  const changeModelShow = (type: string, data: any) => {
    if (type == 'delete') {
      //打开删除弹框
      delPlanModal.delPlanModalShow = true
      delPlanModal.delData = data
    } else if (type == 'move') {
      //打开移动弹框
      delPlanModal.planModelShow = true
      delPlanModal.getNowMoveData = data
    }
    setdelPlanModal({ ...delPlanModal })
  }
  let moreMenu: any = ''
  moreMenu = (
    <>
      <Menu
        className="myDropMenu newPlanBtnMenu"
        style={attachObj.listModeRig ? attachObj.tmpStyle : {}}
        onClick={(menuProp: any) => {
          menuProp.domEvent.stopPropagation()
          if (props.ptProps && props.ptProps.action) {
            attachObj.btnSolveOpt = props.ptProps.action.btnSolveOpt
          }
          menuClick(menuProp, item, attachObj, props, changeModelShow)
        }}
      >
        {arrList &&
          arrList.length > 0 &&
          arrList.map((item: any, index: any) => (
            <Menu.Item key={item.code} className={`${item.isUse ? '' : 'forcedHide'}`}>
              <div className="myMenuItem">
                <span>{getNowText(item.code, item.status)}</span>
              </div>
            </Menu.Item>
          ))}
      </Menu>
    </>
  )
  return moreMenu
}

/**
 * 规划-卡片模式列表数据展示
 * @param params
 * type:1 文件夹 0规划
 */
const CardModeList = (props: any) => {
  // 获取规划上下文数据
  const planContextObj: any = useContext(planContext)
  const { planRightShow } = props.param
  const actionProp = props.action
  const [planListData, setPlanListData] = useState(props.param)
  useEffect(() => {
    setPlanListData(props.param)
  }, [props.param])
  return (
    <DndProvider backend={HTML5Backend}>
      <section className={`workPlanList_card newPlanCardData`}>
        <div
          className={`workPlanCardTopsBox flex wrap center-v planTopsBox ${
            planListData.cardDirList.length > 0 || planListData.newAddFolder ? '' : 'forcedHide'
          }`}
        >
          {planListData.cardDirList.length > 0 &&
            planListData.cardDirList.map((item: any, i: number) => {
              return item.id ? (
                <CardModeItem
                  key={i}
                  viewType={item.type}
                  itemData={item}
                  onClick={() => {
                    if (item.type == 1) {
                      actionProp.inFolder(item)
                    } else {
                      // 右侧操作--- 联动展开选中左侧树
                      planContextObj.planLeftRef &&
                        planContextObj.planLeftRef.current.expandTreeNode({
                          nodeInfo: {
                            id: item.id,
                            type: item.type,
                            parentFolderId: item.parentFolderId,
                          },
                        })
                      // 跳转到脑图
                      planRightShow({ showType: 2, mainId: item.id })
                    }
                  }}
                  changeData={(type: string, data: any) => {
                    if (data) {
                      let index = -1
                      planListData.cardDirList.map((val: any, num: number) => {
                        if (val.id == data.id) {
                          planListData.cardDirList[num] = data
                          index = num
                        }
                      })
                      if (type == 'delete' || type == 'move') {
                        planListData.cardDirList.splice(index, 1)
                        if (type == 'delete' && planListData.cardDirList.length == 0) {
                          actionProp.btnSolveOpt('deleteAll')
                        }
                      }
                      setPlanListData({ ...planListData })
                    }
                  }}
                  ptProps={props}
                />
              ) : (
                ''
              )
            })}
          {/* 新增文件夹卡片 */}
          {props.param.newAddFolder && <NewFolderItem ptProps={props} />}
        </div>
      </section>
    </DndProvider>
  )
}

/**
 * 点击重命名按钮后
 */
const showNameInp = ({ setNameInpShow }: { setNameInpShow: (flag: boolean) => void }) => {
  setNameInpShow(true)
}

/**
 * 文件夹初始名字设置
 */
export const folderInitName: any = (folderDataList: any) => {
  // 当前层级，最多创建10层
  const nowLevel = folderDataList.length + 1
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
    if (item.type == 1 && item.name.includes('新建文件夹')) {
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
  // console.log(maxNum, minNum, name)
  return name
}
/**
 * 新增文件夹模块渲染
 * @param props
 */
const NewFolderItem = (props: any) => {
  const planContextObj: any = useContext(planContext)
  const ptProps = props.ptProps
  const paramProp = ptProps.param
  const actionProp = ptProps.action
  const [planName, setPlanName] = useState('')
  // const [nameInpShow, setNameInpShow] = useState(true)
  // 名字输入框节点
  const [nameRef, setNameRef] = useState(null)
  // 按钮菜单显示隐藏
  const [menuBtnShow, setMoreBtnShow] = useState({ moreMenuShow: false, rigMenuShow: false })
  const isNewFolder = paramProp.newAddFolder
  // 新增文件夹
  const moreMenu = (
    <Menu className="myDropMenu newPlanBtnMenu">
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
  // 检测新增文件夹时名字是否变化，之后则获取输入框焦点
  useEffect(() => {
    const ref: any = nameRef
    // 获取焦点
    if (ref) {
      ref.focus()
      const folderDataList = [...(paramProp.cardDirList || [])]
      const getInitName = folderInitName(folderDataList)
      setPlanName(getInitName)
    }
  }, [nameRef])
  /**
   * 新建文件夹处理
   * @param e
   */
  const setNewFolder = (e: any) => {
    const newName = e.currentTarget.value
    if (newName == '') {
      return
    } else {
      setNewFolderShow(false)
      const param: any = {
        name: newName,
      }
      if (paramProp.folderPosList.length > 1) {
        param.parentId = paramProp.folderPosList[paramProp.folderPosList.length - 1].id
      }
      addFolder(param).then((res: any) => {
        props.ptProps && props.ptProps.action && props.ptProps.action.btnSolveOpt('add')
        planContextObj.planLeftRef &&
          planContextObj.planLeftRef.current.refreshTree({
            optType: 'addChildFolder',
            type: 1,
            taskIds: [param.parentId || 0],
            childId: res.data.data,
            parentIdNodeKey: `1_${param.parentId || 0}`,
          })
      })
    }
  }
  const { rigMenuShow } = { ...menuBtnShow }
  return (
    <Dropdown overlay={moreMenu} trigger={['contextMenu']} placement="bottomRight" visible={rigMenuShow}>
      <div className={`project_plan_data workPlanDocItem ${isNewFolder ? '' : 'forcedHide'}`}>
        <div className="planDocImgBox relative">
          <span className={`img_icon ${props.type == 1 ? 'plan_paln_icon' : ' plan_new_icon'}`}></span>
          <input
            className={`plan_doc_inp`}
            ref={(el: any) => setNameRef(el)}
            value={planName}
            maxLength={255}
            onBlur={(e: any) => {
              setNewFolder(e)
            }}
            onKeyUp={(e: any) => {
              if (e.keyCode == 13) {
                setNewFolder(e)
              }
            }}
            onChange={(e: any) => {
              setPlanName(e.currentTarget.value)
            }}
          />
        </div>
      </div>
    </Dropdown>
  )
}

/**
 * 规划-卡片模式单项数据展示
 * @param params
 * viewType:1 文件夹 0规划
 */
const CardModeItem = (props: any) => {
  // const nowUserId = $store.getState().nowUserId
  const planContextObj: any = useContext(planContext)
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
  const [menuBtnShow, setMoreBtnShow] = useState({ moreMenuShow: false, rigMenuShow: false, planList: [] })
  // const showNameInpParam = {
  //   setNameInpShow: setNameInpShow,
  //   nameRef: nameRef,
  // }
  const menuObj = {
    findPlanList: ptActionProp.findPlanList,
    planContextObj: {},
    ptProps: ptProps,
    setMoreBtnShow: setMoreBtnShow,
    setNameInpShow,
    nameRef,
    refreshLeftTree: planContextObj.planLeftRef.current.refreshTree,
  }
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
    planOperationBtn(viewType ? 6 : 5, id).then((res: any) => {
      setMoreBtnShow({ moreMenuShow: flag, rigMenuShow: false, planList: res.data.dataList })
    })
  }
  // 右键菜单显示隐藏
  const rigMenuVisibleChange = (flag: boolean, id: number, viewType?: number) => {
    planOperationBtn(viewType ? 6 : 5, id).then((res: any) => {
      setMoreBtnShow({ moreMenuShow: false, rigMenuShow: flag, planList: res.data.dataList })
    })
  }
  // const { moreMenuShow, rigMenuShow } = { ...menuBtnShow }

  // ************************拖动功能 start**********************//
  let sourceItem: any = {}
  let targetItem: any = {}
  const dragRef: any = useRef(null)
  // // 使用 useDrag拖拽
  const [, drager] = useDrag({
    item: { type: 'planDragItem', itemData: item },
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
      if (sourceItem.id == targetItem.id || targetItem.type == 0) {
        return
      } else {
        $(dragRef.current).addClass('project_plan_border')
      }
      moveToDirSave(
        {
          id: targetItem.id, //目标文件夹id
          type: sourceItem.type,
          typeId: sourceItem.id, //被移动对象id
        },
        {
          optType: 'drag',
        }
      ).then((res: any) => {
        $(dragRef.current).removeClass('project_plan_border')
        const reFreshParam = {
          optType: 'move',
          taskIds: [sourceItem.id],
          type: sourceItem.type,
          parentId: targetItem.id,
          parentIdNodeKey: `1_${targetItem.id}`,
        }
        planContextObj.planLeftRef.current.refreshTree(reFreshParam)
        props.changeData('move', sourceItem)
      })
    },
  })
  // 文件夹既可以被拖拽也可以接收拖拽元素，故使用 drag 和 drop 包装 ref
  // if (item.type == 1) {
  droper(drager(dragRef))
  // }
  const dragHover = collectProps.isOver ? 'drag_hover' : ''
  // ************************拖动功能 end**********************//
  /**
   * 文件夹重命名处理
   * @param e
   */
  const editFolderNameSet = (e: any, eItem: any, attachObj: any) => {
    // const folderPosList = []
    const newName = e.currentTarget.value
    const oldName = e.currentTarget.dataset.oldname
    if (newName == '' || oldName == newName) {
      attachObj.setNameInpShow(false)
    } else {
      attachObj.setNameInpShow(false)
      const param: any = {
        id: eItem.id,
        name: newName,
      }
      // if (folderPosList.length > 1) {
      param.parentId = eItem.parentId //或者取传进来的parentId
      // }
      if (eItem.type == 1) {
        modifyFolderNameNew(param).then((res: any) => {
          eItem.name = newName
          menuObj.refreshLeftTree({ optType: 'reName', taskIds: [eItem.id], type: 1 })
          props.changeData('name', item)
        })
      } else {
        modifyPlanNameNew(param).then(() => {
          eItem.name = newName
          menuObj.refreshLeftTree({ optType: 'reName', taskIds: [eItem.id], type: 0, isMind: false })
          props.changeData('name', item)
        })
      }
    }
  }

  //正常渲染文件夹
  //文件夹
  return (
    <Dropdown
      overlay={PlanMenu(props, menuObj, menuBtnShow.planList)}
      trigger={['contextMenu']}
      placement="bottomRight"
      visible={menuBtnShow.rigMenuShow}
      onVisibleChange={e => {
        rigMenuVisibleChange(e, item.id, props.viewType)
      }}
    >
      <div
        className={`project_plan_data ${dragHover} workPlanDocItem`}
        data-itemdata={JSON.stringify(item)}
        ref={dragRef}
        onClick={() => {
          props.onClick(item)
        }}
      >
        <div className="planDocImgBox relative ">
          <span className={`planToped ${item.topId ? '' : 'forcedHide'}`}>置顶</span>
          <span className={`img_icon ${props.viewType == 1 ? 'plan_new_icon' : 'plan_paln_icon'}`}></span>
          <div className={`plan_doc_txt dir_name_show my_ellipsis ${nameInpShow ? 'forcedHide' : ''}`}>
            <div className="my_ellipsis" style={{ width: 'calc(100% - 16px)' }}>
              {item.name ? item.name : '未命名'}
            </div>
            <div>
              <span style={{ marginRight: '12px' }}>{item.createTime}创建</span>
              <span
                style={{ paddingLeft: '12px', borderLeft: '1px solid #9A9AA2' }}
                className={`${item.type ? '' : 'forcedHide'}`}
              >
                {item.planningCount}个规划
              </span>
            </div>
          </div>
          <div
            className={`plan_opt_btn_out ${nameInpShow ? '' : 'disHover'}`}
            onClick={e => {
              e.stopPropagation()
            }}
          >
            <Dropdown
              overlay={PlanMenu(props, menuObj, menuBtnShow.planList)}
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
              console.log('blur')
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
      </div>
    </Dropdown>
  )
}

export { CardModeList, standardCreateTime, TaskTypeTag }
