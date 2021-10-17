//检查项
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react'
import { DatePicker, Input, Dropdown, Modal, Tooltip, message } from 'antd'
import moment from 'moment'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import Taskcomment from '../creatTask/taskComment'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import NoneData from '@/src/components/none-data/none-data'
import { DetailContext, isCheckHeaderShow, taskDetailContext } from '../taskDetails/detailRight'
import TextArea from 'antd/lib/input/TextArea'
import './checkEntry.less'
import { getCheckListApi } from '../taskDetails/detailApi'
import { useRef } from 'react'

// 点击按钮操作中
let btnOpting = false
// let nameInpVal = ''
// export let addtypes = false
// export const setAddNewNode = (flag: boolean) => {
//   addtypes = flag
// }
//获取检查项后台所需数据
export const checkListModel = (checkLists: any) => {
  const checkList = checkLists
  const getDatas = (checkList: any, children: any) => {
    let newarr: any = []
    if (children) {
      newarr = children
    }
    for (let i = 0; i < checkList?.length; i++) {
      const item = checkList[i]
      const obj = {
        id: item.newAdd ? '' : item.id,
        newAdd: item.newAdd ? item.newAdd : false,
        content: item.isroot ? item.content.name : item.name,
        userId: item.isroot ? item.userId : '',
        name: item.name,
        endTime: item.time || '',
        choose: item.choose, //1完成 2搁置 3阻碍 0未选择
        isCheck: item.isCheck,
        subCheck: [],
      }
      if (item.chidren && item.chidren.length > 0) {
        obj.subCheck = [] //有childs不断扩充新的children对象
        getDatas(item.chidren, obj.subCheck)
        newarr.push(obj)
      } else {
        newarr.push(obj)
      }
    }
    return newarr
  }
  return getDatas(checkList, '')
}
// 缓存全局当前评论组件ref
let taskcommentRef: any = null
const CheckEntry = forwardRef((props: any, ref) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  // console.log(props)
  const { containerRef, contentRef, checkHeaderDom, headerRef } = props.param
  //数据对象
  const [checklist, setChecklist] = useState<any>([])
  const { nowUserId, nowUser } = $store.getState()
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //更改人员ID
  const [choiceuserid, setChoiceuserid] = useState<any>()
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //暂存输入内容
  const [nameInpVal, setNameInpVal] = useState('')
  //存储旧的任务id
  const [oldTaskId, setOldTaskId] = useState('')
  taskcommentRef = useRef(null)

  let addtypes = false
  useEffect(() => {
    initCheckList()
    return () => {
      taskcommentRef = null
    }
  }, [])

  useEffect(() => {
    console.log(checklist)
    isCheckHeaderShow(containerRef, contentRef, checkHeaderDom, headerRef)
  }, [checklist])
  useEffect(() => {
    if (props.initRefresh.init) {
      initCheckList()
    }
  }, [props.param.from == 'details' && props.initRefresh.init])
  useEffect(() => {
    //切换任务时将组件内数据清空，避免页面显示新的任务时闪旧数据
    if (oldTaskId != props.param.taskid) {
      showInitData([])
    }
    setOldTaskId(props.param.taskid)
  }, [props.param.from == 'details' && props.param.taskid])
  /**
   * 暴露给父组件的方法*
   */
  useImperativeHandle(ref, () => ({
    /**
     * 设置state
     */
    // setState,
    addCheckList,
  }))

  //查询检查项
  const initCheckList = (enterType?: any, farid?: any) => {
    const param = {
      taskId: props.param.taskid,
      userId: nowUserId,
    }
    getCheckListApi(param).then((res: any) => {
      if (res.dataList) {
        showInitData(res.dataList, enterType)
        //按enter保存后刷新新增同级检查项
        if (enterType && enterType == 'child') {
          addNodes(farid)
        }
      } else {
        showInitData([])
      }
    })
  }
  //更新检查项
  const updateCheckList = ({ newData, enterType, farid }: { newData: any; enterType?: any; farid?: any }) => {
    console.log(enterType, farid)

    const checkList = checkListModel(newData)
    if (props.param.from && props.param.from == 'details') {
      //任务详情调用检查项
      if (newData) {
        taskDetailObj.editCheckList({ checkList }).then((res: any) => {
          if (res) {
            // 外部数据刷新
            props.getDatas(checkList)
          }
          initCheckList(enterType, farid)
        })
      }
    } else {
      // 内部数据刷新
      setChecklist(newData)
      //按enter保存后刷新新增同级检查项
      if (enterType && enterType == 'far') {
        addCheckList()
      } else if (enterType && enterType == 'child') {
        addNodes(farid)
      }
      // 外部数据刷新
      props.getDatas(checkList)
    }
  }
  //初始化数据结构
  const showInitData = (initData: any, enterType?: any) => {
    if (initData || initData?.length > 0) {
      const newArr: any = []
      const chidrenFn = (subCheck: any) => {
        if (subCheck) {
          let chidrenArr: any = []
          if (subCheck?.length > 0) {
            for (let i = 0; i < subCheck.length; i++) {
              const items = subCheck[i]
              chidrenArr.push({
                id: items.id,
                isadd: false,
                userId: items.userId,
                name: items.content || items.name,
                time: items.endTime || items.time || '',
                choose: items.choose, //0未选择 1已完成 2搁置
                isCheck: items.isCheck, //0不需要位置 1已完成需要位置
                isroot: false,
                inputShow: false,
                location: items.geographicalLocationModel,
                chidren: [],
                showSetTime: false,
              })
            }
          } else {
            chidrenArr = []
          }
          return chidrenArr
        }
      }
      for (let i = 0; i < initData?.length; i++) {
        const item = initData[i]
        let contentPar = {}
        if (typeof item.content == 'string') {
          contentPar = {
            name: item.content,
            inputShow: false,
          }
        } else {
          contentPar = item.content
        }
        const child = item.chidren || item.subCheck
        // const content = item.content || contentPar
        newArr.push({
          id: item.id,
          isadd: false,
          userId: item.userId,
          name: item.username || item.name,
          time: item.endTime || '',
          choose: item.choose, //0未选择 1已完成 3阻碍
          isCheck: item.isCheck, //0不需要位置 1已完成需要位置
          isroot: true,
          location: item.geographicalLocationModel,
          content: contentPar,
          chidren: chidrenFn(child),
          commentMessageModels: item.commentMessageModels,
          showSetTime: false, //是否显示设置时间
          showchild: true, //是否显示子节点
          showInfo: false, //是否获取回复焦点
        })
      }
      setChecklist(newArr)
      if (enterType && enterType == 'far') {
        addCheckList(newArr)
      }
    }
  }
  //新增父节点
  const addCheckList = (nowData?: any) => {
    const timestamp = Date.parse(new Date().toString())
    const list = {
      id: timestamp,
      // id: -1, //新增时id
      isadd: true,
      newAdd: true,
      userId: nowUserId,
      name: nowUser,
      time: '',
      choose: 0, //0未选择 1已完成 2搁置 3阻碍
      isCheck: 0, //
      isroot: true,
      location: {},
      content: {
        name: '',
        inputShow: true,
      },
      chidren: [],
    }
    const nowDataList: any = nowData || checklist
    isAddnodes(nowDataList)
    // if (!addtypes) {
    const newList = [...nowDataList, list]
    setChecklist(newList)
    // }
  }
  //更改名称
  const editName = ({
    id,
    e,
    index,
    newVal,
    oldVal,
    type,
    item,
    enterType, //'far'父节点enter,'child'子节点enter
    farid, //父节点id
  }: {
    id: any
    item?: any
    e?: any
    index?: any
    newVal?: string
    oldVal?: string
    type?: string
    enterType?: string
    farid?: string
  }) => {
    btnOpting = false
    if (newVal == '' && type != 'cancel') {
      // message.warn('请输入check清单内容')
      return
    }
    const list = [...checklist]
    if (e == null && !type) {
      //点击名称显示Input输入框
      setChecklist(updateData('nameclick', id, list, ''))
    } else {
      //点input输入框更改内容
      const val = {
        data: type == 'cancel' ? oldVal : newVal,
        index,
      }
      let newData: any = []
      // 点击取消按钮
      if (type == 'cancel') {
        // 如果是新增节点则移除
        if (item.isadd) {
          newData = updateData('remove', id, list, val)
        } else {
          // 否则还原数据
          newData = updateData('name', id, list, val, true)
        }
        setChecklist(newData)
        if (props.initRefresh.refreshType == 'add') {
          //初始化父级initRefresh
          props.setInitRefresh()
        }
        setNameInpVal('')
      } else if (newVal != '') {
        // setChecklist(updateData('changeIsAdd', id, list, false))
        newData = updateData('name', id, list, val, false, { isadd: false })
        // newData = updateData('name', id, list, val, false)

        // 检查项内容有变动则调用接口保存
        // !from.includes('creatTask') &&
        if (newVal != oldVal) {
          updateCheckList({ newData, enterType, farid })
        } else {
          setChecklist(newData)
        }
        setNameInpVal('')
      }
    }
  }
  //添加子节点
  const addNodes = (id: any) => {
    isAddnodes(checklist)
    const list = [...checklist]
    const datalist = updateData('addchild', id, list, '')
    setChecklist(datalist)
  }
  //删除子节点
  const removeNode = (id: any, index: number) => {
    const list = [...checklist]
    const datalist = updateData('remove', id, list, index)
    updateCheckList({ newData: datalist })
  }
  //修改时间
  const editTimes = (id: any, date: any, val: number) => {
    const times: any = {
      times: '',
      index: val,
    }
    if (!date) {
      times.times = ''
    } else {
      times.times = moment(date).format('YYYY/MM/DD HH:mm')
    }
    const list = [...checklist]
    const attachObj = { nullName: false }
    const datalist = updateData('editTimes', id, list, times, false, attachObj)
    // console.log('editTimes:', datalist)
    setChecklist(datalist)
    if (attachObj.nullName) {
      // message.warn('请输入check清单内容')
      return
    }
    updateCheckList({ newData: datalist })
  }
  //判断是否有空对象 有空对象则不需要新增
  const isAddnodes = (checklist: any) => {
    // console.log('新增', checklist)
    addtypes = false
    for (let item = 0; item < checklist.length; item++) {
      if (checklist[item].isroot) {
        if (checklist[item].content.name == '') {
          addtypes = true
          checklist.splice(item, 1)
          break
        }
      } else {
        if (checklist[item].name == '') {
          addtypes = true
          checklist.splice(item, 1)
          break
        }
      }
      if (!addtypes) {
        if (checklist[item].chidren && checklist[item].chidren.length > 0) {
          isAddnodes(checklist[item].chidren)
        }
      }
    }
  }

  //递归更改数据
  const updateData = (type: any, id: number, list: any, val: any, closeIpt?: boolean, attachObj?: any) => {
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      if (item.id === id) {
        if (typeof type == 'object') {
          type.map((key: any) => {
            item[key] = val[key]
          })
        } else if (type == 'name') {
          //更改名称
          if (closeIpt) {
            //只隐藏输入框
            if (item.content) {
              item.content.inputShow = false
            } else {
              item.inputShow = false
            }
          } else if (item.isroot == true) {
            item.content.name = val?.data
            item.content.inputShow = false
          } else {
            item.name = val.data
            item.inputShow = false
          }
          if (attachObj && attachObj.isadd !== undefined) {
            item.isadd = attachObj.isadd
          }
        } else if (type == 'nameclick') {
          //点击名称
          if (item.isroot == true) {
            item.content.inputShow = true
          } else {
            item.inputShow = true
          }
        } else if (type == 'addchild') {
          const timestamp = Date.parse(new Date().toString())
          //添加子节点
          item.chidren.push({
            id: timestamp,
            // id: -1,
            isadd: true,
            newAdd: true,
            userId: nowUserId,
            name: '',
            time: '',
            choose: 0, //0未选择 1已完成 2搁置 3阻碍
            isCheck: 0, //
            isroot: false,
            inputShow: true,
            location: {},
            chidren: [],
          })
          item.showchild = true
        } else if (type == 'remove') {
          //删除
          const findI = list.findIndex((fItem: any) => id == fItem.id)
          list.splice(findI, 1)
          i--
        } else if (type == 'editTimes') {
          //修改时间
          item.time = val.times
          if (item.isroot == true) {
            // if (item.content.name == '') {
            //   list.splice(val.index, 1)
            //   i--
            // }
            if (item.content.name == '' && attachObj) {
              attachObj.nullName = true
            }
          } else {
            // if (item.name == '') {
            //   list.splice(val.index, 1)
            //   i--
            // }
            if (item.name == '' && attachObj) {
              attachObj.nullName = true
            }
          }
        } else if (type == 'showSetTime') {
          console.log('showSetTime---')
          item.showSetTime = val
        } else if (type == 'user') {
          //更改成员
          item.userId = val.userId
          item.name = val.userName
        } else if (type == 'editstate') {
          //更改状态
          item.choose = val.types
          if (val.issubCheck) {
            //更改子清单
            for (let i = 0; i < item.chidren.length; i++) {
              item.chidren[i].choose = val.types
            }
          }
        } else if (type == 'showSetChlidTime') {
          item.showSetTime = val
        } else if (type == 'showchild') {
          item.showchild = !val
        } else if (type == 'showInfo') {
          item.showInfo = !val
        } else if (type == 'changeIsAdd') {
          item.isadd = val
        }
      }
      if (item.chidren && item.chidren.length > 0 && type != 'addchild') {
        updateData(type, id, item.chidren, val, closeIpt, attachObj)
      }
    }
    return list
  }
  //调用更改成员
  const selectUser = (_id: any) => {
    setMemberOrgShow(true)
    let initSelMemberOrg: any = {}
    initSelMemberOrg = {
      teamId: props.param.teamId,
      sourceType: '', //操作类型
      allowTeamId: [props.param.teamId],
      selectList: [], //选人插件已选成员
      checkboxType: 'radio',
      permissionType: 3, //组织架构通讯录范围控制
    }
    setChoiceuserid(_id)
    setSelMemberOrg(initSelMemberOrg)
  }
  //更改状态
  const editstate = (_id: any, types: string, isCheck: any) => {
    const list = [...checklist]
    let issubCheck = false
    if (types == '1') {
      //已完成 子清单也同步更改
      issubCheck = true
    }
    const datalist = updateData('editstate', _id, list, { types: types, issubCheck: issubCheck })
    //需要移动端设置定位才能完成
    if (isCheck == 1 && types == '1') {
      Modal.confirm({
        title: '异常提醒',
        icon: <ExclamationCircleOutlined />,
        content:
          '本check清单完成有地理位置要求，需要在手机端操作，如果在电脑端操作完成，位置信息展示异常！确定完成吗?',
        okText: '确认',
        cancelText: '取消',
        onOk() {
          setChecklist(datalist)
          updateCheckList({ newData: datalist })
        },
      })
      return
    }
    setChecklist(datalist)
    updateCheckList({ newData: datalist })
  }
  //选择成员之后
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datas = dataList[0]
    const list = [...checklist]
    const datalist = updateData('user', choiceuserid, list, {
      userId: datas.userId || datas.curId,
      userName: datas.userName || datas.curName,
    })
    setChecklist(datalist)
    // if (nameInpVal) {
    updateCheckList({ newData: datalist })
    // }
  }

  return (
    <>
      {props.initRefresh && props.initRefresh.init && checklist?.length > 0 && (
        <div className={`checkEntry-content ${!props.param.iseditCheck ? 'no_edits' : ''}`}>
          <ul>
            {checklist.map((item: any, index: number) => {
              return (
                <li
                  key={index}
                  className="checkListItem checkListMainItem newAddCheckList"
                  style={item.content.inputShow ? { border: '1px solid #E7E7E9' } : {}}
                >
                  <div
                    className="check_list_name_row check_list_name_f"
                    style={item.content.inputShow ? { background: '#f5f7fb' } : {}}
                  >
                    <div className={`col_left ${item.content.inputShow ? 'col_left_title' : ''}`}>
                      {item.content.inputShow == true && (
                        <TextArea
                          placeholder="Enter确认并快速创建下一同级check项"
                          autoSize
                          autoFocus
                          rows={1}
                          defaultValue={item.content.name}
                          onChange={(e: any) => {
                            setNameInpVal(e.target.value)
                          }}
                          maxLength={255}
                          onBlur={(e: any) => {
                            if (btnOpting || item.isadd) {
                              btnOpting = false
                              return
                            }
                            editName({
                              item,
                              id: item.id,
                              e,
                              newVal: e.target.value,
                              index,
                              oldVal: item.content.name,
                            })
                            // props.getfocus && props.getfocus(false)
                          }}
                          onFocus={(e: any) => {
                            setNameInpVal(e.target.value)
                            e.target.value
                            // console.log('聚焦1')
                            props.getfocus && props.getfocus(true)
                          }}
                          onKeyDown={(e: any) => {
                            if (e.keyCode == 13) {
                              e.preventDefault()
                              e.stopPropagation()
                              editName({
                                item,
                                id: item.id,
                                e,
                                newVal: nameInpVal,
                                oldVal: item.content.name,
                                type: 'save',
                                enterType: 'far',
                              })
                            }
                          }}
                          // ref={(el: any) => {
                          //   if (!item.showSetTime) {
                          //     el && el.focus()
                          //   }
                          // }}
                        />
                      )}
                      {item.content.name != '' && (
                        <div className="check_list_show_names">
                          <div
                            className={`check_list_show_cont ${item.content.inputShow == true ? 'hide' : ''}`}
                          >
                            {props.param.isedit &&
                              [1].map(() => {
                                let iseditdrop = false
                                if (!props.param.iseditCheck) {
                                  if (item.userId != nowUserId) {
                                    iseditdrop = true
                                  }
                                }
                                return (
                                  <Dropdown
                                    key={1}
                                    className="check-editdrop-box"
                                    disabled={iseditdrop}
                                    overlay={
                                      <div className="check-editdrop-down">
                                        <p
                                          className={`${item.choose == 0 ? 'active' : ''}`}
                                          data-val="0"
                                          onClick={() => {
                                            editstate(item.id, '0', item.isCheck)
                                          }}
                                        >
                                          未完成
                                        </p>
                                        <p
                                          className={`${item.choose == 1 ? 'active' : ''}`}
                                          data-val="1"
                                          onClick={() => {
                                            editstate(item.id, '1', item.isCheck)
                                          }}
                                        >
                                          已完成
                                        </p>
                                        <p
                                          className={`${item.choose == 2 ? 'active' : ''}`}
                                          data-val="2"
                                          onClick={() => {
                                            editstate(item.id, '2', item.isCheck)
                                          }}
                                        >
                                          搁置
                                        </p>
                                      </div>
                                    }
                                    trigger={['click']}
                                  >
                                    <i className={`editstate editState-${item.choose}`}></i>
                                  </Dropdown>
                                )
                              })}
                            <span
                              className={`user_name user_names-${item.choose}`}
                              onClick={() => {
                                if (props.param.iseditCheck) {
                                  setNameInpVal(item.content.name)
                                  editName({ id: item.id, item })
                                }
                              }}
                            >
                              {item.content.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* 确定或取消修改标题 */}
                    {item.content.inputShow == true && (
                      <div className="col_rig rest_ok">
                        <div className="check_list_btns">
                          <em
                            className={`img_icon check_list_ok_btn`}
                            onClick={(e: any) => {
                              const list = [...checklist]
                              editName({
                                item,
                                id: item.id,
                                e,
                                newVal: nameInpVal,
                                oldVal: item.content.name,
                                type: 'save',
                              })
                            }}
                          ></em>
                          <em
                            className="img_icon check_list_rest_btn"
                            onMouseDown={(e: any) => {
                              btnOpting = true
                              editName({
                                item,
                                id: item.id,
                                e,
                                newVal: nameInpVal,
                                oldVal: item.content.name,
                                type: 'cancel',
                              })
                            }}
                          ></em>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="check_list_user_row check_list_user_f">
                    <div className="col_left">
                      <span
                        className="myTaskRoleBox my_execute"
                        onClick={() => {
                          selectUser(item.id)
                        }}
                      >
                        {item.name}
                      </span>
                      {!item.showSetTime && props.param.iseditCheck && (
                        <span
                          onClick={() => {
                            const list = [...checklist]
                            setChecklist(updateData('showSetTime', item.id, list, true))
                          }}
                          style={item.time ? { color: '#191F25' } : {}}
                          className="check_end_time"
                        >
                          {item.time ? `${item.time} 截止` : '设置截止时间'}
                        </span>
                      )}
                      {item.showSetTime && (
                        <DatePicker
                          open={true}
                          autoFocus={true}
                          showTime
                          placeholder="结束时间"
                          format="YYYY-MM-DD HH:mm"
                          value={item.time && moment(item.time)}
                          className={`${moment(item.time) < moment(new Date()) && 'formerlyTimes'}, dataPicker`}
                          onChange={(value: any) => {
                            console.log('chang time')
                            editTimes(item.id, value, index)
                          }}
                          onBlur={() => {
                            const list = [...checklist]
                            setChecklist(updateData('showSetTime', item.id, list, false))
                          }}
                          onOk={() => {
                            const list = [...checklist]
                            setChecklist(updateData('showSetTime', item.id, list, false))
                          }}
                        />
                      )}
                    </div>
                    <div className="col_rig">
                      {/* 定位 */}
                      {item.choose == 1 && item.isCheck == 1 && !item.location && (
                        <div className="location-box" style={{ color: 'red' }}>
                          <i className="location-icon-no"></i>
                          未获取定位
                        </div>
                      )}
                      {item.location && JSON.stringify(item.location) != '{}' && (
                        <Tooltip title={item.location.location}>
                          <div className="location-box">
                            <i className="location-icon"></i>
                            {item.location.location}
                          </div>
                        </Tooltip>
                      )}
                      <div
                        className={`check_list_btns ${
                          item.isadd || !props.param.iseditCheck ? 'forcedHide' : ''
                        }`}
                      >
                        <em
                          className="img_icon check_list_add_btn"
                          onClick={() => {
                            // const list = [...checklist]
                            // setChecklist(updateData('showchild', item.id, list, item.showchild))
                            addNodes(item.id)
                          }}
                        ></em>
                        <em
                          className="img_icon check_list_del_btn"
                          onClick={() => {
                            removeNode(item.id, index)
                          }}
                        ></em>
                        <em
                          className={`img_icon check_list_info_btn ${props.param.isShowcomment ? '' : 'hide'}`}
                          onClick={() => {
                            const list = [...checklist]
                            setChecklist(
                              updateData(['showInfo'], item.id, list, {
                                showInfo: true,
                              })
                            )
                          }}
                        ></em>
                        <em
                          className={`img_icon ${item.showchild ? 'check_list_up_btn' : 'check_list_down_btn'}`}
                          onClick={() => {
                            const list = [...checklist]
                            setChecklist(updateData('showchild', item.id, list, item.showchild))
                          }}
                        ></em>
                      </div>
                    </div>
                  </div>
                  {/* 子清单 */}
                  {item.showchild && (
                    <div>
                      <ul className="checkListChild">
                        {item.chidren?.map((chidrenItem: any, index: number) => {
                          return (
                            <li
                              className="checkListItem checkListChildItem"
                              key={index}
                              style={chidrenItem.inputShow ? { border: '1px solid #E7E7E9' } : {}}
                            >
                              <div
                                className="check_list_name_row child_check_list_name_row"
                                style={chidrenItem.inputShow ? { background: '#f5f7fb' } : {}}
                              >
                                <div className={`col_left ${chidrenItem.inputShow ? 'col_left_title' : ''}`}>
                                  {chidrenItem.inputShow == true && (
                                    <TextArea
                                      placeholder="Enter确认并快速创建下一同级check项"
                                      autoSize
                                      autoFocus
                                      rows={1}
                                      defaultValue={chidrenItem.name}
                                      onFocus={(e: any) => {
                                        setNameInpVal(e.target.value)
                                      }}
                                      onChange={(e: any) => {
                                        setNameInpVal(e.target.value)
                                      }}
                                      onBlur={(e: any) => {
                                        if (btnOpting || chidrenItem.isadd) {
                                          btnOpting = false
                                          return
                                        }
                                        editName({
                                          id: chidrenItem.id,
                                          e,
                                          index,
                                          item: chidrenItem,
                                          newVal: e.target.value,
                                          oldVal: chidrenItem.name,
                                        })
                                      }}
                                      onKeyDown={(e: any) => {
                                        if (e.keyCode == 13) {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          editName({
                                            item: chidrenItem,
                                            id: chidrenItem.id,
                                            e,
                                            newVal: nameInpVal,
                                            oldVal: chidrenItem.name,
                                            type: 'save',
                                            enterType: 'child',
                                            farid: item.id,
                                          })
                                        }
                                      }}
                                      // ref={(el: any) => {
                                      //   el && el.focus()
                                      // }}
                                    />
                                  )}
                                  {chidrenItem.name != '' && (
                                    <div
                                      className={`check_list_show_cont ${
                                        chidrenItem.inputShow == true ? 'hide' : ''
                                      }`}
                                    >
                                      {props.param.isedit &&
                                        [1].map(() => {
                                          let iseditdrop = false
                                          if (!props.param.iseditCheck) {
                                            if (item.userId != nowUserId) {
                                              iseditdrop = true
                                            }
                                          }
                                          return (
                                            <Dropdown
                                              key={1}
                                              className="check-editdrop-box"
                                              disabled={iseditdrop}
                                              overlay={
                                                <div className="check-editdrop-down">
                                                  <p
                                                    className={`${chidrenItem.choose == 0 ? 'active' : ''}`}
                                                    data-val="0"
                                                    onClick={() => {
                                                      editstate(chidrenItem.id, '0', chidrenItem.isCheck)
                                                    }}
                                                  >
                                                    未完成
                                                  </p>
                                                  <p
                                                    className={`${chidrenItem.choose == 1 ? 'active' : ''}`}
                                                    data-val="1"
                                                    onClick={() => {
                                                      editstate(chidrenItem.id, '1', chidrenItem.isCheck)
                                                    }}
                                                  >
                                                    已完成
                                                  </p>
                                                  <p
                                                    className={`${chidrenItem.choose == 2 ? 'active' : ''}`}
                                                    data-val="2"
                                                    onClick={() => {
                                                      editstate(chidrenItem.id, '2', chidrenItem.isCheck)
                                                    }}
                                                  >
                                                    搁置
                                                  </p>
                                                </div>
                                              }
                                              trigger={['click']}
                                            >
                                              <i className={`editstate editState-${chidrenItem.choose}`}></i>
                                            </Dropdown>
                                          )
                                        })}
                                      <span
                                        className={`check_list_name_show user_names-${chidrenItem.choose}`}
                                        onClick={() => {
                                          setNameInpVal(chidrenItem.name)
                                          editName({ id: chidrenItem.id, item: chidrenItem })
                                        }}
                                      >
                                        {chidrenItem.name}
                                      </span>
                                      {/* <DatePicker
                              showTime
                              placeholder="截至时间"
                              format="YYYY-MM-DD HH:mm"
                              value={chidrenItem.time && moment(chidrenItem.time)}
                              className={`${moment(chidrenItem.time) < moment(new Date()) &&
                                'formerlyTimes'}`}
                              onChange={(value: any) => {
                                editTimes(chidrenItem.id, value, index)
                              }}
                            /> */}
                                    </div>
                                  )}
                                </div>
                                {/* 确定或取消修改标题 */}
                                {chidrenItem.inputShow == true && (
                                  <div className="col_rig rest_ok">
                                    <div className="check_list_btns">
                                      <em
                                        className={`img_icon check_list_ok_btn`}
                                        onMouseDown={(e: any) => {
                                          btnOpting = true
                                          editName({
                                            item: chidrenItem,
                                            id: chidrenItem.id,
                                            e,
                                            newVal: nameInpVal,
                                            oldVal: chidrenItem.name,
                                            type: 'save',
                                          })
                                        }}
                                      ></em>
                                      <em
                                        className="img_icon check_list_rest_btn"
                                        onMouseDown={(e: any) => {
                                          btnOpting = true
                                          editName({
                                            item: chidrenItem,
                                            id: chidrenItem.id,
                                            e,
                                            newVal: nameInpVal,
                                            oldVal: chidrenItem.name,
                                            type: 'cancel',
                                          })
                                        }}
                                      ></em>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* 设置子节点时间 */}
                              <div className="check_list_chlid_time">
                                <div className="check_list_user_row check_list_user_child">
                                  <div className="col_left">
                                    {!chidrenItem.showSetTime && props.param.iseditCheck && (
                                      <span
                                        onClick={() => {
                                          const list = [...checklist]
                                          setChecklist(
                                            updateData('showSetChlidTime', chidrenItem.id, list, true)
                                          )
                                        }}
                                        className="check_end_time"
                                      >
                                        {chidrenItem.time ? `${chidrenItem.time}截止` : '设置截止时间'}
                                      </span>
                                    )}
                                    {chidrenItem.showSetTime && (
                                      <DatePicker
                                        open={true}
                                        autoFocus={true}
                                        showTime
                                        placeholder="结束时间"
                                        format="YYYY-MM-DD HH:mm"
                                        value={chidrenItem.time && moment(chidrenItem.time)}
                                        className={`${moment(chidrenItem.time) < moment(new Date()) &&
                                          'formerlyTimes'}`}
                                        onChange={(value: any) => {
                                          console.log('chang time')
                                          editTimes(chidrenItem.id, value, index)
                                        }}
                                        onBlur={() => {
                                          const list = [...checklist]
                                          setChecklist(updateData('showSetTime', chidrenItem.id, list, false))
                                        }}
                                        onOk={() => {
                                          const list = [...checklist]
                                          setChecklist(updateData('showSetTime', chidrenItem.id, list, false))
                                        }}
                                      />
                                    )}
                                  </div>
                                  {/* 右侧删除添加 */}
                                  <div className="col_rig">
                                    {/* 定位 */}
                                    {chidrenItem.choose == 1 &&
                                      chidrenItem.isCheck == 1 &&
                                      !chidrenItem.location && (
                                        <div className="location-box" style={{ color: 'red' }}>
                                          <i className="location-icon-no"></i>
                                          未获取定位
                                        </div>
                                      )}
                                    {chidrenItem.location && JSON.stringify(chidrenItem.location) != '{}' && (
                                      <Tooltip title={chidrenItem.location.location}>
                                        <div className="location-box">
                                          <i className="location-icon"></i>
                                          {chidrenItem.location.location}
                                        </div>
                                      </Tooltip>
                                    )}
                                    <div className={`check_list_btns ${chidrenItem.isadd ? 'forcedHide' : ''}`}>
                                      <em
                                        className="img_icon check_list_del_btn"
                                        onClick={() => {
                                          removeNode(chidrenItem.id, index)
                                        }}
                                      ></em>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                  {/* 评论回复 */}
                  {props.param.isShowcomment && !item.isadd && (
                    <div className={`detailComment ${item.commentMessageModels ? 'detailComment_box' : ''}`}>
                      <Taskcomment
                        ref={taskcommentRef}
                        param={{
                          setChecklist: (nowMessage: any, isTopLeval?: boolean) => {
                            if (nowMessage) {
                              item.commentMessageModels = nowMessage
                            }
                            const list = [...checklist]
                            setChecklist(updateData('showInfo', item.id, list, item.showInfo))
                            // 一级评论(内部无法获知当前选择项数据，该有父级设置内部数据)
                            if (isTopLeval) {
                              taskcommentRef?.current?.setCommentParentInfoFn(item)
                            }
                          },
                          isInfoShow: item.showInfo, //获取回复焦点
                          initDatas: item.commentMessageModels || [], //初始数据
                          from: 'detail', //来源
                          isAllowReply: props.param.iseditCheck, //是否允许回复(显示恢复框)
                          belongData: {
                            teamName: props.param.teamName,
                            teamid: props.param.teamId,
                            taskid: props.param.taskid,
                            typeid: item.id, //评论主题id
                            names: item.content.name, //检查项名称
                          },
                          scrollNeedDom: {
                            containerRef,
                            contentRef,
                            checkHeaderDom,
                            headerRef,
                          },
                          type: 'checklist', //检查项调用回复
                        }}
                        callback={(datas: any) => {
                          updateCheckList({ newData: datas })
                        }}
                      ></Taskcomment>
                    </div>
                  )}
                  {checklist.length - 1 != index && <div className="check_line"></div>}
                </li>
              )
            })}
          </ul>
          {/* 选人插件 */}
          {memberOrgShow && (
            <SelectMemberOrg
              param={{
                visible: memberOrgShow,
                ...selMemberOrg,
              }}
              action={{
                setModalShow: setMemberOrgShow,
                // 点击确认
                onSure: selMemberSure,
              }}
            />
          )}
        </div>
      )}
      {checklist.length == 0 && props.param.isshowNoneData && <NoneData />}
    </>
  )
})

export default CheckEntry
