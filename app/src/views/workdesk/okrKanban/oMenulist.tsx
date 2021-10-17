import { Menu, message, Modal } from 'antd'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './oMenulist.less'
import { topedFolder, cancelFolder, addTaskNodeApi } from './getData'
import { findEditMember } from '../../workplan/WorkPlanOpt'
import { SelectMemberOrg } from '../../../components/select-member-org/index'
import { requestApi } from '../../../common/js/ajax'
import { deleteNodesApi } from '../../work-plan-mind/getData'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { DelPlanModal } from '../../workplan/WorkPlanModal'
const OMenulist = (popos: any) => {
  const refComplete = useRef(null)
  const nodeItems = popos.data.row.taskName
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  //删除提醒
  const [deleteOrgShow, setDeleteOrgShow] = useState(false)
  useLayoutEffect(() => {
    jQuery('.okrContainer,.workdesk-container')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.OMenulists') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          popos.setVisible('none')
        }
      })
  }, [refComplete.current])

  const tmpStyle: any = {
    position: 'fixed',
    left: `${popos.data.x}px`,
    top: `${popos.data.y}px`,
    display: 'block',
  }

  const handleClick = (e: any) => {
    console.log(e.key)
    if (e.key == 0) {
      //查看权限
    } else if (e.key == 1) {
      //编辑权限
      editMemberAuthFn()
    } else if (e.key == 2) {
      //重命名
      rechristenNames()
    } else if (e.key == 3) {
      //顶置/取消顶置
      setStick()
    } else if (e.key == 4) {
      //顶置/取消顶置
      canceltick()
    } else if (e.key == 5) {
      setDeleteOrgShow(true)
      popos.setVisible('none')
    }
  }
  //查询状态
  const getZone = () => {
    const val = $('.workPlanListNav li.active').attr('data-type')
    return val
  }
  //重命名
  const rechristenNames = () => {
    popos.callback('rechristen', popos.data.row)
  }
  //置顶
  const setStick = () => {
    const param = {
      userId: $store.getState().nowUserId,
      type: 0, //0规划 1文件夹
      typeId: popos.data.id,
      zone: getZone(),
    }
    const url = '/task/work/plan/folder/setTop'
    topedFolder(param, url).then((res: any) => {
      if (res.returnCode == 0) {
        message.success($intl.get('setTopSuc'))
        popos.callback('stick', popos.data.row)
      } else {
        popos.setVisible('none')
      }
    })
  }

  //取消顶置
  const canceltick = () => {
    const param = {
      topId: popos.data.row.taskName.topId,
    }
    const url = '/task/work/plan/folder/cancelTop'
    cancelFolder(param, url).then((res: any) => {
      if (res.returnCode == 0) {
        message.success($intl.get('cancelTopSuc'))
        popos.callback('stick', popos.data.row)
      } else {
        popos.setVisible('none')
      }
    })
  }

  //编辑权限
  const editMemberAuthFn = () => {
    findEditMember({
      id: nodeItems.id,
      mainId: nodeItems.mainId,
    }).then((dataList: any) => {
      const newList: any = []
      dataList.map((item: any) => {
        let disable = false
        const obj: any = {
          curId: item.id,
          curName: item.name,
          curType: 0,
        }
        // 责任人或创建人不可删除
        if (item.isDel == 0) {
          disable = true
        }
        obj.disable = disable
        newList.push(obj)
      })
      const initSelMemberOrg = {
        teamId: nodeItems.teamId,
        sourceType: '', //操作类型
        allowTeamId: [nodeItems.teamId],
        selectList: [...newList], //选人插件已选成员
        checkboxType: 'checkbox',
        permissionType: 3, //组织架构通讯录范围控制
        visible: true,
      }
      setSelMemberOrg(initSelMemberOrg)
    })
  }

  //设置权限
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const typeIds: any = []
    dataList.map((item: any) => {
      typeIds.push(item.curId)
    })
    const param = {
      id: nodeItems.id,
      name: nodeItems.name,
      operateUser: $store.getState().nowUserId,
      operateUserName: $store.getState().nowUser,
      receivers: typeIds,
    }
    requestApi({
      url: '/task/work/plan/addAuth',
      param: param,
      json: true,
      successMsg: $intl.get('editSuc'),
    })
  }

  return (
    <>
      <div className="OMenulists" ref={refComplete} style={tmpStyle}>
        {popos.data.row.taskName.type == 2 && (
          <Menu onClick={handleClick}>
            {/* <Menu.Item key="0">查看权限</Menu.Item> */}
            <Menu.Item key="1">{$intl.get('editAuth')}</Menu.Item>
            <Menu.Item key="2">{$intl.get('Rename')}</Menu.Item>
            {!popos.data.row.taskName.topId && popos.data.showTop && (
              <Menu.Item key="3">{$intl.get('setTop')}</Menu.Item>
            )}
            {popos.data.row.taskName.topId && popos.data.showTop && (
              <Menu.Item key="4">{$intl.get('cancelTop')}</Menu.Item>
            )}
            <Menu.Item key="5">{$intl.get('delete')}</Menu.Item>
          </Menu>
        )}
        {popos.data.row.taskName.type == 3 && (
          <Menu onClick={handleClick}>
            <Menu.Item key="5">{$intl.get('delete')}</Menu.Item>
          </Menu>
        )}
      </div>
      {/* 删除二次弹窗 */}
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
            popos.callback('remove', popos.data.row)
          }
        }}
        dataItem={{
          id: nodeItems.id,
          mainId: nodeItems.mainId,
          name: nodeItems.name,
          typeId: nodeItems.typeId,
          mainTypeId: '', //根节点typeid
          isDel: 1,
          firstId: nodeItems.id, //第一个根节点ID
          type: nodeItems.type,
          hasChild:nodeItems.hasChild
        }}
      />
      {/* 选人插件 */}
      {selMemberOrg.visible && (
        <SelectMemberOrg
          param={{
            ...selMemberOrg,
          }}
          action={{
            setModalShow: (visible: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: visible })
              popos.setVisible('none')
            },
            // 点击确认
            onSure: selMemberSure,
          }}
        />
      )}
    </>
  )
}

export default OMenulist
