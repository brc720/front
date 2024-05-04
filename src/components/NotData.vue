<template>
  <div class="not-data">
    <img src="/imgs/not.png" alt="" />
    <div>No items found</div>
  </div>
</template>
<script setup lang="ts"></script>

<style lang="less" scoped>
.not-data {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  img {
    width: 52px;
    margin-bottom: 10px;
  }
}
</style>
