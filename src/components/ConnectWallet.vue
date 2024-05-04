<script defer="true" setup lang="ts">
import { init, useOnboard } from "@web3-onboard/vue";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers } from "ethers";
import { reactive, onMounted, watch } from "vue";

const injected = injectedModule();
const infuraKey = "daf31b2af245410ba1725ebe3f5ed48a";
const rpcUrl = `https://mainnet.infura.io/v3/${infuraKey}`;

const appMetadata = {
  name: "Test",
  icon: "data:image/png;base64,iVBORw",
  description: "ttt",
};
const web3Onboard = init({
  theme: "dark",
  wallets: [injected],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      icon: '<svg viewBox="0 0 44 25" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_104_1045" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="44" height="25"><path d="M125 0H0V25H125V0Z" fill="white"></path></mask><g mask="url(#mask0_104_1045)"><path fill-rule="evenodd" clip-rule="evenodd" d="M43.3913 12.2708L31.084 0V8.98437L18.8652 17.9792L31.084 17.9896V24.5365L43.3913 12.2708Z" fill="#7d7edd"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0 12.2656L12.3073 24.5313V15.6198L24.526 6.55208L12.3073 6.54167V0L0 12.2656Z" fill="#7d7edd"></path></g></svg>',
      label: "zkSync Sepolia Testnet",
      rpcUrl: rpcUrl,
    },
  ],
  connect: {
    autoConnectLastWallet: true,
  },
  appMetadata,
});

const {
  connectedWallet,
  connectingWallet,
  connectWallet,
  disconnectWallet,
  setChain,
} = useOnboard();

const data = reactive({
  connectedWallet,
  connectingWallet,
  walletAddress: null as any,
  chainId: null as any,
  wallet: null as any,
});

watch(
  () => data.walletAddress,
  (walletAddress, walletAddress_old) => {
    if (
      walletAddress_old &&
      walletAddress &&
      walletAddress != walletAddress_old
    ) {
      onClickDisConnect();
      onClickConnect();
    }
  }
);

const getWalletProvider = async () => {
  let { provider } = connectedWallet.value || {};
  const ethersProvider = new ethers.BrowserProvider(provider, "any");
  await ethersProvider
    .getSigner()
    .then((signer: any) => {
      data.walletAddress = signer.address;
      console.log(23123);
    })
    .catch((error: any) => {
      console.log(error, 1231223);

      // that.showError(error);
      return onClickDisConnect();
    });
};

const onClickConnect = () => {
  connectWallet().then(function () {
    console.log("resopnse");
  });
};

const onClickDisConnect = async () => {
  let { provider, label } = connectedWallet.value || {};
  if (provider && label) {
    disconnectWallet({ label });
    data.wallet = null;
    data.walletAddress = null;
    data.chainId = null;
  }
};

onMounted(() => {
  let state = web3Onboard.state.select();
  state.subscribe(function (stat) {
    if (stat.wallets.length > 0) {
      getWalletProvider();
      let wallet = stat.wallets[0];
      data.wallet = wallet.label;
      data.chainId = wallet.chains[0].id;
      console.log(wallet.chains[0].id);
      if (data.chainId != "0x1") {
        setChain({ wallet: data.wallet, chainId: "0x1" });
      }
    }
  });
});
</script>
<!-- <style scoped lang="css" src="./assets/index.css"></style> -->
<template>
  <div class="page">
    <div class="header">
      <div class="logo">
        <img src="./assets/img/logo.png" /><span>Zefi</span>
      </div>
      <div class="account">
        <div class="connect_wallet" v-if="data.walletAddress">
          <a href="#">
            <svg
              class="wallet"
              focusable="false"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_1446_2180)">
                  <path
                    d="M17.25 20.8438H5.75C4.79688 20.8438 3.88279 20.4651 3.20884 19.7912C2.53488 19.1172 2.15625 18.2031 2.15625 17.25V7.1875C2.15625 6.99688 2.23198 6.81406 2.36677 6.67927C2.50156 6.54448 2.68438 6.46875 2.875 6.46875H17.25C18.2031 6.46875 19.1172 6.84738 19.7912 7.52134C20.4651 8.19529 20.8438 9.10938 20.8438 10.0625V17.25C20.8438 18.2031 20.4651 19.1172 19.7912 19.7912C19.1172 20.4651 18.2031 20.8438 17.25 20.8438ZM3.59375 7.90625V17.25C3.59375 17.8219 3.82093 18.3703 4.2253 18.7747C4.62968 19.1791 5.17813 19.4062 5.75 19.4062H17.25C17.8219 19.4062 18.3703 19.1791 18.7747 18.7747C19.1791 18.3703 19.4062 17.8219 19.4062 17.25V10.0625C19.4062 9.49063 19.1791 8.94218 18.7747 8.5378C18.3703 8.13343 17.8219 7.90625 17.25 7.90625H3.59375Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M18.6876 7.90625C18.497 7.90625 18.3141 7.83052 18.1793 7.69573C18.0446 7.56094 17.9688 7.37812 17.9688 7.1875V5.21094C17.9826 4.95915 17.9393 4.7075 17.8423 4.47478C17.7452 4.24205 17.5968 4.03425 17.4082 3.86687C17.2387 3.73991 17.0426 3.65321 16.8346 3.61336C16.6266 3.57351 16.4123 3.58155 16.2079 3.63687L4.15445 6.37531C3.99232 6.41183 3.84785 6.5034 3.74563 6.63445C3.64341 6.76549 3.58977 6.92791 3.59383 7.09406C3.59383 7.28469 3.5181 7.4675 3.38331 7.60229C3.24852 7.73709 3.0657 7.81281 2.87508 7.81281C2.68446 7.81281 2.50164 7.73709 2.36685 7.60229C2.23205 7.4675 2.15633 7.28469 2.15633 7.09406C2.15211 6.60272 2.31584 6.12467 2.62039 5.73907C2.92494 5.35348 3.35206 5.08347 3.83102 4.97375L15.8916 2.23531C16.3064 2.13043 16.7397 2.12189 17.1583 2.21034C17.5769 2.2988 17.9697 2.4819 18.3066 2.74562C18.6629 3.04796 18.9466 3.42646 19.137 3.85316C19.3273 4.27987 19.4194 4.74388 19.4063 5.21094V7.1875C19.4063 7.37812 19.3306 7.56094 19.1958 7.69573C19.061 7.83052 18.8782 7.90625 18.6876 7.90625Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M20.125 16.5312H15.0938C14.3313 16.5312 13.6 16.2283 13.0608 15.6892C12.5217 15.15 12.2188 14.4187 12.2188 13.6562C12.2188 12.8938 12.5217 12.1625 13.0608 11.6233C13.6 11.0842 14.3313 10.7813 15.0938 10.7812H20.125C20.3156 10.7812 20.4984 10.857 20.6332 10.9918C20.768 11.1266 20.8438 11.3094 20.8438 11.5V15.8125C20.8438 16.0031 20.768 16.1859 20.6332 16.3207C20.4984 16.4555 20.3156 16.5312 20.125 16.5312ZM15.0938 12.2188C14.7125 12.2188 14.3469 12.3702 14.0773 12.6398C13.8077 12.9094 13.6562 13.275 13.6562 13.6562C13.6562 14.0375 13.8077 14.4031 14.0773 14.6727C14.3469 14.9423 14.7125 15.0938 15.0938 15.0938H19.4062V12.2188H15.0938Z"
                    fill="currentColor"
                  ></path>
                </g>
                <defs>
                  <clipPath>
                    <rect width="23" height="23" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>
            </svg>
            {{ data.walletAddress.slice(0, 6) }}...{{
              data.walletAddress.slice(-4)
            }}
          </a>
        </div>
        <div class="connect" v-if="!data.walletAddress" @click="onClickConnect">
          {{
            connectingWallet
              ? "Connecting..."
              : connectedWallet
              ? "Connected"
              : "Connect Wallet"
          }}
        </div>
        <!-- @click="showPerson" -->
        <div class="person">
          <img src="./assets/img/person.png" />
        </div>
      </div>
      <!-- v-if="person" -->
      <div class="person_box">
        <div @click="onClickDisConnect">
          <svg
            focusable="false"
            aria-hidden="true"
            viewBox="0 0 20 20"
            width="20"
            height="20"
            fill="#7C8497"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M13.0016 3.5999C13.333 3.5998 13.6015 3.3311 13.6014 2.99973C13.6013 2.66835 13.3326 2.3998 13.0013 2.3999L5.49989 2.40212C4.0645 2.40331 2.90116 3.56732 2.90039 5.00271V14.9971C2.90039 16.433 4.06445 17.5971 5.50039 17.5971H13.0014C13.3328 17.5971 13.6014 17.3285 13.6014 16.9971C13.6014 16.6657 13.3328 16.3971 13.0014 16.3971H5.50039C4.72719 16.3971 4.10039 15.7703 4.10039 14.9971V5.00303C4.10081 4.22985 4.72775 3.60293 5.50089 3.60212L13.0016 3.5999ZM13.1789 13.43C13.417 13.6605 13.7969 13.6543 14.0273 13.4162L16.9164 10.4315C17.0299 10.3223 17.1005 10.1689 17.1005 9.99905C17.1005 9.91459 17.083 9.83421 17.0515 9.76131C17.0235 9.69623 16.9835 9.63508 16.9313 9.58126L14.0265 6.58171C13.796 6.34366 13.4162 6.33757 13.1781 6.56809C12.9401 6.79862 12.934 7.17847 13.1645 7.41651L15.0844 9.39905H7.50047C7.1691 9.39905 6.90047 9.66768 6.90047 9.99905C6.90047 10.3304 7.1691 10.599 7.50047 10.599H15.0841L13.1651 12.5816C12.9346 12.8197 12.9408 13.1996 13.1789 13.43Z"
              fill="current"
            ></path></svg
          >Logout
        </div>
      </div>
    </div>
  </div>
</template>
