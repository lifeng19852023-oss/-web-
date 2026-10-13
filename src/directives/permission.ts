import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

const permission: Directive = {
  mounted(el,binding){
    const userStore = useUserStore()
    const value = binding.value
    const hasPermission =
      userStore.hasPermission(value)
    if(!hasPermission){
      el.remove()
    }
  }
}

export default permission