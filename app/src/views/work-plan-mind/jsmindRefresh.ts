import moment from 'moment'
import { getItemsFusHtml, updateRefDataFn } from './work-plan-mind'
//工作规划刷新 -------------------------

export const jsmindFefFn = (type: any, jmCompany: any, nodeData: any) => {
  const _nodeid = jQuery('.okrnode').attr('nodeid') || `###${jmCompany.get_selected_node().data.typeId}###`
  if (!_nodeid) return
  const selectedNode = jmCompany.get_node(_nodeid)
  const typeId = selectedNode.data.typeId
  const nodeItem = selectedNode.data.nodeitem
  let refData = null
  if (type == 'add') {
    //新增节点 -------------------
    const selected_node = jmCompany.get_selected_node()
    const datas = getAddnodes(nodeData.data)
    const topic = getItemsFusHtml(datas)
    const _nodeid = '###' + datas.typeId + '###'
    const nodeDatas = {
      typeId: datas.typeId, //更新节点任务id
      nodeId: datas.id, //更新节点id
      names: datas.name,
      hasChild: datas.hasChild,
      direction: 'right',
      icon: datas.icon,
      property: datas.property,
      approvalStatus: datas.approvalStatus,
      status: datas.status,
      flag: datas.flag,
      cycleNum: datas.cycleNum,
      tagList: datas.tagList,
      process: datas.process,
      taskType: datas.type,
      genreStatus: datas.taskType,
      cci: datas.cci,
      taskStatus: datas.taskStatus,
      taskFlag: datas.taskFlag,
      startTime: datas.startTime,
      endTime: datas.endTime,
      day: datas.day,
      liableUsername: datas.liableUsername,
      liableUserProfile: datas.liableUserProfile,
      nodeText: datas.nodeText,
      liableUser: datas.liableUser,
      meetings: datas.meetings,
      files: datas.files,
      themes: datas.themes,
      isOther: datas.isOther,
      ascriptionType: datas.ascriptionType,
      update: datas.update,
      nodeitem: datas,
    }
    if (nodeData.type == 1) {
      //新增子任务
      jmCompany.add_node(selected_node, _nodeid, topic, nodeDatas)
    } else if (nodeData.type == 2) {
      //新增同级下
      jmCompany.insert_node_after(selected_node, _nodeid, topic, nodeDatas)
    } else if (nodeData.type == 3) {
      //新增同级父
      jmCompany.insert_node_parent(selected_node, _nodeid, topic, nodeDatas)
    } else if (nodeData.type == 4) {
      //新增同级上
      jmCompany.insert_node_before(selected_node, _nodeid, topic, nodeDatas)
    }
    jmCompany.get_node(_nodeid).direction = 1
    setTimeout(function() {
      jmCompany.update_node(_nodeid, topic, 'tsx')
    }, 300)
  } else if (type == 'eidtName') {
    //修改名称 -------------------
    const selectedNode = jmCompany.get_node(`###${nodeData.typeId}###`)
    const nodeItem = selectedNode.data.nodeitem
    const typeId = selectedNode.data.typeId
    nodeItem.name = nodeData.data
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    refData = {
      _topic: _topic,
      name: nodeData.data,
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'setDate') {
    //修改时间 -------------------
    if (nodeData.timestype == 1) {
      nodeItem.startTime = nodeData.data
    } else {
      nodeItem.endTime = nodeData.data
    }
    //计算时间天数
    let days: any = null
    if (nodeData.startTime) {
      nodeData.startTime =
        nodeData.startTime.indexOf(' ') != -1 ? nodeData.startTime.split(' ')[0] : nodeData.startTime
    }
    if (nodeData.endTime) {
      nodeData.endTime = nodeData.endTime.indexOf(' ') != -1 ? nodeData.endTime.split(' ')[0] : nodeData.endTime
    }
    //规则:没有开始时间 或者已经派发 或者OKR 都从当前时间开始算起（计算剩余时间）
    if (
      nodeData.startTime == '' ||
      nodeData.startTime == undefined ||
      selectedNode.data.status == 4 ||
      selectedNode.data.status == 3 ||
      selectedNode.data.taskType == 2 ||
      selectedNode.data.taskType == 3
    ) {
      const newDate: any = moment(new Date()).format('YYYY/MM/DD')
      const newTime: any = new Date(nodeData.endTime).getTime() / 1000 - new Date(newDate).getTime() / 1000
      days = parseInt(String(newTime / 60 / 60 / 24))
      if (newDate == nodeData.endTime) {
        nodeItem.day = 1
      } else {
        nodeItem.day = days < 0 ? 0 : days + 1 || ''
      }
    } else {
      const newTimes =
        new Date(nodeData.endTime).getTime() / 1000 - new Date(nodeData.startTime).getTime() / 1000
      days = parseInt(String(newTimes / 60 / 60 / 24))
      nodeItem.day = days < 0 ? 0 : days + 1 || ''
    }
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    refData = {
      _topic: _topic,
      time: nodeData.data,
      timestype: nodeData.timestype,
      day: days,
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'process') {
    //修改进度 -------------------
    nodeItem.process = nodeData.data
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    jQuery('.show_progress').removeClass('edit_show_progress')
    jQuery('.show_progress input').hide()
    refData = {
      _topic: _topic,
      process: nodeData.data,
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'cci') {
    //修改信心指数 -------------------
    nodeItem.cci = nodeData.data
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    jQuery('.eidt_Kr_Process').hide()
    refData = {
      _topic: _topic,
      cci: nodeData.data,
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'topContact_draft' || type == 'affiliation_draft' || type == 'affiliation_payout') {
    //修改常用联系人||归属 -------------------
    nodeItem.liableUsername = nodeData.data.liableUsername
    nodeItem.liableUserProfile = nodeData.data.liableUserProfile
    nodeItem.nodeText = nodeData.data.nodeText
    nodeItem.liableUser = nodeData.data.liableUser
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    jQuery('.portrait_okrMain').hide()
    refData = {
      _topic: _topic,
      data: nodeData.data,
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'addIcon') {
    //修改图标 -------------------
    nodeItem.icon = nodeData.data
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    refData = {
      _topic: _topic,
      data: nodeData.data,
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'signokr') {
    //标记成o/kr -------------------
    nodeItem.type = nodeData.data == 101 ? 2 : 3
    if (nodeData.data == 102) {
      nodeItem.cci = 5
    }
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    if (nodeItem.type == 2) {
      jQuery(`jmnode[nodeid="###${typeId}###"]`).addClass('root_o')
    } else {
      jQuery(`jmnode[nodeid="###${typeId}###"]`)
        .removeClass('task_node')
        .addClass('task_okr')
    }
    refData = {
      _topic: _topic,
      data: nodeData.data, //101标记成o 102标记成kr
    }
    updateRefDataFn(type, typeId, refData)
    if (selectedNode.children.length > 0) {
      //标记成O/kr 需要把子任务的任务状态显示出
      const OgenreStatus = selectedNode.data.genreStatus
      for (let i = 0; i < selectedNode.children.length; i++) {
        const newnodeItem = selectedNode.children[i].data.nodeitem
        const _topic = getItemsFusHtml(newnodeItem)
        const newrefData = {
          _topic: _topic,
          data: OgenreStatus, //0目标、1临时 、2职能、3项目
        }
        jmCompany.update_node(selectedNode.children[i].id, _topic, 'tsx')
        jQuery(`jmnode[nodeid="###${selectedNode.children[i].data.typeId}###"]`).removeClass('no-genre')
        updateRefDataFn('signokrchildren', selectedNode.children[i].data.typeId, newrefData)
      }
    }
  } else if (type == 'cancelsign') {
    //取消标记 -------------------
    let _topic = null
    if (nodeItem.type == 3) {
      //取消KR
      nodeItem.type = 1
      nodeItem.status = 1
      _topic = getItemsFusHtml(nodeItem)
      jQuery(`jmnode[nodeid="###${typeId}###"]`)
        .removeClass('task_okr')
        .addClass('task_node')
      jmCompany.update_node(selectedNode.id, _topic, 'tsx')
      jQuery(`jmnode[nodeid="###${typeId}###"]`).removeClass('accomplish')
      refData = {
        _topic: _topic,
        data: nodeItem.type,
      }
      updateRefDataFn(type, typeId, refData)
      if (selectedNode.children.length > 0) {
        //取消标记kr 需要把子任务的任务状态
        const OgenreStatus = selectedNode.data.genreStatus
        for (let i = 0; i < selectedNode.children.length; i++) {
          const newnodeItem = selectedNode.children[i].data.nodeitem
          const _topic = getItemsFusHtml(newnodeItem)
          const newrefData = {
            _topic: _topic,
            data: OgenreStatus, //0目标、1临时 、2职能、3项目
          }
          jmCompany.update_node(selectedNode.children[i].id, _topic, 'tsx')
          jQuery(`jmnode[nodeid="###${selectedNode.children[i].data.typeId}###"]`).addClass('no-genre')
          updateRefDataFn('signokrchildren', selectedNode.children[i].data.typeId, newrefData)
        }
      }
    } else if (nodeItem.type == 4 || nodeItem.type == 41) {
      nodeChildrenAttr(selectedNode, jmCompany, nodeData, 'cancelsynergy')
    }
  } else if (type == 'signsynergy') {
    //标记为协同 -------------------
    if (nodeData.liableUser) {
      nodeItem.liableUsername = nodeData.liableUsername
      nodeItem.liableUserProfile = nodeData.liableUserProfile
      nodeItem.nodeText = nodeData.nodeText
      nodeItem.liableUser = nodeData.liableUser
      const _topic = getItemsFusHtml(nodeItem)
      jmCompany.update_node(selectedNode.id, _topic, 'tsx')
      refData = {
        _topic: _topic,
        data: nodeData,
      }
      updateRefDataFn('topContact_draft', typeId, refData)
    }
    nodeChildrenAttr(selectedNode, jmCompany, nodeData, type)
  } else if (type == 'distribute_one') {
    //派发单项、撤回派发单项 -------------------
    nodeItem.status = nodeData.data == 105 ? 4 : 1
    if (nodeData.data == 107) {
      nodeItem.taskFlag = 2 //taskFlag:2草稿
      jmCompany.get_node(`###${typeId}###`).data.taskFlag = 2
    } else {
      if (nodeItem.taskType == 1) {
        //taskFlag:0任务 （非okr/非协同更改状态为任务）
        nodeItem.taskFlag = 0
        jmCompany.get_node(`###${typeId}###`).data.taskFlag = 0
      }
    }
    jmCompany.get_node(`###${typeId}###`).data.status = nodeData.data == 105 ? 4 : 1
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    if (nodeData.data == 105) {
      //105派发单项 107撤回派发单项
      jQuery(`jmnode[nodeid="###${typeId}###"]`).addClass('accomplish')
    } else {
      jQuery(`jmnode[nodeid="###${typeId}###"]`).removeClass('accomplish')
    }
    refData = {
      _topic: _topic,
      data: nodeData.data, //101标记成o 102标记成kr
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'distribute_whole' || type == 'distribute_all') {
    //派发整链、撤回整链派发 -------------------
    //106派发整链 108撤回整链派发
    if (type == 'distribute_all') {
      //派发所有
      nodeChildrenAttr(jmCompany.get_root(), jmCompany, nodeData, type)
    } else {
      nodeChildrenAttr(selectedNode, jmCompany, nodeData, type)
    }
  } else if (type == 'distribute_Choose') {
    //单点派发
    distrChoose(jmCompany, nodeData.data)
  } else if (type == 'taskStart') {
    //任务启动 取消完成
    if (nodeItem.taskStatus == 2) {
      jQuery(`jmnode[nodeid="###${typeId}###"]`).removeClass('complete')
      nodeItem.update = true
    }
    nodeItem.taskStatus = nodeData.data.taskStatus
    nodeItem.process = nodeData.data.process
    nodeItem.status = nodeData.data.status
    const _topic = getItemsFusHtml(nodeItem)
    jmCompany.update_node(selectedNode.id, _topic, 'tsx')
    refData = {
      _topic: _topic,
      data: nodeData.data,
    }
    updateRefDataFn(type, typeId, refData)
  } else if (type == 'movenodes') {
    //拖动 -------------------
    const _taskType = jmCompany.get_node(nodeData.parentid).data.taskType
    const _property = jmCompany.get_node(nodeData.parentid).data.property
    // const _genreStatus = jmCompany.get_node(nodeData.parentid).data.genreStatus
    if (_taskType == 4 || _taskType == 41) {
      //判断父级是否为协同
      nodeItem.type = _taskType
      //暂时屏蔽【父级任务下只显示父级的任务类型】
      // nodeItem.taskType = _genreStatus
      // jmCompany.get_node(`###${typeId}###`).data.genreStatus = _genreStatus
      const _topic = getItemsFusHtml(nodeItem)
      jmCompany.update_node(jmCompany.get_node(nodeData.fromId).id, _topic, 'tsx')
      jmCompany.get_node(`###${typeId}###`).data.taskType = _taskType
    } else if (_property == 1) {
      //判断父级是否为私密
      nodeItem.property = _property
      const _topic = getItemsFusHtml(nodeItem)
      jmCompany.update_node(jmCompany.get_node(nodeData.fromId).id, _topic, 'tsx')
      jmCompany.get_node(`###${typeId}###`).data.property = _property
    } else {
      const _topic = getItemsFusHtml(nodeItem)
      jmCompany.update_node(jmCompany.get_node(nodeData.fromId).id, _topic, 'tsx')
    }
    //暂时屏蔽【父级任务下只显示父级的任务类型】
    // if (_taskType == 2 || _taskType == 3) {
    //   jQuery(`jmnode[nodeid="###${typeId}###"]`).removeClass('no-genre')
    // } else {
    //   jQuery(`jmnode[nodeid="###${typeId}###"]`).addClass('no-genre')
    // }
    if (jmCompany.get_node(nodeData.beforePid).children.length == 0) {
      const newtypeId = jmCompany.get_node(nodeData.beforePid).data.typeId
      const newnodeItem = jmCompany.get_node(nodeData.beforePid).data.nodeitem
      newnodeItem.hasChild = 0
      const _topic = getItemsFusHtml(newnodeItem)
      jmCompany.get_node(`###${newtypeId}###`).data.hasChild = 0
      jmCompany.update_node(jmCompany.get_node(nodeData.beforePid).id, _topic, 'tsx')
      jQuery(`jmexpander[nodeid="${nodeData.beforePid}"]`).hide()
    }
    jmCompany.layout.layout()
    jmCompany.view.show()
  }
}

//遍历节点下所有子节点更改相关属性
export const nodeChildrenAttr = (selectedNode: any, jmCompany: any, nodeData: any, type: string) => {
  let refData: any = null
  let typeId = null
  let nodeItem = null
  const obj = []
  obj.push(selectedNode)
  function jsonRecursionChild(items: any) {
    for (let i = 0; i < items.length; i++) {
      typeId = items[i].data.typeId
      nodeItem = items[i].data.nodeitem
      if (type == 'signsynergy') {
        //标记为协同
        nodeItem.type = 4
        const _topic = getItemsFusHtml(nodeItem)
        jmCompany.update_node(items[i].id, _topic, 'tsx')
        refData = {
          _topic: _topic,
          data: 4,
        }
        updateRefDataFn(type, typeId, refData)
      } else if (type == 'cancelsynergy') {
        //取消标记协同
        nodeItem.type = 1
        const _topic = getItemsFusHtml(nodeItem)
        jmCompany.update_node(items[i].id, _topic, 'tsx')
        refData = {
          _topic: _topic,
          data: 1,
        }
        updateRefDataFn(type, typeId, refData)
      } else if (type == 'distribute_whole' || type == 'distribute_all') {
        //派发整链、撤回整链派发
        //106派发整链 108撤回整链派发
        //有责任人才能派发
        if (nodeData.data == 108) {
          //撤回（有责任人及是派发状态）
          if (items[i].data.liableUsername && items[i].data.status == 4) {
            nodeItem.status = 1
            nodeItem.taskFlag = 2 //taskFlag:2草稿
            jmCompany.get_node(`###${typeId}###`).data.status = 1
            jmCompany.get_node(`###${typeId}###`).data.taskFlag = 2
            const _topic = getItemsFusHtml(nodeItem)
            jmCompany.update_node(items[i].id, _topic, 'tsx')
            refData = {
              _topic: _topic,
              data: 1,
            }
            jQuery(`jmnode[nodeid="###${typeId}###"]`).removeClass('accomplish')
            updateRefDataFn(type, typeId, refData)
          }
        } else {
          //派发（有责任人及是草稿状态及除了O/KR）
          if (
            items[i].data.liableUsername &&
            items[i].data.status == 1 &&
            items[i].data.taskType != 2 &&
            items[i].data.taskType != 3
          ) {
            nodeItem.status = 4
            if (items[i].data.taskType == 1) {
              //taskFlag:0任务 （非okr/非协同更改状态为任务）
              nodeItem.taskFlag = 0
              jmCompany.get_node(`###${typeId}###`).data.taskFlag = 0
            }
            jmCompany.get_node(`###${typeId}###`).data.status = 4
            const _topic = getItemsFusHtml(nodeItem)
            jmCompany.update_node(items[i].id, _topic, 'tsx')
            refData = {
              _topic: _topic,
              data: 4,
            }
            jQuery(`jmnode[nodeid="###${typeId}###"]`).addClass('accomplish')
            updateRefDataFn(type, typeId, refData)
          }
        }
      }
      //有childs的时候递归
      if (
        items[i].children != undefined &&
        items[i].children != '' &&
        items[i].children != null &&
        items[i].children.length != 0 &&
        items[i].children instanceof Array
      ) {
        jsonRecursionChild(items[i].children)
      }
    }
  }
  jsonRecursionChild(obj)
}

//更改单个数据集合
export const distrChoose = (jmCompany: any, arrs: any) => {
  const items = arrs
  let refData: any = null
  let typeId = null
  let nodeItem = null
  for (let i = 0; i < items.length; i++) {
    items[i] = jmCompany.get_node(`###${items[i]}###`)
    typeId = items[i].data.typeId
    nodeItem = items[i].data.nodeitem
    //派发（有责任人及是草稿状态及除了O/KR）
    if (
      items[i].data.liableUsername &&
      items[i].data.status == 1 &&
      items[i].data.taskType != 2 &&
      items[i].data.taskType != 3
    ) {
      nodeItem.status = 4
      if (items[i].data.taskType == 1) {
        //taskFlag:0任务 （非okr/非协同更改状态为任务）
        nodeItem.taskFlag = 0
        jmCompany.get_node(`###${typeId}###`).data.taskFlag = 0
      }
      jmCompany.get_node(`###${typeId}###`).data.status = 4
      const _topic = getItemsFusHtml(nodeItem)
      jmCompany.update_node(items[i].id, _topic, 'tsx')
      refData = {
        _topic: _topic,
        data: 4,
      }
      jQuery(`jmnode[nodeid="###${typeId}###"]`).addClass('accomplish')
      updateRefDataFn('distribute_Choose', typeId, refData)
    }
  }
}

//新增从新构建数据
const getAddnodes = (data: any) => {
  const datas: any = {}
  datas.typeId = data.typeId
  datas.id = data.id
  datas.name = data.name
  datas.hasChild = 0
  datas.icon = ''
  datas.property = data.property
  datas.approvalStatus = undefined
  datas.status = data.status
  datas.flag = undefined
  datas.cycleNum = -1
  datas.tagList = undefined
  datas.process = 0
  datas.type = data.type
  datas.taskType = data.taskType
  datas.cci = datas.type == 3 ? 5 : undefined
  datas.taskStatus = 0
  datas.taskFlag = 2
  datas.startTime = data.startTime
  datas.endTime = data.endTime
  datas.day = data.day
  datas.liableUsername = data.liableUsername
  datas.liableUserProfile = data.liableUserProfile
  datas.nodeText = data.nodeText
  datas.liableUser = data.liableUser
  datas.meetings = 0
  datas.files = 0
  datas.themes = undefined
  datas.isOther = 0
  datas.ascriptionType = data.ascriptionType
  datas.update = true
  return datas
}
