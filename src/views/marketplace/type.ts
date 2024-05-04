export interface ModelInfo {
  status: number
  vxc: string
  fee_base: number
  fee_sats: number
  [key: string]: any
}

export interface CollectMk {
  name: string
  slug: string
  icon: string
  floor_price: number
  volume: number
  sales: number
}

export interface SearchCollect {
  name: string
  slug: string
  icon: string
}

export interface Registration {
  update: number
  create: number
  fail: number
}

export interface Nft {
  market_id: number
  inscription_id: string
  inscription_num: string
  name: string
  pic: string
  price: number
  owner: string
  status: number
}

export interface Activity {
  seller: string
  buyer: string
  type: string
  name: string
  pic: string
  price: number
  list_time: string
  buy_time: string
}


export interface OrderInfo {
  order_id: string;
  network_address: string;
  sats: number;
  success: number;
  fail: number;
}

export interface Ranking {
  index: number
  address: string;
  rate: number
  count: string;
}

export interface Results {
  money: number
  txid: string
  fee: number
}
