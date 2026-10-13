import { ref } from 'vue'

const requestCount = ref(0)

export const globalLoading = ref(false)


export function startLoading() {

  requestCount.value++

  globalLoading.value = true
}


export function endLoading() {

  requestCount.value--

  if (requestCount.value <= 0) {

    requestCount.value = 0

    globalLoading.value = false
  }
}