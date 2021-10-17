/**
 * 我的应用空白页
 */
import React, { useEffect, useState } from 'react'
import './my-app.less'

const MyAppBlank = () => {
  return (
    <div className="odoo_app_blank_container" style={{ width: '100%', height: '100%', display: 'flex' }}>
      <div style={{ alignSelf: 'center', textAlign: 'center', margin: 'auto' }}>
        <img src={$tools.asAssetsPath('/images/my-app/blank.png')} />
        <p>未开通应用!!!</p>
      </div>
    </div>
  )
}

export default MyAppBlank
