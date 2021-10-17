// 创建规划接口
import { message } from 'antd'
// import { ipcRenderer } from 'electron'

export const addprojectData = (
  nowperiodId: string | number,
  getplanTree: any,
  myplanOrg: any,
  isMyplan: any,
  key: any,
  detialData?: any,
  nowFolderId?: string //当前所处文件夹id
) => {
  return new Promise(resolve => {
    const getAddprojectApi = (addProjectParam: any, key: any) => {
      $api
        .request('/task/work/plan/create', addProjectParam, {
          headers: {
            loginToken: $store.getState().loginToken,
            teamId: addProjectParam?.teamId,
            'Content-Type': 'application/json',
          },
        })
        .then(resData => {
          resolve(resData.data)
          if (resData.returnCode === 0) {
            if (resData.data) {
              // 更新工作规划点击数据
              $store.dispatch({
                type: 'MINDMAPOKRDATA',
                data: {
                  id: resData.data.id,
                  typeId: resData.data.typeId,
                  name: resData.data.name,
                  teamName: addProjectParam.teamName,
                  teamId: addProjectParam.teamId,
                  status: resData.data.status,
                  mainId: resData.data.mainId,
                  type: resData.data.type,
                  ascriptionType: addProjectParam.ascriptionType,
                },
              })
              console.log(resData.data)
              //跳转到脑图
              // $tools.createWindow('okrFourquadrant')//脑图创建窗口屏蔽
              let type = 0
              if (Number(key) === 1) {
                type = 1
              }
              $store.dispatch({
                type: 'FROM_PLAN_TYPE',
                data: { createType: type, fromToType: 1 }, //跳转四象限
              })
            }
          } else {
            message.error(resData.returnMessage)
          }
        })
        .catch(res => {
          message.error(res.returnMessage)
        })
    }
    let curId: any = ''
    let curType: any = ''
    let cmyId: any = ''
    let cmyName: any = ''
    const deptId: any = 0,
      roleId: any = 0,
      deptName: any = '',
      roleName: any = ''
    if (isMyplan) {
      //入口为我的规划
      curId = myplanOrg.curId || -1
      curType = myplanOrg.curType || -1
      cmyId = myplanOrg.cmyId || $store.getState().mindMapOkrData.teamId
      cmyName = myplanOrg.cmyName || $store.getState().mindMapOkrData.teamName
    } else {
      //组织架构树
      curId = getplanTree.curId
      curType = getplanTree.curType
      cmyId = getplanTree.cmyId
      cmyName = getplanTree.cmyName
    }
    const addProjectParam: any = {
      ascriptionId: curId,
      ascriptionType: curType,
      teamId: cmyId,
      teamName: cmyName,
      deptId: getplanTree.curType == 0 && !isMyplan ? getplanTree.parentId : deptId, //查询个人需要传部门岗位
      deptName: getplanTree.curType == 0 && !isMyplan ? getplanTree.parentName : deptName,
      roleId: getplanTree.curType == 0 && !isMyplan ? getplanTree.roleId : roleId,
      roleName: getplanTree.curType == 0 && !isMyplan ? getplanTree.roleName : roleName,
      operateUser: $store.getState().nowUserId, //操作人
      id: 0, //创建默认为0
      periodId: nowperiodId,
    }
    if (detialData?.type) {
      addProjectParam.type = detialData.type
      addProjectParam.endTime = detialData.endTime
      addProjectParam.name = detialData.name
      addProjectParam.startTime = detialData.startTime
    }
    if (nowFolderId) {
      addProjectParam.folderId = nowFolderId
    }
    getAddprojectApi(addProjectParam, key)
  })
}

//派发目标任务
export const getDistribute = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/distribute', params, {
        headers: {
          loginToken: $store.getState().loginToken,
          teamId: params?.teamId,
          'Content-Type': 'application/json',
        },
      })
      .then(resData => {
        if (resData.returnCode == 0) {
          message.success($intl.get('distributeTaskSuc'))
        }
        resolve(resData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}
//撤回目标任务派发
export const cancelDistributePlan = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/recallDistribute', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode == 0) {
          message.success($intl.get('recallDistributedSuc'))
        }
        resolve(resData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}

//删除目标任务
export const deleteNodes = (params: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/work/plan/delete', params, {
        headers: { loginToken: $store.getState().loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        if (resData.returnCode == 0) {
          message.success($intl.get('delSuc'))
        }
        resolve(resData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  })
}
