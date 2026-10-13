import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'


const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: {
        isLogin: true,
      },

      children: [
        {
          path: '',
          redirect: '/home',
          meta: {
            isLogin: true,
          }
        },
        {
          path: '/home',
          component: () => import('../views/home/index.vue'),
          meta: {
            isLogin: true,
          }
        },

        {
          path: '/dashboard',
          component: () => import('../views/Dashboard/index.vue'),
          meta: {
            isLogin: true,
          }
        },

        {
          path: '/elderly',
          component: () => import('../views/Elderly/ElderlyList.vue'),
          meta: {
            isLogin: true,
            permission:'elderly:view'
          }
        },
        {
          path:'/user',
          component:()=>import('../views/user/index.vue'),
          meta:{
            isLogin:true,
            permission:'user:manage'
          }
        },
        {
          path:'/room',
          component:()=>import('../views/Room/index.vue'
          ),
          meta:{
            isLogin:true,
            permission:'room:view'
          }
        },
        {
          path:'/bed',
          component:()=>import('@/views/Bed/index.vue'),
          meta:{
            isLogin:true,
            permission:'bed:view'
          }
        },
        {
          path:'/admission',
          component:()=>import('@/views/Admission/index.vue'),
          meta:{
            isLogin:true,
            permission:'admission:view'
          }
        },
        {
          path:'/care',
          component:()=>import('@/views/Care/index.vue'),
          meta:{
            isLogin:true,
            permission:'care:manage'
          }
        }

      ]
    },

    {
      path: '/403',
      component: () => import('../views/403.vue')
    },

    {
      path: '/login',
      component: () => import('../views/login/index.vue'),
      meta: {
        isLogin: false
      }
    }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const userInfo = JSON.parse(
    localStorage.getItem('userInfo') || 'null'
  )

  // ① 需要登录，但没有 Token
  if (to.meta.isLogin && !token) {
    return '/login'
  }

  // ② 已经登录，不允许再次进入登录页
  if (to.path === '/login' && token) {
    return '/'
  }

  // ③ 检查页面权限
  if (to.meta.permission) {
    const userStore = useUserStore()
    if(!userStore.hasPermission(
        to.meta.permission as string
      )
    ){
      return '/403'
    }
  }

  return true
})

export default router