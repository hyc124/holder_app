import React, { useState, useEffect } from 'react'
import Modal from 'antd/lib/modal/Modal'
import { getMindMapEmpty } from '../../work-plan-mind/getData'
import { Table, Progress, Avatar, Spin, Tag, DatePicker } from 'antd'
// import '../fourQuadrant.less'
import $c from 'classnames'
// import '../../work-plan-mind/work-plan-mind.less'
import moment from 'moment'
export const ProgressColors = [
  ['#4285f4', '#e9f2ff'],
  ['#34a853', '#cdead5'],
  ['#fbbc05', '#fcecc5'],
  ['#ea4335', '#fad1ce'],
]
interface DataItemProps {
  key: number
  taskName: globalInterface.WorkPlanTaskProps
  liableUser: { name: string; profile: string; type: number }
  progress: { percent: number; type: number; taskStatus: number; status: number; editProcess: boolean }
  subTaskCount: number
  typeId: number
  handleBtn: globalInterface.WorkPlanTaskProps
  children: Array<DataItemProps>
}

//支撑时间处理
const addiconContent = (nodeData: any) => {
  const day = nodeData.day
  const nodeText = nodeData.nodeText || ''
  let days = ''
  if (nodeData.type == 2 || nodeData.type == 3) {
    days = ' 剩余'
  } else {
    if (nodeData.status == 4 || nodeData.status == 3) {
      //派发显示剩余 未派发显示共
      days = ' 剩余'
    } else {
      days = ' 共'
    }
  }
  let colorControl = false
  if (nodeData.type == 2 || nodeData.type == 3 || nodeData.status != 1) {
    colorControl = true
  }
  return (
    <div className="taskTagListBox">
      <span className={`okr_affiliation ${colorControl ? 'getblue' : ''}`} style={{ display: 'inline-block' }}>
        <i className="nodeaffiliation"></i>
        {nodeText || '?'}
      </span>
      <span style={{ display: 'inline-block', minWidth: '150px' }} className="task_day">
        <DatePicker
          className="okr_startTime okr_four_time"
          style={{ width: nodeData.startTime ? '35px' : '10px' }}
          bordered={false}
          showNow={false}
          value={nodeData.startTime ? moment(new Date(nodeData.startTime), 'MM/DD') : undefined}
          format="MM/DD HH:mm"
          placeholder="?"
          allowClear={false}
          disabled={true}
          inputReadOnly={true}
        />
        <span>~</span>
        <DatePicker
          className="okr_endTime okr_four_time"
          bordered={false}
          showNow={false}
          value={moment(new Date(nodeData.endTime), 'MM/DD')}
          format="MM/DD HH:mm"
          placeholder="?"
          allowClear={false}
          showToday={false}
          inputReadOnly={true}
          disabled={true}
        />
        <span>
          {days}
          <span className="task_days getblue">{day}</span> <span>天</span>
        </span>
      </span>
    </div>
  )
}
const AddHandModel = (props: any) => {
  const { nowUserId, loginToken } = $store.getState()
  //列表数据
  const [tableData, setTableData] = useState<DataItemProps[]>([]) //用来存储编辑后的数据
  //选择规划行数据
  const [selectedRows, setSelectedRows] = useState<any>(null)
  //加载
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([])
  useEffect(() => {
    //初始化
    information()
    if (props.param.visible == true) {
      movePlanList('init', null)
    }
  }, [props.param.visible])

  //初始化
  const information = () => {
    setTableData([])
  }

  //查询移动规划列表
  const movePlanList = (type: string, datas: any) => {
    setLoading(true)
    const param = {
      operateUser: nowUserId,
      mainId: props.param.mainId,
      id: props.param.id,
      level: '',
      hasOther: '1',
      typeId: props.param.typeId,
      hasSelf: 1,
      taskType: props.param.type,
    }
    $api
      .request('/task/work/plan/queryTree', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const redData = resData.data
        if (redData.children.length > 0) {
          redData.children = []
          redData.hasChild = 1
        }
        const contentData = [redData]
        const newTableData: any = []
        contentData.map((item: globalInterface.WorkPlanTaskProps, index: number) => {
          newTableData.push({
            key: item.id,
            mainId: props.param.mainId,
            taskName: { ...item },
            liableUser: { name: item.liableUsername, profile: item.liableUserProfile, type: item.type },
            progress: {
              percent: item.process,
              type: item.type,
              taskStatus: item.taskStatus,
              status: item.status,
              editProcess: false,
            },
            subTaskCount: item.hasChild,
            handleBtn: { ...item },
            typeId: item.typeId,
            children: item.children || [],
          })
          if (item.id == props.param.nowId) {
            setSelectedRowKeys([item.id])
          }
        })
        setTableData(newTableData)
        setLoading(false)
      })
  }
  //展开行
  const expandedRow = (expanded: any, record: any) => {
    if (record.children && record.children.length > 0) {
      return
    }
    const nowTaskId = record.taskName.id
    const param = {
      operateUser: nowUserId,
      mainId: record.mainId,
      id: nowTaskId,
      level: '',
      hasOther: '1',
      typeId: record.typeId,
      hasSelf: 1,
      taskType: props.param.type,
    }
    $api
      .request('/task/work/plan/queryTree', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        const childTaskData = resData.data.children
        const childDataItemArr: Array<DataItemProps> = childTaskData.map(
          (item: globalInterface.WorkPlanTaskProps, index: number) => {
            if (item.id == props.param.nowId) {
              setSelectedRowKeys([item.id])
            }
            return {
              key: item.id,
              mainId: record.mainId,
              taskName: { ...item },
              liableUser: { name: item.liableUsername, profile: item.liableUserProfile, type: item.type },
              progress: {
                percent: item.process,
                type: item.type,
                taskStatus: item.taskStatus,
                status: item.status,
                editProcess: false,
              },
              subTaskCount: item.hasChild,
              KRprogress: false,
              typeId: item.typeId,
              handleBtn: { ...item },
              children: item.children || [],
            }
          }
        )
        //动态添加任务子任务
        const newTable = tableData.concat([])
        updateTaskData(newTable, nowTaskId, childDataItemArr)
        setTableData(newTable)
      })
  }
  //递归插入任务列表子元素
  const updateTaskData = (tableData: any, parentId: number, childData: Array<DataItemProps>) => {
    tableData.find((item: DataItemProps) => {
      if (item.taskName.id === parentId) {
        item.children = childData
        return tableData
      }
      if (item.children && item.children.length > 0) {
        updateTaskData(item.children, parentId, childData)
      }
    })
  }
  /**
   * 根据不同状态返回任务列表标签
   */
  const setTagByStatus = (item: globalInterface.WorkPlanTaskProps) => {
    return (
      <div className="tag-list">
        {item.property === 1 && (
          <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
            密
          </Tag>
        )}
        {item.taskStatus === 3 && (
          <Tag color={'#FAD1CE'} style={{ color: '#EA4335' }}>
            延
          </Tag>
        )}
        {(item.status === 2 || item.approvalStatus !== 0) && (
          <Tag color={'#FCECC5'} style={{ color: '#FBBC05' }}>
            审
          </Tag>
        )}
        {item.taskFlag === 1 && <Tag color={'#CDCDCD'}>冻</Tag>}
        {item.taskFlag === 3 && <Tag color={'#CDCDCD'}>归档</Tag>}
        {item.cycleNum === 0 && <Tag color={'#4285f4'}>循</Tag>}
        {item.cycleNum > 0 && (
          <Tag color={'#4285f4'} style={{ width: '22px' }}>
            循{item.cycleNum}
          </Tag>
        )}
      </div>
    )
  }
  const columns = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (record: globalInterface.WorkPlanTaskProps, data: DataItemProps) => {
        let colorControl = false
        if (record.type == 2 || record.type == 3 || record.status != 1) {
          colorControl = true
        }
        let okrFlag = null
        if (record.type == 2 || record.type == 3) {
          const okrTxt = record.type == 2 ? 'O' : 'KR'
          const okrClass = record.type == 2 ? 'okr_o' : 'okr_kr'
          okrFlag = <div className={`okr_flag ${okrClass}`}>{okrTxt}</div>
        }
        const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
        return (
          <div className="flex center-v text-ellipsis">
            {okrFlag}
            <div className="node_portrait_main" style={{ width: '40px' }}>
              <Avatar
                size={34}
                src={record.liableUsername ? record.liableUserProfile || '' : headDef}
                style={{
                  backgroundColor: colorControl ? '#4285f4' : '#777777',
                  fontSize: '11px',
                  margin: '0px 7px',
                }}
              >
                {record.liableUsername ? record.liableUsername.substr(-2, 2) : ''}
              </Avatar>
            </div>
            <div className="task-list-content flex column center-h">
              <div className={$c('task-list-item', { finishedTask: record.status === 2 })}>
                <span className="task-title text-ellipsis">{record.name}</span>
                {record.type == 3 && (
                  <div className="eidt_Kr">
                    <span className="confidence">{record.cci}/10</span>
                  </div>
                )}
                {(record.type == 4 || record.type == 41) && record.taskFlag != 0 && (
                  <span className="specail-show specail-show-coor"></span>
                )}
                {(record.type == 4 || record.type == 41) && record.taskFlag == 0 && (
                  <span className="specail-show specail-show-isdialogue"></span>
                )}
                {record.type != 3 && setTagByStatus(record)}
              </div>
              <div className="tagList-content">{addiconContent(record)}</div>
            </div>
          </div>
        )
      },
    },

    {
      title: '任务进度',
      dataIndex: 'progress',
      width: '36px',
      key: 'progress',
      render: (progress: any, data: DataItemProps) => {
        //是否显示进度条
        if ((progress.type != 3 && progress.status === 1) || !data.taskName.id) {
          return <div style={{ width: 36, textAlign: 'center' }}></div>
        } else {
          const colorIndex = 0
          //进度条的色彩
          const strokeColor = ProgressColors[colorIndex][0]
          //未完成的分段的颜色
          const trailColor = ProgressColors[colorIndex][1]
          return (
            <div
              style={{ width: 32, textAlign: 'center' }}
              className={`row_progress ${progress.editProcess ? 'active' : ''}`}
            >
              <Progress
                strokeColor={strokeColor}
                trailColor={trailColor}
                type={'circle'}
                percent={progress.percent}
                width={32}
                strokeWidth={12}
              ></Progress>
            </div>
          )
        }
      },
    },
  ]

  //设置行名称
  const setRowClassName = (record: any) => {
    if (record.subTaskCount === 0) {
      return 'noExpandable'
    } else {
      return ''
    }
  }

  //点击选择移动规划行存储数据
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      setSelectedRows(selectedRows[0].taskName)
      setSelectedRowKeys(selectedRowKeys)
    },
  }
  const handleOk = () => {
    props.action.setModalShow(false)
    if (selectedRows) {
      props.action.onSure(selectedRows)
    }
  }

  const handleCancel = () => {
    props.action.setModalShow(false)
  }

  return (
    <Modal
      title={$intl.get('supportTitle')}
      className="standContentBox"
      visible={props.param.visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={$intl.get('sure')}
      cancelText={$intl.get('cancel')}
    >
      <Spin spinning={loading} tip={$intl.get('loadingWait')}>
        <div className="quadrantBordData">
          <Table
            columns={columns}
            dataSource={tableData}
            showHeader={false}
            onExpand={expandedRow}
            rowClassName={setRowClassName}
            pagination={false}
            rowSelection={{ ...rowSelection, type: 'radio' }}
          />
        </div>
      </Spin>
    </Modal>
  )
}

export default AddHandModel
