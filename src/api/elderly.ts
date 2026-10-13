import request from '../utils/request'
// 获取老人统计
export function getElderlyStatistics() {
  return request.get('/elderly/statistics')
}

// 获取老人列表
export function getElderlyList(params?: any) {
  return request.get('/elderly', {
    params
  })
}

// 新增老人
export function createElderly(data: any) {
  return request.post('/elderly', data)
}
// 修改老人
export function updateElderly(id: number, data: any) {
  return request.put(`/elderly/${id}`, data)
}

// 删除老人
export function deleteElderly(id: number) {
  return request.delete(`/elderly/${id}`)
}