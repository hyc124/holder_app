import React from 'react'
import $c from 'classnames'

// 时间切换小组件
const WeekDateComp = ({ params }: any) => {
  const { dateArr, dateActive, isToDay, handele } = params

  return (
    <div className={$c('week_navbar', 'heightFull')}>
      {/* 年月展示 */}
      <div className={$c('week_navbar_item now_year_month')} onClick={() => {}} key={-3}>
        <span className={$c('w_n_d')}>{getNowYearMonth(2)}</span>
        <span className={$c('w_n_k')}>{getNowYearMonth(1)}</span>
      </div>
      {/* 左侧切换按钮 */}
      {/* <div
          className={$c('week_navbar_item week_navbar_item_left')}
          onClick={() => {
            const param = judeleftOrRighgt(dateActive, dateArr, -1)
            handele(param.index, param.day)
          }}
          key={-1}
        >
          <em className="icon left"></em>
        </div> */}
      {dateArr.map((item: { name: string; day: number; isToday: boolean }, index: number) => {
        return (
          <div
            className={$c('week_navbar_item', {
              'week-navbar-item-active': index == dateActive,
            })}
            onClick={() => {
              handele(index, item.day)
            }}
            key={index}
          >
            <span className={$c('w_n_d', { 'w-n-d-active': index == dateActive })}>{item.day}</span>
            <span className={$c('w_n_k', { 'w-n-k-active ': index == dateActive })}>{item.name}</span>

            {isToDay && dateActive == index && <span className="w_active_spot"></span>}
            {item.day == new Date().getDate() && !isToDay && <span className="w_active_spot"></span>}
          </div>
        )
      })}
      {/* 右侧切换按钮 */}
      {/* <div
          className={$c('week_navbar_item week_navbar_item_right')}
          onClick={() => {
            const param = judeleftOrRighgt(dateActive, dateArr)
            handele(param.index, param.day)
          }}
          key={-2}
        >
          <em className="icon right"></em>
        </div> */}
    </div>
  )
}
// 设置左右切换参数
// const judeleftOrRighgt = (dateActive: number, dateArr: any[], type?: number) => {
//   let index = 0
//   let day = 0
//   if (type) {
//     // 左侧
//     if (dateActive == 0) {
//       index = dateArr.length - 1
//     } else {
//       index = dateActive - 1
//     }
//   } else {
//     // 右侧
//     if (dateActive == dateArr.length - 1) {
//       index = 0
//     } else {
//       index = dateActive + 1
//     }
//   }
//   day = dateArr[index].day
//   return {
//     index,
//     day,
//   }
// }
// 获取当前年月
const getNowYearMonth = (type: number) => {
  const myDate = new Date()
  if (type == 1) {
    // 获取年份
    return myDate.getFullYear()
  } else if (type == 2) {
    // 获取月份
    let _date = String(myDate.getMonth() + 1)
    if (_date.length == 1) {
      _date = '0' + _date
    }
    return _date
  }
}
export default WeekDateComp
