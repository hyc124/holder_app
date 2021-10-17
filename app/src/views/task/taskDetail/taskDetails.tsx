// 任务详情
import React, { useEffect, useState, useRef } from 'react'
import Modal from 'antd/lib/modal/Modal'
import '../taskDetail/taskdetails.less'
import { inquireCheckApi } from './getData'
import Details from './details'
import { TaskDetailTit } from './taskDetailTit'
import CheckEntry, { checkListModel } from '../creatTask/checkEntry'
import { editTaskSaveApi } from './getData'
import { Tabs, Empty, message } from 'antd'

import TaskDynamic from '../taskDynamic/taskDynamic'
// 附件预览
import { FilesList } from '../fileDetail/fileDetail'
// 任务协同
import { TaskSynergy } from '../taskSynergy/taskSynergy'
import NoneData from '@/src/components/none-data/none-data'
// 测试提交

const { TabPane } = Tabs

const TaskDetails = React.memo((props: any) => {
  const { param } = props
  // 列表传入的任务
  const listTaskData =
    !param.taskData || Object.keys(param.taskData).length == 0 ? { id: props.param.id } : param.taskData
  //是否渲染检查项
  const [initcheck, setInitcheck] = useState(false)
  //添加检查项默认添加传当前时间戳
  const [time, setTime] = useState<any>()
  //检查项初始查询数据
  const [initCheckData, setInitCheckData] = useState<any>([])
  //任务详情数据
  const [taskDatas, setTaskDatas] = useState<any>({})
  //切换任务动态、过程监管、附件总览
  const [cutkey, setCutkey] = useState<any>(param.defaultActiveKey ? param.defaultActiveKey : '1')
  //是否有任务详情编辑权限
  const [editAuth, setEditAuth] = useState(false)
  const { nowUserId, nowAccount, selectTeamId, loginToken } = $store.getState()
  //判断输入框是否聚焦1
  const [isfocus, setIsfocus] = useState(false)

  useEffect(() => {
    console.log(props.param.id)
    setTaskDatas({ ...taskDatas, id: props.param.id })
    param.defaultActiveKey && param.defaultActiveKey == '2' ? inquireCheck() : ''
  }, [])
  //点击关闭
  const handleCancel = () => {
    props.setvisible(false)
  }
  //查询检查项
  const inquireCheck = (id?: number) => {
    const url = '/task/check/list'
    const param = {
      taskId: id ? id : taskDatas.id,
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

  // const containerHeight: any = useRef() //获取容器高度
  // const height = containerHeight.current.clientHeight
  return (
    <Modal
      title={
        <TaskDetailTit
          param={{
            taskData: {
              ...listTaskData,
              ...taskDatas,
              isFollow: taskDatas.followUsers && taskDatas.followUsers.length > 0 ? true : false,
            },
            reminder: taskDatas ? taskDatas.reminder : '0',
            editAuth: editAuth,
            from: param.from,
            code: param.code,
          }}
          setvisible={props.setvisible}
          callbackFn={props.callbackFn}
        />
      }
      visible={props.param.visible}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
      className="taskDetails"
      footer={null}
      confirmLoading={true}
    >
      <div className="process_manage_content">
        <div className="process_manage_wrapper">
          {/* 任务详情 */}
          <div className="processTaskDetailCon">
            <Details
              param={{ id: props.param.id }}
              from={props.param.from}
              code={props.param.code}
              isaddtask={props.param.isaddtask}
              taskdetailDatas={(datas: any) => {
                console.log(datas)
                setTaskDatas(datas)
                inquireCheck(datas.id)
              }}
              setauth={(data: any) => {
                setEditAuth(data)
              }}
              callbackFn={props.callbackFn}
            ></Details>
          </div>
          {/* 任务动态、过程监管、附件总览 */}
          <div className="process_right_child_box">
            <div className="taskDynamic">
              <Tabs
                defaultActiveKey={param.defaultActiveKey ? param.defaultActiveKey : '1'}
                onChange={callback}
              >
                <TabPane tab="任务动态" key="1">
                  {/* 任务动态组件 */}
                  <TaskDynamic
                    param={{
                      taskDetail: taskDatas,
                    }}
                  />
                </TabPane>
                <TabPane tab="过程监管" key="2">
                  <div className="taskSupervise">
                    <div className="detailCheck">
                      {initcheck && (
                        <CheckEntry
                          times={time}
                          param={{
                            from: 'details',
                            isedit: true, //是否显示状态编辑 未完成 已完成 搁置
                            teamId: taskDatas.ascriptionId, //企业id
                            teamName: taskDatas.ascriptionName, //企业名称
                            taskid: taskDatas.id,
                            initData: initCheckData || [], //初始化数据
                            cutkey: cutkey == '2' ? true : false, //切换tab刷新检查项
                            isShowcomment: true, //是否显示评论回复
                            iseditCheck: editAuth, //是否可以编辑检查项
                            isshowNoneData: false, //无数据是否显示空白页
                          }}
                          getDatas={(datas: any) => {
                            console.log(datas)
                            setTime(undefined)
                            editcheck(datas) //更改检查项
                          }}
                          getfocus={(datas: any) => {
                            setIsfocus(datas)
                          }}
                        ></CheckEntry>
                      )}
                    </div>
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
                    {initCheckData.length > 0 || isfocus ? (
                      ''
                    ) : (
                      <NoneData
                        imgSrc={$tools.asAssetsPath(`/images/noData/no_reproduce.png`)}
                        imgStyle={{ width: 63, height: 68 }}
                        containerStyle={{ minHeight: 500 }}
                      />
                    )}
                  </div>
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
          {/* 任务协同 */}
          <div className="process_right_child_box">
            <TaskSynergy param={{ ...listTaskData, ...taskDatas, from: param.from }} />
          </div>
        </div>
      </div>
    </Modal>
  )
})

export default TaskDetails
