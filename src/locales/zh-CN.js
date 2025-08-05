export default {
  // 通用
  common: {
    confirm: '确定',
    cancel: '取消',
    save: '保存',
    reset: '重置',
    back: '返回',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
    close: '关闭',
    delete: '删除',
    edit: '编辑',
    view: '查看',
    search: '搜索',
    clear: '清除',
    refresh: '刷新',
    submit: '提交',
    upload: '上传',
    download: '下载',
    copy: '复制',
    paste: '粘贴',
    cut: '剪切',
    undo: '撤销',
    redo: '重做',
    select: '选择',
    selectAll: '全选',
    deselect: '取消选择',
    expand: '展开',
    collapse: '收起',
    next: '下一步',
    previous: '上一步',
    finish: '完成',
    skip: '跳过',
    retry: '重试',
    help: '帮助',
    about: '关于',
    settings: '设置',
    profile: '个人资料',
    logout: '退出登录',
    login: '登录',
    register: '注册'
  },

  // 应用标题和描述
  app: {
    title: 'AI图片生成器',
    subtitle: '基于人工智能的图片创作平台',
    description: '使用先进的AI技术，将您的创意转化为精美的图片作品'
  },

  // 登录页面
  login: {
    title: '欢迎回来',
    subtitle: '登录您的账户以继续使用',
    username: '用户名',
    password: '密码',
    rememberMe: '记住我',
    forgotPassword: '忘记密码？',
    loginButton: '登录',
    registerLink: '还没有账户？立即注册',
    usernameRequired: '请输入用户名',
    passwordRequired: '请输入密码',
    loginSuccess: '登录成功！',
    loginFailed: '登录失败，请检查用户名和密码'
  },

  // 注册页面
  register: {
    title: '创建新账户',
    subtitle: '加入我们，开始您的AI创作之旅',
    username: '用户名',
    email: '邮箱地址',
    password: '密码',
    confirmPassword: '确认密码',
    registerButton: '注册',
    loginLink: '已有账户？立即登录',
    usernameRequired: '请输入用户名',
    emailRequired: '请输入邮箱地址',
    passwordRequired: '请输入密码',
    confirmPasswordRequired: '请确认密码',
    passwordMismatch: '两次输入的密码不一致',
    registerSuccess: '注册成功！',
    registerFailed: '注册失败，请重试'
  },

  // 图片生成器
  generator: {
    title: '创作您的AI艺术作品',
    prompt: '描述您想要生成的图片',
    promptPlaceholder: '请输入图片描述，例如：一只可爱的小猫在花园里玩耍',
    negativePrompt: '负面提示词',
    negativePromptPlaceholder: '描述您不希望出现在图片中的内容',
    model: '选择模型',
    size: '图片尺寸',
    count: '生成数量',
    generateButton: '生成图片',
    generating: '正在生成...',
    generateSuccess: '图片生成成功！',
    generateFailed: '图片生成失败，请重试',
    promptRequired: '请输入图片描述',
    advancedSettings: '高级设置',
    seed: '随机种子',
    steps: '生成步数',
    guidance: '引导强度',
    scheduler: '调度器'
  },

  // 设置页面
  settings: {
    title: '系统设置',
    subtitle: '个性化配置您的使用体验',
    
    // 个人偏好
    personalPreferences: '个人偏好',
    themeMode: '主题模式',
    themeModeDesc: '选择您偏好的界面主题',
    themeAuto: '跟随系统',
    themeLight: '浅色模式',
    themeDark: '深色模式',
    
    language: '界面语言',
    languageDesc: '选择界面显示语言',
    
    autoSave: '自动保存',
    autoSaveDesc: '自动保存生成的图片到历史记录',
    
    // 图片生成设置
    imageGeneration: '图片生成',
    defaultSize: '默认尺寸',
    defaultSizeDesc: '新建生成任务时的默认图片尺寸',
    defaultCount: '默认生成数量',
    defaultCountDesc: '每次生成任务的默认图片数量',
    defaultModel: '默认模型',
    defaultModelDesc: '图片生成使用的默认AI模型',
    showAdvanced: '显示高级参数',
    showAdvancedDesc: '在生成界面显示高级参数选项',
    
    // 通知设置
    notifications: '通知设置',
    notifyOnComplete: '生成完成通知',
    notifyOnCompleteDesc: '图片生成完成时显示通知',
    systemNotify: '系统消息通知',
    systemNotifyDesc: '接收系统重要消息通知',
    testNotification: '测试通知',
    testNotificationDesc: '发送测试通知以验证功能是否正常',
    sendTestNotification: '发送测试通知',
    
    // 隐私设置
    privacy: '隐私设置',
    saveHistory: '保存历史记录',
    saveHistoryDesc: '保存图片生成历史记录',
    clearData: '数据清理',
    clearDataDesc: '清除本地缓存和临时数据',
    clearDataButton: '清除数据',
    
    // 操作按钮
    saveSettings: '保存设置',
    saving: '保存中...',
    resetToDefault: '恢复默认',
    
    // 消息提示
    themeUpdated: '主题设置已更新',
    languageUpdated: '语言设置已更新',
    autoSaveEnabled: '自动保存已开启',
    autoSaveDisabled: '自动保存已关闭',
    defaultSizeUpdated: '默认尺寸设置已更新',
    defaultCountUpdated: '默认生成数量已更新',
    defaultModelUpdated: '默认模型已更新',
    advancedShown: '高级参数已显示',
    advancedHidden: '高级参数已隐藏',
    notificationEnabled: '通知已开启',
    notificationDisabled: '通知已关闭',
    notificationPermissionDenied: '通知权限未授予，请在浏览器设置中允许通知',
    testNotificationSent: '测试通知已发送！',
    testNotificationFailed: '发送测试通知失败',
    historyEnabled: '历史记录保存已开启',
    historyDisabled: '历史记录保存已关闭',
    settingsSaved: '设置保存成功！',
    settingsSaveFailed: '保存设置失败，请重试',
    settingsReset: '设置已恢复为默认值！',
    dataCleared: '数据清除完成！页面将在3秒后刷新',
    dataClearFailed: '数据清除失败，请重试'
  },

  // 个人资料页面
  profile: {
    title: '个人资料',
    subtitle: '管理您的账户信息',
    avatar: '头像',
    username: '用户名',
    email: '邮箱地址',
    joinDate: '注册时间',
    lastLogin: '最后登录',
    changePassword: '修改密码',
    updateProfile: '更新资料',
    deleteAccount: '删除账户'
  },

  // 历史记录
  history: {
    title: '生成历史',
    subtitle: '查看您的创作记录',
    empty: '暂无生成记录',
    loadMore: '加载更多',
    deleteAll: '清空历史',
    deleteSelected: '删除选中',
    downloadSelected: '下载选中',
    createdAt: '创建时间',
    prompt: '提示词',
    model: '使用模型',
    size: '图片尺寸'
  },

  // 错误消息
  errors: {
    networkError: '网络连接错误，请检查网络设置',
    serverError: '服务器错误，请稍后重试',
    unauthorized: '未授权访问，请重新登录',
    forbidden: '访问被拒绝',
    notFound: '请求的资源不存在',
    timeout: '请求超时，请重试',
    unknown: '未知错误，请联系技术支持'
  },

  // 确认对话框
  confirmDialog: {
    clearData: {
      title: '确认清除数据',
      message: '此操作将清除所有本地缓存和临时数据，包括：\n• 图片生成历史记录\n• 临时文件缓存\n• 用户偏好设置（除登录信息外）\n\n是否继续？',
      confirm: '确定清除',
      cancel: '取消'
    },
    resetSettings: {
      title: '确认重置设置',
      message: '此操作将恢复所有设置为默认值，包括：\n• 主题模式\n• 语言设置\n• 图片生成参数\n• 通知设置\n• 隐私设置\n\n是否继续？',
      confirm: '确定重置',
      cancel: '取消'
    },
    logout: {
      title: '确认退出',
      message: '您确定要退出登录吗？',
      confirm: '确定退出',
      cancel: '取消'
    }
  }
}
