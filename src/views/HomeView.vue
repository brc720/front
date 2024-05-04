<script setup lang="ts">
const get = async () => {
  console.log(window.okxwallet);

  // try {
  //   let res = await window.okxwallet.getInscriptions(0, 10);
  //   console.log(res);
  // } catch (e) {
  //   console.log(e);
  // }
};
</script>

<template>
  <div class="home">
    <button @click="get">交易</button>
  </div>
</template>

<style scoped></style>
