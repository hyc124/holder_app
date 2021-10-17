import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import './OkrSetting.less'
import { Form, Input, InputNumber, message, Modal, Radio, Select, Spin, Switch, Tabs } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { requestApi } from '@/src/common/js/ajax'
import { langTypeHandle } from '@/src/common/js/common'
import { OkrPeriodBasicSet, PeriodManage } from './okrPeriodSetConts'
import { saveOkrEnableApi } from './okrPeriodSetApi'
//过滤 inputNumber 只能输入整数字
const limitDecimals = (value: any) => {
  const _value = value.replace(/^(0+)|[^\d]+/g, '')
  return _value
}

const { TabPane } = Tabs

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}
// 缓存周期选择列表
let periodDatas = {}
// 缓存编辑前周期规则数据
let periodRuleInit = {}
// 记录刚开启okr周期时（刚开启时需要设置周期管理，否则开启不生效）
export let enableOkrInfo: any = { from: '' }
export const setEnableOkrInfo = (paramObj: any) => {
  enableOkrInfo = { ...enableOkrInfo, ...paramObj }
}
// periodDatas = {
//   1: [
//     {
//       periodText: '2021年01月',
//       startDate: '2021-01',
//     },
//   ],
//   2: [
//     {
//       periodText: '2021年01月',
//       startDate: '2021-01',
//     },
//   ],
// }
// okr设置组件
const OkrSetting = ({ params }: any) => {
  const lang = langTypeHandle({ type: 0 })
  const { visible, teamId, onCancel } = params
  const [datas, setDatas] = useState<any>({
    // tabKey: circleAuth ? '1' : '2',
    tabKey: '0',
    rating: 1, //评分类型
    okrEnable: false,
    // 周期管理标签下显示的组件内容
    periodMgType: 0,
  })
  const [loading, setLoading] = useState(false)

  // 周期管理规则设置组件
  const periodRuleRef = useRef<any>({})

  // const [form] = Form.useForm()
  useEffect(() => {
    clearTmp()
    queryOkrEnable().then((data: any) => {
      setDatas({ ...datas, okrEnable: data.data || false })
    })
    // queryPeriodList()
    // // queryPeriodSet()
    // queryRating()

    // form.setFieldsValue({ ...initState })
    return () => {
      clearTmp()
    }
  }, [])
  /**
   * 清空缓存
   */
  const clearTmp = () => {
    periodDatas = {}
    periodRuleInit = {}
    enableOkrInfo = {}
  }
  // 提交周期配置表单
  const onFinish = (values: any) => {
    // console.log(values)
    if (!values.periodType) return message.warning($intl.get('periodLenReq'))
    if (!values.startTime) return message.warning($intl.get('periodFirstReq'))
    if (!values.advanceNum || values.advanceNum < 1 || !values.advanceType)
      return message.warning($intl.get('periodLeastReq'))
    const param = {
      ...values,
      ascriptionId: teamId,
    }
    setLoading(true)
    requestApi({
      url: '/task/okr/period/save',
      param: param,
      json: true,
      apiType: 1,
    }).then((res: any) => {
      setLoading(false)
      if (res.success) {
        message.success($intl.get('updateSuc'))
        // params.changData = true
        // onSure(params.changData)
        // 关闭后回到基础设置
        parentSetState({ periodMgType: 0 })
      }
    })
  }

  // 提交评分请求
  const updateRating = (value: number) => {
    return new Promise((resolve: any) => {
      const param = {
        ascriptionId: teamId,
        ratingType: value,
      }
      requestApi({
        url: '/task/okr/rating/save',
        param: param,
        json: true,
      }).then((res: any) => {
        resolve(res.data)
        if (res.success) {
          params.changData = true
          message.success($intl.get('updateSuc'))
        }
      })
    })
  }

  /**
   * 查询是否启用okr
   */
  const queryOkrEnable = () => {
    return new Promise((resolve: any) => {
      const param = {
        ascriptionId: teamId,
      }
      requestApi({
        url: '/task/okr/enable/find',
        param,
        apiType: 1,
      }).then((res: any) => {
        // console.log(res.data)
        resolve(res.data)
      })
    })
  }

  /**
   * 子组件设置当前组件state
   */
  const parentSetState = (paramObj: any) => {
    setDatas({ ...datas, ...paramObj })
  }

  /**
   * 获取父组件state
   */
  const getParentState = () => {
    return { ...datas }
  }
  /**
   * 切换tab
   */
  const tabChange = async (key: string) => {
    if (key == '0') {
      queryOkrEnable().then((res: any) => {
        setDatas({ ...datas, tabKey: key, okrEnable: res.data })
      })
    } else {
      setDatas({ ...datas, tabKey: key })
    }
  }
  return (
    <>
      <Modal
        title={$intl.get('OKRSet')}
        visible={visible}
        centered={true}
        width={'auto'}
        onCancel={() => {
          if (enableOkrInfo.from == 'enableOpt' && !enableOkrInfo.saved) {
            Modal.confirm({
              title: '提醒',
              icon: <ExclamationCircleOutlined />,
              content: '您未保存设置周期，关闭后将不会开启周期，确定关闭吗？',
              centered: true,
              onOk() {
                enableOkrInfo = {}
                saveOkrEnableApi({ teamId }).then(() => {
                  onCancel(true)
                })
              },
            })
          } else {
            onCancel(true)
          }
        }}
        onOk={() => {
          // 标记已保存
          enableOkrInfo.saved = true
          const form: any = periodRuleRef.current && periodRuleRef.current.getForm()
          onFinish(form.getFieldsValue())
        }}
        okText={$intl.get('Save')}
        cancelText={$intl.get('cancel')}
        maskClosable={false}
        keyboard={false}
        className={`OkrsettingModal ${lang} ${datas.tabKey == 1 && datas.periodMgType == 1 ? '' : 'nofooter'}`}
      >
        <Spin spinning={loading} tip={$intl.get('loadingWait')}>
          <Tabs
            activeKey={datas.tabKey}
            tabPosition={'left'}
            style={{ height: '100%' }}
            onChange={(key: string) => {
              tabChange(key)
            }}
          >
            {/* 基础设置 */}
            <TabPane tab={$intl.get('basicSetup')} key={0}>
              {datas.tabKey == '0' ? (
                <OkrPeriodBasicSet
                  parentSetState={parentSetState}
                  okrEnable={datas.okrEnable}
                  teamId={teamId}
                />
              ) : (
                ''
              )}
            </TabPane>
            {/* 周期管理 periodMgType:1-显示周期规则设置 0-周期管理表格*/}
            {datas.okrEnable && (
              <TabPane tab={$intl.get('periodManage')} key={1}>
                {datas.tabKey == '1' && datas.periodMgType == 1 ? (
                  <PeriodRuleSet
                    ref={periodRuleRef}
                    // form={form}
                    onFinish={onFinish}
                    parentSetState={parentSetState}
                    teamId={teamId}
                    setLoading={setLoading}
                    getParentState={getParentState}
                  />
                ) : (
                  datas.tabKey == '1' && <PeriodManage parentSetState={parentSetState} teamId={teamId} />
                )}
              </TabPane>
            )}
            {datas.okrEnable && (
              <TabPane tab={$intl.get('gradeManage')} key={2}>
                {datas.tabKey == '2' && (
                  <ScoreManageCom
                    visible={datas.tabKey == '2' ? true : false}
                    teamId={teamId}
                    updateRating={updateRating}
                  />
                )}
              </TabPane>
            )}
          </Tabs>
        </Spin>
      </Modal>
    </>
  )
}

/**
 * 周期规则设置
 */
export const PeriodRuleSet = forwardRef(
  ({ onFinish, parentSetState, teamId, setLoading, getParentState }: any, ref) => {
    const [form] = Form.useForm()
    useEffect(() => {
      queryPeriodList()
      return () => {
        periodRuleInit = {}
      }
    }, [])

    /**
     * 暴露给父组件的方法*
     */
    useImperativeHandle(ref, () => ({
      /**
       * 获取内部form
       */
      getFieldsValue: () => {
        return form.getFieldsValue()
      },
      getForm: () => {
        return form
      },
    }))

    // 查询周期list
    const queryPeriodList = () => {
      return new Promise((resolve: any) => {
        setLoading(true)
        const param = {
          ascriptionId: teamId,
        }
        requestApi({
          url: '/task/okr/period/selectList',
          param: param,
          apiType: 1,
        }).then((res: any) => {
          setLoading(false)
          resolve(res.data)
          if (res.success) {
            periodDatas = res.data.data
            queryPeriodSet()
          }
        })
      })
    }

    // 查询周期配置
    const queryPeriodSet = () => {
      const param = {
        ascriptionId: teamId,
      }
      requestApi({
        url: '/task/okr/period/query',
        param: param,
        apiType: 1,
      }).then((res: any) => {
        setLoading(false)
        if (res.success) {
          form.setFieldsValue({ ...res.data.data })
          periodRuleInit = { ...res.data.data }
        }
      })
    }

    /**
     * 跳转到周期管理设置表格列表
     */
    const goBack = () => {
      if (enableOkrInfo.from == 'enableOpt' && !enableOkrInfo.saved) {
        const { okrEnable } = getParentState()
        Modal.confirm({
          title: '提醒',
          icon: <ExclamationCircleOutlined />,
          content: '您未保存设置周期，关闭后将不会开启周期，确定关闭吗？',
          centered: true,
          onOk() {
            enableOkrInfo = {}
            saveOkrEnableApi({ teamId }).then(() => {
              // 关闭后回到基础设置
              parentSetState({ tabKey: '0', okrEnable: !okrEnable })
            })
          },
        })
      } else {
        // periodRuleInit
        const isChange = getIsChange({ initData: periodRuleInit, newData: form.getFieldsValue() })
        if (isChange) {
          Modal.confirm({
            title: '提醒',
            icon: <ExclamationCircleOutlined />,
            content: '修改还未保存，确定离开吗？',
            centered: true,
            onOk() {
              parentSetState({ periodMgType: 0 })
            },
          })
        } else {
          parentSetState({ periodMgType: 0 })
        }
      }
    }
    /**
     * 是否编辑了数据
     */
    const getIsChange = ({ initData, newData }: { initData: any; newData: any }) => {
      let change = false
      if (
        initData.periodType != newData.periodType ||
        initData.periodText != newData.periodText ||
        initData.advanceNum != newData.advanceNum ||
        initData.advanceType != newData.advanceType ||
        initData.enableYearOkr != newData.enableYearOkr
      ) {
        change = true
      }
      return change
    }

    return (
      <>
        {/* 头部返回按钮 */}
        <div className="back_btn" onClick={() => goBack()}>
          <em className="img_icon back_icon"></em>
          <span>返回</span>
        </div>
        {/* 表单 */}
        <Form {...layout} form={form} onFinish={onFinish}>
          <Form.Item name={'periodType'} label={$intl.get('OKRPeriodLen') + ':'} className="rest-radio">
            <Radio.Group
              // defaultValue={form.getFieldValue('periodType')}
              onChange={(e: any) => {
                const options = periodDatas[form.getFieldValue('periodType')] || []
                const firstItem = options[0] || {}
                const _startTime = options.length > 0 ? options[0].startDate : ''
                form.setFieldsValue({
                  periodType: e.target.value,
                  startTime: _startTime,
                  periodText: firstItem.periodText || '',
                })
              }}
            >
              <Radio value={1}>{$intl.get('monthNum', { month: 1 })}</Radio>
              <Radio value={2}>{$intl.get('monthNum', { month: 2 })}</Radio>
              <Radio value={3}>
                {$intl.get('monthNum', { month: 3 })}({$intl.get('quarter')})
              </Radio>
              <Radio value={4}>{$intl.get('monthNum', { month: 4 })}</Radio>
              <Radio value={6}>{$intl.get('halfYear')}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues: any, curValues: any) => {
              return prevValues.periodType !== curValues.periodType
            }}
          >
            {() => {
              const options = periodDatas[form.getFieldValue('periodType')] || []
              return (
                <Form.Item name={'startTime'} label={$intl.get('firstPeriod') + ':'}>
                  <Select
                    placeholder={$intl.get('periodFirstReq')}
                    onChange={(_: any, item: any) => {
                      form.setFieldsValue({ periodText: item.children })
                    }}
                  >
                    {options.map((item: any, index: number) => (
                      <Select.Option key={index} value={item.startDate}>
                        {item.periodText}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )
            }}
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues: any, curValues: any) => {
              return prevValues.advanceType != curValues.advanceType ||
                prevValues.advanceNum != curValues.advanceNum
                ? true
                : false
            }}
          >
            {() => {
              return (
                <Form.Item name={'advanceNum'} label={$intl.get('newPeriodShow') + ':'}>
                  <div className="row-box">
                    <span className="row-label">{$intl.get('beforeLastPeriod')}</span>
                    <InputNumber
                      // defaultValue={15}
                      max={180}
                      min={1}
                      maxLength={3}
                      formatter={limitDecimals}
                      parser={limitDecimals}
                      value={form.getFieldValue('advanceNum')}
                      onChange={(value: any) => {
                        form.setFieldsValue({ advanceNum: value })
                      }}
                      style={{
                        marginLeft: 12,
                        marginRight: 32,
                      }}
                    />
                    <Select
                      value={form.getFieldValue('advanceType')}
                      style={{ width: 120 }}
                      onChange={(value: number) => {
                        form.setFieldsValue({ advanceType: value })
                      }}
                    >
                      <Select.Option value={1}>{$intl.get('day')}</Select.Option>
                      <Select.Option value={2}>{$intl.get('month')}</Select.Option>
                    </Select>
                  </div>
                </Form.Item>
              )
            }}
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues: any, curValues: any) => {
              return prevValues.enableYearOkr != curValues.enableYearOkr
            }}
          >
            {() => {
              return (
                <Form.Item
                  labelCol={{ span: 3 }}
                  wrapperCol={{ span: 21 }}
                  name={'enableYearOkr'}
                  label={`${$intl.get('annualOkr')}:`}
                >
                  <Switch
                    checked={form.getFieldValue('enableYearOkr')}
                    onChange={(checked: boolean) => {
                      form.setFieldsValue({ enableYearOkr: checked })
                    }}
                  />
                </Form.Item>
              )
            }}
          </Form.Item>
          <Form.Item hidden name={'advanceType'} label={$intl.get('periodType')}>
            <Input />
          </Form.Item>
          <Form.Item hidden name={'periodText'}>
            <Input />
          </Form.Item>
        </Form>
      </>
    )
  }
)
/**
 * 打分管理组件
 */
export const ScoreManageCom = ({ visible, teamId, updateRating }: any) => {
  const [state, setState] = useState({
    rating: 1, //评分类型
  })
  useEffect(() => {
    if (visible) {
      queryRating()
    }
  }, [visible])

  // 查询评分请求
  const queryRating = () => {
    return new Promise((resolve: any) => {
      const param = {
        ascriptionId: teamId,
      }
      requestApi({
        url: '/task/okr/rating/query',
        param: param,
      }).then((res: any) => {
        resolve(res.data)
        if (res.success) {
          setState({ ...state, rating: res.data.data })
        }
      })
    })
  }
  return (
    <div className="score-box">
      <div className="score-title">{$intl.get('OKRGradeSys')}</div>
      <div className="score-content">
        <Radio.Group
          name="radiogroup"
          value={state.rating}
          onChange={(e: any) => {
            setState({ ...state, rating: e.target.value })
            updateRating(e.target.value)
          }}
        >
          <Radio value={1}>
            <div className="radio-label">
              <p className="label-title">{$intl.get('commonGradeSys')}</p>
              <p className="sub-label">{$intl.get('GradeSysDetail')}</p>
            </div>
          </Radio>
          <Radio value={100}>
            <div className="radio-label">
              <p className="label-title">{$intl.get('GradeFullSys')}</p>
            </div>
          </Radio>
        </Radio.Group>
      </div>
    </div>
  )
}
export default OkrSetting
