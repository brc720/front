import { ethers } from "ethers";
import numeral from 'numeral'
// import { Buffer } from 'buffer/';
import { useStore } from "@/pinia/store";
// console.log(Buffer);

const store = useStore();

export const isLogin = () => {
  if (!store.userToken) {
    localStorage.clear();
    store.setUserToken("");
    store.setShowWallet(true);
    return false;
  }
  return true;
}

export const useEthersUnit = (val: number | string, data: { unit: number } = { unit: 8 }) => {
  const str = val.toString() || '0'
  const { unit } = data
  const format = ethers.formatUnits(str, unit)

  let formatVal = 0
  if (format.length > 8) {
    formatVal = +format.slice(0, 8)
    formatVal = formatVal > 0.000001 ? formatVal : 0.000001
  } else {
    formatVal = +format
  }

  return { formatVal }
}

export const useEthersUnitParse = (val: number | string, data: { unit: number } = { unit: 8 }) => {
  const str = val.toString() || '0'
  const { unit } = data

  const parse = ethers.parseUnits(str, unit)

  return { parse }
}

export const useNumeral = (num: number, format: string) => {
  return numeral(num).format(format)
}

export function hexToLittleEndian(hex: string) {
  return "Buffer.from(hex, 'hex').reverse().toString('hex');"
}

export function decodeOutpoint(outpointHex: string) {
  // const outpointData = Buffer.from(outpointHex, 'hex');
  // const txid = hexToLittleEndian(outpointData.slice(0, 32).toString('hex'));
  // const index = outpointData.readUInt32LE(32);

  return '{ txid, index }';
}

export const toXOnly = (pubKey: any) =>
  pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33);

export const isBc1qAddress = (address: string) => {
  return /^bc1q.*/.test(address)
}
