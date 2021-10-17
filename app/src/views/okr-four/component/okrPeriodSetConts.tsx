import React, { useEffect, useRef, useState } from 'react'
import NoneData from '@/src/components/none-data/none-data'
import './okrBasicSet.less'
import { message, Pagination, Switch, Table } from 'antd'
import ReminderModal from '@/src/components/reminderModal/reminderModal'
import { delOkrPeriodApi, findPeriodSetListApi, saveOkrEnableApi, signOkrPeriodApi } from './okrPeriodSetApi'
import { setEnableOkrInfo } from './OkrSetting'

/**
 * 周期管理设置列表单行数据
 */
interface PeriodListRow {
  id: any
  name: string
  status: number
  isSet: number
  count: number
}

/**
 * okr周期基础设置
 * parentSetState:设置父组件state
 */
export const OkrPeriodBasicSet = ({
  teamId,
  parentSetState,
  okrEnable,
}: {
  teamId: any
  parentSetState: any
  okrEnable: boolean
}) => {
  const [state, setState] = useState<any>({
    // 是否开启
    okrEnable: false,
    // 周期管理标签下显示
  })

  useEffect(() => {
    setState({ ...state, okrEnable })
  }, [okrEnable])
  /**
   * 启用okr组件
   */
  const OpenOKrCom = () => {
    return (
      <div>
        <span style={{ marginRight: '12px' }}>启用OKR</span>
        <Switch checked={state.okrEnable} onChange={switchChange} />
      </div>
    )
  }
  /**
   * 切换开启状态
   * @param change 是否开启
   */
  const switchChange = (change: boolean) => {
    saveOkrEnableApi({ teamId }).then((res: any) => {
      if (res) {
        setEnableOkrInfo({ from: 'enableOpt' })
        setState({ ...state, okrEnable: change })
        const ptState: any = { okrEnable: change }
        // 开启后跳转到周期管理设置
        if (change) {
          ptState.tabKey = '1'
          ptState.periodMgType = 1
        } else {
          setEnableOkrInfo({ from: '' })
          message.success('已关闭')
        }
        // 父级state设置
        parentSetState(ptState)
      }
    })
  }

  return (
    <NoneData
      className=""
      imgSrc={$tools.asAssetsPath(`/images/noData/no_task.png`)}
      showTxt={<OpenOKrCom />}
    />
  )
}

/**
 * 周期管理表格
 * parentSetState:设置父组件state
 */
let periodManageTmp: any = {
  // 头部信息
  headerInfo: {},
  columns: [],
  contentList: [],
  // 分页
  pageNo: 0,
  pageSize: 5,
  totalNums: 0,
  swichChecked: false,
}
export const PeriodManage = ({ parentSetState, teamId }: any) => {
  /**
   * 初始化表格列
   */
  const columnsInit = [
    {
      title: '周期',
      dataIndex: 'periodCol',
      key: 'periodCol',
      width: '45%',
      render: (value: any, row: any, index: number) => {
        return renderContent({
          value,
          row,
          index,
          colName: 'periodCol',
        })
      },
    },
    {
      title: '状态',
      dataIndex: 'stateCol',
      key: 'stateCol',
      render: (value: any, row: any, index: number) => {
        return renderContent({
          value,
          row,
          index,
          colName: 'stateCol',
        })
      },
    },
    {
      title: '操作',
      dataIndex: 'operateCol',
      key: 'operateCol',
      width: '30%',
      render: (value: any, row: any, index: number) => {
        return renderContent({
          value,
          row,
          index,
          colName: 'operateCol',
          removeRemind,
          signPeriodSave,
        })
      },
    },
  ]
  const [state, setManageState] = useState<any>({ ...periodManageTmp })

  // 移除二次提醒弹框
  const reminderRef = useRef<any>({})
  // 初始化监听
  useEffect(() => {
    periodManageTmp.columns = columnsInit
    findPeriodSetList()
    return () => {
      periodManageTmp = {
        // 头部信息
        headerInfo: {},
        columns: [],
        contentList: [],
        // 分页
        pageNo: 0,
        pageSize: 5,
        totalNums: 0,
        swichChecked: false,
      }
    }
  }, [])
  /**
   * state设置
   * @param paramObj
   */
  const setState = (paramObj: any) => {
    periodManageTmp = { ...periodManageTmp, ...paramObj }
    setManageState({ ...state, ...paramObj })
  }
  /**
   * 查询列表数据
   */
  const findPeriodSetList = (paramObj?: any) => {
    const infoObj = paramObj ? paramObj : {}
    const pageNo = infoObj.pageNo !== undefined ? infoObj.pageNo : periodManageTmp.pageNo
    const pageSize = infoObj.pageSize !== undefined ? infoObj.pageSize : periodManageTmp.pageSize
    findPeriodSetListApi({ teamId, pageNo, pageSize }).then((res: any) => {
      if (res) {
        const secondData = res.data.second || {}
        const paramState: any = {
          ...periodManageTmp,
          headerInfo: res.data.first || {},
          totalNums: secondData.totalElements || 0,
          contentList: secondData.content || [],
        }
        if (infoObj.pageNo !== undefined) {
          paramState.pageNo = infoObj.pageNo
        }
        if (infoObj.pageSize !== undefined) {
          paramState.pageSize = infoObj.pageSize
        }
        setState(paramState)
      }
    })
  }
  /**
   * 移除周期确认
   */
  const removeRemindSave = ({ id }: PeriodListRow) => {
    delOkrPeriodApi({ id }).then((res: any) => {
      const delParam: any = {}
      // 当前删除了最后一条数据则返回到第一页
      if (periodManageTmp.contentList.length == 1) {
        delParam.pageNo = 0
      }
      if (res) {
        findPeriodSetList(delParam)
      }
    })
  }

  /**
   * 移除周期提示
   */
  const removeRemind = (row: PeriodListRow) => {
    reminderRef.current &&
      reminderRef.current.setState({
        visible: true,
        content: `该周期下有${row.count || 0}条OKR数据，移除该周期后此部门数据将一并删除，确认移除？`,
        className: 'removePeriodModal',
        onSure: () => {
          removeRemindSave(row)
        },
      })
  }
  /**
   * 标记周期失效
   */
  const signPeriodSave = ({ id }: PeriodListRow) => {
    signOkrPeriodApi({ id }).then((res: any) => {
      if (res) {
        findPeriodSetList()
      }
    })
  }

  /**
   * 头部信息展示
   */
  const getHeaderInfo = ({ periodType, periodText, advanceType, advanceNum, enableYearOkr }: any) => {
    let showTxt: any = ''
    // 周期长度
    let periodLen = ''
    // 新周期提前可见长度
    let advanceTypeTxt = ''
    // 周期长度
    switch (periodType) {
      case 1:
        periodLen = '1个月'
        break
      case 2:
        periodLen = '2个月'
        break
      case 3:
        periodLen = '季度'
        break
      case 4:
        periodLen = '4个月'
        break
      case 5:
        periodLen = '半年'
        break
      default:
        break
    }
    // 新周期提前可见长度
    switch (advanceType) {
      case 1:
        advanceTypeTxt = '天'
        break
      case 2:
        advanceTypeTxt = '月'
        break
      default:
        break
    }
    showTxt = `周期长度：${periodLen}`
    // 首个生效周期
    if (periodText) {
      showTxt = `${showTxt} | 首个生效周期：${periodText}`
    }
    showTxt = `${showTxt} | 新周期提前${advanceNum || ''}${advanceTypeTxt}可见`
    if (enableYearOkr) {
      showTxt += ` | 年度周期开启`
    }

    return showTxt
  }
  return (
    <section className="okrPeriodBasicSetSec h100 flex column">
      <>
        <header className="basicSetHeader flex between center-v">
          <div className="header_cont">{getHeaderInfo(state.headerInfo)}</div>
          <span
            className="set_period_btn"
            onClick={() => {
              parentSetState({ periodMgType: 1 })
            }}
          >
            设置周期规则
          </span>
        </header>
        <div className="tableBox flex-1">
          <Table
            scroll={{ y: 'calc(100% - 32px)' }}
            className="okrPeriodBasicSetTable h100"
            columns={state.columns}
            dataSource={state.contentList}
            locale={{ emptyText: <NoneData /> }}
            pagination={false}
          />
        </div>
        {/* 底部分页 */}
        <footer className="basicSetFooter">
          {state.totalNums ? (
            <Pagination
              className="basicSetPager"
              showQuickJumper
              // hideOnSinglePage
              current={state.pageNo + 1}
              defaultPageSize={state.pageSize}
              pageSizeOptions={['5', '10', '20', '30', '50', '100']}
              showSizeChanger={true}
              total={state.totalNums}
              onChange={(page, pageSize) => {
                let newPageNo = page - 1
                if (pageSize != state.pageSize) {
                  newPageNo = 0
                }
                findPeriodSetList({ pageNo: newPageNo, pageSize: pageSize || 5 })
              }}
              // onShowSizeChange={(current: number, size: number) => {
              //   findPeriodSetList({ pageNo: 0, pageSize: pageSize || 5 })
              // }}
            />
          ) : (
            ''
          )}
        </footer>
      </>
      {/* 移除提示 */}
      <ReminderModal ref={reminderRef} />
    </section>
  )
}

// 处理单元格合并
const renderContent = ({
  row,
  colName,
  removeRemind,
  signPeriodSave,
}: {
  value: any
  row: any
  colName: string
  index?: number
  removeRemind?: any
  signPeriodSave?: any
}) => {
  // 移除按钮权限
  let removeAuth = true
  // 标记按钮权限
  let signAuth = true
  let tdHtm: any = ''
  const obj: any = {
    children: '',
    props: {},
  }
  // 操作按钮状态
  /**
   * isSet:-1都无法操作 0都可操作 1只能操作失效
   */
  if (row.isSet != 0) {
    removeAuth = false
    if (row.isSet == -1) {
      signAuth = false
    }
  }

  switch (colName) {
    // 周期
    case 'periodCol':
      tdHtm = (
        <div key={row.id + '_0'} className="cellCont">
          {row.name}
        </div>
      )
      break
    // 状态
    case 'stateCol':
      tdHtm = (
        <div key={row.id + '_1'} className="cellCont">
          {row.status == 1 ? '未生效' : '已生效'}
        </div>
      )
      break
    case 'operateCol':
      tdHtm = (
        <div key={row.id + '_2'} className="cellCont operateBtns">
          <span
            className={`operateBtn remove_btn ${removeAuth ? '' : 'disabledGray'}`}
            onClick={() => {
              removeRemind(row)
            }}
          >
            移除
          </span>
          <span
            className={`operateBtn invalid_btn ${signAuth ? '' : 'disabledGray'}`}
            onClick={() => {
              signPeriodSave(row)
            }}
          >
            {row.status == 1 ? '标记为生效' : '标记为失效'}
          </span>
        </div>
      )
      break
    default:
      tdHtm = <div key={row.id + ''} className="cellCont"></div>
      break
  }
  obj.children = tdHtm
  return obj
}
