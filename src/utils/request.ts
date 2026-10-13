import axios from 'axios'
import router from '../router'

import {
    startLoading,
    endLoading
  } from './loading'


const request = axios.create({
  baseURL: '/api',
  timeout: 5000
})


// 请求拦截器
request.interceptors.request.use(
  config => {
    startLoading()
    console.log('发送请求：', config.url)
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },

  error => {
    endLoading()
    return Promise.reject(error)
  }

)


// 响应拦截器
request.interceptors.response.use(
    response => {
      endLoading()
      const data = response.data
      // HTTP正常，但业务失败
      if (data.code !== 200) {
        console.error(
          '业务错误：',
          data.message
        )
        if (data.code === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        }
  
        return Promise.reject(
          new Error(data.message || '请求失败')
        )
      }
      return response
    },
  
    error => {
      endLoading()
      console.error('HTTP请求失败：', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
          router.push('/login')
      }
      return Promise.reject(error)
    }
  )


export default request