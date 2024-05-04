import * as bitcoin from 'bitcoinjs-lib';
import { toXOnly } from './utils';
import { BitcoinNetworkType } from 'sats-connect';
import { mybrc } from '@/api'
import * as ecc from 'tiny-secp256k1';
import { ElMessage } from 'element-plus';
import { useWalletAccount } from './useWallet';

bitcoin.initEccLib(ecc);


const reload = () => {
  localStorage.clear()
  location.reload()
}

const walletName = localStorage.getItem('wallet_name') || ''
const { wallet, accounts } = await useWalletAccount(walletName)

interface GeneratePSBTParams {
  inscriptionIds: string[];
  tapInternalKey: string; // publicKey
  price: number[];
  receiveAddress: string;
}

interface UTXO {
  txid: string;
  index: number;
  valule: number;
  txhex: string;
  inscribe_id: string;
}

export const generateUnsignedPsbts = async (_params: GeneratePSBTParams) => {
  // const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin })
  // const res: any = await mybrc.getUtxo({ inscribe_ids: params.inscriptionIds })

  // let toHexs: string[] = []
  // res.data.forEach((item: UTXO, index: number) => {
  //   const tx = bitcoin.Transaction.fromHex(item.txhex)

  //   const input: any = {
  //     hash: item.txid,
  //     index: item.index,
  //     nonWitnessUtxo: tx.toBuffer(),
  //     witnessUtxo: tx.outs[item.index],
  //     sighashType: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
  //     tapInternalKey: toXOnly(
  //       tx.toBuffer().constructor(params.tapInternalKey, 'hex')
  //     )
  //   }

  //   psbt.addInput(input);

  //   const output: any = {
  //     address: params.receiveAddress,
  //     value: params.price[index] + item.valule
  //   }
  //   psbt.addOutput(output);

  //   toHexs.push(psbt.toHex())
  // })

  // return toHexs;
}

type Xverse = {
  address: string;
  publicKey: string;
  purpose: "payment" | "ordinals" | "stacks";
  addressType: "p2tr" | "p2wpkh" | "p2sh" | "stacks";
}
export const signPsbts = async (psbts: string[]) => {
  let resp: string[] = []

  if (walletName !== 'xverse') {
    resp = await wallet.signPsbts(psbts);
  } else {
    let xvPsbts: any = []
    for (const item of psbts) {
      xvPsbts.push({
        psbtBase64: item,
        inputsToSign: [
          {
            address: accounts[0],
            signingIndexes: [0],
            sigHash: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
          },
          {
            address: accounts[1],
            signingIndexes: [1],
            sigHash: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
          },
        ],
      })
    }

    const { signMultipleTransactions } = wallet
    await signMultipleTransactions({
      payload: {
        network: {
          type: "Mainnet" as BitcoinNetworkType,
        },
        message: "Sign Transaction",
        psbts: xvPsbts,
      },
      onFinish: (response: any) => {
        resp = response
      },
      onCancel: () => {
        throw Error
      },
    });
  }

  return resp;
}

export const signPsbt = async (psbt: string, broadcast: boolean = false) => {
  let resp: string = ''
  if (walletName !== 'xverse') {
    resp = await wallet.signPsbt(psbt);
  } else {
    satsWallet(psbt, broadcast)
  }

  return resp;
}

export const pushPsbt = async (sign: string) => {
  let txid: string = ''
  if (walletName !== 'xverse') {
    txid = await wallet.pushPsbt(sign);
  }

  return txid;
}

const satsWallet = async (sign: string, broadcast: boolean) => {
  let res = ''
  await wallet.signTransaction({
    payload: {
      network: {
        type: 'Mainnet' as BitcoinNetworkType
      },
      psbtBase64: sign,
      broadcast,
      inputsToSign: [{
        address: accounts[0],
        signingIndexes: [0],
      }],
      message: 'Sign Transaction'
    },
    onFinish: (response: any) => {
      res = response
    },
    onCancel: () => {
      throw Error
    },
  });

  return res
}

export const verifySignedPsbt = async (signedPSBT: string[]) => {
  for (const item of signedPSBT) {
    const psbt = bitcoin.Psbt.fromHex(item, { network: bitcoin.networks.bitcoin });
    // psbt.finalizeTaprootInput(0)
    // psbt.finalizeAllInputs()
    psbt.data.inputs.forEach((input) => {
      if (input.tapInternalKey) {
        const finalScriptWitness = input.finalScriptWitness;
        if (finalScriptWitness && finalScriptWitness.length > 0) {
          if (finalScriptWitness.toString('hex') === '0141') {
            ElMessage.error(`Invalid signature - no taproot signature present on the finalScriptWitness`)
            throw new Error(`Invalid signature - no taproot signature present on the finalScriptWitness`);
          }
        } else {
          ElMessage.error(`Invalid signature - no finalScriptWitness`)
          throw new Error(`Invalid signature - no finalScriptWitness`)
        }
      }
    })
  }
}
