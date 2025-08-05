export default {
  // Common
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    reset: 'Reset',
    back: 'Back',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    clear: 'Clear',
    refresh: 'Refresh',
    submit: 'Submit',
    upload: 'Upload',
    download: 'Download',
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    undo: 'Undo',
    redo: 'Redo',
    select: 'Select',
    selectAll: 'Select All',
    deselect: 'Deselect',
    expand: 'Expand',
    collapse: 'Collapse',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    skip: 'Skip',
    retry: 'Retry',
    help: 'Help',
    about: 'About',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register'
  },

  // App title and description
  app: {
    title: 'AI Image Generator',
    subtitle: 'AI-powered image creation platform',
    description: 'Transform your creativity into stunning images using advanced AI technology'
  },

  // Login page
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your account to continue',
    username: 'Username',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginButton: 'Sign In',
    registerLink: "Don't have an account? Sign up now",
    usernameRequired: 'Please enter username',
    passwordRequired: 'Please enter password',
    loginSuccess: 'Login successful!',
    loginFailed: 'Login failed, please check your username and password'
  },

  // Register page
  register: {
    title: 'Create New Account',
    subtitle: 'Join us and start your AI creation journey',
    username: 'Username',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    registerButton: 'Sign Up',
    loginLink: 'Already have an account? Sign in now',
    usernameRequired: 'Please enter username',
    emailRequired: 'Please enter email address',
    passwordRequired: 'Please enter password',
    confirmPasswordRequired: 'Please confirm password',
    passwordMismatch: 'Passwords do not match',
    registerSuccess: 'Registration successful!',
    registerFailed: 'Registration failed, please try again'
  },

  // Image generator
  generator: {
    title: 'Create Your AI Artwork',
    prompt: 'Describe the image you want to generate',
    promptPlaceholder: 'Enter image description, e.g.: A cute cat playing in the garden',
    negativePrompt: 'Negative Prompt',
    negativePromptPlaceholder: 'Describe what you do not want in the image',
    model: 'Select Model',
    size: 'Image Size',
    count: 'Generation Count',
    generateButton: 'Generate Image',
    generating: 'Generating...',
    generateSuccess: 'Image generated successfully!',
    generateFailed: 'Image generation failed, please try again',
    promptRequired: 'Please enter image description',
    advancedSettings: 'Advanced Settings',
    seed: 'Random Seed',
    steps: 'Generation Steps',
    guidance: 'Guidance Scale',
    scheduler: 'Scheduler'
  },

  // Settings page
  settings: {
    title: 'System Settings',
    subtitle: 'Personalize your experience',
    
    // Personal preferences
    personalPreferences: 'Personal Preferences',
    themeMode: 'Theme Mode',
    themeModeDesc: 'Choose your preferred interface theme',
    themeAuto: 'Follow System',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    
    language: 'Interface Language',
    languageDesc: 'Select interface display language',
    
    autoSave: 'Auto Save',
    autoSaveDesc: 'Automatically save generated images to history',
    
    // Image generation settings
    imageGeneration: 'Image Generation',
    defaultSize: 'Default Size',
    defaultSizeDesc: 'Default image size for new generation tasks',
    defaultCount: 'Default Count',
    defaultCountDesc: 'Default number of images per generation task',
    defaultModel: 'Default Model',
    defaultModelDesc: 'Default AI model for image generation',
    showAdvanced: 'Show Advanced Parameters',
    showAdvancedDesc: 'Display advanced parameter options in generation interface',
    
    // Notification settings
    notifications: 'Notification Settings',
    notifyOnComplete: 'Generation Complete Notification',
    notifyOnCompleteDesc: 'Show notification when image generation is complete',
    systemNotify: 'System Message Notification',
    systemNotifyDesc: 'Receive important system message notifications',
    testNotification: 'Test Notification',
    testNotificationDesc: 'Send test notification to verify functionality',
    sendTestNotification: 'Send Test Notification',
    
    // Privacy settings
    privacy: 'Privacy Settings',
    saveHistory: 'Save History',
    saveHistoryDesc: 'Save image generation history records',
    clearData: 'Data Cleanup',
    clearDataDesc: 'Clear local cache and temporary data',
    clearDataButton: 'Clear Data',
    
    // Action buttons
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    resetToDefault: 'Reset to Default',
    
    // Message prompts
    themeUpdated: 'Theme settings updated',
    languageUpdated: 'Language settings updated',
    autoSaveEnabled: 'Auto save enabled',
    autoSaveDisabled: 'Auto save disabled',
    defaultSizeUpdated: 'Default size settings updated',
    defaultCountUpdated: 'Default generation count updated',
    defaultModelUpdated: 'Default model updated',
    advancedShown: 'Advanced parameters shown',
    advancedHidden: 'Advanced parameters hidden',
    notificationEnabled: 'Notifications enabled',
    notificationDisabled: 'Notifications disabled',
    notificationPermissionDenied: 'Notification permission denied, please allow notifications in browser settings',
    testNotificationSent: 'Test notification sent!',
    testNotificationFailed: 'Failed to send test notification',
    historyEnabled: 'History saving enabled',
    historyDisabled: 'History saving disabled',
    settingsSaved: 'Settings saved successfully!',
    settingsSaveFailed: 'Failed to save settings, please try again',
    settingsReset: 'Settings reset to default values!',
    dataCleared: 'Data cleared successfully! Page will refresh in 3 seconds',
    dataClearFailed: 'Failed to clear data, please try again'
  },

  // Profile page
  profile: {
    title: 'Profile',
    subtitle: 'Manage your account information',
    avatar: 'Avatar',
    username: 'Username',
    email: 'Email Address',
    joinDate: 'Join Date',
    lastLogin: 'Last Login',
    changePassword: 'Change Password',
    updateProfile: 'Update Profile',
    deleteAccount: 'Delete Account'
  },

  // History
  history: {
    title: 'Generation History',
    subtitle: 'View your creation records',
    empty: 'No generation records',
    loadMore: 'Load More',
    deleteAll: 'Clear History',
    deleteSelected: 'Delete Selected',
    downloadSelected: 'Download Selected',
    createdAt: 'Created At',
    prompt: 'Prompt',
    model: 'Model Used',
    size: 'Image Size'
  },

  // Error messages
  errors: {
    networkError: 'Network connection error, please check network settings',
    serverError: 'Server error, please try again later',
    unauthorized: 'Unauthorized access, please login again',
    forbidden: 'Access denied',
    notFound: 'Requested resource not found',
    timeout: 'Request timeout, please try again',
    unknown: 'Unknown error, please contact technical support'
  },

  // Confirmation dialogs
  confirmDialog: {
    clearData: {
      title: 'Confirm Clear Data',
      message: 'This operation will clear all local cache and temporary data, including:\n• Image generation history\n• Temporary file cache\n• User preferences (except login info)\n\nContinue?',
      confirm: 'Clear Data',
      cancel: 'Cancel'
    },
    resetSettings: {
      title: 'Confirm Reset Settings',
      message: 'This operation will restore all settings to default values, including:\n• Theme mode\n• Language settings\n• Image generation parameters\n• Notification settings\n• Privacy settings\n\nContinue?',
      confirm: 'Reset Settings',
      cancel: 'Cancel'
    },
    logout: {
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      confirm: 'Logout',
      cancel: 'Cancel'
    }
  }
}
