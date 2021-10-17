declare namespace globalInterface {
  interface TaskListProps {
    id: number
    name: string
    ascriptionId: number
    ascriptionName: string
    status: number
    flag: number
    approvalStatus: number
    endTime: string
    level: number
    property: number
    cycleNum: number
    progress: { percent: number; color: number }
    subTaskCount: number
    type: number
    executeTime: string
    isDraft?: number
    icon?: string
    importRole?: any
    attach: {
      id: number
      typeId: number
      type: number
      typeName: string
      star: number
      setType: number
      profile: string
    }
    assignName?: string
    executorUser: number
    executorUsername: string
    profile: string
    today: boolean
    maxRole: number
    reportCount?: number
    planCount?: number
    opinionCount?: number
    tagList?: any[]
    childrenData?: any[] //前端需要展开树结构任务添加
    followNames?: any[]
    childLevel?: any
    parentId?: any
    periodText?: any
  }

  interface ChatListProps {
    id: number
    roomId: number
    ascriptionId: number
    ascriptionName: string
    roomName: string
    roomJid: string
    type: number
    typeId: number
    profile?: string
    subject: string
    belongOrg?: string
    windowClose?: number
    belongType: string
    belongTypeId: number
    talkType: number
    muc: string
    unreadCount: number
    remindType: number
    content: string
    time: string
    timeStamp?: number
    state: number
    mucRelationNoticeModel?: {
      mucRelationId: number
      noticeId?: number
      userAccount: string
      username: string
      content: string
      createTime: string
      headPhoto?: string
    } | null
    messageInfoModels: any[]
    personIdentity: number
    projectState: number
    identityId: number
    identityBelongType: number
    identityBelongId?: number
    identityBelongName?: string
    mucState: number
    userRead: number
    icon?: string
    isTop: number
    isFirst?: number
    online?: number
    isOpen: boolean
    deptId?: number
  }

  interface SelectMemberProps {
    account: string
    curId: number
    curName: string
    cmyId?: number | string
    cmyName?: string
    roleId?: number
    roleName?: string
    profile?: string
    chatUserType?: number
  }

  interface ChatItemProps {
    time: number
    serverTime: number
    content: string
    user?: string
    profile?: string
    likeId?: number
    commnetCount: number
    likeCount?: number
    readNum?: number
    unReadNum?: number
    unreadUserList: number[]
    isCollect?: number
    handleModel?: AnyObj
    isToday?: boolean
    isYesToday?: boolean
    day?: string
    messageEmojiAppraiseModel: string
    roomType: number
    type: number
    roomName: string
    messageCard: MessageCardProps
    msgUuid: string
    commentCount?: number
    isRecall: number
    fromUser: {
      userId: number
      username: string
    }
  }

  interface ChatRobotItemProps {
    time: number
    user?: string
    handleModel?: AnyObj
    isToday?: boolean
    isYesToday?: boolean
    day?: string
    roomType: number
    roomName: string
    messageCard: MessageCardProps
  }

  interface MessageCardProps {
    attachContentBottom: string
    attachContentTop: string
    noticeType: string
    title: string
    userId: number
    content: string
    createTime: number
    noticeTypeId: number
    secondLevelMessageType: string
    id: number
    notice: number
    enterpriseId: number
    enterpriseName: string
    contentTemp: string
  }

  interface QuoteMsgProps {
    id: number
    reportId?: number
    name: string
    type: number | string
    title: string
    val: string
    taskId: any
    teamId: any
    teamName: any
  }
  interface ChatContentProps {
    sendStatus: string
    type: number
    subType: number
    profile?: string
    from: string
    fromId: number
    fromAccount: string
    to: string
    roomName: string
    roomJid: string
    roomId: string
    roomType: string
    message: string
    time: number
    ascriptionId: string
    ascriptionType: string
    ascriptionName: string
    quoteMsg: QuoteMsgProps
    fileUrl: string
    fileSize: number
    fileName: string
    fileKey: string
    remindType: number
    isTop: number
    spareContent?: string
    replyMessageModel: {
      replyMessage: string
      replyMessageFromUser: string
      replyMessageFromId: number
      replyTimestamp: number
    }
    process?: number
    signType?: string
    commnetCount?: number
    officeUrl?: string
    fileGUID?: string
    fromUser?: {
      userId: number
      username: string
    }
    messageJson?: any
    // unreadUserList?:[]
  }
  //公告列表元素
  interface NoticeListItemProps {
    mucRelationId: number
    noticeId: number
    userAccount: string
    username: string
    content: string
    createTime: string
    headPhoto: string
  }

  export interface ModelListItemProps {
    id: number
    userId: number
    username: string
    userAccount: string
    profile?: string
    content: string
    createTime: string
    parentId?: number
    rootId?: number
    type: number
    childComments?: ModelListItemProps[]
    files: any[]
    updateState: number
  }

  interface DiscussItemProps {
    timestamp: number
    body: string
    sendUsername: string
    isRed: number
    messageModelList: ModelListItemProps[]
    count: number
    profile?: string
  }

  //收藏列表元素
  interface CollectItemProps {
    collectionId: number
    type: number
    body: string
    fileName: string
    fileSize: number
    dir: string
    uploadUser: string
    timestamp: number
    timeCollect: number
    time: string
    username: string
    profile?: string
  }

  //聊天室成员接口类型
  interface ChatMemberPorps {
    id: number
    chatRoomId: number
    userId: number
    username: string
    userName: string
    userAccount: string
    memberType: number
    account: string
    headPhoto: string
    userType: number
    onLine: number
    status: number
    sex: number
    registerType?: number
    attachStatus?: number
    hidePhoneNum?: number
    password?: string
    phoneNumber?: string
    email?: string
    joinDate?: string
    birthday?: string
    workNum?: number
    shortNum?: number
    abbre?: string
    pinyin?: string
    nickName?: string
    nickname?: string
    profile: string
    checked?: boolean
  }

  //工作规划数据格式
  interface WorkPlanTaskProps {
    periodText: ReactNode
    hasForce: number
    isOther: number
    id: number
    status: number
    name: string
    ascriptionType: number
    ascriptionId: number
    nodeText: string
    liableUser: number
    liableUsername: string
    roleId: number
    type: number
    typeId: number
    cci: number
    startTime: string
    endTime: string
    day: number
    process: number
    processStatus: number
    cycleNum: number
    taskFlag: number
    taskStatus: number
    taskType: number
    approvalStatus?: number
    processTimeStr?: any
    property: number
    files: number
    meetings: number
    hasChild: number
    children: []
    enterpriseId: number
    update: boolean
    liableUserProfile: string
    profile: string
    parentId: string
    parentTypeId: string
    isFollow: number
    icon: string
    themes: number
    countModel?: any
    mainId?: any
    enterpriseName?: any
    mainTypeId?: any
    teamId?: any
    teamName?: any
    lateCount?: any
    hasAuth?: any
    weights?: any
    score?: any
    topId?: any
    ascriptionName?: any
    isshowTask?: any
    ratingType?: any
    periodId?: number
  }

  interface EmojiAppraiseProps {
    emoticonName: string
    chatMessageJid: string
    operateUsername: string
    createTime?: number
    operateUserId: number
    id?: number
    timestamp: number
    status?: number
  }
}
