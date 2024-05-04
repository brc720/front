import { ElMessage } from "element-plus"
import useClipboard from 'vue-clipboard3'

export const useCopy = () => {
  const { toClipboard } = useClipboard()

  return async function copy(params: string) {
    try {
      await toClipboard(params)
      ElMessage({
        type: 'success',
        message: 'Replicated'
      })
    } catch (error) {
      ElMessage({
        type: 'error',
        message: 'Copy failed'
      })
    }
  }
}
