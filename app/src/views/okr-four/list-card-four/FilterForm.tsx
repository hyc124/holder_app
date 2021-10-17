import React, { useEffect, useState } from 'react'

export const FilterForm = (props: any) => {
  const { teamId, planTypeActive, search, periodItem, dataCom } = props.filterData
  const isShowFilter = props.isShowFilter
  const sortArrInt = [
    { key: 0, name: '降序排列', active: true },
    { key: 1, name: '升序排列', active: false },
  ]
  const gradesArrInt = [
    { key: 2, name: '公司级', active: false },
    { key: 3, name: '部门级', active: false },
    { key: 0, name: '个人级', active: false },
  ]
  const processArrInt = [
    { key: 0, name: '正常', active: false },
    { key: 1, name: '有风险', active: false },
    { key: 2, name: '超前', active: false },
    { key: 3, name: '延迟', active: false },
  ]
  const scoresComIntArrInt = [
    { key: 0, name: '0 - 40', active: false },
    { key: 1, name: '40 - 80', active: false },
    { key: 2, name: '80 - 100', active: false },
  ]
  const scoresComDotArrInt = [
    { key: 0, name: '0 - 0.4', active: false },
    { key: 1, name: '0.4 - 0.8', active: false },
    { key: 2, name: '0.8-1.0', active: false },
  ]
  const scoresArrInt = [
    { key: 0, type: 'all', min: 0, max: 0.4, name: '0(0) - 0.4(40)', active: false },
    { key: 1, type: 'all', min: 0.4, max: 0.8, name: '0.4(40) - 0.8(80)', active: false },
    { key: 2, type: 'all', min: 0.8, max: 1.0, name: '0.8(80)-1.0(100)', active: false },
  ]
  const cciArrInt = [
    { key: 0, name: '0 - 4', active: false },
    { key: 1, name: '5 - 8', active: false },
    { key: 2, name: '9 - 10', active: false },
  ]
  const [state, setState] = useState<any>({
    sortType: 0, //0：降序，1：升序
    grades: [], //0:个人级，2：公司级，3.部门级
    processStates: [], //进度状态 0:正常，1：有风险，2：超前，3：延迟
    scores: [], //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
    cci: [], //(1-4)-0 (5-8)-1 (9-10)-2
    sortTypeArr: sortArrInt,
    gradesArr: gradesArrInt,
    processStatesArr: processArrInt,
    scoresArr: scoresArrInt,
    cciArr: cciArrInt,
  })
  useEffect(() => {
    //重置
    resetFilter()
  }, [teamId, search])
  useEffect(() => {
    if (periodItem?.ratingType == 100) {
      state.scoresArr = scoresComIntArrInt
      // setState({ ...state, scoresArr: scoresComIntArrInt })
    } else if (periodItem?.ratingType == 1) {
      // setState({ ...state, scoresArr: scoresComDotArrInt })
      state.scoresArr = scoresComDotArrInt
    } else {
      // setState({ ...state, scoresArr: scoresArrInt })
      state.scoresArr = scoresArrInt
    }
  }, [periodItem])
  //选中后处理数据
  const setForm = (type: string, item: any, index: number) => {
    //1:按创建时间，2：按级别；3：按状态；4：按打分；5：按信心指数
    // typeList[i].active ? (typeList[i].active = false) : (typeList[i].active = true)
    // setTypeList([...typeList])
    if (type == 'sortTypeArr') {
      //按创建时间单选
      state[type].forEach((it: { key: any; active: boolean }, key: any) => {
        if (key == index) {
          it.active = true
        } else {
          it.active = false
        }
      })
      state.sortTypeArr.forEach((dataItem: any) => {
        if (dataItem.active) {
          state.sortType = dataItem.key
        }
      })
      setState({
        ...state,
      })
    } else {
      //其他多选筛选通过传入的type设置对应arr和缓存的选中数据
      state[type][index].active ? (state[type][index].active = false) : (state[type][index].active = true)
      setState({
        ...state,
        [type]: state[type],
      })
      //修改缓存的筛选数据
      // 删除type字符串后三位修改缓存值
      const typeName = type.substring(0, type.length - 3)
      const newArr: any[] = []
      state[type].forEach((dataItem: any) => {
        if (dataItem.active) {
          newArr.push(dataItem.key)
        }
      })
      state[typeName] = newArr
      setState({
        ...state,
      })
    }
    handleDataParam()
  }
  //处理数据调用父级接口
  const handleDataParam = () => {
    const filterObj = {
      searchVal: search, //搜索
      sortType: state.sortType, ///0：降序，1：升序
      grades: state.grades, //0:个人级，2：公司级，3.部门级
      processStates: state.processStates, //进度状态 0:正常，1：有风险，2：超前，3：延迟
      scores: state.scores, //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
      cci: state.cci, //(1-4)-0 (5-8)-1 (9-10)-2
      statusList: [4, 3, 1, 5], //之前版本筛选状态，现后台不用传但前端仍需要
    }

    if (props.afterFilter) {
      props.afterFilter({ ...filterObj })
    }
  }

  //重置
  const resetFilter = () => {
    state.sortType = 0 //0：降序，1：升序
    state.grades = [] //0:个人级，2：公司级，3.部门级
    state.processStates = [] //进度状态 0:正常，1：有风险，2：超前，3：延迟
    state.scores = [] //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
    state.cci = [] //(1-4)-0 (5-8)-1 (9-10)-2
    state.sortTypeArr = sortArrInt
    state.gradesArr = gradesArrInt
    state.processStatesArr = processArrInt
    state.scoresArr = teamId ? scoresComDotArrInt : scoresArrInt
    state.cciArr = cciArrInt
    if (periodItem?.ratingType == 100) {
      state.scoresArr = scoresComIntArrInt
      // setState({ ...state, scoresArr: scoresComIntArrInt })
    } else if (periodItem?.ratingType == 1) {
      // setState({ ...state, scoresArr: scoresComDotArrInt })
      state.scoresArr = scoresComDotArrInt
    } else {
      // setState({ ...state, scoresArr: scoresArrInt })
      state.scoresArr = scoresArrInt
    }
    setState({ ...state })
  }
  return (
    <div className="filter_content">
      <div>
        <div>
          <span className="title">按创建时间(单选)</span>
          <ul className="flex filter_menu">
            {state.sortTypeArr.map((item: any, index: any) => {
              return (
                <li
                  onClick={() => {
                    setForm('sortTypeArr', item, index)
                  }}
                  className={`filter_item w80 ${item.active ? 'active' : ''}`}
                  key={index}
                >
                  <span>{item.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <span className="title">按级别(多选)</span>
          <ul className="flex filter_menu">
            {state.gradesArr.map((item: any, index: any) => {
              return (
                <li
                  onClick={() => {
                    setForm('gradesArr', item, index)
                  }}
                  className={`filter_item w80 ${item.active ? 'active' : ''}`}
                  key={index}
                >
                  <span>{item.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <span className="title">按状态(多选)</span>
          <ul className="flex filter_menu">
            {state.processStatesArr.map((item: any, index: any) => {
              return (
                <li
                  onClick={() => {
                    setForm('processStatesArr', item, index)
                  }}
                  className={`filter_item w80 ${item.active ? 'active' : ''}`}
                  key={index}
                >
                  <span>{item.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <span className="title">按打分(多选)</span>
          <ul className="flex filter_menu">
            {state.scoresArr.map((item: any, index: any) => {
              return (
                <React.Fragment key={index}>
                  {item.type && (
                    <li
                      onClick={() => {
                        setForm('scoresArr', item, index)
                      }}
                      className={`filter_item w112 ${item.active ? 'active' : ''}`}
                      key={index}
                    >
                      <span>{item.min}</span>
                      <span className="grayTxt">({item.min * 100})</span>
                      <span>-</span>
                      <span>{item.max == 1.0 ? '1.0' : item.max}</span>
                      <span className="grayTxt">({item.max * 100})</span>
                    </li>
                  )}
                  {!item.type && (
                    <li
                      onClick={() => {
                        setForm('scoresArr', item, index)
                      }}
                      className={`filter_item w112 ${item.active ? 'active' : ''}`}
                      key={index}
                    >
                      <span>{item.name}</span>
                    </li>
                  )}
                </React.Fragment>
              )
            })}
          </ul>
        </div>

        <div>
          <span className="title">按信心指数(多选)</span>
          <ul className="flex filter_menu">
            {state.cciArr.map((item: any, index: any) => {
              return (
                <li
                  onClick={() => {
                    setForm('cciArr', item, index)
                  }}
                  className={`filter_item w112 ${item.active ? 'active' : ''}`}
                  key={index}
                >
                  <span>{item.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <div className="reset_btn">
        <div
          onClick={() => {
            resetFilter()
            handleDataParam()
          }}
          className="reset_btn_box flex center"
        >
          <span className="reset_icon"></span>
          <span className="reset_txt flex center">重置</span>
        </div>
      </div>
    </div>
  )
}
