import React, { useState, useEffect, useRef, useMemo } from 'react'
import './ApprovalExecute.less'
import { Button, Avatar, InputNumber, Radio, message, Spin, Input, Tabs, Tooltip } from 'antd'
const { TabPane } = Tabs
import {
  ActModelObjProps,
  FormElementModelProps,
  ActModelProps,
  getAllCheckVal,
  PointManagerModal,
  getBranchVarList,
} from '../approval/components/ApprovalDettail'
import ContentEditable from 'react-contenteditable'
import { getShowFormItemByType } from '@/src/components/approval-table/ApprovalTable'
import ApprovalWorkFlow from '@/src/components/approval-workflow/ApprovalWorkFlow'
import { ipcRenderer, remote } from 'electron'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { ArabiaToChinese, isJsonString } from '@/core/tools/utils'
import { useSelector } from 'react-redux'
import { SelectMemberOrg } from '@/src/components/select-member-org'
import { sureSelectInPerson } from '../workdesk/getData'
import { loadLocales } from '@/src/common/js/intlLocales'
import RenderRuleDetail from '@/src/components/approval-table/component/RenderRuleDetail'
import RenderRoleAuthDetail from '@/src/components/approval-table/component/RenderRoleAuthDetail'
import RenderMeetingDetail from '@/src/components/approval-table/component/RenderMeetingDetail'

//表单标题
interface DisposesTitleProps {
  contentType: number
  content: string
}
//发起审批表单数据
export interface ApprovalFormProps {
  approvalFormElementModels: FormElementModelProps[]
  modelId: string
  type: number
  postModel: {
    departmentId: number
    departName: string
    type: number
    postId: number
    postName: string
    main: number
  }
  isDefault: number
  eventType: number | string
  infoContent: string
  titleDisposes: DisposesTitleProps[]
  formTime: number
  relationDataModelList: any
  chargeAgainstList: any
}
interface StateProps {
  processData: ActModelProps[]
  loading: boolean
  sendLoading: boolean
  nowCheckData: any[]
  selectTab: string
  pointManager: boolean
  pointManagerData: any[]
  branchVarLists: any[]
}

//查询审批流程图
export const getProcessData = (eventId: any) => {
  return new Promise<ActModelObjProps>((resolve, reject) => {
    const { loginToken } = $store.getState()
    const param = {
      eventId: eventId,
    }
    $api
      .request('/approval/findByEventId', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}

//渲染编辑表单名称
const renderEditTitle = (executeData: any, title: string) => {
  let str = ''
  const titleArr = executeData.titleDisposes || []
  if (titleArr.length === 0) {
    str = title
  } else {
    titleArr.map((item: { contentType: number; content: string }) => {
      if (item.contentType === 2 && item.content !== '') {
        const params = getFormTitleNormal(executeData.approvalFormElementModels, item.content)
        const showName = params.str
        const relaunch = params.isRelaunch //是否是重新发起
        str += `<input disabled class="show-name" data-uuid="${item.content}" style="width:${calculationWidth(
          showName
        )}px" value="{${showName}}" isedit=${relaunch ? 'true' : 'false'}>`
      } else if (item.contentType === 2 && item.content === '') {
        str += `<input disabled class="show-name" style="width:${calculationWidth(
          title
        )}px" value="{${title}}" isedit="true">`
      } else if (item.contentType === 1) {
        str += item.content
      } else {
        str += `<input disabled class="show-name" style="width:${calculationWidth(
          '{表单编号}'
        )}px" value="{表单编号}" isedit="true">`
      }
    })
  }

  return str
}

//获取表单默认名称
const getFormTitleNormal = (arr: any[], uuid: string) => {
  let str = ''
  let isRelaunch = false //重新发起标识
  const { sendApprovalInfo } = $store.getState()
  $(arr).each((i, item) => {
    if (item.type !== 'table' && item.uuId === uuid) {
      // let _val = sendApprovalInfo.isEdit ? (item.value ? item.value : item.name) : item.name
      let _val = item.value ? item.value : item.name
      // if (sendApprovalInfo.isEdit && item.value != null) {
      if (item.value != null) {
        // 重新发起特殊处理
        if (item.type === 'numval' && item.numberTransform === 1) {
          _val = _val = ArabiaToChinese(parseFloat(Number(item.value).toFixed(item.decimals)))
        }
        if (item.type === 'peoSel') {
          _val = item.value
            ? JSON.parse(item.value)[0]
              ? JSON.parse(item.value)[0].userName
              : item.name
            : item.name
        }
        if (item.type === 'deptSel') {
          _val = item.value
            ? JSON.parse(item.value)[0]
              ? JSON.parse(item.value)[0].deptName
              : item.name
            : item.name
        }
        if (item.type === 'roleSel') {
          _val = item.value
            ? JSON.parse(item.value)[0]
              ? JSON.parse(item.value)[0].roleName
              : item.name
            : item.name
        }
        if (item.type === 'select' || item.type === 'radio' || item.type === 'checkbox') {
          _val = item.value ? (JSON.parse(item.value)[0] ? getOption(item.value) : item.name) : item.name
        }
        if (item.value !== '') {
          isRelaunch = true
        }
      }
      // if (sendApprovalInfo.isStartApproval && item.type === 'time') {
      //   _val = item.value ? item.value : item.name
      // }

      str = _val
      return false
    } else if (item.type === 'table') {
      const tableArr = item.tableElements
        .filter((idx: { formElementModel: any }) => idx.formElementModel && idx.formElementModel !== null)
        .map((idx: { formElementModel: any }) => {
          return idx.formElementModel
        })
      str = getFormTitleNormal(tableArr, uuid).str
      isRelaunch = getFormTitleNormal(tableArr, uuid).isRelaunch
      return false
    }
  })
  return {
    str,
    isRelaunch,
  }
}
//下拉选项，多选框，单选框  值组装
const getOption = (value: string) => {
  const arr = JSON.parse(value) || []
  const valarr = arr.map((item: any) => {
    return item.val
  })
  return valarr.join(',')
}

//审批人集合
let sendApporvalers: any[] = []
//需要几人同意
let sendApprovalerNum = 1
//知会人集合
let sendApprovalNoticers: any[] = []
//知会类型
let approvalNoticeType = 0

let approvalUsersType = 1

// 是否可以修改名称 0可以修改，1不可以修改
// let isEditTitle = 0
let temporaryId: any[] = []
//渲染审批标题
const RenderApprovalTitle = ({ executeData }: any) => {
  //表单输入框
  const titleRef = useRef<any>(null)
  const { nowUser, sendApprovalInfo } = $store.getState()

  const nextFormDatas = sendApprovalInfo.isNextFormDatas

  const [approvalTitleState, setApprovalTitleState] = useMergeState({
    approvalTitle: '',
    showEditTitle: false,
  })
  //点击编辑审批名称
  const editApprovalTitle = () => {
    const showTitle = $('.showTitleBox>span').html()
    setApprovalTitleState({ approvalTitle: showTitle, showEditTitle: true })
  }

  //编辑审批名称
  const changeEditTilte = (evt: any) => {
    setApprovalTitleState({ approvalTitle: evt.target.value })
  }

  //结束编辑blur
  const endEditTitle = () => {
    if (titleRef.current.innerHTML !== '') {
      setApprovalTitleState({ showEditTitle: false })
    } else {
      message.error('审批名称不能为空，请填写标题内容！')
      titleRef.current.focus()
    }
  }
  useEffect(() => {
    temporaryId = []
    if (executeData.title) {
      setApprovalTitleState({ approvalTitle: executeData.title })
    } else {
      if (executeData.isDefault === 0) {
        const title = renderEditTitle(executeData, sendApprovalInfo.approvalName)
        setApprovalTitleState({ approvalTitle: title })
      } else {
        const showTitle = `${sendApprovalInfo.approvalName}${
          sendApprovalInfo.spareInfo ? sendApprovalInfo.spareInfo.name : ''
        }`
        setApprovalTitleState({ approvalTitle: showTitle })
      }
    }
  }, [executeData.formTime])

  //编辑名称自动获取焦点
  useEffect(() => {
    if (titleRef.current && approvalTitleState.showEditTitle) {
      if (window.getSelection) {
        titleRef.current.focus()
        const range = window.getSelection() //创建range
        range?.selectAllChildren(titleRef.current) //range 选择obj下所有子内容
        range?.collapseToEnd() //光标移至最后
      }
    }
  }, [approvalTitleState.showEditTitle])

  return (
    <span className="execute-title">
      {!approvalTitleState.showEditTitle && (
        <>
          <div className="showTitleBox">
            {nowUser}申请【
            {<span dangerouslySetInnerHTML={{ __html: approvalTitleState.approvalTitle }}></span>}】的审批
          </div>
          {/* 发起下一轮和考勤补卡审批不允许修改名称 */}
          {((executeData.isDefault === 0 && nextFormDatas == null) || !sendApprovalInfo.isStartApproval) && (
            <div
              className="approval-header-icon"
              onClick={e => {
                e.preventDefault()
                editApprovalTitle()
              }}
            ></div>
          )}
        </>
      )}
      {approvalTitleState.showEditTitle && (
        <ContentEditable
          innerRef={titleRef}
          className="edit-input"
          tagName="div"
          html={approvalTitleState.approvalTitle}
          onChange={changeEditTilte}
          onBlur={endEditTitle}
          onPaste={e => {
            //禁止复制粘贴内容
            document.execCommand('insertHTML', false, '')
            e.preventDefault()
          }}
        />
      )}
    </span>
  )
}

//合并useState方法解决重复渲染
export const useMergeState = (initialState: any) => {
  const [state, setState] = useState(initialState)
  const setMergedState = (newState: any) => setState((prevState: any) => Object.assign({}, prevState, newState))
  return [state, setMergedState]
}

/**
 * 查询唯一标识数据
 * @param id 审批id
 * @param eventId 表单id
 * @param type 判断当前传的是审批id还是表单id
 */
export const getOnlyElement = (id: number, type: string) => {
  return new Promise<any>((resolve, reject) => {
    const { loginToken, sendApprovalInfo } = $store.getState()
    const param: any = {}
    if (type === 'eventId') {
      param.eventId = id
    } else {
      param.id = id
    }
    sendApprovalInfo.isEdit && type === 'eventId' ? (param.id = sendApprovalInfo.oldApprovalId) : ''
    $api
      .request('/approval/approval/findEventFormRelationSet', param, {
        headers: { loginToken: loginToken },
        formData: true,
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
 * 发起审批
 */
const ApprovalExecute = () => {
  //获取审批事件id和归属企业id
  const { executeData, customProcessSet } = $store.getState()
  const sendApprovalInfo = useSelector((store: StoreStates) => store.sendApprovalInfo)
  const nextFormDatas = sendApprovalInfo.isNextFormDatas

  //发起审批state
  const initStates: StateProps = {
    processData: [],
    loading: false,
    sendLoading: false,
    nowCheckData: [],
    selectTab: '0',
    pointManager: false,
    pointManagerData: [],
    branchVarLists: [],
  }
  const [executeState, setExecuteState] = useMergeState(initStates)

  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
  }, [])
  //初始化
  useEffect(() => {
    //手动开启devtools
    window.addEventListener('keydown', e => {
      const { ctrlKey, altKey, keyCode } = e
      if (ctrlKey && altKey && keyCode === 71) {
        const cureentWindow = remote.getCurrentWindow()
        cureentWindow && cureentWindow.webContents.toggleDevTools()
        e.preventDefault()
      }
    })
    //设置title
    document.title = '发起审批'
  }, [])
  useEffect(() => {
    setExecuteState({
      loading: true,
      processData: [],
      sendLoading: false,
      nowCheckData: [],
      selectTab: '0',
      pointManager: false,
      pointManagerData: [],
    })
    //查询唯一标识
    let _onlyUuIdAarr: never[] = []
    getOnlyElement(sendApprovalInfo.eventId, 'eventId')
      .then(data => {
        _onlyUuIdAarr = data
      })
      .catch(() => {
        message.info('查询唯一标识数据失败')
      })
      .finally(() => {
        if (sendApprovalInfo.isNextForm && sendApprovalInfo.isNextFormDatas != null) {
          //发起下一轮
          //设置审批表单数据
          $store.dispatch({
            type: 'SET_EXECUTE_FORM_DATA',
            data: {
              ...nextFormDatas.formData,
              approvalFormElementModels: nextFormDatas.formData.formContentModels,
            },
          })

          setExecuteState({ loading: false })
        } else {
          if (sendApprovalInfo.eventId !== 0) {
            //清空store缓存
            $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: '' })
            $store.dispatch({ type: 'SET_SEND_APPROVAL_TITLE', data: '' })
            // $store.dispatch({ type: 'SET_ONLY_FORM_DATAID', data: null })
            $store.dispatch({ type: 'SET_OUT_BACK_IDS', data: {} })
            $store.dispatch({
              type: 'SAVE_EVENT_FORM_RELATION_SET',
              data: { outBackData: {}, elementRelationDataList: [] },
            })
            //查询流程图

            let startNodeId = ''
            let processDataList: any[] = []
            let checkData: any[] = []
            if (sendApprovalInfo.findByEventIdData) {
              //固定流程审批
              processDataList = sendApprovalInfo.findByEventIdData.childShapes || []
              if (processDataList.length !== 0) {
                startNodeId = processDataList.filter(item => item.stencil.id === 'StartNoneEvent')[0].resourceId
              }
            }

            queryPhoneApprovalForm(startNodeId, sendApprovalInfo.isStartApproval ? sendApprovalInfo.key : null)
              .then(formData => {
                // const onlyElementData = useSelector((store: StoreStates) => store.onlyElementData)
                //如果是基础表单会议
                if (formData.eventType == 2) {
                  formData.infoContent = `meeting_add:::${sendApprovalInfo.spareId}`
                }
                const _newArr: any = []
                if (formData.relationDataModelList) {
                  // 重新发起 唯一标识关联关系
                  formData.relationDataModelList.map((item: any, index: number) => {
                    return _onlyUuIdAarr?.filter((onlyItme: any) => {
                      if (onlyItme.uuid !== item.uuid) {
                        _newArr.push({
                          uuid: item.uuid,
                          type: 1,
                          typeFlag: null,
                          onlyUuId: null,
                        })
                      }
                    })
                  })
                }

                const outBackData = {}
                if (formData.chargeAgainstList) {
                  for (let i = 0; i < formData.chargeAgainstList.length; i++) {
                    outBackData[formData.chargeAgainstList[i].uuid] = formData.chargeAgainstList[i].dataId
                  }
                }
                $store.dispatch({
                  type: 'SAVE_EVENT_FORM_RELATION_SET',
                  data: {
                    elementRelationDataList: formData.relationDataModelList || [],
                    outBackData: outBackData || {},
                    onlyElementData: [..._newArr, ..._onlyUuIdAarr],
                  },
                })
                //处理数据
                checkData = getAllCheckVal(formData.approvalFormElementModels, true).data
                $store.dispatch({ type: 'SET_APP_CHECK_FORM_DATA', data: checkData })
                //设置审批表单数据
                $store.dispatch({ type: 'SET_EXECUTE_FORM_DATA', data: formData })
                //获取分支条件变量

                getBranchVarList(sendApprovalInfo.eventId).then((res: any) => {
                  setExecuteState({
                    nowCheckData: checkData,
                    processData: processDataList,
                    loading: false,
                    branchVarLists: res,
                  })
                })
              })
              .catch(() => {
                setExecuteState({
                  loading: false,
                })
              })
          }
        }
      })
  }, [sendApprovalInfo])

  //查询自定义表单
  const queryPhoneApprovalForm = (startNodeId?: string, key?: any) => {
    return new Promise<ApprovalFormProps>(resolve => {
      const { sendApprovalInfo, nowUserId, loginToken } = $store.getState()
      const param: any = {
        eventId: sendApprovalInfo.eventId,
        ascriptionId: sendApprovalInfo.teamId,
        userId: nowUserId,
        resourceId: startNodeId,
      }

      if (key) {
        param.key = key
      }
      sendApprovalInfo.isEdit ? (param.restartApprovalId = sendApprovalInfo.oldApprovalId) : ''
      $api
        .request('/approval/approval/findPhoneApprovalForm', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(resData => {
          resolve(resData.data)
        })
    })
  }

  // 修改值后获取值
  /**
   *
   * @param arr
   * @param uid
   * @param parId
   * @param normalvalue 父级id参与判断时，普通控件重复行时不带父级的值
   * @returns
   */
  const getChangeValueUuid = (arr: any, uid: any, parId?: any, normalvalue?: any) => {
    let _isIn = false
    let _isId = ''
    if (typeof arr == 'string') {
      if (arr == uid || (!normalvalue && parId && arr == parId)) {
        _isIn = true
        _isId = arr
      }
    } else if (typeof arr === 'object') {
      for (const key in arr) {
        if (key == uid || (!normalvalue && parId && key == parId)) {
          _isIn = true
          _isId = key
          break
        }
      }
    } else if (Array.isArray(arr)) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] == uid || (!normalvalue && parId && arr[i] == parId)) {
          _isIn = true
          _isId = arr[i]
          break
        }
      }
    }
    return {
      isIn: _isIn,
      isId: _isId,
    }
  }

  //修改表单值后缓存
  const changeData = (handleItem: any) => {
    const {
      data,
      contentArr,
      pageUuid,
      elementId,
      elementType,
      symbolVal,
      leaveDateRange,
      leaveDateData,
    } = handleItem
    let _value: any = ''
    let _content = contentArr ? contentArr : ''
    //修改标题相关控件值
    let titleValue: any = _content
    if (handleItem.myFormulaType && handleItem.myFormulaType === 'formula') {
      titleValue = _value
    }
    for (const key in data) {
      _value = data[key]
      const _areaDom = $(`.plugElementRow[data-uuid=${key}]`)
      const _type = _areaDom.attr('data-type')
      _areaDom.removeClass('hight')

      if (isNaN(_value) && _type === 'numval') {
        // 数值控件NaN校验
        _value = ''
      }
      if (isNaN(_content) && _type === 'numval') {
        // 数值控件NaN校验
        _content = ''
      }
      if (isNaN(titleValue) && _type === 'numval') {
        // 数值控件NaN校验
        titleValue = ''
      }

      //修改标题的值
      const $itemWrap = $('.showTitleBox').find(`.show-name[data-uuid="${key}"]`)
      let $isEdit = false
      let $domVal = contentArr ? contentArr : _value
      if (_value && isJsonString(_value)) {
        const leaveDate = JSON.parse(_value)
        if (leaveDate.timeType == 'day') {
          $domVal = leaveDate.startTime.split(' ')[0] + '-' + leaveDate.endTime.split(' ')[0]
        } else if (leaveDate.timeType == 'half_day') {
          $domVal =
            leaveDate.startTime.split(' ')[0] +
            (leaveDate.startTimeTag == 'AM' ? '上午' : '下午') +
            '-' +
            leaveDate.endTime.split(' ')[0] +
            (leaveDate.endTimeTag == 'AM' ? '上午' : '下午')
        }
      }
      //唯一标识选择空间后对应的控件值 单独处理
      if (symbolVal) $domVal = symbolVal
      if (!!_value) {
        $isEdit = true
      } else {
        $domVal = '{}'
      }
      $itemWrap
        .val($domVal)
        .attr({
          value: $domVal,
          isedit: $isEdit,
        })
        .css({
          width: calculationWidth($domVal),
        })
    }
    //缓存数值公式的值
    $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: { key: 'numvalObj', value: data } })
    const { outBackData } = $store.getState()

    //   //修改值
    const newCheckData = executeState.nowCheckData.map((item: any) => {
      const _parId = $(`.plugElementRow[data-uuid=${item.uuId}]`).attr('data-parentuuid')
      const _datas = getChangeValueUuid(data, item.uuId, _parId)
      if (_datas.isIn) {
        item.elementValue = data[item.uuId] === 'NaN' ? '' : data[item.uuId]
        item.valueContent = contentArr === 'NaN' ? '' : contentArr
        item.chargeAgainstId = outBackData[_datas.isId] || ''
        item.leaveDateRangeType = leaveDateRange
        item.leaveDateData = leaveDateData
        if (!!elementType && elementType === 'numType') {
          item.valueContent = data[item.uuId] === 'NaN' ? '' : data[item.uuId]
        }
      }
      //缓存附件得fileID
      const isattach = item.type === 'attachment_table' || item.type === 'attachment'
      const tempLate = isattach && pageUuid && elementId === item.uuId && !!_value.length
      if (tempLate) {
        temporaryId.push(`${pageUuid},${item.uuId}`)
      }

      return item
    })

    //修改重复行值
    const { nowFormulaInfo } = $store.getState()
    const newAddCheck = nowFormulaInfo.newaddValues.map(item => {
      const _parId = $(`.plugElementRow[data-uuid=${item.uuId}]`).attr('data-parentuuid')
      const _normalvalue = $(`.plugElementRow[data-uuid=${item.uuId}]`).attr('data-normalvalue')
      const _datas = getChangeValueUuid(data, item.uuId, _parId, _normalvalue)

      if (_datas.isIn) {
        item.elementValue = data[item.uuId] === 'NaN' ? '' : data[item.uuId]
        item.valueContent = contentArr === 'NaN' ? '' : contentArr
        if (!!elementType && elementType === 'numType') {
          item.valueContent = data[item.uuId] === 'NaN' ? '' : data[item.uuId]
        }
      }
      return item
    })
    $store.dispatch({
      type: 'SET_APPROVAL_FORMULA_INFO',
      data: { newaddValues: newAddCheck },
    })
    $store.dispatch({ type: 'SET_APP_CHECK_FORM_DATA', data: newCheckData })
  }
  const sendApproval = () => {
    const newTemporaryId = Array.from(new Set(temporaryId))
    const { loginToken } = $store.getState()
    if (nextFormDatas !== null) {
      //发起下一轮
      if (sendApporvalers.length === 0) {
        message.error('审批人不能为空')
        return
      }

      const param = {
        id: nextFormDatas.newApprovalId,
        approvalerNum:
          customProcessSet.isApprovalRequired == 0
            ? sendApporvalers.length < sendApprovalerNum
              ? 1
              : sendApprovalerNum
            : 0,
        approvers: sendApporvalers,
        noticeType: approvalNoticeType,
        notices: sendApprovalNoticers,
        customApprovalProcessType: approvalUsersType, //0 同时审批 ；1 依次审批
        temporaryIds: newTemporaryId,
      }
      $api
        .request('/approval/approval/nextApprovalProcess', param, {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(() => {
          message.success('发起审批成功')
          $store.dispatch({ type: 'IS_APPROVAL_SEND', data: false })
          $store.dispatch({
            type: 'APPROVAL_File_IDS',
            data: [],
          })
          $store.dispatch({
            type: 'SET_NEXT_APPROVAL_DATA',
            data: null,
          })
          setTimeout(() => {
            ipcRenderer.send('close_goalgo_execute')
          }, 1000)
        })
        .catch(err => {
          message.error(err.returnMessage)
        })
    } else {
      const formDatas = checkModelsInfo()
      if (formDatas.bool) {
        const approvalSendTitle = $('.showTitleBox>span').html()
        const title = approvalSendTitle.replace(/<input(.*?)value="(.*?)" isedit="(.*?)"([^>]*?)>/g, function(
          str: any,
          $1: string,
          $2: string,
          $3: string
        ) {
          const newStr = String($2).replace(/\{|\}/g, '')
          if ($3 === 'true') {
            if (newStr === '表单编号') {
              return '<#sep#>form_number<#sep#>'
            } else {
              return newStr
            }
          } else {
            return ''
          }
        })
        const sendTitle = title.replace(/&nbsp;/g, ' ')
        if (sendTitle === '') {
          message.error('审批名称不能为空，请填写标题内容！')
          return
        }

        if (
          executeData?.type === 0 &&
          sendApporvalers.length === 0 &&
          customProcessSet.isApprovalRequired == 0
        ) {
          message.error('审批人不能为空')
          return
        }

        //检测必填项
        const {
          approvalCheckData,
          nowUserId,
          nowAccount,
          loginToken,
          nowFormulaInfo,
          hiddenViewList,
        } = $store.getState()

        const { elementRelationDataList } = $store.getState()
        //处理冲销
        const hasChargeIdRow = approvalCheckData.filter(item => item.chargeAgainstId !== '')
        if (hasChargeIdRow.length !== 0) {
          hasChargeIdRow.map(item => {
            const rowNum = item.coord ? item.coord.split(',')[0] : 0
            const isDefault = getDefaultId(rowNum, hasChargeIdRow)
            const approvalId = item.chargeAgainstId
            approvalCheckData.map(idx => {
              if (idx.coord && idx.coord.split(',')[0] === rowNum) {
                idx.chargeAgainstId = approvalId || isDefault.isType ? isDefault.isApprovalId : ''
              }
              return idx
            })
          })
        }
        // 处理表格外公式

        if (nowFormulaInfo.formulaInfo.length !== 0) {
          approvalCheckData.map(idx => {
            const _variable = getvariable(idx.uuId, nowFormulaInfo.formulaInfo)
            if (_variable != '') {
              idx.designFormulas = JSON.stringify(_variable)
            }

            return idx
          })
        }
        const param: any = {
          title: sendTitle,
          approvalerNum:
            customProcessSet.isApprovalRequired == 0
              ? sendApporvalers.length < sendApprovalerNum
                ? 1
                : sendApprovalerNum
              : 0,
          approvers: sendApporvalers,
          noticeType: approvalNoticeType,
          notices: sendApprovalNoticers,
          eventId: sendApprovalInfo.eventId,
          teamId: sendApprovalInfo.teamId,
          teamName: sendApprovalInfo.teamName,
          userId: nowUserId,
          username: nowAccount,
          formContentModels: approvalCheckData,
          infoContent: sendApprovalInfo.spareInfo ? sendApprovalInfo.spareInfo.info : '',
          callBackUrl: sendApprovalInfo.spareInfo ? sendApprovalInfo.spareInfo.callBackUrl : '',
          files: [],
          custom: sendApprovalInfo.spareInfo ? sendApprovalInfo.spareInfo.name : '',
          openTime: executeData?.formTime,
          approvalSourceModel: {
            sourceName: '',
            sourceType: 1,
            sourceId: '',
            associationType: 1,
          },
          customApprovalProcessType: approvalUsersType, //0 同时审批 ；1 依次审批
          relationDataModelList: elementRelationDataList, //唯一标识相关值
          temporaryIds: newTemporaryId,
          hiddenViewList, //隐藏控件的uuid
        }
        if (nowFormulaInfo.newaddValues.length !== 0) {
          const { outBackData } = $store.getState()
          const chargeRowArr: any[] = []
          //有添加重复行
          const addTableElements = nowFormulaInfo.tableElements.map(item => {
            let newItem: any = null
            if (item.isCopyRow) {
              if (item.formElementModel && outBackData[item.formElementModel.uuId]) {
                chargeRowArr.push({
                  row: item.coord.split(',')[0],
                  approvalId: outBackData[item.formElementModel.uuId],
                })
              }
              //重复行
              if (item.formElementModel) {
                const newAddVal = nowFormulaInfo.newaddValues.filter(
                  idx => idx.uuId === item.formElementModel.uuId
                )
                newItem = {
                  coord: item.coord,
                  elementValue: newAddVal.length > 0 ? newAddVal[0].elementValue : '',
                  valueContent: newAddVal.length > 0 ? newAddVal[0].valueContent : '',
                  chargeAgainstId: outBackData[item.formElementModel.uuId] || '',
                  resourceId: item.id, //复制行原始行的id
                  uuId: item.formElementModel.uuId,
                }
              } else {
                newItem = {
                  coord: item.coord,
                  elementValue: '',
                  valueContent: '',
                  chargeAgainstId: '',
                  resourceId: item.id,
                }
              }
            } else {
              newItem = {
                coord: item.coord,
                elementValue: '',
                valueContent: '',
                chargeAgainstId: item.formElementModel ? outBackData[item.formElementModel?.uuId] : '',
                id: item.id,
              }
            }
            //公式更新
            if (item.formElementModel && item.formElementModel.designFormulas) {
              newItem.designFormulas = item.formElementModel.designFormulas
            }
            return newItem
          })

          //一行冲销
          chargeRowArr.map(item => {
            addTableElements.map(idx => {
              if (idx.coord && idx.coord.split(',')[0] === item.row) {
                idx.chargeAgainstId = item.approvalId || ''
              }
              return idx
            })
          })
          param.tableAttachModel = {
            heightArr: nowFormulaInfo.heightArr,
            rowNum: nowFormulaInfo.rowNum,
            tableArr: nowFormulaInfo.tableArr,
            tableElements: addTableElements,
          }
        }
        //如果是重新发起，需要调resendApproval
        if (sendApprovalInfo.isEdit) {
          param.restartApprovalId = sendApprovalInfo.oldApprovalId
        }
        if (sendApprovalInfo.isStartApproval) {
          // 考勤补卡审批
          param.custom = executeData.custom
        }

        setExecuteState({
          sendLoading: true,
        })
        $api
          .request('/approval/approval/addApproval', param, {
            headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
          })
          .then(async res => {
            $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: { isApprovalRequired: 0 } })
            //如果是重新发起，需要调resendApproval
            if (sendApprovalInfo.isEdit) {
              ipcRenderer.send('refresh_approval_count')
            }
            //如果是会议
            if (sendApprovalInfo.isMeetAdd) {
              ipcRenderer.send('close-meet-modal')
            }
            $store.dispatch({ type: 'IS_APPROVAL_SEND', data: false })
            $store.dispatch({
              type: 'SAVE_EVENT_FORM_RELATION_SET',
              data: { outBackData: {} },
            })
            if (res.dataList && res.dataList.length > 0) {
              /* 指定节点责任人选人 */
              setExecuteState({
                pointManager: true,
                pointManagerData: res,
              })
              // ipcRenderer.send('close_goalgo_execute')
            } else {
              ipcRenderer.send('close_goalgo_execute')
            }

            message.success('发起审批成功')
            $store.dispatch({
              type: 'APPROVAL_File_IDS',
              data: [],
            })
          })
          .catch(err => {
            message.error(err.returnMessage)
          })
          .finally(() => {
            setExecuteState({
              sendLoading: false,
            })
          })
      }
    }
  }

  // 表格外公式处理（得到表格外的公式并传给后台）
  const getvariable = (uuid: any, arr: any) => {
    let _data = ''
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].formlaId === uuid) {
        _data = arr[i]
      }
    }
    return _data
  }

  //会议发起
  const changeMeetingAddValue = (value: string, name: string) => {
    $('.plugElementRow.meetInfo').removeClass('hight')
    //修改值
    const newCheckData = executeState.nowCheckData.map(
      (item: { elementName: string; elementValue: string; valueContent: string }) => {
        if (item.elementName === name) {
          item.elementValue = value
          item.valueContent = value
        }
        return item
      }
    )
    $store.dispatch({ type: 'SET_APP_CHECK_FORM_DATA', data: newCheckData })
  }
  // const getChangeLoding = (flag: any) => {
  //   setExecuteState({ loading: flag })
  // }
  //自定义审批渲染
  const customApprovalRender = useMemo(() => {
    if (!executeData) {
      return null
    }
    return (
      <div className="form-info">
        {/* 自定义审批 */}
        {executeData &&
          (executeData.eventType === 'others' || executeData.eventType === 0) &&
          executeData.approvalFormElementModels.map((item: FormElementModelProps) =>
            getShowFormItemByType(
              item,
              sendApprovalInfo.teamId,
              sendApprovalInfo.eventId,
              changeData,
              'triggerApproval',
              undefined,
              undefined,
              true,
              true
              // getChangeLoding
            )
          )}
        {/* 公告审批 */}
        {executeData && executeData.eventType === 'rule' && (
          <RenderRuleDetail meetId={executeData.infoId} showInfo={executeData.approvalFormElementModels} />
        )}
        {/* 职务授权审批 和 个人权限审批 */}
        {executeData &&
          (executeData.eventType === 'role_authorization' || executeData.eventType === 'my_permission') && (
            <RenderRoleAuthDetail
              showInfo={executeData?.approvalFormElementModels}
              infoContent={executeData.infoContent}
              teamId={executeData?.teamId}
            />
          )}
        {/* 会议发起 */}
        {executeData && executeData.eventType === 'meeting_add' && (
          <RenderMeetingDetail
            showInfo={executeData.approvalFormElementModels}
            infoContent={executeData.infoContent}
          />
        )}
        {executeData && executeData.eventType === 2 && (
          <>
            {executeData.approvalFormElementModels.map((item: any, index: number) => {
              if (item.type !== 'CuttingLine') {
                if (index === 3) {
                  return (
                    <div
                      className="plugElementRow meetInfo hasRequire"
                      data-type={'textarea'}
                      data-isedit={true}
                      key={index}
                    >
                      <div className="plugRowLeft">{item.name}</div>
                      <div className="plugRowRight">
                        <Input.TextArea
                          style={{ resize: 'none' }}
                          maxLength={item.textNumber}
                          autoSize={{ minRows: 3 }}
                          onChange={e => {
                            changeMeetingAddValue(e.target.value, item.name)
                          }}
                        ></Input.TextArea>
                      </div>
                    </div>
                  )
                } else {
                  const { nowUser } = $store.getState()
                  let showTxt = ''
                  switch (index) {
                    case 0:
                      showTxt = sendApprovalInfo.spareInfo.approvalEventName
                      break
                    case 1:
                      showTxt = nowUser
                      break
                    case 4:
                      showTxt = `会议名称：${sendApprovalInfo.spareInfo.name}
                  <br />
                  开始时间：${sendApprovalInfo.spareInfo.startTime}
                  <br />
                  结束时间：${sendApprovalInfo.spareInfo.endTime}
                  <br />
                  申请会议室：
                  ${
                    sendApprovalInfo.spareInfo.meetingRoom == null
                      ? '无'
                      : `${sendApprovalInfo.spareInfo.meetingRoomName}(容纳人数${sendApprovalInfo.spareInfo.peopleNum}人)`
                  }
                  <br />
                  会议议题：
                  ${sendApprovalInfo.spareInfo.subjects.map((idx: { topic: any }, _index: number) => {
                    return _index == 0 ? `${_index + 1}.${idx.topic}` : `<br>        ${_index + 1}.${idx.topic}`
                  })}
                  <br />
                  参会人数：${sendApprovalInfo.spareInfo.userNum}
                  <br />`
                      break
                    case 5:
                      showTxt = `所属机构：${sendApprovalInfo.spareInfo.teamName || ''}
                  <br />
                  所属部门：${sendApprovalInfo.spareInfo.deptName || ''}
                  <br />`
                    default:
                      break
                  }
                  //设置会议默认值
                  changeMeetingAddValue(showTxt, item.name)
                  return (
                    <div className="plugElementRow" key={index}>
                      <div className="plugRowLeft">{item.name}</div>
                      <div className="plugRowRight meetInfoRow">
                        <span dangerouslySetInnerHTML={{ __html: showTxt }}></span>
                      </div>
                    </div>
                  )
                }
              } else {
                return (
                  <div className="plugElementRow" key={index}>
                    <div className="form-cuttingLine"></div>
                  </div>
                )
              }
            })}
            <RenderMeetingDetail showInfo={[]} infoContent={executeData.infoContent} />
          </>
        )}
      </div>
    )
  }, [executeData])

  //切换tab
  const changeSelectTab = (key: string) => {
    setExecuteState({
      selectTab: key,
    })
  }

  /**
   * 指定节点责任人
   */
  const closeSelectInPerson = () => {
    setExecuteState({
      pointManager: false,
      pointManagerData: [],
    })
    // 关闭发起审批窗口
    ipcRenderer.send('close_goalgo_execute')
    //更新审批列表
    ipcRenderer.send('refresh_approval_count')
  }

  //确定选择责任人
  const sureSelectInPersonModal = (id: number, name: string, taskKey: string) => {
    const { nowUser, nowUserId } = $store.getState()
    const param = {
      approvalId: executeState.pointManagerData?.data,
      taskKey: taskKey,
      userId: id,
      userName: name,
      operaterId: nowUserId,
      operaterName: nowUser,
    }
    sureSelectInPerson(param)
      .then(() => {
        //更新审批列表
        ipcRenderer.send('refresh_approval_count')
        // 关闭发起审批窗口
        ipcRenderer.send('close_goalgo_execute')
      })
      .catch(err => {
        message.error(err.returnMessage)
      })
  }

  //渲染流程图
  const renderFlowPic = useMemo(() => {
    if (executeState.processData.length === 0) {
      return null
    }
    return (
      <ApprovalWorkFlow
        dataSource={executeState.processData}
        historyProcess={[]}
        branchVarLists={executeState.branchVarLists}
      />
    )
  }, [executeState.processData])
  return (
    <Spin spinning={executeState.loading} wrapperClassName="approval-execute-container">
      <div className="execute-header">{executeData && <RenderApprovalTitle executeData={executeData} />}</div>
      <div className="execute-content">
        <Tabs
          className="approval-detail-content"
          activeKey={executeState.selectTab}
          onChange={changeSelectTab}
          onClick={(e: any) => {
            const _tagName = $(e.target)[0].tagName
            const _className = $(e.target)[0].className
            if (_tagName === 'TBODY' || (_tagName === 'DIV' && _className == 'form-info')) {
              const yy: any = e.pageY || 0
              const _scrollNum = $('.ant-tabs-content-holder').scrollTop()
              if (yy > 0 && _scrollNum == 0) {
                $('.ant-tabs-content-holder').scrollTop(yy - 30)
              }
            }
          }}
        >
          <TabPane tab={'表单详情'} key="0" className="approval-detail-pane-content">
            {customApprovalRender}
            {executeState.processData.length === 0 && <CustomWork teamId={sendApprovalInfo.teamId} />}
            {executeState.pointManager && (
              <PointManagerModal
                data={executeState.pointManagerData.dataList}
                // loading={executeState.showManager.loading}
                onClose={closeSelectInPerson}
                onSure={sureSelectInPersonModal}
              />
            )}
          </TabPane>
          {executeState.processData.length !== 0 && (
            <TabPane tab={'流程图'} key="1" forceRender>
              {renderFlowPic}
            </TabPane>
          )}
        </Tabs>
      </div>
      <div className="execute-btn">
        <Button type="primary" loading={executeState.sendLoading} onClick={sendApproval}>
          确定
        </Button>
      </div>
      <DownLoadFileFooter fromType="approval-execute" />
    </Spin>
  )
}

export default ApprovalExecute

//自定义审批选人
export const CustomWork = ({ teamId, setInfo }: { teamId: number; setInfo?: any }) => {
  //审批人集合
  const [approvalUsers, setApprovalUsers] = useState<any>([])
  //显示选择审批人弹窗
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  //需要审批人几人通过 //默认1个
  const [approvalerNum, setApprovalerNum] = useState(1)
  //知会人集合
  const [noticeUsers, setNoticeUser] = useState<any>([])
  //是否显示知会人弹窗
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  //知会类型 //默认审批发起时知会
  const [noticeType, setNoticeType] = useState<number>(0)
  // 审批人类型选择//默认依次审批
  const [approvalType, setApprovalType] = useState<number>(1)
  const { customProcessSet } = $store.getState()

  useEffect(() => {
    setApprovalUsers([])
    if (customProcessSet.defineUserModelList && customProcessSet.defineUserModelList.length != 0) {
      const _noticeUser = customProcessSet.defineUserModelList?.map((item: any) => {
        return {
          curId: item.userId,
          curName: item.username,
          disable: true, //是否可以删除 true不可以删除
          profile: item.userProfile,
          curType: item.curType,
        }
      })
      sendApprovalNoticers = customProcessSet.defineUserModelList?.map((item: any) => {
        return {
          userId: item.userId,
          username: item.username,
          userAccount: '',
          profile: item.userProfile,
          curType: item.curType,
        }
      })
      setNoticeUser(_noticeUser)
    }
  }, [customProcessSet])

  //选择审批人集合回调
  const selectApprovalUsersChange = (data: any) => {
    setApprovalUsers(data)
    sendApporvalers = data.map((item: { userId: any; userName: any; account: any }) => {
      return {
        userId: item.userId,
        username: item.userName,
        userAccount: item.account,
      }
    })
    setShowApprovalModal(false)
  }
  //显示选择审批弹窗
  const showSelectApprovalUsers = () => {
    setShowApprovalModal(true)
  }

  //外部删除审批人
  const delApprovalUser = (id: number) => {
    const newApprovalUsers = approvalUsers.filter((item: { userId: number }) => item.userId !== id)
    sendApporvalers = newApprovalUsers.map((item: { userId: any; userName: any; account: any }) => {
      return {
        userId: item.userId,
        username: item.userName,
        userAccount: item.account,
      }
    })
    if (newApprovalUsers?.length === 1) {
      setApprovalType(1)
      approvalUsersType = 1
    }
    setApprovalUsers(newApprovalUsers)
  }

  //选择知会人集合回调
  const selectNoticeUserChange = (data: any) => {
    setNoticeUser(data)
    sendApprovalNoticers = data.map((item: { curId: any; curName: any; account: any }) => {
      return {
        userId: item.curId,
        username: item.curName,
        userAccount: item.account ? item.account : '',
      }
    })
    setShowNoticeModal(false)
  }
  //显示选择知会人弹窗
  const showSelectNoticeUsers = () => {
    setShowNoticeModal(true)
  }
  //外部删除知会人
  const delNoticeUser = (id: number) => {
    const newApprovalUsers = noticeUsers.filter((item: { curId: number }) => item.curId !== id)
    sendApprovalNoticers = newApprovalUsers.map((item: { curId: any; curName: any; account: any }) => {
      return {
        userId: item.curId,
        username: item.curName,
        userAccount: item.account ? item.account : '',
      }
    })
    setNoticeUser(newApprovalUsers)
  }

  //修改发起审批知会类型
  const changeNoticeType = (e: any) => {
    approvalNoticeType = e.target.value
    setNoticeType(e.target.value)
  }

  //修改需要几人审批
  const changeApprovalerNum = (value: any) => {
    sendApprovalerNum = value
    setApprovalerNum(value)
  }
  //回调信息
  setInfo &&
    setInfo({
      approvalerNum: sendApprovalerNum,
      approvers: sendApporvalers,
      noticeType: approvalNoticeType,
      notices: sendApprovalNoticers,
      approvalUsersType: approvalUsersType,
    })
  return (
    <div className="custom-work">
      {customProcessSet.isApprovalRequired === 0 && <div className="title">审批人</div>}
      {customProcessSet.isApprovalRequired === 0 && (
        <div className="user-list">
          {approvalUsers.map(
            (item: { curId: number; profile: string | undefined; curName: string }, i: number) => (
              <div className="provide_user_box" key={item.curId}>
                <div className="avatarBox">
                  <Avatar className="oa-avatar" src={item.profile}>
                    {item.curName.substr(-2, 2)}
                  </Avatar>
                  <Tooltip placement="bottomLeft" title={item.curName}>
                    <span className="user-name">{item.curName.substr(-2, 2)}</span>
                  </Tooltip>
                </div>
                {i !== approvalUsers.length - 1 && approvalUsersType === 1 && (
                  <div>
                    <div className="arrowRight"></div>
                  </div>
                )}
                <span
                  className="del-sel-user"
                  onClick={() => {
                    delApprovalUser(item.curId)
                  }}
                ></span>
              </div>
            )
          )}
          <div
            className="provide-add-node"
            onClick={e => {
              e.preventDefault()
              showSelectApprovalUsers()
            }}
          ></div>
        </div>
      )}
      {customProcessSet.isApprovalRequired === 0 && approvalUsers.length > 1 && (
        <div className="approval-count-container">
          <Radio.Group
            onChange={e => {
              approvalUsersType = e.target.value //0 同时审批 ；1 依次审批
              setApprovalType(e.target.value)
            }}
            defaultValue={1}
          >
            <Radio value={1}>依次审批</Radio>
            <Radio value={0}>同时审批</Radio>
          </Radio.Group>
          {approvalType === 0 && (
            <label>
              <span>当前{approvalUsers.length}人，只需其中</span>
              <InputNumber
                style={{ width: 50, margin: '0 5px' }}
                value={approvalerNum}
                max={approvalUsers.length}
                min={1}
                step={1}
                onChange={changeApprovalerNum}
              />
              人同意完成审批
            </label>
          )}
        </div>
      )}
      <div className="title">知会人</div>
      <div className="user-list noticeUsers-box">
        {noticeUsers?.map((item: any) => (
          <div className="provide_user_box flex_column" key={item.curId}>
            <Avatar className="oa-avatar" src={item.profile}>
              {item.curName.substr(-2, 2)}
            </Avatar>
            <span className="user-name">{item.curName}</span>
            {!item.disable && (
              <span
                className="del-sel-user"
                onClick={() => {
                  delNoticeUser(item.curId)
                }}
              ></span>
            )}
          </div>
        ))}
        <div
          className="provide-add-node"
          onClick={e => {
            e.preventDefault()
            showSelectNoticeUsers()
          }}
        ></div>
      </div>
      {customProcessSet.isApprovalRequired === 0 && (
        <div className="approval-took">
          <Radio.Group
            options={[
              { label: '发起审批时知会', value: 0 },
              { label: '审批结束后知会', value: 1 },
            ]}
            defaultValue={noticeType}
            onChange={changeNoticeType}
          ></Radio.Group>
        </div>
      )}
      {/* 审批人选择弹窗 */}
      {showApprovalModal && (
        <SelectMemberOrg
          param={{
            visible: showApprovalModal,
            allowTeamId: [teamId],
            selectList: approvalUsers,
            showPrefix: {
              //是否显示成员的部门岗位前缀
              dept: false, //部门
              role: false, //岗位
              company: false, //企业前缀
            },
            onSure: (datas: any) => {
              selectApprovalUsersChange(datas)
            },
          }}
          action={{
            setModalShow: setShowApprovalModal,
          }}
        />
      )}
      {/* 知会人选择弹窗 */}
      {showNoticeModal && (
        <SelectMemberOrg
          param={{
            visible: showNoticeModal,
            allowTeamId: [teamId],
            selectList: noticeUsers,
            disableList: noticeUsers,
            showPrefix: {
              //是否显示成员的部门岗位前缀
              dept: false, //部门
              role: false, //岗位
              company: false, //企业前缀
            },
            onSure: (datas: any) => {
              selectNoticeUserChange(datas)
            },
          }}
          action={{
            setModalShow: setShowNoticeModal,
          }}
        />
      )}
    </div>
  )
}

// 重新发起，如果有冲销且没有手动修改冲销，则添加后台返回冲销给当前行的控件
export const getDefaultId = (_row: any, arr: any) => {
  const { outBackData } = $store.getState()
  let _isType = false
  let _isApprovalId = ''
  arr.map((item: any) => {
    const rowNum = item.coord ? item.coord.split(',')[0] : 0
    if (rowNum == _row && outBackData[item.uuId]) {
      _isType = true
      _isApprovalId = outBackData[item.uuId]
      return false
    }
  })
  return {
    isType: _isType,
    isApprovalId: _isApprovalId,
  }
}

//检查表单必填值是否为空
export const checkModelsInfo = () => {
  let bool = true
  //清除所有高亮
  $('.hight').removeClass('hight')
  //遍历检查
  $('.plugElementRow').each((index, item) => {
    const type = $(item).attr('data-type')
    //是否必填
    const isAuth = $(item).hasClass('hasRequire') && $(item).attr('data-isauth') === 'true'
    const isEdit = $(item).attr('data-isedit')

    if (
      type === 'select' &&
      isAuth &&
      !$(item)
        .find('.ant-select-selection-item')
        .attr('title')
    ) {
      message.error('请完善下拉框')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      (type === 'time' || type === 'dateRange') &&
      isAuth &&
      $(item)
        .find('input')
        .val() === ''
    ) {
      message.error(type === 'time' ? '请完善时间' : '请完善日期区间')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      (type === 'input' || type === 'numval' || type === 'auth_input' || type === 'dataRange_input') &&
      isAuth &&
      $(item)
        .find('input')
        .val() === ''
    ) {
      const showTxt = type === 'numval' ? '请完善数值控件' : '请完善单行输入'
      message.error(showTxt)
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      type === 'attachment' &&
      isAuth &&
      // $(item)
      //   .find('.ant-upload-list')
      //   .html() === ''
      $(item)
        .find('.newFileWrap')
        .html() === ''
    ) {
      message.error('请完善附件上传')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      type === 'textarea' &&
      isAuth &&
      isEdit &&
      $(item)
        .find('textarea')
        .html() === ''
    ) {
      message.error('请完善多行输入')
      bool = false
      $(item).addClass('hight')
      return false
    }
    //单选框 auth_radio：授权失效radio
    else if (
      (type === 'radio' || type === 'auth_radio' || type === 'dataRange_radio') &&
      isAuth &&
      $(item).find('.ant-radio-checked').length === 0
    ) {
      message.error('请完善单选框')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      (type === 'checkbox' || type === 'peoSel' || type == 'deptSel' || type === 'roleSel') &&
      isAuth &&
      $(item).find('.ant-tag').length === 0
    ) {
      let showtxt = '多选框'
      switch (type) {
        case 'peoSel':
          showtxt = '人员选择'
          break
        case 'deptSel':
          showtxt = '部门选择'
          break
        case 'roleSel':
          showtxt = '岗位选择'
          break
        default:
          break
      }
      message.error('请完善' + showtxt)
      bool = false
      $(item).addClass('hight')
      return false
    }
  })
  return {
    bool: bool,
  }
}

//检查表单必填值是否为空(针对在流程图点击操作按钮的情况，特殊处理)
export const checkModelsInfoBy = () => {
  let bool = true
  //清除所有高亮
  $('.hight').removeClass('hight')
  //遍历检查
  $('.plugElementRow').each((index, item) => {
    const type = $(item).attr('data-type')
    //是否必填
    const isAuth = $(item).hasClass('hasRequire') && $(item).attr('data-isauth') === 'true'
    const isEdit = $(item).attr('data-isedit')
    if (
      type === 'select' &&
      isAuth &&
      !$(item)
        .find('.ant-select-selection-item')
        .attr('title')
    ) {
      // message.error('请完善下拉框')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      (type === 'time' || type === 'dateRange') &&
      isAuth &&
      $(item)
        .find('input')
        .val() === ''
    ) {
      // message.error(type === 'time' ? '请完善时间' : '请完善日期区间')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      (type === 'input' || type === 'numval' || type === 'auth_input' || type === 'dataRange_input') &&
      isAuth &&
      $(item)
        .find('input')
        .val() === ''
    ) {
      const showTxt = type === 'numval' ? '请完善数值控件' : '请完善单行输入'
      // message.error(showTxt)
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      type === 'attachment' &&
      isAuth &&
      $(item)
        .find('.ant-upload-list')
        .html() === ''
    ) {
      // message.error('请完善附件上传')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      type === 'textarea' &&
      isAuth &&
      isEdit &&
      $(item)
        .find('textarea')
        .html() === ''
    ) {
      // message.error('请完善多行输入')
      bool = false
      $(item).addClass('hight')
      return false
    }
    //单选框 auth_radio：授权失效radio
    else if (
      (type === 'radio' || type === 'auth_radio' || type === 'dataRange_radio') &&
      isAuth &&
      $(item).find('.ant-radio-checked').length === 0
    ) {
      // message.error('请完善单选框')
      bool = false
      $(item).addClass('hight')
      return false
    } else if (
      (type === 'checkbox' || type === 'peoSel' || type == 'deptSel' || type === 'roleSel') &&
      isAuth &&
      $(item).find('.ant-tag').length === 0
    ) {
      let showtxt = '多选框'
      switch (type) {
        case 'peoSel':
          showtxt = '人员选择'
          break
        case 'deptSel':
          showtxt = '部门选择'
          break
        case 'roleSel':
          showtxt = '岗位选择'
          break
        default:
          break
      }
      // message.error('请完善' + showtxt)
      bool = false
      $(item).addClass('hight')
      return false
    }
  })
  return {
    bool: bool,
  }
}

/**
 * 计算标题宽度自适应 特殊字符处理 '\./+~!@#$%^&*(_=<>`，
 * @param {*} str
 */
const calculationWidth = (str: any) => {
  if (str) {
    let w = 0
    const num = str.match(/\d/g) //数字
    const ler = str.match(/[a-z]/gi) //字母
    const cna = str.match(/[^ -~]/g) //中文
    if (num !== null) w += num.length * 14.2
    if (ler !== null) w += ler.length * 13
    if (cna !== null) w += cna.length * 24
    w += _countStrWidth(str.match(/\:|;/g) || [], 7.5)
    w += _countStrWidth(str.match(/\.|!|`|'|\|/g) || [], 9)
    w += _countStrWidth(str.match(/\(|\)/g) || [], 10.5)
    w += _countStrWidth(str.match(/\*|_|\/|\\|\?/g) || [], 12)
    w += _countStrWidth(str.match(/\"/g) || [], 13.5)
    w += _countStrWidth(str.match(/\$|#|,|，|-/g) || [], 15)
    w += _countStrWidth(str.match(/\+|~|=|<|\[|\]|>|\^/g) || [], 18)
    w += _countStrWidth(str.match(/\@/g) || [], 21)
    w += _countStrWidth(str.match(/\%/g) || [], 22.5)
    w += _countStrWidth(str.match(/\@/g) || [], 24)
    w += _countStrWidth(str.match(/ /g) || [], 7)
    return w + 16
  }
  return 20
}
/**
 * 根据字符长度计算宽度
 */
const _countStrWidth = (arr: string | any[], len: number) => {
  let strWdith = 0
  if (arr.length !== 0) {
    for (let i = arr.length; i--; ) {
      strWdith += len
    }
  }
  return strWdith
}
