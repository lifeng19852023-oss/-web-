import request from '@/utils/request'

// 获取入住列表
export function getAdmissionList(){
  return request.get('/admissions')
}

// 创建入住
export function createAdmission(data:any){
  return request.post('/admissions', data)
}
// 办理退住
export function checkoutAdmission(id:number){
    return request.put(
      `/admissions/${id}/checkout`
    )
  }