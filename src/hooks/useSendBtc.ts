import { useWallet } from './useWallet'
import { sendBtcTransaction, type BitcoinNetworkType } from 'sats-connect'

export const useSendBtc = async (network_address: string, sats: number, data: { confim: Function, reject: Function } | undefined = { confim: () => { }, reject: () => { } }) => {
  let txid: any = null

  const { wallet_name, wallet } = useWallet()

  if (!wallet) return
  try {
    data.confim()
    switch (wallet_name) {
      case 'unisat':
        txid = await wallet.sendBitcoin(network_address, sats);
        break;
      case 'okxwallet':
        txid = await wallet.bitcoin.sendBitcoin(network_address, sats);
        break;
      case 'bitkeep':
        txid = await wallet.unisat.sendBitcoin(network_address, sats);
        break;
      case 'xverse':
        const sendBtcOptions = {
          payload: {
            network: {
              type: "Mainnet" as BitcoinNetworkType,
            },
            recipients: [
              {
                address: network_address,
                amountSats: BigInt(sats),
              }
            ],
            senderAddress: localStorage.getItem('walletAddress') || '',
          },
          onFinish: (response: any) => {
            txid = response
          },
          onCancel: () => data.reject("Canceled"),
        };
        await sendBtcTransaction(sendBtcOptions);
        break;
      default:
        break;
    }

    return txid
  } catch (e) {
    data.reject(e)
  }
}