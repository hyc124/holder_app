import React, { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { inquireCheckApi } from '../taskDetail/getData'
import CheckEntry from '../creatTask/checkEntry'
import '../taskDetail/taskdetails.less'
import NoneData from '@/src/components/none-data/none-data'
const CheckEntryModal = (props: any) => {
  const { nowUserId, nowAccount, selectTeamId, loginToken } = $store.getState()
  //检查项初始查询数据
  const [initCheckData, setInitCheckData] = useState<any>([])
  //刷新
  const [cutkey, setCutkey] = useState(false)
  //是否渲染检查项
  const [initcheck, setInitcheck] = useState({
    init: false,
    refreshType: '',
    enterType: '', //是否是enter新增
    farid: '', //enter新增子节点时父节点id
  })
  //任务详情数据
  const [taskDatas, setTaskDatas] = useState<any>({
    ascriptionId: '',
    ascriptionName: '',
    id: '',
  })
  useEffect(() => {
    setTaskDatas({
      ascriptionId: props.param.ascriptionId,
      ascriptionName: props.param.ascriptionName,
      id: props.param.id,
    })
    inquireCheck()
    setInitcheck({ ...initcheck, init: true, refreshType: 'init' })
  }, [])
  useEffect(() => {
    console.log(initCheckData)
  }, [initCheckData])
  //查询检查项
  const inquireCheck = () => {
    const url = '/task/check/list'
    const param = {
      taskId: props.param.id,
      userId: nowUserId,
    }
    inquireCheckApi(param, url).then((resData: any) => {
      if (resData.dataList) {
        setInitCheckData([...resData.dataList])
        setCutkey(true)
      }
    })
  }
  return (
    <Modal
      title="检查项"
      visible={props.param.visible}
      onCancel={() => {
        props.setvisible(false)
      }}
      maskClosable={false}
      keyboard={false}
      className="checkEntryModal"
      footer={null}
      confirmLoading={true}
    >
      {initCheckData.length == 0 ? (
        <NoneData />
      ) : (
        <CheckEntry
          initRefresh={initcheck}
          times={''}
          param={{
            from: 'details',
            isedit: false, //是否显示状态编辑 未完成 已完成 搁置
            teamId: taskDatas.ascriptionId, //企业id
            teamName: taskDatas.ascriptionName, //企业名称
            taskid: taskDatas.id,
            initData: initCheckData, //初始化数据
            cutkey: cutkey, //刷新
            isShowcomment: true, //是否显示评论回复
            iseditCheck: false, //是否可以编辑检查项
            isshowNoneData: true, //无数据是否显示空白页
          }}
          getDatas={(datas: any) => {
            console.log(datas)
          }}
        ></CheckEntry>
      )}
    </Modal>
  )
}
export default CheckEntryModal
