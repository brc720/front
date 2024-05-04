<script setup lang="ts">
import TwoConfirm from "./TwoConfirm.vue";
import { api, market } from "@/api";
import type { Nft, Results } from "../type";
import { orderby, status } from "../data";
import { useStore } from "@/pinia/store";
import { isLogin, isBc1qAddress, useEthersUnit } from "@/hooks/utils";
import { useBalance } from "@/hooks/useWallet";
import { ElMessage } from "element-plus";
import { pushPsbt, signPsbt } from "@/hooks/usePsbt";

onMounted(() => {
  props.slug ? getNfts() : "";
  if (props.nftName) {
    searchVal.value = props.nftName;
    getNfts();
  }
});

onBeforeUnmount(() => {
  clearInterval(timer.value);
});

const props = defineProps({
  slug: {
    default: "",
  },
  nftName: {
    default: "",
  },
});
const emits = defineEmits(["update"]);

watch(
  () => props.slug,
  () => {
    if (props.nftName) {
      searchVal.value = props.nftName;
    }
    searchVal.value = "";
    params.maxpage = 0;
    nftList.value = [];
    if (props.slug) getNfts();
  }
);

const store = useStore();
const address = computed(() => store.walletAddress);

// 排列模式
const listMode = ref(1);
const changeMode = (val: number) => {
  listMode.value = val;
};

// 筛选
const searchVal = ref("");
const changeSearchVal = () => {
  getNfts();
};
const listBySeach = ref([]);

const orderbyItem = ref({
  label: "Price: low to high",
  value: "price_asc",
});
const chooseOrderby = (item: any) => {
  orderbyItem.value = item;
  getNfts();
};

const nftStatus = ref({
  label: "Hide Pending",
  value: 1,
});
const changeNftStatus = (status: any) => {
  nftStatus.value = status;
  getNfts();
};

// 刷新
const updateList = () => {
  searchVal.value = "";
  emits("update");
  getNfts();
};

// 获取
const loading = ref(false);
const nftList = ref<Nft[]>([]);
const params = reactive({
  page: 1,
  maxpage: 0,
});
const isEndPage = computed(() => params.page > params.maxpage);
const getNfts = async (isBottom: boolean = true) => {
  if (isBottom) {
    params.page = 1;
    nftList.value = [];
    selectedList.value = [];
    sliderVal.value = 0;
    params.maxpage = 0;
  }

  loading.value = true;
  const res: any = await market
    .getNftList({
      collection: props.slug === "all" ? "" : props.slug,
      page: params.page,
      query: searchVal.value,
      orderby: orderbyItem.value.value,
      hide_pending: nftStatus.value.value,
    })
    .finally(() => (loading.value = false));

  if (res.data) {
    const { list, maxpage } = res.data;

    if (isBottom) {
      nftList.value = list;
    } else {
      nftList.value.push(...list);
    }

    params.maxpage = maxpage;
  }
};

// 触底
const bottomLoading = () => {
  if (isEndPage.value || loading.value) {
    return;
  }

  if (params.maxpage > params.page) {
    params.page += 1;
    getNfts(false);
  }
};

// 已选
const selectedList = ref<string[]>([]);
const chooseItem = (val: Nft) => {
  if (val.market_id === 0 || val.owner === address.value || val.status === 2) {
    return;
  }

  if (isBc1qAddress(val.owner) && !isBc1qAddress(address.value)) return;

  if (selectedList.value.includes(val.inscription_id)) {
    selectedList.value = selectedList.value.filter(
      (item) => item !== val.inscription_id
    );
  } else {
    selectedList.value.push(val.inscription_id);
  }

  sliderVal.value = selectedList.value.length;
  computedTotalPrice();
};

//
const smallUtxoTip = () => {
  ElMessage.warning({
    dangerouslyUseHTMLString: true,
    message:
      "<span style='font-weight: 600;color: #F2682A'>Switch your wallet</span><br><br><span style='font-size: 12px;color: #F2682A'>You're buying inscriptions with small UTXOs.<br>Switch to awallet starting with 'bc1q' for trading.</span>",
  });
};

// 滑块选择
const sliderVal = ref(0);
const canSelectList = computed(() => {
  return nftList.value.filter((item) => {
    const isBc1qNft =
      isBc1qAddress(item.owner) && !isBc1qAddress(address.value);

    return (
      item.market_id !== 0 &&
      item.owner !== address.value &&
      item.status !== 2 &&
      !isBc1qNft
    );
  });
});
const sliderSelect = () => {
  selectedList.value = [];

  if (sliderVal.value > 0) {
    for (let index = 0; index < sliderVal.value; index++) {
      let item = canSelectList.value[index];
      item ? selectedList.value.push(item.inscription_id) : "";
    }

    computedTotalPrice();
  }
};

const totalPrice = ref(0);
const market_ids = ref<number[]>([]);
const selectedNftList = ref<Nft[]>([]);
const computedTotalPrice = () => {
  totalPrice.value = 0;
  market_ids.value = [];
  let list: Nft[] = [];

  nftList.value.forEach((item) => {
    if (selectedList.value.includes(item.inscription_id)) {
      totalPrice.value += item.price;
      market_ids.value.push(item.market_id);
      list.push(item);
    }
  });

  selectedNftList.value = list;
};

const toView = (id: string) => {
  open("https://geniidata.com/ordinals/inscription/" + id, "_blank");
};

// 买
const buy = async () => {
  if (!selectedList.value.length) {
    return;
  }

  if (!isLogin()) return;

  const balance = await useBalance();
  if (balance?.total <= 6000) {
    ElMessage.warning("Failed, Insufficient funds");
    return;
  }

  getAllFee();
};

// fee
const fastestFee = ref(0);
const getAllFee = async () => {
  await api
    .getFees()
    .then((res: any) => {
      if (res) {
        fastestFee.value = res.fastestFee;
        checkUtxo(fastestFee.value);
      }
    })
    .finally();
};

// 检测UTXO
const utxoPsbt = ref("");
const checkUtxo = async (
  fee: number,
  is_check: number | undefined = undefined
) => {
  try {
    const res = await market.checkUtxo({
      market_ids: market_ids.value,
      fee,
      is_check,
    });

    if (res.data) {
      if (!is_check) {
        const { isok, psbt } = res.data;
        if (isok === 1) {
          showTwoConfirm.value = true;
        } else {
          utxoPsbt.value = psbt;
          showCreateUtxo.value = true;
        }
      } else {
        if (res.data.isok === 1) {
          clearInterval(timer.value);

          setTimeout(() => {
            createLoading.value = false;
            showCreateUtxo.value = false;
            showTwoConfirm.value = true;
          }, 2000);
        }
      }
    }
  } catch (error) {
    createLoading.value = false;
    clearInterval(timer.value);
  }
};

const timer = ref();
const showCreateUtxo = ref(false);
const createLoading = ref(false);
const confirmCreateUtxo = () => {
  createLoading.value = true;
  signUtxoMsg(utxoPsbt.value);
};

// 创建UTXO签名
const signUtxoMsg = async (psbt: string) => {
  const walletName = localStorage.getItem("wallet_name");
  try {
    let sign = "";
    if (walletName === "xverse") {
      sign = await signPsbt(psbt, true);
    } else {
      sign = await signPsbt(psbt);
    }

    if (sign) {
      pushUtxoPsbt(sign);
    } else {
      createLoading.value = false;
      ElMessage.error("Failed, user rejected the request");
    }
  } catch (error) {
    createLoading.value = false;
    ElMessage.error("Failed, user rejected the request");
  }
};

// pushUTXO
const pushUtxoPsbt = async (sign: string) => {
  try {
    const txid = await pushPsbt(sign);

    if (txid) {
      timer.value = setInterval(() => {
        checkUtxo(fastestFee.value, 1);
      }, 2000);
    } else {
      createLoading.value = false;
      ElMessage.error("Failed, user rejected the request");
    }
  } catch (error) {
    createLoading.value = false;
    ElMessage.error("Failed, user rejected the request");
  }
};

// 确认交易
const showTwoConfirm = ref(false);
const orderInfo = ref({
  money: 0,
  txid: "",
  fee: 0,
});
const confirmTrade = (data: Results) => {
  orderInfo.value = data;
  showTwoConfirm.value = false;
  showSuccess.value = true;
  updateList();
};

// 购买成功
const showSuccess = ref(false);
</script>

<template>
  <div class="items" style="font-weight: ">
    <LoadingView
      v-if="loading && params.maxpage === 0"
      :style="{ size: 30, showBg: true }"
    />
    <div class="filter flex-between">
      <div class="left flex-align">
        <div
          :class="listMode === 1 ? 'on-mode' : ''"
          class="mode flex-center"
          @click="changeMode(1)"
        >
          <img src="/imgs/market/group.png" alt="" />
        </div>
        <div
          :class="listMode === 2 ? 'on-mode' : ''"
          class="mode flex-center"
          @click="changeMode(2)"
        >
          <img src="/imgs/market/list.png" alt="" />
        </div>
        <div class="search flex-center">
          <input
            v-model="searchVal"
            type="text"
            placeholder="Collections"
            @change="changeSearchVal"
          />
          <div class="inp-ic flex-center">
            <img src="/imgs/market/inp_ic.png" alt="" />
          </div>

          <div class="clt-val">
            <div
              v-for="item of listBySeach"
              :key="item"
              class="ic-name-num flex-align singe-line"
            >
              <img src="" alt="" />
              <div>{{ item }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="right flex-align">
        <div class="select flex-align">
          <div class="value singe-line">{{ orderbyItem.label }}</div>
          <img class="ic" src="/imgs/ic4.png" alt="" />
          <div class="option-list">
            <div
              v-for="item of orderby"
              :key="item.value"
              class="option singe-line"
              @click="chooseOrderby(item)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
        <div class="select flex-align">
          <div class="value singe-line flex-align">
            <div v-if="nftStatus.value === 0" class="logo-ic flex-center">
              <img src="/imgs/market/AI_loading.png" alt="" />
            </div>
            <div v-else class="logo-ic-no flex-center">
              <img src="/imgs/market/AI_loading2.png" alt="" />
            </div>
            {{ nftStatus.label }}
          </div>
          <img class="ic" src="/imgs/ic4.png" alt="" />
          <div class="option-list">
            <div
              v-for="item of status"
              :key="item.value"
              class="option singe-line"
              @click="changeNftStatus(item)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
        <div class="update flex-center" @click="updateList">
          <img src="/imgs/market/update.png" alt="" />
        </div>
      </div>
    </div>

    <template v-if="listMode === 1">
      <div
        v-infinite-scroll="bottomLoading"
        :infinite-scroll-distance="100"
        :disabled="isEndPage || loading"
        class="content"
      >
        <div
          v-for="item of nftList"
          :key="item.inscription_id"
          :class="selectedList.includes(item.inscription_id) ? 'selected' : ''"
          class="item"
        >
          <div v-if="item.status === 2" class="disabled flex-center">
            <div class="loading-ic flex-align">
              <img src="/imgs/market/AI_loading.png" alt="" />
            </div>
          </div>

          <div
            v-else-if="item.market_id !== 0 && item.owner === address"
            class="disabled flex-center"
          >
            <div class="flex-align">Your listed</div>
          </div>

          <div
            v-if="
              address &&
              item.market_id !== 0 &&
              isBc1qAddress(item.owner) &&
              !isBc1qAddress(address)
            "
            class="disabled flex-center"
          >
            <div class="small-utxo" @click="smallUtxoTip">
              <img src="/imgs/market/not_ic.png" alt="" />
            </div>
          </div>

          <div
            v-if="selectedList.includes(item.inscription_id)"
            class="selected-ic"
          >
            <img src="/imgs/selected.png" alt="" />
          </div>
          <div class="img" @click="chooseItem(item)">
            <img
              :class="item.pic.includes('base') ? 'base-img' : ''"
              :src="item.pic"
              alt=""
            />
          </div>
          <div class="info">
            <div @click="chooseItem(item)">
              <div class="flex-between flex-align">
                <div class="id color1">#{{ item.inscription_num }}</div>
                <img
                  class="view"
                  src="/imgs/view.png"
                  alt=""
                  @click="toView(item.inscription_id)"
                />
              </div>
              <div class="name tm-color singe-line">{{ item.name }}</div>
            </div>
            <div class="flex-align price">
              <template v-if="item.market_id !== 0">
                <img src="/imgs/Bitcoin.png" alt="" />
                <div>{{ useEthersUnit(item.price).formatVal }}</div>
              </template>
            </div>
          </div>
        </div>

        <div
          v-if="loading && params.maxpage !== 0"
          style="width: 100%; height: 32px; position: relative"
        >
          <LoadingView :style="{ size: 16, showBg: false }" />
        </div>

        <div v-if="!nftList.length" class="not-data">
          <img src="/imgs/not.png" alt="" />
          <div>No items found</div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="content-list">
        <div class="list-title">
          <div></div>
          <div>Items</div>
          <div>Listing Price</div>
          <!-- <div>Floor Difference</div> -->
          <div>Owner</div>
          <!-- <div>Listed Time</div> -->
        </div>

        <div
          v-infinite-scroll="bottomLoading"
          :infinite-scroll-distance="100"
          :disabled="isEndPage || loading"
          class="box"
        >
          <div
            v-for="item of nftList"
            :key="item.inscription_id"
            class="item-list"
            :class="
              selectedList.includes(item.inscription_id) ? 'selected' : ''
            "
            @click="chooseItem(item)"
          >
            <div v-if="item.status === 2" class="disabled flex-center">
              <div class="loading-ic flex-align">
                <img src="/imgs/market/AI_loading.png" alt="" />
              </div>
            </div>

            <div
              v-else-if="item.market_id !== 0 && item.owner === address"
              class="disabled flex-center"
            >
              <div class="flex-align">Your listed</div>
            </div>

            <div
              v-if="
                address &&
                item.market_id !== 0 &&
                isBc1qAddress(item.owner) &&
                !isBc1qAddress(address)
              "
              class="disabled flex-center"
            >
              <div class="small-utxo" @click="smallUtxoTip">
                <img src="/imgs/market/not_ic.png" alt="" />
              </div>
            </div>

            <div
              v-if="selectedList.includes(item.inscription_id)"
              class="sel-ic flex-center"
            >
              <img class="" src="/imgs/selected.png" alt="" />
            </div>
            <div v-else class="sel-ic flex-center">
              <img class="" src="/imgs/market/add.png" alt="" />
            </div>
            <div class="column1 flex-align">
              <div class="flex-align">
                <img class="avatar" :src="item.pic" alt="" />
                <div>
                  <div class="color1">#{{ item.inscription_num }}</div>
                  <div class="name">{{ item.name }}</div>
                </div>
              </div>
            </div>
            <div class="flex-align singe-line">
              <template v-if="item.market_id !== 0">
                <img class="ic" src="/imgs/Bitcoin.png" alt="" />
                &nbsp;{{ useEthersUnit(item.price).formatVal }}
              </template>
            </div>
            <!-- <div>0.00%</div> -->
            <div>
              {{ item.owner.slice(0, 6) + "..." + item.owner.slice(-6) }}
            </div>
            <!-- <div class="singe-line">17 minutes ago</div> -->
          </div>
        </div>

        <div
          v-if="loading && params.maxpage !== 0"
          style="width: 100%; height: 32px; position: relative"
        >
          <LoadingView :style="{ size: 16, showBg: false }" />
        </div>

        <div v-if="!nftList.length" class="not-data">
          <img src="/imgs/not.png" alt="" />
          <div>No items found</div>
        </div>
      </div>
    </template>

    <div class="footer flex-between flex-align">
      <div class="num flex-align">
        <div class="num-left flex-align">
          <div class="num-val">{{ sliderVal }}</div>
          <div class="num-til">ITEMS</div>
        </div>
        <div class="slider-block">
          <el-slider
            v-model="sliderVal"
            :min="0"
            :max="canSelectList.length || 1"
            :disabled="canSelectList.length === 0"
            @change="sliderSelect"
          />
        </div>
        <div class="num-right">Sweep</div>
      </div>
      <div
        :class="selectedList.length === 0 ? 'no-val' : ''"
        class="buy flex-align"
        @click="buy"
      >
        <div class="flex-align">
          <div>Buy&nbsp;</div>
          <div v-show="selectedList.length > 0">
            {{ selectedList.length }} Items
          </div>
        </div>
        <div v-show="selectedList.length > 0" class="flex-align">
          <img class="ic" src="/imgs/Bitcoin.png" alt="" />
          <span>&nbsp;{{ useEthersUnit(totalPrice).formatVal }}</span>
        </div>
      </div>
    </div>
    <CreateUtxoTip
      v-model:show="showCreateUtxo"
      :loading="createLoading"
      @ok="confirmCreateUtxo"
    />

    <TwoConfirm
      v-model:show="showTwoConfirm"
      :items="selectedNftList"
      :market_ids="market_ids"
      @ok="confirmTrade"
    />

    <BuySuccess
      v-model:show="showSuccess"
      :data="orderInfo"
      :items="selectedNftList"
    />
  </div>
</template>

<style scoped lang="less">
.items {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  .filter {
    flex: none;
    height: 32px;
    .left {
      gap: 10px;
      height: 100%;
      .mode {
        width: 32px;
        height: 100%;
        border-radius: 4px;
        background: #2e2623;
        cursor: pointer;
        img {
          width: 18px;
        }
      }

      .on-mode {
        background: #f2682a;
      }

      .search {
        width: 300px;
        height: 100%;
        border: 1px solid #f2682a;
        border-radius: 4px;
        position: relative;

        input {
          flex: 1;
          height: 100%;
          padding-left: 14px;
          font-size: 12px;
          background: #0f0f12;
        }

        .inp-ic {
          width: 46px;
          height: 100%;
          border-left: 1px solid #f2682a;
          cursor: pointer;

          img {
            width: 16px;
          }
        }

        .clt-val {
          display: none;
          position: absolute;
          z-index: 1;
          top: 31px;
          left: 0;
          width: 100%;
          height: max-content;
          max-height: 200px;
          overflow-y: auto;
          padding: 0 14px;
          background: #090808;
          font-size: 12px;
          border-radius: 4px;
          border: 1px solid #542916;

          .ic-name-num {
            padding: 10px 0;
            border-bottom: 1px solid #3a312f;
            cursor: pointer;

            img {
              width: 16px;
              margin-right: 6px;
            }
          }
        }

        &:hover .clt-val {
          display: block;
        }
      }
    }

    .right {
      height: 100%;
      gap: 10px;
      .select {
        width: 220px;
        height: 100%;
        padding: 0 14px;
        border-radius: 4px;
        border: 1px solid #813c1e;
        font-size: 12px;
        cursor: pointer;
        position: relative;

        .value {
          flex: 1;
          .logo-ic,
          .logo-ic-no {
            width: 24px;
            margin-right: 6px;
            img {
              width: 100%;
            }
            @keyframes loading {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          }

          .logo-ic {
            background: url("/imgs/market/AI.png") no-repeat center/80% 80%;
            img {
              animation: loading 2s infinite forwards linear;
            }
          }
          .logo-ic-no {
            background: url("/imgs/market/AI2.png") no-repeat center/80% 50%;
          }
        }
        .ic {
          width: 14px;
        }

        .option-list {
          display: none;
          width: 100%;
          position: absolute;
          left: 0;
          top: 30px;
          padding: 0 14px;
          border-radius: 4px;
          border: 1px solid #542916;
          background: #0f0f12;
          z-index: 10;

          .option {
            line-height: 30px;
            border-bottom: 1px solid #542916;
            // color: #8f8c8c;

            // &:hover {
            //   color: #fff;
            // }
          }
        }

        &:hover .option-list {
          display: block;
        }

        &:hover .ic {
          transform: rotate(180deg);
        }
      }

      .update {
        width: 32px;
        height: 100%;
        padding: 6px;
        background: #2e2623;
        border-radius: 4px;
        cursor: pointer;

        img {
          width: 100%;
        }
      }
    }
  }

  .disabled {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    background: #0f0f127e;
    cursor: not-allowed;

    .small-utxo {
      position: absolute;
      top: 6px;
      right: 6px;
      img {
        width: 20px;
        cursor: pointer;
      }
    }

    .loading-ic {
      margin-right: 6px;
      background: url("/imgs/market/AI.png") no-repeat center/80% 80%;
      img {
        width: 32px;
        animation: loading 2s infinite forwards linear;
      }
      @keyframes loading {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
  }

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

  .content {
    flex: 1;
    overflow: auto;
    margin: 14px 0;
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    gap: 10px;
    position: relative;
    &::-webkit-scrollbar {
      width: 0px;
    }
    .item {
      width: 196px;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      position: relative;
      border: 1px solid #303031;

      .img {
        width: 100%;
        height: 196px;
        overflow: hidden;
        background: #121212;

        img {
          width: 100%;
        }

        .base-img {
          transform: scale(1.8) translateY(6px);
        }
      }

      .info {
        font-size: 12px;
        padding: 10px 4px;
        background: #100807;

        .view {
          height: 14px;
          margin-bottom: 6px;
        }

        .name {
          width: 100%;
          margin-bottom: 6px;
        }

        .price {
          height: 16px;
          font-size: 14px;
          img {
            height: 100%;
            margin-right: 4px;
          }
        }
      }
    }

    .selected {
      border-color: #f2682a;
    }

    .selected-ic {
      position: absolute;
      top: 6px;
      right: 6px;

      img {
        width: 20px;
      }
    }
  }

  .content-list {
    flex: 1;
    margin: 14px 0;
    background: #181517;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;

    .list-title {
      width: 100%;
      display: grid;
      grid-template-columns: 50px 1fr 1fr 1fr;
      align-items: center;
      padding: 10px 0;
      background: #2e2623;
      font-size: 12px;
      border-radius: 4px;
    }

    .box {
      flex: 1;
      overflow: auto;
      &::-webkit-scrollbar {
        width: 0px;
      }
    }

    .item-list {
      width: 100%;
      padding: 8px 0;
      display: grid;
      grid-template-columns: 50px 1fr 1fr 1fr;
      align-items: center;
      font-size: 12px;
      line-height: 1.5;
      border-bottom: 1px solid #1f1f1f;
      position: relative;

      .sel-ic {
        cursor: pointer;
        img {
          width: 16px;
        }
      }
      .column1 {
        .avatar {
          width: 32px;
          margin-right: 10px;
        }
      }

      .ic {
        width: 16px;
      }
    }

    .selected {
      border-color: #f2682a;
    }
  }

  .footer {
    height: 32px;
    overflow: hidden;
    .num {
      font-size: 12px;
      .num-left {
        flex: none;
        border-radius: 4px;
        overflow: hidden;
        background: #090808;
        border: 1px solid #2e2623;

        div {
          width: 70px;
          line-height: 30px;
          text-align: center;
        }

        .num-val {
          background: #2e2623;
        }
      }
      .slider-block {
        width: 240px;
        // height: 100%;
        margin: 0 20px;

        :deep(.el-slider__bar) {
          background: #f2682a;
        }
        :deep(.el-slider__button) {
          width: 16px;
          height: 16px;
          border-color: #f2682a;
          background: #0f0f12;
        }
      }
    }
    .buy {
      min-width: 260px;
      height: 32px;
      justify-content: space-around;
      padding: 0 14px;
      gap: 20px;
      background: #f2682a;
      border-radius: 4px;
      text-align: center;
      cursor: pointer;
      font-size: 14px;

      img {
        width: 14px;
      }
    }

    .no-val {
      background: #35312f;
      cursor: not-allowed;
    }
  }
}
</style>
