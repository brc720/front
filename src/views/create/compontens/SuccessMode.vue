<template>
  <div v-if="showDialog" class="success">
    <div class="main">
      <div class="header">
        <div class="title">Inscribing</div>
        <div class="close" @click="close">
          <img src="/imgs/ic1.png" alt="" />
        </div>
      </div>
      <div class="content">
        <div class="item">
          <div>BRC-720</div>
          <div class="val tm-color">{{ props.data?.name }}</div>
        </div>

        <div class="item">
          <div>Content type</div>
          <div class="val color1">HTML</div>
        </div>

        <div class="item">
          <div>Inscription ID</div>
          <div v-if="sendLoading">
            <img
              style="height: 18px; margin: 10px 0 0 20px"
              src="/imgs/wait.gif"
              alt=""
            />
          </div>
          <div
            v-else
            class="val"
            style="color: #3559f6"
            @click="
              open3d(
                props.data?.inscription_id ? props.data?.inscription_id : ''
              )
            "
          >
            {{ props.data?.inscription_id }}
          </div>
        </div>

        <div class="item">
          <div>Address</div>
          <div class="val color1">
            {{ props.data?.owner }}
          </div>
        </div>

        <div class="tip">Waiting for confirmation</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch } from "vue";
import type { OrderStatus } from "../type";

const props = defineProps({
  show: {
    default: false,
  },
  data: {
    type: Object as PropType<OrderStatus>,
  },
  sendLoading: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["update:show", "close"]);

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

const close = () => {
  showDialog.value = false;
  emit("close");
};

const open3d = (id: string) => {
  window.open("https://geniidata.com/ordinals/inscription/" + id, "_blank");
};
</script>

<style lang="less" scoped>
.success {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: #000000b5;
  .main {
    width: 625.1px;
    padding: 20px;
    border: 1px solid #343438;
    border-radius: 8px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #0f0f12;

    .header {
      position: relative;
      .title {
        font-size: 22px;
        padding-bottom: 16px;
        border-bottom: 1px solid #343438;
        text-align: center;
      }

      .close {
        position: absolute;
        top: -4px;
        right: 0;
        cursor: pointer;

        img {
          width: 18px;
        }
      }
    }
  }

  .content {
    padding-bottom: 20px;
    .item {
      margin-top: 40px;

      .val {
        text-indent: 24px;
        margin-top: 10px;
        font-size: 12px;
        word-break: break-all;
      }
    }

    .tip {
      margin-top: 60px;
      text-align: center;
    }
  }
}
</style>
