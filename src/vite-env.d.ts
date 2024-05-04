/// <reference types="vite/client" />

declare interface Window {
  okxwallet: any
  unisat: any
  bitcoin: any
  okxwallet: any
  requestAccounts: any
  bitkeep: any
  [key: string]: any
}

declare interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly NODE_ENV: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
