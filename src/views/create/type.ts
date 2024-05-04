export interface Inscription {
  name: string;
  slug: string;
  inscription_id: string;
  url: string;
  status: 1 | 2 | 3;
  pic: string
}

export interface Collect {
  description: string;
  icon: string;
  name: string;
  slug: string;
  supply: number;
  btc: Inscription[];
}

export interface Detail {
  copyright_fee: number
  description: string
  icon: string
  inscribed: number
  name: string
  sell_fee: number
  service_fee: number
  slug: string
  supply: number
}

export interface Model {
  network: string
  slug: string
  name: string
  pic: string
  inscription_number: number
  service_fee: number
  task_id: string
  collection: string
  new_name: string
  supply: number
}

export interface ModelInfo {
  status: number
  vxc: string
  fee_base: number
  fee_sats: number
  [key: string]: any
}

export interface Order {
  order_id: string
  network_address: string
  sats: number
}

export interface OrderStatus {
  status: number
  name: string
  inscription_id: string
  owner: string
}

export interface OrderHis {
  owner: string
  name: string
  inscription_id: string
  status: string
  time: string
}
