import React, { useState, useEffect } from 'react'
import { Select, Input, Collapse, Spin, message } from 'antd'
import $c from 'classnames'
const { Panel } = Collapse

import './sendApproval.less'
import * as Maths from '@/src/common/js/math'
import NoneData from '@/src/components/none-data/none-data'
import { getProcessData } from '../../approval-execute/ApprovalExecute'
import { addCustomApprovalGetConfig } from '../../workdesk/getData'

interface ApprovalListModelProps {
  id: number
  eventName: string
  eventKey: string
  eventType: number
  processId: string
  processKey: string
  createUserAccount: string
  groupId: number
  resourceId: string
  logo: string
  defaultForm: number
}

interface ApprovalListProps {
  groupId: number
  groupName: string
  approvalEventModels: ApprovalListModelProps[]
}

/**
 * 发起审批界面
 */
const SendApproval = ({ selectKey }: { selectKey: string }) => {
  const { orgInfo } = $store.getState()
  const [selectOrg, setSelectOrg] = useState(orgInfo[0])
  const { nowUserId, loginToken } = $store.getState()
  //审批表单列表
  const [approvalList, setApprovalList] = useState<Array<ApprovalListProps>>([])
  //默认展开所有
  const [expandListKeys, setExpandListKeys] = useState<Array<number>>()
  const [formKeyword, setFormKeyWord] = useState('')
  //loading
  const [loading, setLoading] = useState(false)
  const [freshPg, setFreshPage] = useState('')

  //切换企业
  const changeSelectOrg = (_value: string, options: any) => {
    if (options.key) {
      const newSelectOrg = orgInfo.filter(item => item.id === parseInt(options.key))[0]
      setSelectOrg(newSelectOrg)
    }
  }
  let isUnmounted = false
  //初始化操作
  useEffect(() => {
    if (!isUnmounted) {
      setLoading(true)
      queryApprovalList().then(dataList => {
        setApprovalList(dataList.filter(item => item.approvalEventModels.length !== 0))
        setExpandListKeys(
          dataList.map(item => {
            return item.groupId
          })
        )
        setLoading(false)
      })
    }
    return () => {
      isUnmounted = true
    }
  }, [selectOrg, formKeyword, selectKey, freshPg])

  //查询表单列表
  const queryApprovalList = () => {
    return new Promise<ApprovalListProps[]>(resolve => {
      const param = {
        ascriptionId: selectOrg.id,
        ascriptionType: 2,
        orgId: selectOrg.id,
        userId: nowUserId,
        isPhone: 0,
        keywords: formKeyword,
      }
      $api
        .request('/approval/approval/event/phoneQueryGroup', param, {
          headers: { loginToken: loginToken },
          formData: true,
        })
        .then(resData => {
          resolve(resData.dataList)
        })
        .catch(() => {
          setLoading(false)
          message.error('查询列表失败')
        })
    })
  }

  //搜索表单
  const changeKeyWords = (value: string) => {
    setFormKeyWord(value)
  }

  //展开收起表单
  const changeExpandKey = (props: any) => {
    setExpandListKeys(props)
  }

  const freshPage = () => {
    setFreshPage(Maths.uuid())
  }

  return (
    <div className="send-approval-content sendContainer flex column">
      <div className="send-approval-header flex end">
        <Select className="select-org" value={selectOrg.shortName || ''} onSelect={changeSelectOrg}>
          {orgInfo.map(item => {
            if (item.shortName) {
              return (
                <Select.Option key={item.id} value={item.id}>
                  {item.shortName}
                </Select.Option>
              )
            }
          })}
        </Select>
        <Input.Search className="search-form" placeholder="请输入表单名称" onSearch={changeKeyWords} />
      </div>
      <Spin spinning={loading} wrapperClassName="send-approval-list flex-1">
        {expandListKeys && approvalList.length !== 0 && (
          <Collapse activeKey={expandListKeys} expandIcon={expandList} onChange={changeExpandKey}>
            {approvalList.map((item: ApprovalListProps) => (
              <Panel header={<span className="header-title">{item.groupName}</span>} key={item.groupId}>
                {item.approvalEventModels.map(val => (
                  <RenderApprovalItem
                    key={val.id}
                    item={val}
                    teamId={selectOrg.id}
                    teamName={selectOrg.name}
                    freshPage={freshPage}
                  />
                ))}
              </Panel>
            ))}
          </Collapse>
        )}
        {approvalList.length === 0 && <NoneData />}
      </Spin>
    </div>
  )
}

//审批表单展开
const expandList = (panelProps: any) => {
  return (
    <div className="approval_title_expand">
      <div className="show_title_name"></div>
      <div className="expand_icon">
        {panelProps.isActive ? '收起' : '展开'}
        <em className={$c({ closeDiscussList: panelProps.isActive })}></em>
      </div>
    </div>
  )
}

//渲染表单item
const RenderApprovalItem = ({
  item,
  teamId,
  teamName,
  freshPage,
}: {
  item: ApprovalListModelProps
  teamId: number
  teamName: string
  freshPage: any
}) => {
  const [loading, setLoading] = useState(false)
  const { nowUserId } = $store.getState()
  //点击发起审批
  const openApprovalExecute = (eventId: number, approvalName: string) => {
    // $store.dispatch({
    //   type: 'SET_SEND_APPROVAL_INFO',
    //   data: {
    //     eventId: eventId,
    //     teamId: teamId,
    //     teamName,
    //     approvalName: approvalName,
    //     isEdit: false,
    //     uuid: Maths.uuid(),
    //     isNextForm: false,
    //     isNextFormDatas: null,
    //     findByEventIdData: '',
    //   },
    // })
    $store.dispatch({ type: 'SET_FORMULA_NUMVAL_OBJ', data: '' })
    $store.dispatch({ type: 'SET_SELECT_APPROVAL_TAB', data: 'triggerApproval' })
    $store.dispatch({ type: 'IS_APPROVAL_SEND', data: true })
    $store.dispatch({
      type: 'SAVE_EVENT_FORM_RELATION_SET',
      data: { elementRelationDataList: [] },
    })
    getProcessData(eventId)
      .then((res: any) => {
        if (res.returnCode === 0) {
          if (res.data == null) {
            addCustomApprovalGetConfig({ id: eventId, userId: nowUserId })
              .then((returnData: any) => {
                const newObj = handelReturnData(returnData.data)
                $store.dispatch({ type: 'CUSTOM_PROVESS_SET', data: newObj })
              })
              .catch(returnErr => {
                message.error(returnErr.returnMessage)
              })
          }
          console.log(eventId)
          $store.dispatch({
            type: 'SET_SEND_APPROVAL_INFO',
            data: {
              eventId: eventId,
              teamId: teamId,
              teamName,
              approvalName: approvalName,
              isEdit: false,
              uuid: Maths.uuid(),
              isNextForm: false,
              isNextFormDatas: null,
              findByEventIdData: res.data,
            },
          })
          $store.dispatch({ type: 'FIND_BY_EVENT_ID_DATA', data: res.data })
          $tools.createWindow('ApprovalExecute').finally(() => {
            setLoading(false)
          })
        }
      })
      .catch(err => {
        console.log(err)
        message.error(err.returnMessage)
        setLoading(false)
        if (err.returnCode === 10097) {
          freshPage()
        }
      })
  }
  return (
    <Spin spinning={loading} wrapperClassName="approval-list-item flex center">
      <div
        style={{
          width: 212,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
        }}
        onClick={() => {
          setLoading(true)
          openApprovalExecute(item.id, item.eventName)
        }}
      >
        <img src={$tools.asAssetsPath(`/images/formIcon/${item.logo === null ? 'icon_05.png' : item.logo}`)} />
        <span className="form-name flex-1 text-ellipsis">{item.eventName}</span>
      </div>
    </Spin>
  )
}

export default SendApproval

//处理数据
export const handelReturnData = (param: any) => {
  const _obj = param || {}
  const modelList = _obj.defineUserModelList || []
  const newList = modelList.map((item: any) => {
    if (item.hasOwnProperty('curType')) {
      return item
    }
    return {
      ...item,
      curType: 0,
    }
  })
  return {
    ..._obj,
    defineUserModelList: newList,
  }
}
