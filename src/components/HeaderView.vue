<template>
  <div class="page_header" style="position: fixed; z-index: 1000">
    <div class="header">
      <div class="left" style="cursor: pointer" @click="router.push('/')">
        <img class="logo" src="/imgs/logo.png" />
        <img class="brc720" src="/imgs/BRC720.png" />
      </div>

      <div class="nav">
        <div
          class="nav-item"
          :class="active === '/' ? 'nav-on' : ''"
          @click="toPage('/')"
        >
          Create
        </div>
        <div
          class="nav-item"
          :class="active === '/mybrc720' ? 'nav-on' : ''"
          @click="toPage('/mybrc720')"
        >
          My BRC720
        </div>
        <div
          :class="active === '/marketplace' ? 'nav-on' : ''"
          class="nav-item"
          @click="toPage('/marketplace')"
        >
          Marketplace
        </div>
        <!-- <router-link
          class="nav-item"
          active-class="nav-on"
          >Marketplace</router-link
        > -->
      </div>

      <div class="right-box">
        <a
          href="https://whitepaper.bitworld.ai/bitworld/overview/brc-720-ai-protocol"
          target="_blank"
          class="gitbook"
        >
          Gitbook
        </a>
        <a
          href="https://twitter.com/BitWorld_AI"
          target="_blank"
          class="twitter"
          ><img class="link" src="/imgs/x.png"
        /></a>
        <a href="https://t.me/BitWorld_AI" target="_blank" class="telgram"
          ><img class="link" src="/imgs/t.png"
        /></a>
        <a href="https://discord.gg/WUbrGyue64" target="_blank" class="discord"
          ><img class="link" src="/imgs/discord.png"
        /></a>

        <div class="address">
          <div v-if="!userToken" class="connect" @click="showConnect">
            <a href="#" class="wallet">Connect Wallet</a>
          </div>

          <div v-else class="wallet_address">
            {{ walletAddress?.slice(0, 6) }}...{{ walletAddress?.slice(-4) }}
            <img class="left-ic" src="/imgs/ic4.png" alt="" />
            <div class="logout" @click="delWallet">Disconnect</div>
          </div>
        </div>
      </div>
    </div>

    <WalletMask v-if="state.show" />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import WalletMask from "./WalletMask.vue";
import { computed, reactive, watchEffect } from "vue";
import { ref } from "vue";
import { useStore } from "@/pinia/store";

const router = useRouter();
const route = useRoute();
const store = useStore();

const state = reactive({
  show: computed(() => store.showWallet),
});

const userToken = computed(() => store.userToken);
const walletAddress = computed(() => store.walletAddress);

const showConnect = () => {
  store.setShowWallet(true);
};
const delWallet = () => {
  localStorage.clear();
  store.clearInfo();
  location.reload();
};

const active = ref("/");
watchEffect(() => {
  active.value = route.path;
});
const toPage = (path: string) => {
  if (path === "/mybrc720") {
    if (store.userToken) {
      router.push(path);
    } else {
      store.setShowWallet(true);
    }
  } else {
    router.push(path);
  }
};
</script>

<style scoped lang="less">
.page_header {
  width: 100%;
  padding: 0 20px;
  top: 0;
  left: 0;
  background: #0f0f12;
  border-bottom: 1px solid #434348;

  .header {
    min-width: 960px;
    height: 70px;
    margin: 0 auto 0 auto;
    display: flex;
    justify-content: space-between;
    * {
      color: #fff;
    }

    .left {
      display: flex;
      align-items: center;

      .logo {
        width: 40px;
        margin-right: 16px;
      }

      .brc720 {
        height: 16px;
      }
    }

    .nav {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 18px;

      .nav-item {
        margin: 0 2vw;
        text-align: center;
        cursor: pointer;
      }
    }

    .right-box {
      display: flex;
      height: max-content;
      padding-top: 18px;

      a {
        padding-top: 8px;
        margin: 0 10px;
        img {
          height: 18px;
        }
      }

      .address {
        margin-left: 22px;

        .connect {
          padding: 7px 12px;
          background: #f2682a;
          border-radius: 4px;
        }

        .wallet_address {
          padding: 6px 12px;
          border-radius: 4px;
          position: relative;
          border: 1px solid #f2682a;
          .logout {
            cursor: pointer;
            display: none;
            border-top: rgba(242, 104, 42, 1) 1px solid;
            position: absolute;
            left: 5%;
            top: 31px;
            width: 90%;
            padding: 12px 0;
            text-align: center;
            background: url(/imgs/logout.png) no-repeat;
            background-size: 12px 14px;
            background-position: 4px 15px;
          }

          &:hover {
            height: 74px;
          }

          &:hover .left-ic {
            transform: rotate(180deg);
          }

          &:hover .logout {
            display: block;
          }

          .left-ic {
            width: 16px;
          }
        }
      }
    }
  }
}
</style>
