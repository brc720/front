import { ElNotification, ElMessage } from "element-plus"

interface Message {
  title?: string
  icon?: string
  duration?: number
  showClose?: boolean
  dangerouslyUseHTMLString?: boolean
}

export const useElNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success', data: Message | undefined) => {

  return ElNotification({
    message,
    type: type || 'success',
    ...data
  })
}

export const useElMessage = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success', data: Message | undefined = undefined) => {
  const other = data ? { ...data } : {}

  return ElMessage({ type, message, ...other })
}

export const useMessage = (type: 'msg' | 'noti' = 'msg') => {
  switch (type) {
    case 'msg':
      return ElMessage
    case 'noti':
      return ElNotification
    default:
      return ElMessage
  }
}
