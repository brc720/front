<template>
  <div class="connect_layout">
    <div class="connect_box">
      <div class="connect_box_title">
        <div class="close" @click="close">
          <img src="/imgs/ic1.png" alt="" />
        </div>
        <h3>CONNECT WALLET</h3>
        <span class="close" @click="showConnect"></span>
      </div>
      <div class="wallet_box wallet_unisat" @click="connectUniSat">
        Unisat Wallet
      </div>
      <div class="wallet_box wallet_okx" @click="connectOkx">OKX Wallet</div>
      <div class="wallet_box wallet_bitget" @click="connectBitget">
        Bitget Wallet
      </div>
      <div class="wallet_box wallet_xverse" @click="connectXverse">
        Xverse Wallet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { getNotice, login } from "@/api/api";
import { useStore } from "@/pinia/store";
import {
  getAddress,
  signMessage,
  type AddressPurpose,
  type BitcoinNetworkType,
} from "sats-connect";

const store = useStore();
const route = useRoute();
const router = useRouter();

const showConnect = () => {};
const connectUniSat = async () => {
  const iUniSat = () => {
    if (typeof window.unisat === "undefined") {
      installWallet("UniSat Wallet", "https://unisat.io/download");
      return false;
    }
    return true;
  };
  if (iUniSat()) {
    try {
      const accounts = await window.unisat.requestAccounts();
      localStorage.setItem("wallet_name", "unisat");
      setWallet(accounts[0]);
      await attemptLogin(accounts[0]);
    } catch (err: any) {
      if (err.message) {
        walletError(err.message);
      }
    }
  }
};
const connectOkx = async () => {
  const iOKX = () => {
    if (typeof window.okxwallet !== "undefined") {
      return true;
    } else {
      installWallet("OKX Wallet", "https://www.okx.com/web3");
      return false;
    }
  };
  if (iOKX()) {
    try {
      const accounts = await window.okxwallet.bitcoin.requestAccounts();
      setWallet(accounts[0]);
      localStorage.setItem("wallet_name", "okxwallet");
      await attemptLogin(accounts[0]);
    } catch (err) {
      // if (err.message) {
      //   // that.walletError(err.message);
      // }
    }
  }
};
const connectBitget = async () => {
  const iBitget = () => {
    if (typeof window.bitkeep === "undefined") {
      installWallet(
        "Bitget Wallet",
        "https://web3.bitget.com/en/wallet-download?type=2"
      );
      return false;
    }
    return true;
  };
  if (iBitget()) {
    try {
      const accounts = await window.bitkeep.unisat.requestAccounts();
      setWallet(accounts[0]);
      localStorage.setItem("wallet_name", "bitkeep");
      await attemptLogin(accounts[0]);
    } catch (err: any) {
      if (err.message) {
        walletError(err.message);
      }
    }
  }
};

const xversePublicKey = ref("");
const connectXverse = async () => {
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
      xversePublicKey.value = addresses[1].publicKey;

      setWallet(addresses[1].address || "");
      localStorage.setItem("wallet_name", "xverse");
      localStorage.setItem("xverse", JSON.stringify(response.addresses));

      await attemptLogin(addresses[1].address);
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
};

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

const attemptLogin = async (address: string) => {
  const wallet_name: any = localStorage.getItem("wallet_name");
  if (!wallet_name) {
    // showWalletModal();
    ElMessage.warning("Please connect wallet before inscribe!");
    return;
  }
  let publicKey = "";
  const { data: notice } = await getNotice({ address });
  const message =
    "Welcome to BRC720!\n\nClick to sign this message to prove you have access to this wallet and we'll log you in.\nThis request will not trigger a blockchain transaction or cost any gas fees. \n\nWallet address:\n" +
    address +
    "\n\nNotice ID: " +
    notice;

  let signStr = null;

  if (wallet_name === "unisat") {
    publicKey = await window.unisat.getPublicKey();
  }
  if (wallet_name === "okxwallet") {
    publicKey = await window[wallet_name].bitcoin.getPublicKey();
  }
  if (wallet_name === "bitkeep") {
    publicKey = await window[wallet_name].unisat.getPublicKey();
  }

  if (wallet_name === "xverse") {
    publicKey = xversePublicKey.value;
    const signMessageOptions = {
      payload: {
        network: {
          type: "Mainnet" as BitcoinNetworkType,
        },
        address,
        message,
      },
      onFinish: (response: any) => {
        signStr = response;
      },
      onCancel: () => {
        ElMessage.warning("Canceled");
        if (route.path === "/mybrc720") {
          router.replace("/");
        }
      },
    };
    await signMessage(signMessageOptions);
  } else {
    try {
      signStr = await (wallet_name === "unisat"
        ? window.unisat
        : wallet_name === "okxwallet"
        ? window[wallet_name].bitcoin
        : window[wallet_name].unisat
      ).signMessage(message);
    } catch (error) {
      if (route.path === "/mybrc720") {
        router.replace("/");
      }
    }
  }

  if (!signStr) return;

  try {
    // : "bc1pscsjhsdkrpupug5ds0nfwefjhccquxjsv8p7u620tzlrc7432tnq9u3h70"
    const { data: token } = await login({
      address,
      pubkey: publicKey,
      signature: signStr,
    });

    localStorage.setItem("publicKey", publicKey);
    localStorage.setItem("userToken", token);
    location.reload();
  } catch (error) {
    console.log("login：", error);
  }
};

const setWallet = (walletAddress: string) => {
  localStorage.setItem("walletAddress", walletAddress);
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
const close = () => {
  store.setShowWallet(false);
  if (route.path === "/mybrc720") {
    router.replace("/");
  }
};
</script>

<style lang="less" scoped>
.connect_layout {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  position: fixed;
  z-index: 990;
  top: 0;
  left: 0;
  .connect_box {
    position: fixed;
    width: 340px;
    z-index: 999;
    background-color: #1a1514;
    border: #e1703d 1px solid;
    border-radius: 5px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -76%);
    color: #fff;
    font-size: 14px;
    line-height: 28px;
    .close {
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
      img {
        width: 18px;
      }
    }

    .connect_box_title {
      width: 100%;
      height: 90px;
      position: relative;
      text-align: center;
      h3 {
        margin: 30px auto 0px auto;
        display: inline-block;
        padding: 10px 30px 10px 30px;
        line-height: 36px;
        font-size: 22px;
        text-align: center;
        border-bottom: #e1703d 1px solid;
      }
    }

    .wallet_box {
      width: 260px;
      height: 56px;
      line-height: 56px;
      color: #fff;
      text-align: center;
      border-radius: 5px;
      font-size: 18px;
      font-weight: 300;
      text-indent: 25px;
      border: #2c292a 1px solid;
      margin: 20px auto 20px auto;
      cursor: pointer;
    }
  }

  .wallet_unisat {
    background: #0a0602 url(/imgs/unisat.png) no-repeat;
    background-size: 24px 30px;
    background-position: 32px 11px;
  }
  .wallet_xverse {
    background: #0a0602 url(/imgs/xverse.png) no-repeat;
    background-size: 30px 30px;
    background-position: 30px 14px;
  }
  .wallet_okx {
    background: #0a0602 url(/imgs/okx.png) no-repeat;
    background-size: 24px 24px;
    background-position: 48px 16px;
  }
  .wallet_bitget {
    background: #0a0602 url(/imgs/bitget.png) no-repeat;
    background-size: 26px 26px;
    background-position: 30px 14px;
  }
  .wallet_box:hover {
    background-color: #131312;
    transition: background-color 0.2s ease-in-out;
  }
}
</style>
