import React, { useEffect, useState, useReducer } from 'react'
import { Tabs, Button } from 'antd'
import $c from 'classnames'
import GetNextStatus from '../GetNextStatus'
interface CodeItem {
  code: number
  status: number
  name: string
  isUse: number
}
const getTableList = {
  fourParBtn: [],
}
const { TabPane } = Tabs
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    //待处理
    case '4':
      return { ...state, fourParBtn: action.data }
    default:
      return state
  }
}

const FourStatus = (props: any) => {
  const { action } = props
  const [getStatus, setGetData] = useState(false)
  const [state, dispatch] = useReducer(reducer, getTableList)
  const [getTypeId, setTypeId] = useState(0)
  useEffect(() => {
    if (props) {
      dispatch({ type: '4', data: props.tableDataList })
      if (props.data.dataList && props.data.dataList.length > 0) {
        if (
          props.data.dataList.filter((element: any) => element.id == $store.getState().nowUserId).length == 0
        ) {
          props.data.status = true
        }
      }
      setTypeId(props.data.typeId)
      setGetData(props.data.status)
    }
  }, [props])
  const createNowHtml = () => {
    let addData = true
    state.fourParBtn.forEach((value: any) => {
      if (!value.id) {
        addData = false
      }
    })
    if (addData) {
      state.fourParBtn.unshift({
        content: '',
        id: 0,
        rgb: '#4285F4',
      })
      dispatch({ type: '4', data: state.fourParBtn })
    }
  }
  return (
    <Tabs
      key="4"
      className="quadrant-part part-next-status"
      data-type={4}
      renderTabBar={(props: any, DefaultTabBar: any) => (
        <div className="flex center-v quadrant-header">
          <div className="quadrant-header-title">
            <h3>{$intl.get('statusNorm')}</h3>
          </div>
          <div className="module-btn-display">
            {state.fourParBtn.length > 0 && (
              <Button
                className="quadrant-header-btn"
                style={getStatus ? { display: 'none' } : {}}
                onClick={() => createNowHtml()}
              >
                <i></i>
                {$intl.get('createIndicators')}
              </Button>
            )}
          </div>
        </div>
      )}
      draggable={'false'}
    >
      <TabPane className={$c({ 'module-none-padding': false })}>
        <div className="module-content part-next-status-content">
          <div className="table-responsive taskListBox quadrantBordData">
            <GetNextStatus
              statusData={state.fourParBtn}
              getChildrenMsg={action.getChildrenMsg}
              getstatus={getStatus}
              typeId={getTypeId}
            />
          </div>
        </div>
      </TabPane>
    </Tabs>
  )
}
export default FourStatus
