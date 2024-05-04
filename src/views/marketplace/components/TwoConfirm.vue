<script setup lang="ts">
import { ref, watch, PropType } from "vue";
import { api, market } from "@/api";
import { isLogin, useEthersUnit } from "@/hooks/utils";
import type { Nft } from "../type";
import axios from "@/api/axios";
import { useBalance } from "@/hooks/useWallet";
import { ElMessage } from "element-plus";
import { useElMessage } from "@/hooks/useMessage";
import { signPsbt } from "@/hooks/usePsbt";

const props = defineProps({
  show: {
    default: false,
  },
  items: {
    type: Array as PropType<Nft[]>,
  },
  market_ids: {
    type: Array as PropType<number[]>,
  },
});
const emit = defineEmits(["update:show", "ok"]);

const usd = ref(0);
const getUsdtByBtc = async () => {
  const res: any = await axios.get("https://mempool.space/api/v1/prices");
  usd.value = res.USD;
};

const showDialog = ref(false);
watch(
  () => props.show,
  () => {
    showDialog.value = props.show;
    if (props.show) {
      getMoney();
      getUsdtByBtc();
    }
  }
);
watch(
  () => showDialog.value,
  () => {
    emit("update:show", showDialog.value);
  }
);

let feeData = ref({
  economy: 0,
  custom: 0,
  standard: 0,
});

const loading = ref(false);

// 获取价格
const moneyData = ref({
  bese_fee: 0,
  network_fee: 0,
  service_fee: 0,
});
const getMoney = async () => {
  const market_ids = props.items?.map((item) => item.market_id) || [];
  try {
    loading.value = true;
    const res = await market
      .computedMoney({
        market_ids,
      })
      .finally(() => (loading.value = false));

    if (res.data) {
      moneyData.value = res.data;
      getAllFee();
    }
  } catch (error) {
    loading.value = false;
  }
};

// fee
const getAllFee = async () => {
  await api
    .getFees()
    .then((res) => {
      if (res) {
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
        computedNetworkFree(feeData.value.economy);
      }
    })
    .finally(() => (loading.value = false));
};

// slign设置custom fee
const changeCustom = () => {
  computedNetworkFree(feeData.value.custom);
};

// 切换fee
const feeType = ref(2);
const changeFeeType = (val: number, fee: number) => {
  feeType.value = val;
  computedNetworkFree(fee);
};

// 计算TotalFree
const totalMoney = ref(0);
const computedTotalFree = () => {
  totalMoney.value =
    moneyData.value.service_fee + moneyData.value.bese_fee + networkFree.value;
};

// 计算networkFree
const networkFree = ref(0);
const computedNetworkFree = (fee: number) => {
  networkFree.value = moneyData.value.network_fee
    ? moneyData.value.network_fee * fee
    : 0;

  computedTotalFree();
};

// 确认购买
const confirmCreate = async () => {
  if (!isLogin()) return;

  const balance = await useBalance();
  if (balance?.total <= 0 || balance?.total < totalMoney.value) {
    useElMessage("Failed, Insufficient funds", "warning");
    return;
  }

  submitOrder();
};

// 创建订单
const submitOrder = async () => {
  const fee =
    feeType.value === 1
      ? feeData.value.economy
      : feeType.value === 2
      ? feeData.value.standard
      : feeData.value.custom;
  try {
    loading.value = true;
    const res = await market.createOrder({
      market_ids: props.market_ids || [],
      fee,
    });

    if (res.data) {
      sign(res.data);
    }
  } catch (error) {
    loading.value = false;
    console.log(error);
  }
};

// 交易签名
const sign = async (order: { order_id: string; psbt_hex: string }) => {
  try {
    const sign = await signPsbt(order.psbt_hex).finally(
      () => (loading.value = false)
    );
    if (sign) {
      getResults(order.order_id, sign);
    }
  } catch (error) {
    console.log("Sign Error:", error);
    ElMessage.error("Failed, user rejected the request");
    loading.value = false;
  }
};

// 获取结果
const getResults = async (order_id: string, sign: string) => {
  try {
    const res = await market
      .getOrderResults({
        order_id,
        sign,
      })
      .finally(() => (loading.value = false));

    if (res.data && res.data.txid) {
      emit("ok", res.data);
    } else {
      ElMessage.error("Failed, order has expired. Please try again.");
    }
  } catch (error) {
    ElMessage.error("Failed, order has expired. Please try again.");
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="showDialog" class="two-cfm">
    <LoadingView v-if="loading" :style="{ size: 24, showBg: true }" />
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
        <div class="items-box">
          <div
            v-for="item of items"
            :key="item.inscription_id"
            class="items flex-between"
          >
            <div class="name flex-align">
              <img :src="item.pic" alt="" />
              <div>
                <div style="font-size: 12px" class="color1">
                  Inscription #{{ item.inscription_num }}
                </div>
                <div>{{ item.name }}</div>
              </div>
            </div>

            <div class="price flex-align">
              <img src="/imgs/Bitcoin.png" alt="" />
              <span
                >{{ useEthersUnit(item.price).formatVal }} (${{
                  (usd * useEthersUnit(item.price).formatVal).toFixed(2)
                }})</span
              >
            </div>
          </div>
        </div>

        <div class="item">
          <div>Items({{ items?.length }})</div>
          <div class="right flex-align">
            <img src="/imgs/Bitcoin.png" alt="" />
            <div class="color1">
              {{ useEthersUnit(moneyData.bese_fee).formatVal }}
            </div>
          </div>
        </div>
        <div class="item">
          <div>Service Fee</div>
          <div class="right flex-align">
            <img src="/imgs/Bitcoin.png" alt="" />
            <div class="color1">
              {{ useEthersUnit(moneyData.service_fee).formatVal }}
            </div>
          </div>
        </div>

        <div class="item">
          <div class="color1">Network Fee</div>
          <div class="right flex-align">
            <img src="/imgs/Bitcoin.png" alt="" />
            <div class="color1">
              {{ useEthersUnit(networkFree).formatVal }}
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
          <div class="">You Pay</div>
          <div class="right flex-align">
            <img src="/imgs/Bitcoin.png" alt="" />
            <div class="">
              {{ useEthersUnit(totalMoney).formatVal }}
            </div>
          </div>
        </div>

        <div class="btn-box">
          <div class="confirm" @click="confirmCreate">Confirm</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.two-cfm {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
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
    .items-box {
      max-height: 25vh;
      overflow: auto;
      border-radius: 4px;
      border: 1px solid #3a312f;
      background: #181517;

      .items {
        padding: 6px 20px;
        border-bottom: 1px solid #1f1f1f;
        font-size: 14px;
        border-radius: 4px;

        .name {
          line-height: 1.5;
          img {
            width: 32px;
            margin-right: 16px;
          }
        }

        .price {
          img {
            width: 18px;
            margin-right: 10px;
          }
        }
      }
    }

    .item {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;

      .right {
        font-size: 14px;

        img {
          width: 18px;
          margin-right: 6px;
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
      .confirm {
        width: 33%;
        margin: auto;
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
