import React, { useContext, useEffect } from 'react'
import { filterData, judeTypeText } from './dynamicCom'
import $c from 'classnames'
import { DetailContext, taskDetailContext } from '../taskDetails/detailRight'

const LogItem = ({ logItem, action }: any) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { ratingType } = taskDetailObj.mainData
  const numTypeObj = {
    3: {
      lable: '困难度较高几乎不可能实现',
      grade: `${ratingType == 1 ? '1' : '100'} 分`,
      style: { backgroundColor: '#fef3f2', color: '#f44236' },
    },
    2: {
      lable: '希望达成的程度，虽然困难但能实现',
      grade: `${ratingType == 1 ? '0.6-0.7' : '60-70'} 分`,
      style: { backgroundColor: '#e5f7e8', color: '#61d580' },
    },
    1: {
      lable: '肯定能达到，只要很少的帮助或不需要',
      grade: `${ratingType == 1 ? '0.3' : '30'} 分`,
      style: { backgroundColor: '#f2f4ff', color: '#3949ab' },
    },
  }
  // /** 1分制 还是 100分制 */
  // useEffect(() => {
  //   num = ratingType
  // }, [])

  return (
    <>
      <div className={$c(`onelevl_change_item logType${logItem.type}`, { canHover: logItem.type == 2 })}>
        {/* 根据 type 动态显示  */}
        {/* {logItem.type != 2 && logItem.type != 7 && */}
        {logItem.type == 29 && logItem.scoreType && (
          <div className="grades flex">
            <span className="onelevl_change_type">{judeTypeText(logItem.type)}</span>
            {/* 之前 */}
            <div className="grade old_grade flex">
              <div className="grade_left">
                <span className="fen" style={numTypeObj[logItem.scoreType].style}>
                  {numTypeObj[logItem.scoreType].grade}
                </span>
              </div>
              <div className="grade_right">
                <div className="grade_top">{numTypeObj[logItem.scoreType].lable}</div>
                {logItem.before && <div className="grade_bottom">{logItem.before}</div>}
              </div>
            </div>
            {/* ---> */}
            <div className="arrows"></div>
            {/* 之后 */}
            <div className="grade new_grade flex">
              <div className="grade_left">
                <span className="fen" style={numTypeObj[logItem.scoreType].style}>
                  {numTypeObj[logItem.scoreType].grade}
                </span>
              </div>
              <div className="grade_right">
                <div className="grade_top">{numTypeObj[logItem.scoreType].lable}</div>
                <div className="grade_bottom">{logItem.after}</div>
              </div>
            </div>
          </div>
        )}
        {logItem.type != 29 && (
          <>
            <span className="onelevl_change_type">{judeTypeText(logItem.type)}</span>
            {logItem.type != 6 && (
              <>
                {logItem.type == 2 && (
                  <div
                    className="onelevl_descript_old"
                    dangerouslySetInnerHTML={{ __html: filterData(logItem.type, logItem.before) }}
                    onClick={() => {
                      action(logItem.before, 0, true)
                    }}
                  ></div>
                )}
                {logItem.type != 2 && (
                  <>
                    {logItem.type == 27 && <span className="log_heart log_heart_old"></span>}
                    {/* {logItem.type == 29 && <div>1111</div>}
                {logItem.type != 29 && ( */}
                    <span
                      className={$c(`onelevl_change_old 
                ${logItem.type}`)}
                      style={logItem.type == 25 ? { textDecoration: 'none' } : {}}
                      dangerouslySetInnerHTML={{ __html: filterData(logItem.type, logItem.before) }}
                    ></span>
                    {/* // )} */}
                  </>
                )}
                <span className="onelevl_change_icon"></span>
              </>
            )}
            {logItem.type == 2 && (
              <div
                className="onelevl_descript_new"
                dangerouslySetInnerHTML={{ __html: filterData(logItem.type, logItem.after) }}
                onClick={() => {
                  action(logItem.after, 1, true)
                }}
              ></div>
            )}
            {logItem.type != 2 && (
              <>
                {logItem.type == 27 && <span className="log_heart log_heart_new"></span>}
                <span
                  className={$c(`onelevl_change_new logType${logItem.type}`)}
                  dangerouslySetInnerHTML={{ __html: filterData(logItem.type, logItem.after) }}
                ></span>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default LogItem
