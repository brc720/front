import axios from './axios';
// import { AxiosResponse } from 'axios';

// 获取Notice
export async function getNotice({
  address,
}: {
  address: string;
}) {
  return axios.post('user/notice', { address }).then((res) => res.data);
}

// 登录
export async function login({
  address,
  pubkey,
  signature
}: {
  address: string;
  pubkey: string;
  signature: string;
}) {
  return axios.post('user/auth', { address, pubkey, signature }).then((res) => res.data);
}

// 获取我的铭文集合列表
export const getCollects = async () => {
  return axios.get('collect/list').then((res) => res.data);
}

// 获取选择铭文集合列表
export const getSelectCollects = async () => {
  return axios.get('collect/select').then((res) => res.data);
}

// 获取BTC可用集合
export const getBtcGather = async (data: {
  inscription_ids: string[]
}) => {
  return axios.post('source/btc', data).then((res) => res.data);
}

// 获取铭刻合集详情
export const getCollectInfo = async (data: {
  collection: string
}) => {
  return axios.post('collect/info', data).then((res) => res.data);
}

// 创建模型
export const createVoxel = async (data: {
  network: string
  source: string
}) => {
  return axios.post('voxel/create', data).then((res) => res.data);
}

// 创建模型
export const getVoxelStatus = async (data: {
  task_id: string
}) => {
  return axios.post('voxel/status', data).then((res) => res.data);
}

// 随机获取一个bitman
export const getRandBitman = async () => {
  return axios.get('https://api.bitworld.ai/bitman/rand').then((res) => res.data);
}

// 随机获取一个bitman
export const checkBitman = async (data: {
  block_height: number
}) => {
  return axios.post('https://api.bitworld.ai/bitman/hasbyheight', data).then((res) => res.data);
}

// getfee
export async function getFees() {
  return axios.get('https://mempool.space/api/v1/fees/recommended').then((res) => res);
}

// 创建铭刻订单
export const createOrder = async (data: {
  task_id: string
  "fee": number
  "bitman_id": number
}) => {
  return axios.post('order/create', data).then((res) => res.data);
}

// 查询铭刻订单
export const checkOrderStatus = async (data: {
  order_id: string
  txid: string
}) => {
  return axios.post('order/status', data).then((res) => res.data);
}


// 铭刻记录
export const getOrderHistory = async () => {
  return axios.get('order/history').then((res) => res.data);
}

// 我的BRC720合集
export const getMyBrc = async (data: {
  page: number
}) => {
  return axios.post('collect/mine', data).then((res) => res.data);
}

// 生成图片
export const createImg = async (data: {
  task_id: string
  pic_base64: string
}) => {
  return axios.post('voxel/update', data).then((res) => res.data);
}
