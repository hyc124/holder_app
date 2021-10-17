import path from 'path'

const devConfig = {
  host: '127.0.0.1',
  port: 13311,
  mainSource: path.resolve(__dirname, '../app/electron'),
  rendererSource: path.resolve(__dirname, '../app/src'),
  template: path.resolve(__dirname, '../app/src/index.html'),
  dist: path.resolve(__dirname, '../dist'),
  release: path.resolve(__dirname, '../release'),
  proxy: {},
  BUILD_ENV: 'dev',
  version: '5.3.3', //版本号
  env: {
    // dev 环境变量 (npm run dev 将使用此配置)
    dev: {
      variables: {
        PRODUCT_NAME_CH: '掌控者', //中文名
        PRODUCT_NAME: 'holder-test',
        API_PROTOCOL: 'http://',
        API_HOST: 'gateway.hp.goalgo.cn:42770',
        // API_HOST: '192.168.30.221:9080',
        // API_HOST: '192.168.30.119:9080', //TODO:
        // API_FILE_HOST: '110.185.107.104:5000', //附件
        API_FILE_HOST: 'https://office-test.holderzone.cn', //附件
        METABASE_URL: 'https://reax-dev.holderzone.cn', //matabase地址
        // BOSH_SERVICE: 'http://im.hp.goalgo.cn:32375',
        BOSH_SERVICE: 'http://im.hp.goalgo.cn:5280',
        ROOM_SERVICE: '@muc.im.hp.goalgo.cn',
        IPSUFFIX: '@im.hp.goalgo.cn',
        API_BASE_PATH: '',
        CLOUDDISK_SERVICE: 'cloudisk.goalgo.cn:31010',
        SOCKET_SERVER: 'http://gateway.hp.goalgo.cn:31070',
        ORG_URL: 'http://gateway.hp.goalgo.cn/',
        ODOO_MY_APP: 'http://hes.dev.goalgo.cn/goalgo_sync/auth/login',
        //升级地址: http://192.168.100.204:56145/minio/x86/upgrade.exe
        UPGRADE_URL: 'https://getup.holderzone.cn/',
        //增量更新服务器地址
        // PART_UPDATE_URL: 'https://getup.xyl.gold/oa/update/',
        PART_UPDATE_URL: 'https://getup.holderzone.cn/update/',
      },
    },
    // prod 环境变量 (npm run build 将使用此配置)
    prod: {
      variables: {
        PRODUCT_NAME_CH: '掌控者', //中文名
        PRODUCT_NAME: 'holder',
        API_PROTOCOL: 'http://',
        API_HOST: 'gateway.zx.goalgo.cn:31380',
        // API_FILE_HOST: '110.185.107.104:5000', //附件
        API_FILE_HOST: 'https://onlyoffice-accessory.holderzone.com/', //附件
        METABASE_URL: 'https://metabase.goalgo.cn', //matabase地址
        BOSH_SERVICE: 'http://im.zx.goalgo.cn:35280',
        ROOM_SERVICE: '@muc.im.zx.goalgo.cn',
        IPSUFFIX: '@im.zx.goalgo.cn',
        API_BASE_PATH: '',
        CLOUDDISK_SERVICE: 'cloudisk.goalgo.cn:31010',
        SOCKET_SERVER: 'http://gateway.zx.goalgo.cn:31117',
        ORG_URL: 'http://emb.prod.goalgo.cn/',
        ODOO_MY_APP: 'http://hes.goalgo.cn/goalgo_sync/auth/login',
        UPGRADE_URL: 'https://getup.goalgo.cn/oa/', //上线升级地址
        PART_UPDATE_URL: 'https://getup.goalgo.cn/oa/update/',
        // PART_UPDATE_URL: 'https://getup.holderzone.cn/update/', // 测试升级地址
        // UPGRADE_URL: 'https://getup.holderzone.cn/x86/', //测试升级地址
        // CSC_LINK: 'package.pfx',
        // WIN_CSC_KEY_PASSWORD: '111111',
      },
    },
  },
}

export default devConfig
