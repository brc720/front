export interface MyCollection {
  slug: string
  name: string
  icon: string
  floor_price: number
  has_number: number
  listed: number
}

export interface MyNft {
  market_id: number
  inscription_id: string
  name: string
  pic: string
  price: number
  status: number
  [key: string]: any
}

export interface MyBrc {
  list: BrcInfo[],
  page: number
  prvpage: number
  prvtxt: string
  nextpage: number
  nexttxt: string
  maxpage: number
}

export interface BrcInfo {
  slug: string
  name: string
  address: string
  number: number
  inscription_id: string
}

export interface Activity {
  number: string
  seller: string
  buyer: string
  type: string
  name: string
  pic: string
  price: number
  list_time: string
  buy_time: string
}