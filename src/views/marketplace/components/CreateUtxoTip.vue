<template>
  <div v-if="showDialog" class="utxo-tip">
    <div class="main">
      <LoadingView v-if="showLoading" :style="{ size: 24, showBg: true }" />
      <div class="header">
        <div class="title">{{ title }}</div>
        <div class="close" @click="showDialog = false">
          <img src="/imgs/ic1.png" alt="" />
        </div>
      </div>
      <div class="content">
        <div>{{ content }}</div>
      </div>

      <div class="btn-box">
        <div class="confirm" @click="confirm">Create UTXO</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  show: {
    default: false,
  },
  title: {
    type: String,
    default: "Preparing Your Wallet",
  },
  content: {
    type: String,
    default:
      "To enable transactions, create a payment UTXO for fully decentralized transactions, ensuring Ordinals safety. This UTXO stays in your wallet for future transactions, allowing multiple purchases on BRC720 Marketplace. If engaging in concurrent transactions, repeat this process as needed.",
  },
  loading: {
    type: Boolean,
    defalut: false,
  },
});
const emit = defineEmits(["update:show", "ok"]);

const showDialog = ref(false);
watch(
  () => props.show,
  () => {
    showDialog.value = props.show;
  }
);
watch(
  () => showDialog.value,
  () => {
    emit("update:show", showDialog.value);
  }
);

const showLoading = ref(false);
watch(
  () => props.loading,
  () => {
    console.log(props.loading);

    showLoading.value = props.loading;
  }
);

const confirm = () => {
  emit("ok");
};
</script>

<style lang="less" scoped>
.utxo-tip {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  background: #000000b5;
  .main {
    width: 469.3px;
    padding: 16px;
    border: 1px solid #343438;
    border-radius: 8px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0f0f12;
    position: relative;

    .header {
      position: relative;
      border-bottom: 1px solid #343438;
      .title {
        font-size: 18px;
        padding-bottom: 20px;
      }

      .close {
        position: absolute;
        top: 0;
        right: 0;
        cursor: pointer;
        img {
          width: 18px;
        }
      }
    }
  }

  .content {
    font-size: 14px;
    border-bottom: 1px solid #3a312f;
    padding: 40px 0 60px;
    line-height: 1.5;
    text-indent: 28px;
  }

  .btn-box {
    margin-top: 40px;
    display: flex;
    justify-content: space-around;
    .cancel,
    .confirm {
      width: 40%;
      padding: 8px 0;
      text-align: center;
      background: #35312f;
      border-radius: 4px;
      cursor: pointer;
    }

    .confirm {
      background: #f2682a;
    }
  }
}
</style>
