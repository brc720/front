<template>
  <div class="loading-ani flex-center">
    <div class="content">
      <div class="loading1"></div>
      <div class="loading2"></div>
      <div class="loading3"></div>
      <div class="loading4"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  style: {
    type: Object as PropType<{ size: number; showBg: boolean | undefined }>,
    default: { size: 36, showBg: true },
  },
});
const size = computed(() => props.style.size + "px");
const showBg = computed(() => (props.style.showBg ? "#00000096" : "#00000000"));
</script>

<style lang="less" scoped>
.loading-ani {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: v-bind(showBg);
  z-index: 50;

  .content {
    width: v-bind(size);
    height: v-bind(size);
    max-width: 36px;
    max-height: 36px;
    position: relative;
    animation: box 1s 2s infinite forwards linear;
    div {
      width: 45%;
      height: 45%;
      max-width: 16px;
      max-height: 16px;
      border-radius: 50%;
      background: #f2682a;
      transform: translate(-50%, -50%);
    }

    .loading1 {
      position: absolute;
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
      animation: loading1 2s infinite forwards linear;
    }
    .loading2 {
      position: absolute;
      top: 0;
      right: 0;
      transform: translate(50%, -50%);
      animation: loading2 2s infinite forwards linear;
    }
    .loading3 {
      position: absolute;
      bottom: 0;
      left: 0;
      transform: translate(-50%, 50%);
      animation: loading3 2s infinite forwards linear;
    }
    .loading4 {
      position: absolute;
      bottom: 0;
      right: 0;
      transform: translate(50%, 50%);
      animation: loading4 2s infinite forwards linear;
    }
  }
}

@keyframes loading1 {
  0% {
    top: 0;
    left: 0;
  }
  50% {
    top: 50%;
    left: 50%;
  }

  100% {
    top: 0;
    left: 0;
  }
}

@keyframes loading2 {
  0% {
    top: 0;
    right: 0;
  }
  50% {
    top: 50%;
    right: 50%;
  }

  100% {
    top: 0;
    right: 0;
  }
}

@keyframes loading3 {
  0% {
    bottom: 0;
    left: 0;
  }
  50% {
    bottom: 50%;
    left: 50%;
  }

  100% {
    bottom: 0;
    left: 0;
  }
}

@keyframes loading4 {
  0% {
    bottom: 0;
    right: 0;
  }
  50% {
    bottom: 50%;
    right: 50%;
  }

  100% {
    bottom: 0;
    right: 0;
  }
}

@keyframes box {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(180deg);
  }
}
</style>
