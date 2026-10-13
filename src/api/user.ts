import request from '@/utils/request'

// 获取用户列表
export function getUserList(){
  return request.get(
    '/users'
  )
}

// 创建用户
export function createUser(data:{
  username:string
  password:string
  role:string
}){
  return request.post(
    '/users',
    data
  )
}

// 删除用户
export function deleteUser(id:number){
    return request.delete(
      `/users/${id}`
    )
  }

  // 修改角色
export function updateUserRole(
    id:number,
    role:string
  ){
    return request.put(
      `/users/${id}/role`,
      {
        role
      }
    )
  }