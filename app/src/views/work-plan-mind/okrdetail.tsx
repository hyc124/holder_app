import React, { useState, useReducer, useEffect } from 'react'
import { Modal, Tooltip, Slider, InputNumber, DatePicker, Spin, message, Input, Button } from 'antd'
import './work-plan-mind.less'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import UploadFile from '@/src/components/upload-file/index'
import { findEditMember } from '../workplan/WorkPlanOpt'
import FileList from '@/src/components/file-list/file-list'
import moment from 'moment'
import { RenderFileList, RenderUplodFile } from '../mettingManage/component/RenderUplodFile'
import * as Maths from '@/src/common/js/math'
//初始化数据
const initStates = {
  progress: 0, //进度
  startTime: '', //开始时间
  endTime: '', //结束时间
  name: '', //名称
  user: [], //人员
  id: '',
  typeId: '',
  teamId: '',
  teamName: '',
}
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'progress':
      return { ...state, progress: action.data }
    case 'startTime':
      return { ...state, startTime: action.data }
    case 'endTime':
      return { ...state, endTime: action.data }
    case 'name':
      return { ...state, name: action.data }
    case 'user':
      return { ...state, user: action.data }
    case 'id':
      return { ...state, id: action.data }
    case 'typeId':
      return { ...state, typeId: action.data }
    case 'teamId':
      return { ...state, teamId: action.data }
    case 'teamName':
      return { ...state, teamName: action.data }
    default:
      return state
  }
}
// let fileModeles: any[] = []
const Okrdetail = (props: any) => {
  const { nowUserId, nowAccount, nowUser, loginToken } = $store.getState()
  //公共参数
  const [state, dispatch] = useReducer(reducer, initStates)
  //滑动条
  const [inputValue, setInputValue] = useState<any>(0)
  //设置进度步长
  const [stepnum, setStepnum] = useState(5)
  //加载
  const [loading, setLoading] = useState(false)
  //okr详情
  const [okrDetalis, setokrDetalis] = useState<any>()
  //选人插件
  const [memberOrgShow, setMemberOrgShow] = useState(false)
  //选人插件初始化
  const [selMemberOrg, setSelMemberOrg] = useState({})
  // 上传的文件列表数据
  const [fileUserList, setFileUserList] = useState<Array<any>>([])
  // 是否有编辑权限
  const [conAuth, setconAuth] = useState(false)
  // 详情state
  const [detailState, setDetailState] = useState({
    loadTime: '',
    uploadVisible: false,
    fileList: [],
    defaultFiles: [],
  })
  useEffect(() => {
    init()
    draftAuthFn()
  }, [props.visible])
  //初始化
  const init = () => {
    setLoading(true)
    const param = {
      typeId: props.datas.typeId,
    }
    $api
      .request('/task/work/plan/queryOkr', param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        setLoading(false)
        const resDatas = resData.data
        setokrDetalis(resDatas)
        setdatas(resDatas)
      })
      .catch(function(res) {
        setLoading(false)
        message.error(res.returnMessage)
      })
  }
  //查看编辑权限
  const draftAuthFn = () => {
    let conAuth = false
    findEditMember({
      id: props.oId, //O的ID
      mainId: props.mindId,
    }).then((res: any) => {
      if (res && res.length > 0) {
        for (let i = 0; i < res.length; i++) {
          if (res[i].id == $store.getState().nowUserId) {
            conAuth = true
            break
          }
        }
      }
      setconAuth(conAuth)
    })
  }
  //设置数据
  const setdatas = (resDatas: any) => {
    // fileModeles = resDatas.fileModels
    if (resDatas.ascriptionType != -1) {
      dispatch({
        type: 'user',
        data: [
          {
            account: '',
            type: resDatas.ascriptionType,
            userId: resDatas.ascriptionId,
            username: resDatas.ascriptionName || '',
            curId: resDatas.ascriptionId,
            curName: resDatas.ascriptionName || '',
            curType: resDatas.ascriptionType,
          },
        ],
      })
    }
    dispatch({
      type: 'startTime',
      data: resDatas.startTime,
    })
    dispatch({
      type: 'endTime',
      data: resDatas.endTime,
    })
    dispatch({
      type: 'id',
      data: resDatas.id,
    })
    dispatch({
      type: 'typeId',
      data: resDatas.typeId,
    })
    dispatch({
      type: 'teamId',
      data: resDatas.teamId,
    })
    dispatch({
      type: 'teamName',
      data: resDatas.teamName,
    })
    dispatch({
      type: 'progress',
      data: resDatas.process,
    })
    dispatch({
      type: 'name',
      data: resDatas.name,
    })
    setInputValue(resDatas.process)
    setFileUserList(resDatas.fileModels || [])
  }
  //修改进度
  const editSlider = (value: any) => {
    dispatch({
      type: 'progress',
      data: value,
    })
  }
  //修改时间
  const editTimes = (val: any, type: string) => {
    let times: any = ''
    if (val) {
      times = moment(val).format('YYYY/MM/DD HH:mm')
    }
    if (type == 'startTime') {
      dispatch({
        type: 'startTime',
        data: times,
      })
    } else if (type == 'endTime') {
      dispatch({
        type: 'endTime',
        data: times,
      })
    }
  }
  /**
   * 删除附件
   */
  // const delFile = ({ fileKey }: any) => {
  //   for (let i = 0; i < fileUserList.length; i++) {
  //     const item = fileUserList[i]
  //     if (item.fileKey == fileKey) {
  //       fileUserList.splice(i, 1)
  //       break
  //     }
  //   }
  //   setFileUserList([...fileUserList])
  // }
  //编辑名称
  const editName = (e: any) => {
    e.persist()
    dispatch({
      type: 'name',
      data: e.target.value || '',
    })
  }
  //选择成员插件
  const selectUser = () => {
    setMemberOrgShow(true)
    let initSelMemberOrg: any = {}
    initSelMemberOrg = {
      teamId: okrDetalis.teamId,
      sourceType: '', //操作类型
      allowTeamId: [okrDetalis.teamId],
      selectList: [], //选人插件已选成员
      checkboxType: 'radio',
      permissionType: 3, //组织架构通讯录范围控制
      checkableType: [0, 2, 3],
    }
    setSelMemberOrg(initSelMemberOrg)
  }
  //选择成员
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datas = dataList
    const arr = []
    //汇报人
    for (let i = 0; i < datas.length; i++) {
      arr.push({
        account: datas[i].account,
        type: datas[i].curType,
        curId: datas[i].curId,
        curName: datas[i].curName,
        userId: datas[i].userId,
        username: datas[i].userName || datas[i].username,
        deptId: datas[i].deptId,
        deptName: datas[i].deptName,
        roleId: datas[i].roleId,
        roleName: datas[i].roleName,
        curType: datas[i].curType,
      })
    }
    dispatch({
      type: 'user',
      data: arr,
    })
  }
  //保存
  const editPlanSave = () => {
    if (state.endTime && state.startTime && state.startTime > state.endTime) {
      message.warning('开始时间不能大于结束时间')
      return false
    }
    if (!conAuth) {
      message.warning('没有操作权限!')
      return false
    }
    const fileList: any = []
    fileUserList.forEach(file => {
      if (file) {
        fileList.push({
          id: file.id,
          fileKey: file.fileKey,
          fileName: file.fileName,
          fileSize: file.fileSize,
          dir: 'task',
        })
      }
    })
    setLoading(true)
    const param = {
      mainId: props.mindId,
      typeId: state.typeId,
      id: state.id,
      teamId: state.teamId,
      teamName: state.teamName,
      ascriptionId: state.user[0] ? state.user[0].curId : undefined,
      ascriptionType: state.user[0] ? state.user[0].type : undefined,
      deptId: state.user[0] && state.user[0].type == 0 ? state.user[0].deptId : undefined,
      deptName: state.user[0] && state.user[0].type == 0 ? state.user[0].deptName : undefined,
      roleId: state.user[0] && state.user[0].type == 0 ? state.user[0].roleId : undefined,
      roleName: state.user[0] && state.user[0].type == 0 ? state.user[0].roleName : undefined,
      startTime: state.startTime,
      endTime: state.endTime,
      name: state.name,
      fileModels: fileList,
      operateUser: nowUserId,
      operateUserName: nowUser,
      process: state.progress,
    }
    $api
      .request('/task/work/plan/save', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        message.success('编辑成功')
        setLoading(false)
        props.setvisible(false)
        props.openMode(resData)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
        setLoading(false)
      })
  }
  // 进度输入值控制整数
  const changeInputVal = (value: any) => {
    const textboxvalue = value
    if (textboxvalue.length == 1) {
      setInputValue(String(value).replace(/[^0-9]/g, ''))
    } else {
      setInputValue(String(value).replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1'))
    }
    if (Number(textboxvalue) > 100) {
      setInputValue(4)
    }
  }
  //过滤 inputNumber 只能输入正整数+2位小数
  const limitDecimals = (value: any): any => {
    const reg = /^(\-)*(\d+)\.(\d\d).*$/
    let newVal = ''
    if (typeof value === 'string') {
      newVal = !isNaN(Number(value)) ? value.replace(reg, '$1$2.$3') : ''
    } else if (typeof value === 'number') {
      newVal = !isNaN(value) ? String(value).replace(reg, '$1$2.$3') : ''
    }
    if (newVal.split('.')[1] && newVal.split('.')[1] == '00') {
      newVal = newVal.split('.')[0]
    }
    return newVal
  }

  /**
   * 所有附件上传完成
   */
  const filesUploaded = (files: any, _?: string, isDel?: boolean) => {
    const fileModels: any = []
    files?.map((file: any) => {
      const findFiles = fileUserList.filter((fItem: any) => fItem.fileGUID == file.fileGUID)
      if (findFiles.length == 0) {
        fileModels.push(file)
      }
    })
    if (isDel) {
      setFileUserList(files)
    } else {
      const newList = [...fileUserList, ...fileModels]
      setFileUserList(newList)
    }
  }
  return (
    <Modal
      title={'详情'}
      visible={props.visible}
      maskClosable={false}
      keyboard={false}
      className="okrNewdetail"
      onOk={editPlanSave}
      onCancel={() => {
        props.setvisible(false)
      }}
    >
      <Spin spinning={loading} tip={'加载中，请耐心等待'}>
        {okrDetalis && (
          <div className="okrdetail_content">
            {/* 进度 */}
            <div className="okrdetail_row bg_g">
              <div className="okritem_left">进度：</div>
              <div className="okritem_right">
                <div className="progress_right">
                  <div className="progress_mid" key={state.progress}>
                    {/* 客观进度 */}
                    <Tooltip title={`客观进度：${okrDetalis.objectiveProcess || 0}%`}>
                      <span
                        className="impersonality_process"
                        style={{ left: `${(595 * okrDetalis.objectiveProcess) / 100}px` }}
                      ></span>
                    </Tooltip>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={inputValue}
                      onChange={(value: any) => {
                        setInputValue(value)
                        setStepnum(5)
                      }}
                      onAfterChange={(value: any) => {
                        editSlider(value)
                      }}
                      tipFormatter={() => {
                        return (
                          <span>
                            {okrDetalis.processUser || nowUser}评估了该进度为
                            {inputValue || okrDetalis.process}%
                          </span>
                        )
                      }}
                    />
                    <InputNumber
                      min={0}
                      max={100}
                      step={1}
                      value={!inputValue ? okrDetalis.process : inputValue}
                      style={{ width: '35px !important' }}
                      formatter={limitDecimals}
                      parser={limitDecimals}
                      onChange={(value: any) => {
                        setStepnum(1)
                        changeInputVal(value)
                      }}
                      onBlur={(e: any) => {
                        editSlider(e.target.value)
                      }}
                    />
                    <span style={{ marginTop: '7px', color: '#D7D7D9', marginLeft: '3px' }}>%</span>
                  </div>
                  {/* 开始截至时间 */}
                  <div className="progress_bot flex">
                    <div className="task_start_time_box">
                      <span>开始:</span>
                      <DatePicker
                        showTime
                        placeholder="点击设置"
                        bordered={false}
                        suffixIcon={<i></i>}
                        format={'YYYY/MM/DD HH:mm'}
                        value={state.startTime ? moment(state.startTime) : null}
                        onChange={(value: any) => {
                          editTimes(value, 'startTime')
                        }}
                      />
                    </div>
                    <div className="task_end_time_box">
                      <span className="tasknames-jz">截至:</span>
                      <DatePicker
                        showTime
                        placeholder=""
                        allowClear={false}
                        bordered={false}
                        suffixIcon={<i></i>}
                        value={moment(state.endTime)}
                        format={'YYYY/MM/DD HH:mm'}
                        onChange={(value: any) => {
                          editTimes(value, 'endTime')
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 名称 */}
            <div className="okrdetail_row">
              <div className="okritem_left">
                <div className="okritem_icon"></div>
              </div>
              <div className="okritem_right">
                <Input onChange={editName} placeholder="请输入名称" defaultValue={okrDetalis.name} />
              </div>
            </div>
            {/* 任务归属 */}
            <div className="okrdetail_row" style={{ marginBottom: '0px' }}>
              <div
                className="okritem_left affiar"
                onClick={() => {
                  selectUser()
                }}
              >
                <div className="xuanzeguishu"></div>选择归属
              </div>
            </div>
            <div
              className="okrdetail_row"
              style={state.user.length == 0 ? { marginBottom: '0px' } : { marginTop: '10px' }}
            >
              <div className="okritem_right">
                <div className="staff-object">
                  {state.user.length > 0 &&
                    state.user.map((item: any, index: any) => {
                      return (
                        <span key={index}>
                          {item.curName}
                          <em
                            className="img_icon del_icon"
                            onClick={() => {
                              dispatch({
                                type: 'user',
                                data: [],
                              })
                            }}
                          ></em>
                        </span>
                      )
                    })}
                </div>
              </div>
            </div>
            {/* 附件 */}
            <div className="okrdetail_row" style={{ marginBottom: '10px', marginTop: '24px' }}>
              {/* <div className="okritem_left">附件：</div> */}
              {/* <UploadFile
                fileModels={[]}
                fileUploaded={(file: any) => {
                  fileUserList.push({
                    ...file.fileItem,
                    src: file.imgUrl,
                  })
                  setFileUserList([...fileUserList])
                }}
                dir="task"
                showText="添加附件"
                showIcon={true}
                showUploadList={false}
                windowfrom={'workplanMind'}
                fileIcon={<Button className="msg-handle-btn file_icon">添加附件</Button>}
              ></UploadFile> */}

              <Button
                className="msg-handle-btn file_icon"
                onClick={() => {
                  setDetailState({
                    ...detailState,
                    uploadVisible: true,
                    loadTime: new Date().getTime().toString(),
                  })
                }}
              >
                添加附件
              </Button>
            </div>
            <div className="okrdetail_row">
              <RenderUplodFile
                visible={detailState.uploadVisible}
                leftDown={true}
                canDel={true}
                filelist={fileUserList || []}
                teamId={okrDetalis.teamId}
                fileId={`${Maths.uuid()}`}
                defaultFiles={detailState.defaultFiles || []}
                setVsible={state => {
                  setDetailState({ ...detailState, uploadVisible: state })
                }}
                loadTime={detailState.loadTime}
                fileChange={(list: any, delGuid?: string, isDel?: boolean) => {
                  filesUploaded(list, delGuid, isDel)
                }}
              />
            </div>
          </div>
        )}
      </Spin>
      {/* 选人插件 */}
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
    </Modal>
  )
}
export default Okrdetail
