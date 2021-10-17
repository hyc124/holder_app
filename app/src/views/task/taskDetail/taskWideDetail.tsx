// 任务详情
import React, { useEffect, useState, useImperativeHandle } from 'react'
import '../taskDetail/taskdetails.less'
import './taskWideDetail.less'
import { inquireCheckApi } from './getData'
import Details from './details'
import CheckEntry, { checkListModel } from '../creatTask/checkEntry'
import { editTaskSaveApi } from './getData'
import { Tabs, message } from 'antd'
import TaskDynamic from '../taskDynamic/taskDynamic'
// 附件预览
import { FilesList } from '../fileDetail/fileDetail'
// 任务协同
import { TaskSynergy } from '../taskSynergy/taskSynergy'
const { TabPane } = Tabs

/**
 * 任务宽详情
 * @param props
 */
const TaskWideDetail = React.forwardRef((props: any, ref) => {
  const { id, refresh } = props.param
  //是否渲染检查项
  const [initcheck, setInitcheck] = useState(false)
  //添加检查项默认添加传当前时间戳
  const [time, setTime] = useState<any>()
  //检查项初始查询数据
  const [initCheckData, setInitCheckData] = useState<any>([])
  //任务详情数据
  const [taskDatas, setTaskDatas] = useState<any>({})
  //切换任务动态、过程监管、附件总览
  const [cutkey, setCutkey] = useState<any>('1')
  const { nowUserId } = $store.getState()
  //是否有任务详情编辑权限
  const [editAuth, setEditAuth] = useState(false)
  // 宽详情任务主动刷新
  const [wideRefresh, setWideRefresh] = useState<any>({
    id: '',
    refresh: 0,
  })
  /**
   * 刷新详情
   */
  useEffect(() => {
    setWideRefresh({
      ...wideRefresh,
      id,
      refresh: refresh,
    })
  }, [refresh])
  useEffect(() => {
    // console.log('wide')
    jQuery('#taskWideDetail .process_manage_wrapper').animate({ scrollLeft: 0 })
  }, [wideRefresh.id])

  // ***********************暴露给父组件的方法 start**************************//
  useImperativeHandle(ref, () => ({
    /**
     * 获取当前列表是否初始化查询
     */
    wideRefreshFn: ({ id }: { id: number | string }) => {
      setWideRefresh({
        ...wideRefresh,
        id,
        refresh: wideRefresh.refresh + 1,
      })
    },
  }))

  //查询检查项
  const inquireCheck = () => {
    const url = '/task/check/list'
    const param = {
      taskId: wideRefresh.id,
      userId: nowUserId,
    }
    inquireCheckApi(param, url).then((resData: any) => {
      if (resData.dataList) {
        setInitCheckData(resData.dataList)
        setInitcheck(true)
        setCutkey('2')
      } else {
        setInitCheckData([])
        setInitcheck(true)
        setCutkey('2')
      }
    })
  }
  //切换任务动态、过程监管、附件总览
  const callback = (key: any) => {
    if (key == '2') {
      //过程监管
      inquireCheck()
    } else {
      setCutkey(key)
    }
  }
  //更改检查项
  const editcheck = (datas: any) => {
    const param = {
      id: taskDatas.id,
      operateUser: nowUserId,
      checkList: checkListModel(datas),
    }
    console.log(param.checkList)
    const url = '/task/modify/id'
    editTaskSaveApi(param, url).then((resData: any) => {
      if (resData.returnCode == 0) {
        message.success('编辑任务成功')
        inquireCheck() //从新请求接口查询检查项
      } else {
        message.error(resData.returnMessage)
      }
    })
  }
  return (
    <div className="process_manage_content ">
      <div className="process_manage_wrapper">
        {/* 任务详情 */}
        <div className="processTaskDetailCon">
          <Details
            sourceType="taskManage_wideDetail"
            from="taskManage_wideDetail"
            param={{ id: wideRefresh.id }}
            taskdetailDatas={(datas: any) => {
              setTaskDatas({ ...datas })
            }}
            setauth={(data: any) => {
              setEditAuth(data)
            }}
            refresh={wideRefresh.refresh}
          ></Details>
        </div>
        {/* 任务动态、过程监管、附件总览 */}
        <div className="process_right_child_box h100">
          <div className="taskDynamic">
            <Tabs defaultActiveKey="1" onChange={callback}>
              <TabPane tab="任务动态" key="1">
                {/* <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> */}
                {/* 任务动态组件 */}
                {cutkey == '1' ? (
                  <TaskDynamic
                    param={{
                      taskDetail: taskDatas,
                    }}
                  />
                ) : (
                  ''
                )}
              </TabPane>
              <TabPane tab="过程监管" key="2">
                <div className="taskSupervise">
                  <p
                    className="add_supervise"
                    onClick={() => {
                      if (editAuth) {
                        setInitcheck(true)
                        setTime(Date.parse(new Date().toString()))
                      }
                    }}
                  >
                    检查项<i></i>
                  </p>
                  <div className="detailCheck">
                    {initcheck && (
                      <CheckEntry
                        times={time}
                        param={{
                          from: 'details',
                          isedit: true, //是否显示状态编辑 未完成 已完成 搁置
                          teamId: taskDatas ? taskDatas.ascriptionId : '', //企业id
                          teamName: taskDatas ? taskDatas.ascriptionName : '', //企业名称
                          taskid: taskDatas ? taskDatas.id : '',
                          initData: initCheckData || [], //初始化数据
                          cutkey: cutkey == '2' ? true : false, //切换tab刷新检查项
                          isShowcomment: true, //是否显示评论回复
                          iseditCheck: editAuth, //是否可以编辑检查项
                          isshowNoneData: true, //无数据是否显示空白页
                        }}
                        getDatas={(datas: any) => {
                          console.log(datas)
                          setTime(undefined)
                          editcheck(datas) //更改检查项
                        }}
                      ></CheckEntry>
                    )}
                  </div>
                </div>
              </TabPane>
              <TabPane tab="任务协同" key="4">
                <TaskSynergy param={{ ...taskDatas, from: 'wide_detail' }} />
              </TabPane>
              <TabPane tab="附件总览" key="3">
                {/* <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> */}
                {cutkey == '3' ? (
                  <FilesList
                    param={{
                      taskId: taskDatas ? taskDatas.id : '',
                      ascriptionId: taskDatas ? taskDatas.ascriptionId : '',
                    }}
                  />
                ) : (
                  ''
                )}
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
})

export default TaskWideDetail
