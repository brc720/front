<template>
  <div v-if="showDialog" class="config-brc">
    <div class="main">
      <div class="header">
        <div class="title">BRC-720 Inscribe</div>
        <div class="close" @click="showDialog = false">
          <img src="/imgs/ic1.png" alt="" />
        </div>
      </div>
      <div class="content">
        <div class="item">
          <div>Service Fee</div>
          <div class="right flex-align">
            <img src="/imgs/Bitcoin.png" alt="" />
            <div class="color1">0.0005</div>
          </div>
        </div>

        <div class="item">
          <div class="color1">Network Fee</div>
          <div class="right flex-align">
            <img src="/imgs/Bitcoin.png" alt="" />
            <div class="color1">
              {{ ethers.formatUnits(networkFree.toString() || "0", 8) }}
            </div>
          </div>
        </div>

        <div class="type-box">
          <div
            :class="feeType === 1 ? 'type-on' : ''"
            class="type"
            @click="changeFeeType(1, feeData.economy)"
          >
            <div class="top">Economy</div>
            <div class="color1">{{ feeData.economy }} sats/vB</div>
          </div>
          <div
            :class="feeType === 2 ? 'type-on' : ''"
            class="type"
            @click="changeFeeType(2, feeData.standard)"
          >
            <div class="top">Standard</div>
            <div class="color1">{{ feeData.standard }} sats/vB</div>
          </div>
          <div
            :class="feeType === 3 ? 'type-on' : ''"
            class="type"
            @click="changeFeeType(3, feeData.custom)"
          >
            <div class="top">Custom</div>
            <div class="color1">{{ feeData.custom }} sats/vB</div>
          </div>
        </div>

        <div v-show="feeType === 3" class="slider-block flex-align">
          <el-slider
            v-model="feeData.custom"
            :min="25"
            :max="500"
            @change="changeCustom"
          />
          <div class="amount">{{ feeData.custom }}</div>
        </div>

        <div class="item">
          <div class="color1">Total Fee</div>
          <div class="right flex-align">
            <img src="/imgs/Bitcoin.png" alt="" />
            <div class="">
              {{ ethers.formatUnits(totalFee.toString() || "0", 8) }}
            </div>
          </div>
        </div>

        <div class="btn-box">
          <div class="cancel" @click="showDialog = false">Cancel</div>
          <div class="confirm" @click="confirmCreate">Confirm</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, PropType } from "vue";
import { getFees, createOrder } from "@/api/api";
import type { ModelInfo } from "../type";
import { ethers } from "ethers";

const props = defineProps({
  show: {
    default: false,
  },
  data: {
    type: Object as PropType<ModelInfo>,
  },
});
const emit = defineEmits(["update:show", "ok"]);

const showDialog = ref(false);

watch(
  () => props.show,
  () => {
    showDialog.value = props.show;
    // getAllFee();
  }
);
watch(
  () => showDialog.value,
  () => {
    getAllFee();
    emit("update:show", showDialog.value);
  }
);

let feeData = ref({
  economy: 0,
  custom: 0,
  standard: 0,
});

const getAllFee = async () => {
  await getFees().then((res) => {
    const {
      hourFee: economy,
      fastestFee: custom,
      halfHourFee: standard,
    } = res as any;
    const feeObj = {
      economy,
      custom: custom < 25 ? 25 : custom > 500 ? 500 : custom,
      standard: standard + 1,
    };

    feeData.value = feeObj;
    computedTotalFree(feeData.value.economy);
    computedNetworkFree(feeData.value.economy);
  });
};

const changeCustom = () => {
  computedTotalFree(feeData.value.custom);
  computedNetworkFree(feeData.value.custom);
};

const feeType = ref(2);
const totalFee = ref(0);
const changeFeeType = (val: number, fee: number) => {
  feeType.value = val;
  computedTotalFree(fee);
  computedNetworkFree(fee);
};
const computedTotalFree = (fee: number) => {
  totalFee.value = props.data?.fee_sats
    ? props.data?.fee_sats * fee + props.data?.fee_base
    : 0;
};

const networkFree = ref(0);
const computedNetworkFree = (fee: number) => {
  networkFree.value = props.data?.fee_sats ? props.data?.fee_sats * fee : 0;
};

const confirmCreate = async () => {
  const fee =
    feeType.value === 1
      ? feeData.value.economy
      : feeType.value === 2
      ? feeData.value.standard
      : feeData.value.custom;
  const res = await createOrder({
    task_id: props.data?.task_id,
    fee,
    bitman_id: +props.data?.bitman_id,
  });

  if (res.code === 200) {
    emit("ok", res.data, fee);
  }
};
</script>

<style lang="less" scoped>
.config-brc {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: #000000b5;
  .main {
    width: 625.1px;
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
        padding-bottom: 16px;
        border-bottom: 1px solid #343438;
        text-align: center;
      }

      .close {
        position: absolute;
        top: -10px;
        right: 0;
        cursor: pointer;
        img {
          width: 24px;
        }
      }
    }
  }

  .content {
    padding-bottom: 40px;
    .item {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;

      .right {
        font-size: 14px;

        img {
          width: 22px;
          margin-right: 12px;
        }
      }
    }

    .type-box {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      .type {
        border: 1px solid #424242;
        border-radius: 4px;
        text-align: center;
        font-size: 12px;
        padding: 10px 0;
        background: #0c0c18;

        .top {
          margin-bottom: 10px;
        }
      }

      .type-on {
        border-color: #f2682a;
      }
    }

    .slider-block {
      margin-top: 20px;
      :deep(.el-slider__bar) {
        background: #f2682a;
      }
      :deep(.el-slider__button) {
        width: 16px;
        height: 16px;
        border-color: #f2682a;
        background: #0f0f12;
      }
      .amount {
        width: 88px;
        padding: 6px 0;
        margin-left: 20px;
        border: 1px solid #424242;
        border-radius: 4px;
        text-align: center;
        background: #0c0c18;
      }
    }

    .btn-box {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      .cancel,
      .confirm {
        width: 33%;
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
}
</style>
