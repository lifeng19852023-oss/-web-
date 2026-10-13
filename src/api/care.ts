import request from '@/utils/request'

// 获取护理记录
export function getCareList(){
  return request.get('/care')
}

// 新增护理记录
export function createCare(data:any){
  return request.post('/care',data)
}