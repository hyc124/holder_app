import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Select, message, Checkbox, Button, Spin, Tooltip } from 'antd'
import DataRange from './dataRange'
import NoneData from '@/src/components/none-data/none-data'
import './index.less'
import * as Maths from '@/src/common/js/math'
interface CompanyItemProps {
  id: number
  shortName: string
  isLast: number
}

interface OrgModelsItem {
  ascriptionId: number
  ascriptionName: string
  ascriptionType: number
  id: number
  teamInfoId: number
}

interface DataPermissionModelItem {
  id: number
  isChecked: boolean
  permissionName: string
  permissionOrgModels: OrgModelsItem[]
}

interface AuthItemProps {
  id: number
  isChecked: number
  permissionName: string
  dataPermissionType: number
  dataPermissionModel: DataPermissionModelItem
  grantType: number
  grantValue: number
  remainValue: number
}

interface ModuleListItem {
  id: number
  functionName: string
  permissionModels: AuthItemProps[]
}

interface MainItemProps {
  id: number
  name: string
  functionModels: ModuleListItem[]
}

function AuthManage() {
  const { loginToken, nowAccount, nowUserId, nowUser } = $store.getState()
  const [companyList, setCompanyList] = useState([])
  const [authList, setAuthList] = useState([])
  // 当前选中的企业id
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  // const selectTeamItem = companyList.find((item: CompanyItemProps) => {
  //   return item.isLast === 1
  // })
  // const teamId =
  //   selectTeamId !== -1
  //     ? selectTeamId
  //     : selectTeamItem
  //     ? selectTeamItem['id']
  //     : companyList.length > 0 && companyList[0]['id']
  const [teamId, setTeamId] = useState(-1)
  // 当前选中的权限项
  const [permissionIds, setPermissionIds] = useState<number[]>([])
  // loading状态
  const [loading, setLoading] = useState(false)
  // 数据范围模态框显隐
  const [modalVisible, setModalVisible] = useState(false)
  // 查询数据范围所需的参数type
  const [permissionType, setPermissionType] = useState(0)
  // 可设置数据范围的数据的id
  const [rangeId, setRangeId] = useState<number[]>([])
  // 新增的数据范围数据
  const [addRangeData, setRangeData] = useState<any>([])
  // 申请权限保存所需参数
  const [permissionId, setpPermissionId] = useState<number>(-1)
  const [checkedAllStatus, setCheckedAllStatus] = useState<boolean[]>([])

  // 初始时是否全选
  const isCheckedAll = (arrData: AuthItemProps[]) => {
    const result = arrData.every(item => {
      return item.isChecked === 1
    })
    return result
  }

  // 点击全选
  const handleCheckAll = (e: any, i: number, index: number, permissionModels: AuthItemProps[]) => {
    const isChecked = e.target.checked
    setCheckedAllStatus(origin => {
      const data = [...origin]
      data[i][index] = isChecked
      return data
    })
    // 点击全选选中所有未选中的checkbox
    setPermissionIds(origin => {
      const checkedIds = [...origin]
      if (isChecked) {
        permissionModels.map((item: any) => {
          if (!item.isChecked && !checkedIds.includes(item.id)) {
            checkedIds.push(item.id)
          }
        })
      } else {
        permissionModels.map((item: any) => {
          if (checkedIds.includes(item.id)) {
            checkedIds.splice(checkedIds.indexOf(item.id), 1)
          }
        })
      }
      return checkedIds
    })
  }

  // 点击切换选中
  const checkChange = (e: any, { id, dataPermissionType }: AuthItemProps) => {
    if (e.target.checked) {
      // 保存当前选中的id
      setPermissionIds(origin => {
        return [...origin, id]
      })
      // 显示设置数据范围保存的id
      if (dataPermissionType) {
        setRangeId(origin => {
          return [...origin, id]
        })
      }
    } else {
      // 取消选中删除选中的id
      setPermissionIds(origin => {
        const checkedIds = [...origin]
        for (const i in checkedIds) {
          if (checkedIds[i] === id) {
            checkedIds.splice(parseInt(i), 1)
          }
        }
        return checkedIds
      })
      // 取消选中时，显示设置数据范围删除id
      if (dataPermissionType) {
        setRangeId(origin => {
          const checkedIds = [...origin]
          for (const i in checkedIds) {
            if (checkedIds[i] === id) {
              checkedIds.splice(parseInt(i), 1)
            }
          }
          return checkedIds
        })
      }
    }
  }

  // 申请权限提交
  const applyAuth = () => {
    if (!permissionIds.length && !addRangeData.length) {
      message.error('没有修改任何权限')
      return
    }
    const currentOrg = companyList.find((item: CompanyItemProps) => {
      return item.id === teamId
    })
    let dataPermissionModels: any = []
    if (permissionId !== -1) {
      dataPermissionModels = [{ permissionId, permissionType }]
    }
    const showOrgName = currentOrg && currentOrg['shortName']
    const values = {
      account: nowAccount,
      applyName: nowUser,
      applyPersonId: nowUserId,
      teamId,
      orgId: teamId,
      orgName: showOrgName,
      ascriptionType: currentOrg && currentOrg['type'],
      permissionIds: permissionIds,
      dataPermissionModels,
      systemIdentification: 'oa',
    }
    $api
      .request('/team/my/permission/apply/permission', values, {
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken,
        },
      })
      .then(res => {
        if (res.data) {
          message.info('发起审批')
          $store.dispatch({
            type: 'SET_SEND_APPROVAL_INFO',
            data: {
              eventId: res.data.eventId,
              teamId: teamId,
              approvalName: `【个人权限申请】${showOrgName}`,
              approvalType: res.data.type,
              isEdit: false,
              authId: res.data.authId,
              uuid: Maths.uuid(),
              isNextForm: false,
              isNextFormDatas: null,
              findByEventIdData: '',
            },
          })
          $tools.createWindow('ApprovalExecute')
        } else {
          getAuthList()
          message.success('权限申请成功')
        }
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }

  // 显示已经设置过的+新增的数据范围
  const showRange = (data: DataPermissionModelItem) => {
    const permissionOrgModels = [...data.permissionOrgModels, ...addRangeData]
    return permissionOrgModels
      .map((data: OrgModelsItem) => {
        return data.ascriptionName
      })
      .join('、')
  }

  const setTeamValue = (companyList: CompanyItemProps[]) => {
    if (!selectTeamId || selectTeamId === -1) {
      const selectTeamItem = companyList.find((item: CompanyItemProps) => {
        return item.isLast === 1
      })
      if (selectTeamItem) {
        setTeamId(selectTeamItem['id'])
      } else {
        setTeamId(companyList[0]['id'])
      }
    } else {
      setTeamId(selectTeamId)
    }
  }

  //切换企业
  const selectOrg = (value: number, options: any) => {
    setPermissionIds([])
    if (options.key) {
      //保存选择的企业id
      $store.dispatch({ type: 'SET_SEL_TEAMID', data: { selectTeamId: parseInt(options.key) } })
      setTeamId(parseInt(options.key))
    }
    // 未切换企业再次选中当前企业刷新
    if (teamId === parseInt(options.key)) {
      getAuthList()
    }
  }

  // 查询公司列表
  const getCompanyList = () => {
    const params = {
      type: -1,
      userId: nowUserId,
      username: nowAccount,
    }
    $api
      .request('/team/enterpriseInfo/newQueryTeamList', params, {
        headers: {
          'Content-Type': 'application/json',
          loginToken: loginToken,
        },
      })
      .then(res => {
        setCompanyList(res.dataList)
        setTeamValue(res.dataList)
      })
      .catch(function(res) {
        message.error(res.returnMessage)
      })
  }

  // 查询表格数据
  const getAuthList = () => {
    setLoading(true)
    const params = {
      account: nowAccount,
      teamId,
    }
    $api
      .request('/team/permission/findUserPermissions', params, {
        headers: {
          loginToken: loginToken,
        },
        formData: true,
      })
      .then(res => {
        const dataList = res.dataList
        const arr: any[] = []
        dataList.map((item: any) => {
          const arr1: boolean[] = []
          item.functionModels.map((target: any) => {
            const resStatus = target.permissionModels.every((origin: any) => {
              return origin.isChecked === 1
            })
            arr1.push(resStatus)
          })
          arr.push(arr1)
        })
        setCheckedAllStatus(arr)
        setLoading(false)
        setAuthList(dataList)
      })
      .catch(function(res) {
        setLoading(false)
        message.error(res.returnMessage)
      })
  }

  const setTime = (grantType: number, grantValue: number, remainValue: number) => {
    let timeLimit = '永久',
      remainTime = ''
    // 权限时效 0永久 1限时 2次数
    let tips = '永久'
    if (grantType == 1) {
      //限时
      // 授权时间
      const limitHour = grantValue / (60 * 60 * 1000) + '小时'
      const limitHourRemain = grantValue % (60 * 60 * 1000)
      let limitMinute = ''
      if (limitHourRemain != 0) {
        limitMinute = limitHourRemain / (60 * 1000) + '分'
      }
      timeLimit = limitHour + limitMinute
      // 剩余时间
      const remainHour = Math.floor(remainValue / (60 * 60 * 1000)) + '小时'
      const remainHourRemain = remainValue % (60 * 60 * 1000)
      let remainMinute = ''
      if (remainHourRemain != 0) {
        remainMinute = Math.floor(remainHourRemain / (60 * 1000)) + '分'
      }
      remainTime = remainHour + remainMinute
      tips = `授权时效：${timeLimit}，剩余${remainTime}`
    } else if (grantType == 2) {
      //次数
      tips = `授权时效：${grantValue}次，剩余${remainValue}次`
    }
    return tips
  }

  useEffect(() => {
    if (teamId && teamId !== -1) {
      getAuthList()
    }
  }, [teamId])

  useEffect(() => {
    getCompanyList()
  }, [])

  return (
    <Spin spinning={teamId === -1 ? true : loading}>
      {/* <div className="authTitle">权限管理</div> */}
      <div className="authHeader">
        <Select value={teamId} style={{ width: '200px' }} onSelect={selectOrg}>
          {companyList.map((item: CompanyItemProps) => {
            return (
              item.id && (
                <Select.Option key={item.id} value={item.id}>
                  {item.shortName}
                </Select.Option>
              )
            )
          })}
        </Select>
        <div className="tips">
          提示：选中的表示当前已拥有的权限，未选中的表示还可以申请的权限，审批中权限不可再次申请。
        </div>
      </div>
      <div className="authContent">
        {authList.length === 0 && (
          <NoneData
            imgSrc={$tools.asAssetsPath('/images/common/none_table_list.png')}
            showTxt="您是企业负责人，默认已拥有所有权限"
          />
        )}
        {authList.length > 0 && (
          <table style={{ width: '100%' }}>
            <tbody>
              {authList.map((mainModule: MainItemProps, i: number) => {
                return (
                  <tr key={mainModule.id}>
                    <td className="authModule">{mainModule.name}</td>
                    <td>
                      {mainModule.functionModels.map((moduleList: ModuleListItem, index: number) => {
                        return (
                          <div className="authCheckContent" key={moduleList.id}>
                            <div className="detailItems">{moduleList.functionName}</div>
                            <div className="permissItem">
                              <Checkbox
                                // defaultChecked={isCheckedAll(moduleList.permissionModels)}
                                disabled={isCheckedAll(moduleList.permissionModels)}
                                checked={checkedAllStatus.length > 0 && checkedAllStatus[i][index]}
                                onChange={e => {
                                  handleCheckAll(e, i, index, moduleList.permissionModels)
                                }}
                              >
                                全选
                              </Checkbox>
                              {moduleList.permissionModels.map((item: AuthItemProps) => {
                                return (
                                  <div key={item.id}>
                                    {/* 未设置数据范围，可设置 */}
                                    {rangeId.includes(item.id) && !item.dataPermissionModel && (
                                      <Checkbox
                                        defaultChecked={item.isChecked === 1 ? true : false}
                                        disabled={item.isChecked === 1 || item.isChecked === -1 ? true : false}
                                        checked={
                                          item.isChecked === 1 || permissionIds.includes(item.id) ? true : false
                                        }
                                        onChange={e => checkChange(e, item)}
                                      >
                                        <span>{item.permissionName}</span>
                                        <span
                                          className="dataRanges"
                                          onClick={() => {
                                            setModalVisible(true)
                                            setPermissionType(item.dataPermissionType)
                                          }}
                                        >
                                          <i></i>设置数据范围
                                        </span>
                                      </Checkbox>
                                    )}
                                    {item.dataPermissionModel && (
                                      <Checkbox
                                        defaultChecked={item.isChecked === 1 ? true : false}
                                        disabled={item.isChecked === 1 || item.isChecked === -1 ? true : false}
                                        checked={
                                          item.isChecked === 1 || permissionIds.includes(item.id) ? true : false
                                        }
                                        onChange={e => checkChange(e, item)}
                                      >
                                        <span>{item.permissionName}</span>

                                        {/* 已设置数据范围 */}
                                        <Tooltip placement="top" title={showRange(item.dataPermissionModel)}>
                                          <span
                                            className="dataRanges"
                                            onClick={() => {
                                              setModalVisible(true)
                                              setPermissionType(item.dataPermissionType)
                                            }}
                                          >
                                            <i></i>设置数据范围（{showRange(item.dataPermissionModel)}）
                                          </span>
                                        </Tooltip>
                                      </Checkbox>
                                    )}

                                    {/* 已拥有的权限设tooltips提示 */}
                                    {!rangeId.includes(item.id) && !item.dataPermissionModel ? (
                                      <Tooltip
                                        placement="top"
                                        title={
                                          item.isChecked
                                            ? setTime(item.grantType, item.grantValue, item.remainValue)
                                            : ''
                                        }
                                        className="toolTisValue"
                                      >
                                        <Checkbox
                                          defaultChecked={item.isChecked === 1 ? true : false}
                                          disabled={
                                            item.isChecked === 1 || item.isChecked === -1 ? true : false
                                          }
                                          checked={
                                            item.isChecked === 1 || permissionIds.includes(item.id)
                                              ? true
                                              : false
                                          }
                                          onChange={e => checkChange(e, item)}
                                        >
                                          <span>{item.permissionName}</span>
                                        </Checkbox>
                                      </Tooltip>
                                    ) : (
                                      ''
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {authList.length > 0 && (
        <Button onClick={applyAuth} className="submitBtn">
          申请权限
        </Button>
      )}
      {modalVisible && (
        <DataRange
          visible={modalVisible}
          permissionType={permissionType}
          closeModal={() => setModalVisible(false)}
          setRangeData={(addRangeData, permissionId) => {
            setRangeData(addRangeData)
            setpPermissionId(permissionId)
          }}
        />
      )}
    </Spin>
  )
}

export default AuthManage
