import React, { useState, useEffect } from 'react'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import { message, Modal } from 'antd'
import { ShareToRoomModal } from '../workplan/WorkPlanModal'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { requestApi } from '../../common/js/ajax'
import { DelPlanModal } from '../workplan/WorkPlanModal'
const Rightmodal = (props: any) => {
  const { nowUserId, nowAccount, nowUser, loginToken } = $store.getState()
  // //打开创建任务
  // const [opencreattask, setOpencreattask] = useState(false)
  //右键节点数据
  const [taskinfo, settaskinfo] = useState<any>()
  //删除提醒
  const [deleteOrgShow, setDeleteOrgShow] = useState(false)
  //共享到人
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState({})
  //分享到工作组弹窗
  const [shareToRoomParam, setShareToRoomParam] = useState<any>({})
  useEffect(() => {
    settaskinfo(props.info)
    init()
  }, [props.time])
  //初始化
  const init = () => {
    const type = props.info.type
    const datas = props.info.data
    // if (type == 100) {
    //   //详情 --------------------
    //   if (datas.type != 2 && datas.type != 3) {
    //     setOpencreattask(true)
    //   }
    // } else
    if (type == 'share-1') {
      //共享到人 ------------------
      setMemberOrgShow(true)
      const initSelMemberOrg = {
        teamId: props.info.teamId,
        sourceType: '', //操作类型
        allowTeamId: [props.info.teamId],
        selectList: [], //选人插件已选成员
        checkboxType: 'checkbox',
        isDel: false, //是否可以删除 true可以删除
        permissionType: 3, //组织架构通讯录范围控制
      }
      setSelMemberOrg(initSelMemberOrg)
    } else if (type == 'share-2') {
      //共享到项目组 ------------------
      $store.dispatch({
        type: 'WORKPLAN_MODAL',
        data: {
          sourceItem: {
            id: props.info.rootId, //节点id
            type: 1, //类型：0个人 1项目组
            name: props.info.rootName,
            mainId: props.info.mainId,
            typeId: props.info.rootTypeId,
            teamId: $store.getState().mindMapData.teamId,
            teamName: $store.getState().mindMapData.teamName,
          },
          shareFormType: 'workPlan',
        },
      })
      setShareToRoomParam({
        shareToRoomModalShow: true,
        titName: '分享任务',
        onOk: () => {
          message.success('分享成功')
        },
      })
    } else if (type == 'remove') {
      setDeleteOrgShow(true)
      //删除规划 -----------------
    } else if (type == 'jurisdiction') {
      //编辑工作规划权限 -----------------
      setMemberOrgShow(true)
      const initSelMemberOrg = {
        teamId: props.info.teamId,
        sourceType: '', //操作类型
        allowTeamId: [props.info.teamId],
        selectList: props.info.data, //选人插件已选成员
        checkboxType: 'checkbox',
        isDel: false, //是否可以删除 true可以删除
        permissionType: 3, //组织架构通讯录范围控制
      }
      setSelMemberOrg(initSelMemberOrg)
    }
  }
  //共享到人 共享到群 操作权限
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datasuser = dataList || []
    props.setvisible()
    if (taskinfo.type == 'share-1' || taskinfo.type == 'share-2') {
      let types = 0
      const typeIds: any = []
      if (taskinfo.type == 'share-1') {
        types = 0
        $.each(datasuser, (j, item) => {
          typeIds.push(item.userId)
        })
      } else {
        types = 1
        $.each(datasuser, (j, item) => {
          typeIds.push(item.id)
        })
      }
      const param = {
        id: taskinfo.rootId, //节点id
        operateUser: nowUserId,
        type: types, //类型：0个人 1项目组
        typeIds: typeIds, //数组、类型id
        name: taskinfo.rootName,
        operateUserName: nowUser,
        mainId: taskinfo.mainId,
      }
      $api
        .request('/task/work/plan/share', param, {
          headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
        })
        .then(resData => {
          message.success('已成功共享')
        })
        .catch(function(res) {
          message.error(res.returnMessage)
        })
    } else if (taskinfo.type == 'jurisdiction') {
      setJurisdiction(datasuser)
    }
  }
  //编辑工作规划权限
  const setJurisdiction = (datasuser: any) => {
    const typeIds: any = []
    $.each(datasuser, (j, item) => {
      typeIds.push(item.userId)
    })
    const param: any = {
      id: taskinfo.rootId,
      name: taskinfo.rootName,
      operateUser: $store.getState().nowUserId,
      operateUserName: $store.getState().nowUser,
      receivers: typeIds,
    }
    requestApi({
      url: '/task/work/plan/addAuth',
      param: param,
      json: true,
      successMsg: '编辑成功',
    })
  }
  return (
    <div className="right_modal">
      {/* 选择人员 */}
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
      {/* 分享到工作组 */}
      <ShareToRoomModal
        props={{
          param: { ...shareToRoomParam },
          action: {
            setShareToRoomModalShow: (flag: boolean) => {
              setShareToRoomParam({ ...shareToRoomParam, shareToRoomModalShow: flag })
            },
          },
        }}
        isclcallback={false}
        isclcallbackFn={(selRoomList: any) => {
          selMemberSure(selRoomList, { sourceType: '' })
        }}
      />
      <DelPlanModal
        props={{
          param: {
            delPlanModalShow: deleteOrgShow,
          },
          action: {
            setDelPlanModalShow: (flag: any) => {
              setDeleteOrgShow(flag)
            },
          },
        }}
        refreshData={(data: any) => {
          if (data) {
            const param = {
              id: props.info.rootId,
              mainId: props.info.mainId,
              name: props.info.rootName,
              operateUser: nowUserId,
              isAll: 1,
              typeId: props.info.rootTypeId,
            }
            props.removemind('removemind', param)
          }
        }}
        dataItem={{
          id: props.info.rootId,
          mainId: props.info.mainId,
          name: props.info.rootName,
          typeId: props.info.rootTypeId,
          type: props.type,
          hasChild: props.hasChild,
        }}
      />
    </div>
  )
}
export default Rightmodal
