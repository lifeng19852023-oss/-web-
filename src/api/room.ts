import request from '@/utils/request'


// 获取房间列表
export function getRoomList(){

  return request.get(
    '/rooms'
  )

}


// 新增房间
export function createRoom(data:any){

  return request.post(
    '/rooms',
    data
  )

}


// 修改房间
export function updateRoom(
  id:number,
  data:any
){

  return request.put(
    `/rooms/${id}`,
    data
  )

}


// 删除房间
export function deleteRoom(
  id:number
){

  return request.delete(
    `/rooms/${id}`
  )

}