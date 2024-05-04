<script setup lang="ts">
import { onMounted } from "vue";
import HeaderView from "./components/HeaderView.vue";
import { useStore } from "@/pinia/store";
import { useListenIn } from "@/hooks/listenIn";

const store = useStore();
useListenIn();
onMounted(() => {
  const userToken = localStorage.getItem("userToken") || "";
  const userAddr = localStorage.getItem("walletAddress") || "";
  store.setWalletAddress(userAddr);
  store.setUserToken(userToken);
});
</script>

<template>
  <div class="app">
    <HeaderView />
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  padding-top: 70px;
  overflow: hidden;
  background: #121316;
}
.content {
  height: 100%;
  overflow: auto;
}
</style>
@/hooks/listenIn
