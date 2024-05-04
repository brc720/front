import axios from '../axios';

// 合集搜索接口
export async function searchCollect(data: {
  query: string
}) {
  return axios.post('collect/search', data).then((res) => res.data);
}

// 合集列表
export async function getMarketCollect(data: {
  time: string
  slug: string
  query: string
  floor_price: string | undefined
  page: number
  volume: string | undefined
  sales: string | undefined
}) {
  return axios.post('market/collect', data).then((res) => res.data);
}

// 市场列表
export async function getNftList(data: {
  collection: string
  page: number
  query: string
  orderby: string
  hide_pending: number
}) {
  return axios.post('market/list', data).then((res) => res.data);
}

// 创建订单
export async function createOrder(data: {
  market_ids: number[]
  fee: number
}) {
  return axios.post('morder/create', data).then((res) => res.data);
}

// 市场动态
export async function getActivity(data: {
  collection: string
  page: number
  type: string
}) {
  return axios.post('market/activity', data).then((res) => res?.data);
}

// 持有人排行榜
export async function getCollectRank(data: {
  collection: string
  page: number
}) {
  return axios.post('collect/rank', data).then((res) => res?.data);
}

// 计算订单金额
export async function computedMoney(data: {
  market_ids: number[]
}) {
  return axios.post('morder/money', data).then((res) => res.data);
}

// 订单交易推送
export async function getOrderResults(data: {
  order_id: string,
  sign: string
}) {
  return axios.post('morder/push', data).then((res) => res.data);
}

// 检测UTXO
export async function checkUtxo(data: {
  market_ids: number[]
  fee: number
  is_check: number | undefined
}) {
  return axios.post('morder/utxo', data).then((res) => res.data);
}

export const getFeeByTx = (tx: string) => {
  return axios.get('https://mempool.space/api/tx/' + tx)
}

