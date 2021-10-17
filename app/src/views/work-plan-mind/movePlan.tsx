import React, { useState, useEffect } from 'react'
import Modal from 'antd/lib/modal/Modal'
import { getMovePlanList, movePlanSaveApi } from './getData'
import { Table, Progress, Avatar, Spin, message } from 'antd'
import InfiniteScroll from 'react-infinite-scroller'

export const ProgressColors = [
  ['#4285f4', '#e9f2ff'],
  ['#34a853', '#cdead5'],
  ['#fbbc05', '#fcecc5'],
  ['#ea4335', '#fad1ce'],
]

//任务类型
export const filterTaskType = (type: number) => {
  switch (Number(type)) {
    case 1:
      return <span className="taskTypeLabel boardXm">项目</span>
    default:
      return <span className="taskTypeLabel boardRw">任务</span>
    // case 0:
    //   return <span className="taskTypeLabel boardMb">目标</span>
    // case 1:
    //   return <span className="taskTypeLabel boardLs">临时</span>
    // case 2:
    //   return <span className="taskTypeLabel boardZn">职能</span>
    // case 3:
    //   return <span className="taskTypeLabel boardXm">项目</span>
  }
}

const MovePlan = (props: any) => {
  //列表数据
  const [dataList, setdataList] = useState({
    pageNo: 0,
    pageSize: 20,
    list: [],
  })
  //选择规划行数据
  const [selectedRows, setSelectedRows] = useState({
    toId: '',
    toTypeId: '',
    toName: '',
    mainId: '',
    toFirstId: '',
  })
  //加载
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  //滚动分页参数声明 加载loading
  const [listPageNo, setListPageNo] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  //记录上一次加载的状态
  const [movetype, setmovetype] = useState(false)
  useEffect(() => {
    //初始化
    information()
    if (props.type == true) {
      movePlanList('init', null)
    }
  }, [props.type, listPageNo])

  //初始化
  const information = () => {
    setmovetype(props.type)
    if (movetype != props.type) {
      setListPageNo(0)
      setdataList({
        pageNo: 0,
        pageSize: 20,
        list: [],
      })
      if (listPageNo === 0) {
        setHasMore(true)
      }
    }
  }

  //查询移动规划列表
  const movePlanList = (type: string, datas: any) => {
    let params = {}
    setLoading(true)
    if (type == 'expand') {
      params = {
        mainId: datas.mainId, //根节点id
        id: datas.key,
        typeId: datas.typeId,
        operateUser: $store.getState().nowUserId,
        level: '', //1查询当前层及以下所有任务
        hasOther: '1', //是否查询其他 0否 1是
      }
    } else if (type == 'init') {
      params = {
        operateUser: $store.getState().nowUserId,
        id: props.datas.findId,
        typeId: props.datas.fromCode == 5 ? props.datas.fromTypeId : undefined,
        level: -1,
        pageNo: listPageNo,
        pageSize: 20,
      }
    }
    getMovePlanList(params).then((redData: any) => {
      const contentData = redData.data.content
      setTotalPages(redData.data.totalPages)
      const newTableData: any = []
      contentData.map((item: any) => {
        let isDisaBleds = false
        if (props.datas.findId == item.id) {
          isDisaBleds = true
        }
        if (type == 'expand' && datas.isDisabled) {
          isDisaBleds = true
        }
        newTableData.push({
          key: item.id,
          mainId: item.mainId || datas.mainId,
          taskName: item.name,
          status: item.status,
          type: item.type,
          cci: item.cci,
          typeId: item.typeId,
          ascriptionId: item.ascriptionId,
          nodeText: item.nodeText,
          isParent: type == 'init' ? true : false,
          isParentId: type == 'init' ? item.id : false,
          parent: item.parentId,
          isDisabled: isDisaBleds,
          liableUser: {
            liableUserProfile: item.liableUserProfile,
            user: item.liableUser,
            liableUsername: item.liableUsername,
            createUsername: item.createUsername,
          },
          progress: {
            percent: item.process || 0,
          },
          roleId: item.roleId,
          startTime: item.startTime,
          endTime: item.endTime,
          day: item.day,
          taskType: item.taskType,
          subTaskCount: item.hasChild,
          children: item.children || [],
        })
      })
      if (type == 'init') {
        //默认
        setdataList({
          pageNo: listPageNo,
          pageSize: 20,
          list: dataList.list.concat(newTableData),
        })
      } else {
        //展开
        const newTable = dataList.list.concat([])
        updateTaskData(newTable, datas.key, datas.isParentId, newTableData)
        setdataList({
          pageNo: listPageNo,
          pageSize: 20,
          list: newTable,
        })
      }
      setLoading(false)
    })
  }

  //递归插入任务列表子元素
  const updateTaskData = (tableData: any, parentId: number, isParentId: number, childData: any) => {
    tableData.find((item: any) => {
      if (item.key === parentId) {
        item.children = childData
        childData.find((items: any) => {
          //给子元素添加父级ID
          items.isParentId = isParentId
        })
        return tableData
      }
      if (item.children && item.children.length > 0) {
        updateTaskData(item.children, parentId, isParentId, childData)
      }
    })
  }
  // 初始化列
  const columns = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (record: globalInterface.WorkPlanTaskProps, item: any) => {
        let okrFlag = null
        if (item.type == 2 || item.type == 3) {
          const okrTxt = item.type == 2 ? 'O' : 'KR'
          const okrClass = item.type == 2 ? 'okr_o' : 'okr_kr'
          okrFlag = <div className={`okr_flag ${okrClass}`}>{okrTxt}</div>
        }
        //任务类型
        let taskTypeTag = null
        if (item.type != 2 && item.type != 3) {
          if (item.parent) {
            const parentTypeslen = jQuery(`.movemindrow[data-ids=${item.parent.split('###')[1]}]`).find(
              '.taskTypeLabel'
            ).length
            if (parentTypeslen == 0) {
              taskTypeTag = filterTaskType(item.taskType || 0)
            }
          } else {
            taskTypeTag = filterTaskType(item.taskType || 0)
          }
        }
        const userName = item.liableUser.liableUsername
          ? item.liableUser.liableUsername
          : item.liableUser.createUsername
        return (
          <div data-ids={item.typeId} data-mindid={item.mainId} data-type={item.type} className="movemindrow">
            <div className={`comUserHead ${userName ? '' : 'noshow'}`}>
              <Avatar
                className="oa-avatar"
                src={item.liableUser.liableUserProfile}
                size={32}
                style={userName ? {} : { backgroundColor: 'inherit' }}
              >
                {userName && userName.substr(-2, 2)}
              </Avatar>
            </div>
            <div className="row_content flex_auto">
              <div className="plan_cont_top flex ver_center">
                {okrFlag}
                <span className="plan_name my_ellipsis">{item.taskName}</span>
                {taskTypeTag}
                <span className={`plan_cci ${item.type == 3 ? '' : 'noshow'}`}>{item.cci || 0}/10</span>
              </div>
              <div className="plan_cont_bot">
                <span className={`belong_name ${item.nodeText ? '' : 'noshow'}`}>{item.nodeText || ''}</span>
                <span className="plan_time">
                  {item.startTime || '/'} - {item.endTime || '/'}
                </span>
                <div className="remain_time">
                  剩余<span className="remain_time_num">{item.day || 0}</span>天
                </div>
              </div>
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
      render: (progress: any) => {
        //是否显示进度条
        if (progress.percent) {
          const colorIndex = 0
          //进度条的色彩
          const strokeColor = ProgressColors[colorIndex][0]
          //未完成的分段的颜色
          const trailColor = ProgressColors[colorIndex][1]
          return (
            <div style={{ width: 36, textAlign: 'center' }}>
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
        } else {
          return <div style={{ width: 36, textAlign: 'center' }}>-/-</div>
        }
      },
    },
  ]
  //展开行
  const expandedRow = (expanded: any, record: any) => {
    if (record.children && record.children.length > 0) {
      return
    }
    movePlanList('expand', record)
  }
  //设置行名称
  const setRowClassName = (record: any) => {
    if (record.subTaskCount === 0) {
      return 'noExpandable'
    } else {
      return ''
    }
  }
  //确认移动规划
  const movePlanSave = () => {
    let url = '/task/work/plan/moveNode2Out'
    let param = {}
    let mainId = props.datas.fromMainId
    if (selectedRows.toId == '') {
      props.setType(false)
      return
    }
    if (mainId == undefined) {
      mainId = ''
    }
    if (props.datas.fromCode == 1) {
      // 收到的协同点击支持按钮,使用拖动接口
      url = '/task/work/plan/appendNode'
      param = {
        fromType: 4, //当前节点类型：4协同，5待办
        fromId: props.datas.fromId,
        formName: props.datas.fromName,
        toId: selectedRows.toId,
        toName: selectedRows.toName,
        operateUser: $store.getState().nowUserId,
        toOrdinal: 1, //序号
        teamId: props.datas.teamId, //企业id
        teamName: props.datas.teamName, //企业名称
        mainId: mainId,
        id: 0, //后台默认参数
        toFirstId: selectedRows.toFirstId,
      }
    } else {
      param = {
        fromId: props.datas.fromCode == 5 ? props.datas.fromTypeId : props.datas.fromId,
        fromType: props.datas.fromCode == 5 ? 5 : undefined, //当前节点类型：4协同，5待办
        formName: props.datas.fromName,
        toId: selectedRows.toId,
        toName: selectedRows.toName,
        operateUser: $store.getState().nowUserId,
        mainId: mainId, //根节点id
        id: 0, //后台默认参数
        toOrdinal: 1,
        toFirstId: selectedRows.toFirstId,
      }
    }
    movePlanSaveApi(param, url).then((resData: any) => {
      props.setType(false)
      if (props.openMode) {
        props.openMode(param)
      }
      if (props.datas.fromCode == 1) {
        message.success('已支持')
      } else {
        message.success('移动规划成功')
      }
    })
  }
  //点击选择移动规划行存储数据
  const rowSelection = {
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      setSelectedRows({
        toId: selectedRows[0].key,
        toTypeId: selectedRows[0].typeId,
        toName: selectedRows[0].taskName,
        mainId: selectedRows[0].mainId,
        toFirstId: selectedRows[0].isParentId,
      })
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.isDisabled,
    }),
  }
  //滚动加载
  const handleInfiniteOnLoad = () => {
    setLoading(true)
    if (listPageNo + 1 >= totalPages) {
      setLoading(false)
      setHasMore(false)
      return
    }
    setListPageNo(listPageNo + 1)
  }
  const handleOk = () => {
    movePlanSave()
  }

  const handleCancel = () => {
    props.setType(false)
  }

  return (
    <Modal
      title="移动规划"
      className="movePlanModal"
      visible={props.type}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Spin spinning={loading} tip={'加载中，请耐心等待'}>
        <div className="table-list">
          <InfiniteScroll
            initialLoad={false} // 不让它进入直接加载
            pageStart={0} // 设置初始化请求的页数
            hasMore={!loading && hasMore} // 是否继续监听滚动事件 true 监听 | false 不再监听
            loadMore={handleInfiniteOnLoad} // 监听的ajax请求
            useWindow={false} // 不监听 window 滚动条
          >
            <Table
              columns={columns}
              tableLayout={'fixed'}
              dataSource={dataList.list}
              showHeader={false}
              onExpand={expandedRow}
              rowClassName={setRowClassName}
              // scroll={{ y: '550px' }}
              pagination={false}
              rowSelection={{ ...rowSelection, type: 'radio' }}
            />
          </InfiniteScroll>
        </div>
      </Spin>
    </Modal>
  )
}

export default MovePlan
