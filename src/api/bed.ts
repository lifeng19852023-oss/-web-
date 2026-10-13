import request from '@/utils/request'


// 获取床位列表
export function getBedList(){

  return request.get(
    '/beds'
  )

}


// 新增床位
export function createBed(
  data:any
){

  return request.post(
    '/beds',
    data
  )

}


// 修改床位
export function updateBed(
  id:number,
  data:any
){

  return request.put(
    `/beds/${id}`,
    data
  )

}


// 删除床位
export function deleteBed(
  id:number
){

  return request.delete(
    `/beds/${id}`
  )

}