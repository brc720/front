<template>
  <div v-if="showDialog" class="buy-suc">
    <div class="main">
      <div class="header">
        <div class="title">
          Buy <span class="tm-color">{{ items?.length }}</span> items
        </div>
        <div class="close" @click="showDialog = false">
          <img src="/imgs/ic1.png" alt="" />
        </div>
      </div>
      <div class="content">
        <div class="ic-status">
          <img src="/imgs/success.png" alt="" />
          <div>Successful</div>
        </div>

        <div class="pirce flex-align flex-between">
          <div>You paid</div>
          <div class="flex-align">
            <div class="flex-align">
              <img src="/imgs/Bitcoin.png" alt="" />
              <div>
                ${{ useEthersUnit(data?.money || 0).formatVal }}
                <span class="tm-color">BTC</span>
              </div>
            </div>
            <div class="color1">
              （${{
                (usd * useEthersUnit(data?.money || 0).formatVal).toFixed(2)
              }}）
            </div>
          </div>
        </div>

        <div class="pirce flex-align flex-between">
          <div>Gas fee</div>
          <div class="flex-align">
            <div class="flex-align">
              <img src="/imgs/Bitcoin.png" alt="" />
              <div>
                ${{ useEthersUnit(data?.fee || 0).formatVal }}
                <span class="tm-color">BTC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="btn-box">
        <div class="cancel" @click="buyMore">Buy More</div>
        <div class="confirm" @click="viewItems">View item</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Results } from "../type";
import { useEthersUnit } from "@/hooks/utils";
import axios from "@/api/axios";

const props = defineProps({
  show: {
    default: false,
  },
  data: {
    type: Object as PropType<Results>,
  },
  items: {
    type: Array,
  },
});
const emit = defineEmits(["update:show", "ok"]);
const router = useRouter();

const showDialog = ref(false);

watch(
  () => props.show,
  () => {
    if (props.show) getUsdtByBtc();

    showDialog.value = props.show;
  }
);
watch(
  () => showDialog.value,
  () => {
    emit("update:show", showDialog.value);
  }
);

const usd = ref(0);
const getUsdtByBtc = async () => {
  const res: any = await axios.get("https://mempool.space/api/v1/prices");
  usd.value = res?.USD;
};

const buyMore = () => {
  showDialog.value = false;
  emit("ok");
};

const viewItems = async () => {
  router.push("/mybrc720");
};
</script>

<style lang="less" scoped>
.buy-suc {
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

    .header {
      position: relative;
      .title {
        font-size: 22px;
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
    font-size: 12px;
    border-bottom: 1px solid #3a312f;
    padding: 20px 0 40px;
    .ic-status {
      font-size: 18px;
      width: max-content;
      margin: 0 auto 40px;
      text-align: center;

      img {
        width: 52px;
      }
    }

    .pirce {
      margin-bottom: 10px;
      img {
        width: 18px;
        margin-right: 6px;
      }
    }
  }

  .btn-box {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
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
