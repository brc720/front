import { ElMessage } from "element-plus";
import {
  getAddress,
  type AddressPurpose,
  type BitcoinNetworkType,
} from "sats-connect";
import * as sats from "sats-connect";

const reload = () => {
  localStorage.clear()
  location.reload()
}

const installWallet = (wallet: string, url: string) => {
  ElMessage({
    type: "warning",
    dangerouslyUseHTMLString: true,
    duration: 7000,
    message:
      `
         Please install ` +
      wallet +
      `!
         <a style="text-decoration: underline; font-weight: bold" target="_blank" href='` +
      url +
      `'>Download</a>
       `,
  });
};

const walletError = (msg: string) => {
  ElMessage({
    type: "error",
    dangerouslyUseHTMLString: true,
    duration: 5000,
    message: msg,
  });
  delWallet();
  console.log(msg);
};
const delWallet = (from: string = "") => {
  localStorage.clear();
  if (!from) {
    location.reload();
  }
};

/**
 * 获取钱包信息
 * @param wallet_name 
 * @returns 
 */
export const useWalletAccount = async (wallet_name: string) => {
  let accounts: string | string[] = ''
  let publicKey: string | string[] = ''
  let wallet: any = {}
  if (wallet_name === "unisat") {
    accounts = await window[wallet_name].requestAccounts();
    publicKey = await window.unisat.getPublicKey();
    wallet = window.unisat
  }

  if (wallet_name === "okxwallet") {
    accounts = await window[wallet_name].bitcoin.requestAccounts();
    publicKey = await window[wallet_name].bitcoin.getPublicKey();
    wallet = window[wallet_name].bitcoin
  }

  if (wallet_name === "bitkeep") {
    accounts = await window[wallet_name].unisat.requestAccounts();
    publicKey = await window[wallet_name].unisat.getPublicKey();
    wallet = window.unisat
  }

  if (wallet_name === "xverse") {
    const getAddressOptions = {
      payload: {
        purposes: ["payment", "ordinals"] as AddressPurpose[],
        message: "Address for receiving Ordinals and payments",
        network: {
          type: "Mainnet" as BitcoinNetworkType,
        },
      },
      onFinish: async (response: any) => {
        let addresses = response.addresses;
        accounts = [addresses[0].address, addresses[1].address];
        publicKey = [addresses[0].publicKey, addresses[1].publicKey];
        wallet = { ...sats }
      },
      onCancel: () => walletError("Request canceled"),
    };

    try {
      await getAddress(getAddressOptions);
    } catch (err: any) {
      if (err.message) {
        if (err.message == "No Bitcoin wallet installed") {
          installWallet("Xverse Wallet", "https://www.xverse.app/download");
        } else {
          walletError(err.message);
        }
      }
    }
  }

  return {
    accounts,
    publicKey,
    wallet,
    reload
  }
}

/**
 * 使用钱包
 * 检测是否登录
 * @returns 
 */
export const useWallet = () => {
  const wallet_name = localStorage.getItem('wallet_name')
  if (!wallet_name) {
    ElMessage.warning('Please connect your wallet to log in')
    // reload()
    return { wallet_name: '', wallet: null }
  }

  return { wallet_name, wallet: window[wallet_name] }
}

/**
 * 获取余额
 * @returns 
 */
export const useBalance = async () => {
  const name = localStorage.getItem('wallet_name') || ''
  const { wallet } = await useWalletAccount(name)

  let balance = await wallet.getBalance();
  return balance
}
