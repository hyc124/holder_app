import React, { forwardRef, useEffect, useImperativeHandle, useState, useContext, useRef } from 'react'
import { Avatar, Button, Checkbox, Dropdown, Input, Modal, message, Rate, Popover } from 'antd'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import update from 'immutability-helper'
import { DndProvider } from 'react-dnd'
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend'
import { useDrag, useDrop } from 'react-dnd'
import { SupportOKRs } from './createTask'
import { createObjectInit, createObjectSave } from './getData'
// import { CheckOutlined } from '@ant-design/icons'
import { setCaretEnd } from '@/src/common/js/common'
import { HeartFilled } from '@ant-design/icons'
import Tooltip from 'antd/es/tooltip'
import { refreshOkrKanban } from '../../workdesk/okrKanban/okrKanban'
import { OkrDateModule } from '@/src/components/okrDate/okrDate'
import { queryPeriodApi } from '../OKRDetails/okrDetailApi'
import { selectDateDisplay } from '../../fourQuadrant/getfourData'
import { planContext } from '../../okr-four/list-card-four/okr-workplan'

// 禁用创建按钮，防止用户多次点击
let saveDisable = false
// let blurFlag: any = null //创建kr与添加同时
export const createObjectContext: any = React.createContext({})
// 创建任务数据缓存
const nowInit = {
  visible: false,
  keepCreate: false, //是否继续创建目标
  callbacks: {},
  reqType: 0, // 请求类型：0点击创建按钮，1修改权重，2其他
  from: '',
  ascriptionId: 0, // 归属id
  ascriptionType: 0, // 归属类型 0个人，2企业，3部门
  ascriptionName: '', //归属名称
  description: '', // 描述
  name: '', // 目标名称
  periodId: 0, // 周期id
  supportOkrList: [], // 支撑目标id数组
  krResults: [], //放置KR数据
  periodList: [], //周期列表
  teamLogo: '', //企业的图像
  defaultLiable: {},
  loginLiable: {}, //缓存当前登录人的信息
  liable: {
    // 负责人
    deptId: 0, // 部门id
    deptName: '', // 部门名称
    roleId: 0, // 岗位id
    roleName: '', // 岗位名称
    userId: 0, // 成员id
    username: '', // 成员名称
  },
  ratingType: 0, //打分设置
  refresh: 0, //设置刷新统计
  createType: '', //设置编辑或者创建
  enableOkrTeams: [],
  supports: null,
}
let planContextObj: any
//创建目标弹窗组件
export const CreateObjectModal = forwardRef((_: any, ref) => {
  // 从okr-workplan获取的context值
  planContextObj = useContext(planContext)

  const { nowUserId } = $store.getState()
  const nowInitData: any = JSON.parse(JSON.stringify(nowInit))
  // 数据展示---需要操作展示的数据
  const [state, setTaskState] = useState<any>(nowInit)
  /**
   * 暴露给外部调用的方法
   */
  useImperativeHandle(ref, () => ({
    getState: (paramObj: any) => {
      if (paramObj.visible) {
        createObjectInit({
          operateUser: paramObj.teaminfo?.userId || nowUserId,
          reqType: 0,
          ...paramObj.teaminfo,
        }).then((res: any) => {
          if (res.returnCode == 0) {
            setTaskState({
              ...state,
              ...res.data,
              ...paramObj,
              defaultLiable: res.data.liable,
              teamId: res.data?.teamId.toString(),
            })
          } else {
            setTaskState({ ...state, visible: false })
          }
        })
      } else {
        const defData = clearTaskData()
        const newState = { ...state, ...defData, ...paramObj }
        setTaskState(newState)
      }
    },
  }))
  /**
   * 设置state及全局数据
   * @param paramObj
   */
  const setState = (paramObj: any, attachObj?: any) => {
    const refresh = new Date().getTime().toString()
    setTaskState({ ...state, ...paramObj, refresh })
  }
  /**
   * 取消操作
   */
  const handleCancel = () => {
    const newState = clearTaskData(state.keepCreate ? { clearType: 'keepCreate' } : undefined)
    setState({ ...state, ...newState })
  }

  /**
   * 编辑数据
   */
  const editTaskData = (paramObj: any, attachObj?: any) => {
    const { clearType }: any = attachObj ? attachObj : {}
    if (clearType == 'changeData') {
      // const supportIds: any = []
      // state.supportOkrList.map((item: any) => {
      //   supportIds.push(item.id)
      // })
      const list: any = $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
      createObjectInit({
        ascriptionId: paramObj.ascriptionId,
        ascriptionType: paramObj.ascriptionType,
        operateUser: nowUserId,
        teamId: paramObj.teamId,
        periodId: state.periodId,
        krResults: paramObj.krResults || JSON.parse(list),
        liable: paramObj.liable || state.liable,
        reqType: 2,
      }).then((res: any) => {
        setState({
          ...state,
          ...res.data,
          supportOkrList: [],
          supports: null,
          defaultLiable: res.data.liable,
          teamId: res.data?.teamId.toString(),
        })
      })
      return false
    }
    const newState: any = state
    Object.keys(paramObj).forEach((key: any) => {
      newState[key] = paramObj[key]
    })
    setState({ ...state, ...newState })
  }
  /**
   * 清空缓存内容
   * clearType:清空类型  keepCreate-继续创建目标
   */
  const clearTaskData = (paramObj?: { clearType: any }) => {
    const infoObj: any = paramObj ? paramObj : {}
    const { clearType } = infoObj
    let newData = {}
    const defData: any = nowInitData
    // 更改归属
    if (clearType == 'keepCreate') {
      const {
        ascriptionId,
        ascriptionName,
        ascriptionType,
        liable,
        periodList, //周期列表
        teamLogo, //企业的图像
        defaultLiable,
        loginLiable,
        callbacks,
        periodId,
        ratingType,
        enableOkrTeams,
        visible,
        ...clearData
      } = defData
      newData = { ...clearData }
    } else {
      newData = defData
    }
    return newData
  }
  /**
   * 保存目标
   */
  const handleOk = () => {
    if (!state.name) {
      message.warning('目标名称不能为空字符')
      saveDisable = false
      return false
    }
    if (saveDisable) {
      // 恢复创建按钮禁用状态
      setTimeout(() => {
        saveDisable = false
      }, 500)
      return false
    }
    // 禁用创建按钮，防止用户多次点击
    saveDisable = true
    const supportIds: any = []
    state.supportOkrList.map((item: any) => {
      supportIds.push(item.id)
    })
    const list: any = $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
    createObjectSave({
      ascriptionId: state.ascriptionId,
      ascriptionType: state.ascriptionType,
      description: state.description || '',
      name: state.name,
      operateUser: nowUserId,
      teamId: state.teamId,
      periodId: state.periodId,
      supportIds: supportIds,
      krResults: JSON.parse(list),
      liable: state.liable,
    }).then((res: any) => {
      saveDisable = false
      if (res.returnCode == 0) {
        if (!state.keepCreate) {
          const nowData = $store.getState().selectTeamId
          //okr卡片模式和宽详情模式刷新
          if (state.from == 'workbench_okr' && (planContextObj.planMode == 0 || planContextObj.planMode == 2)) {
            planContextObj?.findPlanList && planContextObj?.findPlanList()
          } else if (nowData == state.teamId || nowData == -1 || state.from == 'workbench_okr') {
            refreshOkrKanban && refreshOkrKanban({ optType: 'creatOkr', taskIds: [] })
          }
        }
        handleCancel()
      }
    })
  }
  const detailObj: any = {
    mainData: state,
    editTaskData,
  }
  const changeName = (text: any) => {
    setTaskState({ ...state, name: text })
  }
  return (
    <createObjectContext.Provider value={detailObj}>
      <Modal
        centered
        className="createObjectModal baseModal baseWidth scrollbarsStyle"
        visible={state.visible}
        maskClosable={false}
        keyboard={false}
        width={850}
        title={'创建目标'}
        onCancel={handleCancel}
        destroyOnClose={true}
        footer={
          <div className="createFooter flex between center-v">
            <div className="footerLeft flex">
              <div className="keep_create_box">
                <Checkbox
                  checked={state.keepCreate}
                  onChange={(e: any) => {
                    e.stopPropagation()
                    setState({
                      ...state,
                      keepCreate: e.target.checked,
                      krResults: JSON.parse(
                        $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                      ),
                    })
                  }}
                >
                  继续创建目标
                </Checkbox>
              </div>
            </div>
            <div className="button-wrap">
              <Button key="back" onClick={handleCancel}>
                取消
              </Button>
              <Button key="submit" type="primary" onClick={handleOk}>
                创建
              </Button>
            </div>
          </div>
        }
      >
        <section className="createTaskContainer flex h100">
          <div className="createTaskLeft flex-1">
            {/* 输入名称 */}
            <div className="taskRow taskNameRow">
              <span className="objectIcon img_icon required"></span>
              <div className="taskItem">
                <div className="task_names">
                  <Input
                    onChange={(e: any) => {
                      changeName(e.target.value)
                    }}
                    autoFocus
                    maxLength={100}
                    placeholder={'填写一个振奋人心的目标'}
                    value={state.name}
                  />
                </div>
              </div>
            </div>
            <div
              contentEditable={true}
              dangerouslySetInnerHTML={{ __html: state.description }}
              className="taskNameText"
              placeholder={'一些激励的话，阐述该目标为什么是现在去做'}
              onBlur={(e: any) => {
                if (state.name != e.target.innerText) {
                  setState({ ...state, description: e.target.innerText })
                }
              }}
              onKeyUp={(e: any) => {
                // 限制输入框字数100范围内
                if (e.target.innerText.length >= 100) {
                  e.target.innerText = e.target.innerText.substring(0, 100)
                  setCaretEnd($('.taskNameText'))
                }
                if (e.keyCode == 13 && state.name != e.target.innerText) {
                  setState({ ...state, description: e.target.innerText })
                }
              }}
            ></div>
            <DndProvider backend={HTML5Backend}>
              <CreateObjectLeft
                dataState={state}
                changeTeamData={(paramObj: any, attachObj?: any) => {
                  if (paramObj) editTaskData(paramObj, attachObj)
                }}
              />
            </DndProvider>
          </div>
          <CreateObjectRight dataState={state} />
        </section>
      </Modal>
    </createObjectContext.Provider>
  )
})
//创建KR组件
export const CreateObjectLeft = (props: any) => {
  const { dataState } = props
  const getNameInit = {
    cci: 5, // 信心指数
    name: '', // 名称
    weights: 0, // 权重
    difficulty: '', // 1分描述
    ordinary: '', // 0.6-0.7分描述
    simple: '', // 0.3分描述
    liable: {
      // 执行人
      deptId: 0, // 部门id
      deptName: '', // 部门名称
      roleId: 0, // 岗位id
      roleName: '', // 岗位名称
      userId: 0, // 成员id
      username: '未分配', // 成员名称
      profile: '',
    },
  }
  const [okrList, setNowOkrList] = useState<any[]>([])
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  useEffect(() => {
    setNowOkrList(dataState.krResults)
  }, [dataState.teamId, dataState.keepCreate])
  //新增Kr数据
  const addKrData = (list?: any) => {
    let judegInput = true
    const arrList: any = list || okrList
    arrList.map((item: any) => {
      if (item.InputName) {
        judegInput = false
      }
    })
    if (judegInput) {
      getNameInit.liable = dataState.loginLiable
      arrList.push({
        ...getNameInit,
        InputName: true,
        weightShow: false,
      })
      setNowOkrList([...arrList])
    }
  }
  //选择KR的人员
  const chooseKrMember = (item: any) => {
    const selMemberOrg = {
      visible: true,
      selectList: [
        {
          cmyId: dataState.teamId,
          cmyName: dataState.teamName,
          curId: item.liable.userId || '',
          curName: item.liable.username || '',
          account: '',
          profile: item.liable.profile || '',
          curType: 0,
        },
      ], //选人插件已选成员
      checkboxType: 'radio',
      permissionType: 3, //组织架构通讯录范围控制
      checkableType: [0],
      allowTeamId: dataState.enableOkrTeams,
      isDel: false,
      comMember: 'team',
      onSure: (dataList: any) => {
        const userObj = dataList[0] || {}
        const getNowData: any = {}
        item.liable = {
          userId: userObj.curId,
          username: userObj.curName,
          profile: userObj.profile,
          roleId: userObj.roleId,
          roleName: userObj.roleName,
          deptId: userObj.deptId,
          deptName: userObj.deptName,
        }
        setNowOkrList([...okrList])
        if (userObj.cmyId != dataState.teamId) {
          getNowData.ascriptionId = dataState.deptId
          getNowData.teamId = userObj.cmyId
          getNowData.ascriptionType = 0
          getNowData.krResults = okrList
          props.changeTeamData(getNowData, userObj.cmyId == dataState.teamId ? {} : { clearType: 'changeData' })
        }
      },
    }
    setSelMemberOrg(selMemberOrg)
  }
  return (
    <div className="create-Object-Okr" data-list={JSON.stringify(okrList)}>
      {okrList.length > 0 && <div className="create-okr-text">{okrList[0].name ? '权重' : ''}</div>}
      <div className={`create-okr-list ${okrList.length == 1 ? 'single_kr' : ''}`}>
        {okrList.map((data: any, index: number) => {
          return (
            <SingleKrData
              item={data}
              index={index}
              key={index}
              setOkrList={(data: any, type?: string) => {
                setNowOkrList(data)
                if (type == 'add') {
                  addKrData(data)
                }
              }}
              ratingType={dataState.ratingType} //打分类型：0-1分，1-100分
              selectMember={(item: any) => {
                chooseKrMember(item)
              }}
            />
          )
        })}
      </div>
      <div
        className={`create-okr-add flex center-v ${okrList?.length > 0 ? 'line' : ''}`}
        onClick={(e: any) => {
          e.stopPropagation()
          addKrData()
        }}
      >
        <em className="img_icon create-icon-add"></em>
        <span className="create-okr_txt flex flex-1">添加Key Result</span>
      </div>
      {selMemberOrg.visible ? (
        <SelectMemberOrg
          param={{ ...selMemberOrg }}
          action={{
            setModalShow: (flag: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: flag })
            },
          }}
        />
      ) : (
        ''
      )}
    </div>
  )
}
export const SingleKrData = (props: any) => {
  const dragRef: any = useRef(null)
  const { item, index, setOkrList } = props
  const [getProgress, setProgress] = useState({
    weight: 0,
  })
  //拖动目标
  const [, drag, preview] = useDrag({
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      let drag = true
      const okrDataList = JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
      if (
        $(dragRef.current)
          .find('.create-okr-name')
          .is(':visible') ||
        $(dragRef.current)
          .find('.show_percent')
          .is(':visible') ||
        okrDataList.length < 2
      ) {
        drag = false
      }
      return drag
    },
    item: { type: 'krDataItem', sourceNode: dragRef, data: item, index: index },
  })
  //放置目标源
  const [, drop] = useDrop({
    accept: 'krDataItem',
    canDrop: (item: any, monitor: any) => {
      let drag = true
      if (
        $(dragRef.current)
          .find('.create-okr-name')
          .is(':visible') ||
        index == monitor.getItem().index
      ) {
        drag = false
      }
      return drag
    },
    drop: (_: any, minoter: any) => {
      dragUpdateTask(
        index,
        {
          index: minoter.getItem().index,
          data: minoter.getItem().data,
        },
        JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
      )
    },
  })
  /**
   * 拖动后更新源任务和目标任务 nowdata替换的元素 moveData拖动的元素
   */
  const dragUpdateTask = (nowdata: any, moveData: any, tableData: any) => {
    let removeI: any = null, //移除的位置
      targetI = 0 //原来的位置
    // 是否查询到需要移除的源节点
    for (let i = 0; i < tableData.length; i++) {
      if (i == moveData.index) {
        removeI = i
        // isRemove = true
      }
      // 拖至首层,记录拖至位置，之后插入新数据
      if (i == nowdata) {
        targetI = i
      }
    }
    tableData = update(tableData, {
      $splice: [
        [removeI, 1],
        [targetI, 0, moveData.data],
      ],
    })
    setOkrList([...tableData])
  }

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [])
  drag(drop(dragRef))
  // 进度输入值控制数字小数点后一位
  const changeWeightInputVal = (e: any) => {
    let textboxvalue = e.target.value
    if (textboxvalue.length == 1) {
      textboxvalue = e.target.value.replace(/[^0-9]/g, '')
    } else {
      textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,1})?).*$/g, '$1')
    }
    if (textboxvalue > 100) {
      textboxvalue = 100
    }
    getProgress.weight = textboxvalue
    setProgress({ ...getProgress })
  }
  //改变权重
  const changeWeightList = (item: any, value: any) => {
    item.weightShow = false
    const okrList = JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
    const nowWeight = Number(value.replace(/^[0]+/, ''))
    okrList[index] = item
    if (nowWeight == item.weights) {
      setOkrList([...okrList])
      return false
    }
    let allWeights = 100
    okrList.map((data: any) => {
      allWeights = allWeights - Number(data.weights)
    })

    const lastwWeight = okrList[okrList.length - 1].weights - nowWeight + Number(item.weights) + allWeights
    if (lastwWeight < 0) {
      okrList[index] = item
      setOkrList([...okrList])
      return message.error('所有KR的权重之和不可大于100%')
    } else {
      okrList[okrList.length - 1].weights = Number(lastwWeight.toFixed(1).replace(/^[0]+/, ''))
    }
    item.weights = nowWeight
    okrList[index] = item
    setOkrList([...okrList])
  }
  const isNull = (str: any) => {
    const regu = '^[ ]+$'
    const re = new RegExp(regu)
    return re.test(str)
  }
  //改变kr的名称
  const changeNameData = (e: any, item: any) => {
    const okrList = JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
    if ((e.target.value != '' || (item.name && !e.target.value)) && !isNull(e.target.value)) {
      if (item.name == '') {
        const judegWeight = JudgeChangeKr() ? false : true
        if (judegWeight) {
          okrList.map((data: any) => {
            data.weights = Number((100 / okrList.length).toFixed(1))
          })
          item.weights = Number((100 / okrList.length).toFixed(1))
        }
      }
      if (e.target.value) {
        item.name = e.target.value
      }
      item.InputName = false
      okrList[index] = item
      setOkrList([...okrList], e.keyCode == 13 ? 'add' : '')
    } else {
      item.InputName = false
      okrList.splice(index, 1)
      setOkrList([...okrList])
    }
  }
  //判断权重是否被更改
  const JudgeChangeKr = () => {
    const okrData = JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
    let nowShowAdd = false
    okrData.map((_val: any, index: number) => {
      if (_val.InputName && _val.name == '') {
        nowShowAdd = true
      }
    })
    const nowLength = nowShowAdd ? okrData.length - 1 : okrData.length
    const avalWeights = Number((100 / nowLength).toFixed(1))
    let JudgeKr = false
    okrData.map((data: any) => {
      if (avalWeights != data.weights && !data.InputName) {
        JudgeKr = true
      }
    })

    return JudgeKr
  }
  return (
    <div
      className={`create-okr-item flex center kr_content_tr ${item.InputName ? '' : ' bg'}`}
      data-index={index}
      ref={dragRef}
    >
      <span className="create-okr-type">KR{index + 1}</span>
      <span
        className="create-okr-title flex flex-1"
        style={item.InputName ? { height: '22px' } : {}}
        onClick={(e: any) => {
          const okrList = JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
          e.stopPropagation()
          item.InputName = true
          okrList[index] = item
          setOkrList([...okrList])
        }}
      >
        {item.name}
      </span>
      <div
        className="flex center"
        style={{ height: '21px' }}
        onClick={(e: any) => {
          e.stopPropagation()
          props.selectMember(item)
        }}
      >
        <Avatar
          key="liable"
          className={`oa-avatar ${item.liable.profile && !item.liable.username ? 'default-head-g' : ''}`}
          src={item.liable.profile || null}
          style={{ backgroundColor: '#3949ab', minWidth: '18px', marginRight: '0px' }}
          size={18}
        >
          {item.liable.username ? item.liable.username.charAt(item.liable.username.length - 1) : ''}
        </Avatar>
        <span
          className="text-ellipsis"
          style={{ marginLeft: '4px', fontSize: '12px', width: '36px', textAlign: 'center' }}
        >
          {item.liable.username}
        </span>
      </div>
      <div
        className="show_input_okr"
        onClick={e => {
          e.stopPropagation()
          const okrList = JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
          if (index == okrList.length - 1) {
            return message.warning($intl.get('modifyOthersWeightOfKR'))
          }
          okrList.forEach((item: any) => {
            if (item.weightShow) {
              item.weightShow = false
            }
          })
          item.weightShow = true
          getProgress.weight = item.weights
          setProgress({ ...getProgress })
          okrList[index] = item
          setOkrList([...okrList])
        }}
      >
        {!item.weightShow && <span className="name_blod_blue">{item.weights}%</span>}
        {item.weightShow && (
          <Input
            min={0}
            size="small"
            className="show_percent"
            max={100}
            maxLength={5}
            value={getProgress.weight}
            autoFocus={true}
            onClick={(e: any) => {
              e.stopPropagation()
            }}
            onChange={e => {
              changeWeightInputVal(e)
            }}
            onKeyUp={(e: any) => {
              if (e.keyCode == 13) {
                changeWeightList(item, e.target.value)
              }
            }}
            onBlur={(e: any) => {
              e.stopPropagation()
              changeWeightList(item, e.target.value)
            }}
          />
        )}
      </div>

      <Popover
        placement="bottomRight"
        trigger="click"
        content={
          <div className={`kr_heart_heart`}>
            <div className="heartVal">
              信心值：<span className="okr_heart_num">{item.cci}</span>
            </div>
            <Rate
              allowHalf
              className="heard_heart"
              character={
                <HeartFilled
                  style={{
                    fontSize: '14px',
                  }}
                />
              }
              value={item.cci / 2}
              onChange={(val: number) => {
                if (val || (val == 0 && item.cci / 2 == 0.5)) {
                  const okrList = JSON.parse(
                    $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                  )
                  item.cci = val * 2
                  okrList[index] = item
                  setOkrList([...okrList])
                }
              }}
              onHoverChange={(val: number) => {
                if (val) {
                  $('.kr_heart_heart .okr_heart_num').text(val * 2)
                } else {
                  $('.kr_heart_heart .okr_heart_num').text(item.cci)
                }
              }}
            />
          </div>
        }
      >
        <Tooltip title={'信心指数'}>
          <span className="leftline flex center" style={{ color: '#414141' }}>
            <i></i>
            {item.cci}
          </span>
        </Tooltip>
      </Popover>
      <Popover
        placement="bottomRight"
        trigger="click"
        content={
          <div className="score_okr_list">
            <div className="score_title">打分标准</div>
            <div className="score_okr_contant">
              <div className="score_okr_header flex">
                <span className="score_1">{props.ratingType > 1 ? '100分' : '1分'}</span>
                <h6>困难度较高几乎不可能实现</h6>
              </div>

              <Input
                placeholder="例如：完成市场占有率达90%"
                className="marketshare_input"
                maxLength={100}
                defaultValue={item.difficulty}
                onBlur={(e: any) => {
                  if (item.difficulty != e.target.value) {
                    item.difficulty = e.target.value
                    const okrList = JSON.parse(
                      $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                    )
                    okrList[index] = item
                    setOkrList([...okrList])
                  }
                }}
                onKeyUp={(e: any) => {
                  if (item.difficulty != e.target.value && e.keyCode == 13) {
                    item.difficulty = e.target.value
                    const okrList = JSON.parse(
                      $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                    )
                    okrList[index] = item
                    setOkrList([...okrList])
                  }
                }}
              />

              <div className="score_okr_header flex">
                <span className="score_2">{props.ratingType > 1 ? '60-70分' : '0.6-0.7分'}</span>
                <h6>希望达成的程度，虽然困难但能实现</h6>
              </div>

              <Input
                placeholder="例如：完成市场占有率达到70%"
                className="marketshare_input"
                maxLength={100}
                defaultValue={item.ordinary}
                onBlur={(e: any) => {
                  if (item.ordinary != e.target.value) {
                    item.ordinary = e.target.value
                    const okrList = JSON.parse(
                      $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                    )
                    okrList[index] = item
                    setOkrList([...okrList])
                  }
                }}
                onKeyUp={(e: any) => {
                  if (item.ordinary != e.target.value && e.keyCode == 13) {
                    item.ordinary = e.target.value
                    const okrList = JSON.parse(
                      $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                    )
                    okrList[index] = item
                    setOkrList([...okrList])
                  }
                }}
              />

              <div className="score_okr_header flex">
                <span className="score_3">{props.ratingType > 1 ? '30分' : '0.3分'}</span>
                <h6>肯定可以达到，只要很少帮助或不需要</h6>
              </div>

              <Input
                placeholder="例如：完成市场占有率达30%"
                className="marketshare_input"
                maxLength={100}
                defaultValue={item.simple}
                onBlur={(e: any) => {
                  if (item.simple != e.target.value) {
                    item.simple = e.target.value
                    const okrList = JSON.parse(
                      $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                    )
                    okrList[index] = item
                    setOkrList([...okrList])
                  }
                }}
                onKeyUp={(e: any) => {
                  if (item.simple != e.target.value && e.keyCode == 13) {
                    item.simple = e.target.value
                    const okrList = JSON.parse(
                      $('.createObjectModal .create-Object-Okr').attr('data-list') || '[]'
                    )
                    okrList[index] = item
                    setOkrList([...okrList])
                  }
                }}
              />
            </div>
          </div>
        }
      >
        <Tooltip title="填写打分规则">
          <em
            className={`rating-okr-icon ${item.difficulty || item.ordinary || item.simple ? 'show' : ''}`}
          ></em>
        </Tooltip>
      </Popover>
      <span
        className="rating-okr-delete"
        onClick={(e: any) => {
          const okrList = JSON.parse($('.createObjectModal .create-Object-Okr').attr('data-list') || '[]')
          e.stopPropagation()
          const delWeight = item.weights
          okrList.splice(index, 1)
          const noChangeKR = JudgeChangeKr()
          if (noChangeKR) {
            okrList.map((_val: any, index: number) => {
              if (index == okrList.length - 1) {
                _val.weights += delWeight
              }
            })
          } else {
            const getlength = okrList.length
            okrList.map((_val: any) => {
              _val.weights = Number((100 / getlength).toFixed(1))
            })
          }
          setOkrList([...okrList])
        }}
      ></span>
      {item.InputName && (
        <Input
          className="create-okr-name part_name_input"
          defaultValue={item.name}
          maxLength={50}
          placeholder={'添加Key Result:  要支持Objective,一般三个为宜'}
          onClick={(e: any) => {
            e.stopPropagation()
          }}
          autoFocus
          onChange={e => {}}
          onKeyUp={(e: any) => {
            if (e.keyCode == 13) {
              changeNameData(e, item)
            }
          }}
          onBlur={(e: any) => {
            changeNameData(e, item)
          }}
        />
      )}
    </div>
  )
}

//弹框左侧组件处理
export const CreateObjectRight = (props: any) => {
  const createContextObj: any = useContext(createObjectContext)
  const { dataState } = props
  // 执行人（当前改为责任人）
  const liableObj = dataState.liable || {}
  const liableProfile = liableObj?.profile || ''
  let typeName = '个人目标'
  if (dataState.ascriptionType == 2) {
    typeName = '企业目标'
  } else if (dataState.ascriptionType == 3) {
    typeName = '部门目标'
  }
  //选人插件
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  /**
   * 选择归属
   */
  const selectAffiliation = () => {
    const { mainData } = createContextObj
    const selectList: any = []
    let profile = ''
    let curId = dataState.ascriptionId
    let curName = ''
    if (dataState.ascriptionType == 2 || dataState.ascriptionType == 3) {
      profile = mainData.teamLogo || ''
      curName = dataState.ascriptionName
    } else {
      profile = dataState.defaultLiable.profile || ''
      curId = dataState.defaultLiable.userId
      curName = dataState.defaultLiable.username
    }
    selectList.push({
      curId: curId,
      curName: curName,
      cmyId: dataState.teamId,
      cmyName: dataState.teamName,
      account: '',
      curType: dataState.ascriptionType,
      profile: profile,
    })
    const memberOrg: any = {
      title: '选择归属',
      sourceType: 'taskBelong',
      addShowOkrText: 'okr',
      comMember: 'team',
      visible: true,
      findType: 0,
      selectList,
      // 只有新增任务时可选多企业
      allowTeamId: dataState.enableOkrTeams,
      checkboxType: 'radio',
      permissionType: 3, //组织架构通讯录范围控制
      checkableType: [0, 2, 3],
      isDel: false,
      noQueryProfile: true, //初始进入不查询头像
      fliterByType: {
        '1': {
          show: true,
          text: '按组织架构选择',
        },
        '2': {
          show: true,
          text: '按角色选择',
        },
        '3': {
          show: true,
        },
        '4': {
          show: true,
        },
      }, //控制显示的筛选类型（按组织架构，一级部门）
      onSure: (dataList: any) => {
        const userObj = dataList[0] || {}
        const nowRefresh: any = {
          ascriptionId: userObj.deptId,
          ascriptionType: userObj.curType,
          ascriptionName: userObj.deptName || userObj.cmyName,
          teamId: userObj.cmyId,
          teamLogo: userObj.profile,
        }
        if (userObj.curType == 0) {
          if (
            userObj.deptId == dataState.ascriptionId &&
            userObj.cmyId == dataState.teamId &&
            userObj.userId == dataState.liable.userId &&
            userObj.curType == dataState.ascriptionType
          ) {
            return false
          }
          nowRefresh.liable = {
            userId: userObj.userId,
            username: userObj.userName,
            profile: userObj.profile,
            roleId: userObj.roleId,
            roleName: userObj.roleName,
            deptId: userObj.deptId,
            deptName: userObj.deptName,
            operateUser: $store.getState().nowUserId,
            onlyUser: 0,
          }
          nowRefresh.defaultLiable = nowRefresh.liable
        } else if (userObj.curType == 2) {
          if (userObj.cmyId == dataState.teamId && userObj.curType == dataState.ascriptionType) {
            return false
          }
        } else if (userObj.curType == 3) {
          if (
            userObj.deptId == dataState.ascriptionId &&
            userObj.cmyId == dataState.teamId &&
            userObj.curType == dataState.ascriptionType
          ) {
            return false
          }
        }
        createContextObj.editTaskData(
          nowRefresh,
          userObj.cmyId == dataState.teamId ? {} : { clearType: 'changeData' }
        )
      },
    }
    console.log(memberOrg)

    setSelMemberOrg(memberOrg)
  }
  return (
    <div className="createTaskRight detailRightAttach">
      {/* 2:草稿任务 不展示 */}
      <div className="attachCont ">
        <div
          className={`memberItem flex between center-v`}
          onClick={() => {
            const selMemberOrg = {
              visible: true,
              selectList: [
                {
                  cmyId: dataState.teamId,
                  cmyName: dataState.teamName,
                  curId: dataState.liable.userId || '',
                  curName: dataState.liable.username || '',
                  account: '',
                  profile: dataState.liable.profile || '',
                  curType: 0,
                },
              ], //选人插件已选成员
              checkboxType: 'radio',
              permissionType: 3, //组织架构通讯录范围控制
              checkableType: [0],
              allowTeamId: dataState.enableOkrTeams,
              isDel: false,
              comMember: 'team',
              onSure: (dataList: any) => {
                const userObj = dataList[0] || {}
                const getNowData: any = {
                  liable: {
                    userId: userObj.curId,
                    username: userObj.curName,
                    profile: userObj.profile,
                    roleId: userObj.roleId,
                    roleName: userObj.roleName,
                    deptId: userObj.deptId,
                    deptName: userObj.deptName,
                    operateUser: $store.getState().nowUserId,
                    onlyUser: 0,
                  },
                }
                if (userObj.cmyId != dataState.teamId) {
                  getNowData.ascriptionId = userObj.deptId
                  getNowData.teamId = userObj.cmyId
                  getNowData.ascriptionType = 0
                }
                createContextObj.editTaskData(
                  getNowData,
                  userObj.cmyId == dataState.teamId ? {} : { clearType: 'changeData' }
                )
              },
            }
            setSelMemberOrg(selMemberOrg)
          }}
        >
          <div>
            <p className="role_name">负责人</p>
          </div>
          <div className="flex center-v edit_liaber">
            <Avatar
              key="liable"
              className={`oa-avatar ${!liableProfile && !liableObj.username ? 'default-head-g' : ''}`}
              src={liableProfile || null}
              size={18}
            >
              {liableObj.username ? liableObj.username.charAt(liableObj.username.length - 1) : ''}
            </Avatar>
            <span className="text-ellipsis">{liableObj.username}</span>
          </div>
        </div>
      </div>
      <div className="attachCont ">
        <header className="attachSecHeader flex between center-v">
          <div className="headerTit">
            <span className="tit_txt">周期</span>
          </div>
        </header>
        <Dropdown
          overlay={
            <OkrDateModule
              periodList={dataState.periodList}
              periodId={dataState.periodId}
              hideAllperiod={true}
              nowHository={dataState.isCloseHistory}
              AfterchoseeData={(data: any) => {
                //更换周期选择
                if (data) {
                  createContextObj.editTaskData({
                    periodId: data.periodId,
                    supportOkrList: [],
                    supports: null,
                  })
                }
              }}
              changeListData={(val: any) => {
                // 查询周期是否显示历史周期
                selectDateDisplay().then((res: any) => {
                  const nowHository = res.data.isClosed ? 1 : 0
                  const param: any = {
                    teamId: dataState.teamId,
                    mySelf: '0',
                    ascriptionId: dataState.teamId,
                    ascriptionType: 2,
                    isClosed: nowHository,
                  }
                  // 查询周期列表
                  queryPeriodApi(param).then((res: any) => {
                    const NowData = res?.filter((data: any) => {
                      return data.isSelected == true
                    })
                    createContextObj.editTaskData({
                      isCloseHistory: nowHository,
                      periodList: res,
                      periodId: NowData[0].periodId,
                    })
                  })
                })
              }}
              isEdit={false}
            />
          }
          placement="bottomRight"
        >
          <div className={`time_filter editHoverBlue`}>
            {dataState.periodList.map((item: any, index: number) => {
              if (item.periodId == dataState.periodId) {
                return <span key={index}>{item.periodText}</span>
              }
            })}
          </div>
        </Dropdown>
      </div>
      <div className={`attachCont belongCont`}>
        <header className="attachSecHeader flex between center-v">
          <div className="headerTit">
            <span className="tit_txt">{typeName}</span>
            <span className="tit_txt text-ellipsis">
              {dataState.ascriptionType == 3 ? ` -  ${dataState.ascriptionName}` : ''}
            </span>
          </div>
          <div className="actionBtn">
            <span
              className={`img_icon set_liable_btn no_hide`}
              onClick={(e: any) => {
                e.stopPropagation()
                selectAffiliation()
              }}
            ></span>
          </div>
        </header>
        <div className={`showListBox`}>
          <div className="belong_name_box">
            <p className="team_name text-ellipsis">{dataState.teamName || ''}</p>
          </div>
        </div>
        {/* 选择人员弹框 */}
        {selMemberOrg.visible ? (
          <SelectMemberOrg
            param={{ ...selMemberOrg }}
            action={{
              setModalShow: (flag: boolean) => {
                selMemberOrg.visible = flag
                setSelMemberOrg({ ...selMemberOrg })
              },
            }}
          />
        ) : (
          ''
        )}
      </div>
      <SupportOKRs
        supportOkrList={dataState.supportOkrList || []}
        refresh={dataState.refresh}
        supports={dataState.supports}
        contextObj={createObjectContext}
        soureForm="createObject"
        createText="向上支撑"
      />
    </div>
  )
}
