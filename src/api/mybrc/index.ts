import axios from '../axios';

// 我的BRC720 左侧合集列表
export async function getMyCollects(data: {
  page: number
}) {
  return axios.post('collect/mycollect', data).then((res) => res.data);
}

// 我的BRC720 右侧（单合集下铭刻列表）
export async function getMyCollectNft(data: {
  "collection": string, "page": number
}) {
  return axios.post('collect/myinscribe', data).then((res) => res.data);
}

// 获取psbt
interface Data {
  inscription_id: string
  price: number
}
export async function getPsbt(data: {
  inscriptions: Data[]
}) {
  return axios.post('tools/psbt', data).then((res) => res.data);
}

// 市场挂单
export async function upperOrder(data: {
  inscriptions: {
    inscription_id: string
    price: number | BigInt
  }[]
}) {
  return axios.post('market/create', data).then((res) => res.data);
}

// 市场撤单
export async function lowerOrder(data: {
  inscription_ids: string[]
}) {
  return axios.post('market/cancel', data).then((res) => res.data);
}

// 我的动态
export async function getMyRecords(data: {
  "type": string
  "page": number
}) {
  return axios.post('market/records', data).then((res) => res.data);
}
