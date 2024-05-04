<script setup lang="ts">
import { mybrc } from "@/api";
import { MyCollection, MyNft } from "../type";
import { ElMessage } from "element-plus";
import { isLogin } from "@/hooks/utils";
import GPTModal from "@/components/GPTModal/GPT.vue";
import { useEthersUnit } from "@/hooks/utils";

onMounted(() => {
  if (isLogin()) {
    getCollectList();
  }
});

const router = useRouter();

const nav = ref(1);
const changeNav = (val: number) => {
  if (val !== 1) {
    ElMessage.warning("Coming soon");
    return;
  }
  nav.value = val;
};

// 左侧合集
const onType = ref("");
const onCollection = ref({} as MyCollection);
const changeOnType = (val: string) => {
  onType.value = val;
  onCollection.value = collectList.value.filter((item) => item.slug === val)[0];
  getNftList();
};

const collectList = ref<MyCollection[]>([]);
const collectionData = reactive({
  loading: false,
  page: 1,
  maxpage: 1,
});
const isEndPage = computed(() => collectionData.page > collectionData.maxpage);
const getCollectList = async (isNext: boolean = false) => {
  if (collectionData.loading) return;

  if (!isNext) {
    collectionData.page = 1;
    collectList.value = [];
  }

  collectionData.loading = true;
  const res = await mybrc.getMyCollects({
    page: collectionData.page,
  });
  if (res.code === 200) {
    const { list, maxpage } = res.data;

    if (!isNext) {
      collectList.value = list;
    } else {
      collectList.value.push(...list);
    }

    collectionData.maxpage = maxpage;
    onType.value = onType.value ? onType.value : collectList.value[0]?.slug;
    if (onType.value) {
      onCollection.value = collectList.value.filter(
        (item) => item.slug === onType.value
      )[0];
      getNftList();
    }
  }
  collectionData.loading = false;
};

const nextCollection = () => {
  if (isEndPage || collectionData.loading) {
    return;
  }

  if (collectionData.maxpage > collectionData.page) {
    collectionData.page += 1;
    getCollectList(true);
  }
};

// 右侧列表
const nftList = ref<MyNft[]>([]);
const nftData = reactive({
  loading: false,
  page: 1,
  maxpage: 1,
});
const isNftEndPage = computed(() => nftData.page > nftData.maxpage);
const getNftList = async (isNext: boolean = false) => {
  if (!isNext) {
    nftData.page = 1;
    nftList.value = [];
    selectedList.value = [];
    sliderVal.value = 0;
  }

  nftData.loading = true;
  const res = await mybrc.getMyCollectNft({
    collection: onType.value,
    page: nftData.page,
  });

  const { list, maxpage } = res.data;

  if (!isNext) {
    nftList.value = list;
  } else {
    nftList.value.push(...list);
  }

  nftData.maxpage = maxpage;
  nftData.loading = false;
};

const nextNftPage = () => {
  if (isEndPage || collectionData.loading) {
    return;
  }

  if (nftData.maxpage > nftData.page) {
    nftData.page += 1;
    getNftList(true);
  }
};

const toView = (inscription_id: string) => {
  window.open(
    "https://geniidata.com/ordinals/inscription/" + inscription_id,
    "_blank"
  );
};

// 已选
const selectedList = ref<string[]>([]);
const selectedNft = ref<MyNft[]>([]);
const chooseItem = (val: MyNft) => {
  if (val.status === 2) return;

  if (selectedList.value.includes(val.inscription_id)) {
    selectedList.value = selectedList.value.filter(
      (item) => item !== val.inscription_id
    );

    selectedNft.value = selectedNft.value.filter(
      (item) => item.inscription_id !== val.inscription_id
    );
  } else {
    selectedList.value.push(val.inscription_id);
    selectedNft.value.push(val);
  }

  sliderVal.value = selectedList.value.length;
  computedTotalPrice();
};

const sliderVal = ref(0);
const canSelectList = computed(() => {
  return nftList.value.filter((item) => item.status !== 2);
});
const sliderSelect = () => {
  selectedList.value = [];

  if (sliderVal.value > 0) {
    for (let index = 0; index < sliderVal.value; index++) {
      let item = canSelectList.value[index];
      selectedList.value.push(item.inscription_id);
    }

    computedTotalPrice();
  }
};

const totalPrice = ref(0);
const selectedNftList = ref<MyNft[]>([]);
const computedTotalPrice = () => {
  totalPrice.value = 0;
  let list: MyNft[] = [];

  nftList.value.forEach((item) => {
    if (selectedList.value.includes(item.inscription_id)) {
      totalPrice.value += item.price;
      list.push(item);
    }

    selectedNftList.value = list;
  });
};

// list
const list = () => {
  if (!selectedList.value.length) return;
  showList.value = true;
};

const showList = ref(false);
const confirmUpOrder = (_data: { success: number; fail: number }) => {
  getCollectList();
  showList.value = false;
};

// Gpt
const showGpt = ref(false);
const gptModelData = reactive({
  id: "",
  num: 0,
});
const openDialogue = (id: string, num: string) => {
  gptModelData.id = id;
  gptModelData.num = num ? +num : 0;
  showGpt.value = true;
};
const close = () => {
  gptModelData.id = "";
  gptModelData.num = 0;
};

//
const toMarketplace = (nft: MyNft) => {
  router.push({
    path: "/marketplace",
    query: {
      slug: onCollection.value.slug,
      name: onCollection.value.name,
      nftName: nft.name,
    },
  });
};
</script>

<template>
  <div class="collects">
    <div class="data-left">
      <div class="title flex-align">
        <div class="icon"></div>
        BRC720 Collections
      </div>
      <div class="header">
        <div class=""></div>
        <div class="flex-between">
          <div>Floor</div>
          <div>Value</div>
          <div>Listed</div>
        </div>
      </div>
      <div
        v-infinite-scroll="nextCollection"
        :infinite-scroll-distance="100"
        :disabled="isEndPage || collectionData.loading"
        class="l-list"
      >
        <div
          v-for="item in collectList"
          :key="item.slug"
          :class="onType === item.slug ? 'on-type' : ''"
          class="type flex-align"
          @click="changeOnType(item.slug)"
        >
          <div class="flex-align avatar">
            <img :src="item.icon" alt="" />
          </div>
          <div class="info">
            <div class="nft-name">{{ item.name }}</div>
            <div class="floor">
              <div class="color1">FLOOR</div>
              <div class="num flex-between">
                <div class="flex-center">
                  <img src="/imgs/Bitcoin.png" alt="" />
                  <div>{{ useEthersUnit(item.floor_price).formatVal }}</div>
                </div>
                <div class="flex-center">
                  <img src="/imgs/Bitcoin.png" alt="" />
                  <div>
                    {{
                      useEthersUnit(item.floor_price * item.has_number)
                        .formatVal
                    }}
                  </div>
                </div>
                <div>{{ item.listed }}/{{ item.has_number }}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: center; position: relative">
          <p v-if="collectionData.loading">
            <LoadingView :style="{ size: 16, showBg: false }" />
          </p>
        </div>
      </div>
    </div>
    <div class="data-right">
      <div
        v-infinite-scroll="nextNftPage"
        :infinite-scroll-distance="100"
        :disabled="isNftEndPage || nftData.loading"
        class="r-list"
      >
        <div
          v-for="item in nftList"
          :key="item.inscription_id"
          :class="selectedList.includes(item.inscription_id) ? 'on' : ''"
          class="brc-info"
          @click="chooseItem(item)"
        >
          <div v-if="item.status === 2" class="disabled flex-center">
            <div class="loading-ic flex-align">
              <img src="/imgs/market/AI_loading.png" alt="" />
            </div>
          </div>

          <div
            v-if="selectedList.includes(item.inscription_id)"
            class="selected"
          >
            <img src="/imgs/selected.png" alt="" />
          </div>

          <div
            v-if="!item.name.includes('3D')"
            class="gpt"
            @click="openDialogue(item.inscription_id, item.name.split('#')[1])"
          >
            <img class="msg" src="/imgs/message.png" alt="" />
            <img class="bt" src="/imgs/small_bot.png" alt="" />
          </div>

          <div class="info-img">
            <img
              :class="item.pic.includes('base') ? 'base-img' : ''"
              :src="item.pic"
              alt=""
            />
          </div>
          <div class="info-data">
            <div class="to-view flex-align flex-between">
              <div class="color1">{{ item.inscription_num }}</div>
              <img
                src="/imgs/view.png"
                alt=""
                @click="toView(item.inscription_id)"
              />
            </div>
            <div
              class="nft-name tm-color singe-line"
              @click="toMarketplace(item)"
            >
              {{ item.name }}
            </div>

            <div class="price flex-align">
              <template v-if="item.market_id !== 0">
                <img src="/imgs/Bitcoin.png" alt="" />
                <div>{{ useEthersUnit(item.price).formatVal }}</div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <p v-if="nftData.loading">
        <LoadingView :style="{ size: 32, showBg: true }" />
      </p>
      <div v-if="!nftList.length" class="not-data">
        <img src="/imgs/not.png" alt="" />
        <div>No items found</div>
      </div>

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
              :max="nftList.length"
              @change="sliderSelect"
            />
          </div>
          <div class="num-right">Sweep</div>
        </div>
        <div
          :class="selectedList.length === 0 ? 'no-val' : ''"
          class="buy"
          @click="list"
        >
          {{
            selectedNft.filter((item) => item.market_id !== 0).length > 0
              ? "Edit "
              : ""
          }}
          List
        </div>
      </div>
    </div>
  </div>

  <GPTModal
    v-model:show="showGpt"
    :title="`X-Bitman#${gptModelData.num}`"
    :number="gptModelData.num"
    :bitman-id="gptModelData.id"
    @onClose="close"
  >
    <div style="background-color: aqua">132132</div>
  </GPTModal>

  <ListNft
    v-model:show="showList"
    :collection="onCollection"
    :nft_list="selectedNftList"
    @ok="confirmUpOrder"
  />
</template>

<style lang="less" scoped>
.collects {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  .data-left {
    width: 370px;
    height: 100%;
    overflow: hidden;
    padding: 10px;
    border: 1px solid #303031;
    border-radius: 4px;
    display: flex;
    flex-direction: column;

    .title {
      padding-bottom: 6px;
      margin-bottom: 20px;
      color: #f2682a;

      .icon {
        margin-right: 10px;
      }
    }

    .header {
      padding: 0 6px 6px;
      margin-bottom: 6px;
      font-size: 12px;
      display: grid;
      grid-template-columns: 62px 1fr;
      border-bottom: 1px solid #303031;

      :first-child {
        width: 62px;
      }
    }

    .l-list {
      flex: 1;
      overflow: auto;
      .type {
        padding: 6px;
        margin-bottom: 10px;
        justify-content: space-between;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        border: 1px solid #f2692a00;

        .avatar {
          width: 52px;
          height: 52px;
          margin-right: 10px;
          img {
            width: 100%;
            border-radius: 50%;
          }
        }
        .info {
          flex: 1;
          .nft-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 10px;
          }
          .floor {
            font-size: 12px;
            .num {
              img {
                width: 14px;
                margin-right: 4px;
              }
            }
            .color1 {
              margin-bottom: 6px;
            }
          }
        }

        .checked {
          width: 14px;
          height: 14px;
          border: 1px solid #fff;
          border-radius: 50%;

          .icon {
            flex: none;
          }
        }
      }

      .on-type {
        border-color: #f2682a;
        background: #100907;
      }
    }
  }

  .data-right {
    flex: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;

    .r-list {
      flex: 1;
      overflow: auto;
      display: flex;
      flex-wrap: wrap;
      align-items: start;
      gap: 10px;
      ::-webkit-scrollbar {
        height: 10px;
        width: 10px;
      }
      .brc-info {
        width: 196px;
        border: 1px solid #303031;
        border-radius: 4px;
        position: relative;

        .disabled {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          background: #0f0f127e;

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

        .selected {
          position: absolute;
          right: 6px;
          top: 32px;
          img {
            width: 20px;
          }
        }

        .gpt {
          position: absolute;
          right: 6px;
          top: 6px;
          display: flex;
          align-items: start;
          cursor: pointer;
          .msg {
            width: 12px;
            margin-right: 4px;
          }

          .bt {
            width: 20px;
          }
        }

        .no {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background: #000000c7;

          div {
            font-size: 14px;
            color: #ff0030;
          }
        }

        .info-img {
          overflow: hidden;
          img {
            width: 100%;
            height: 194px;
          }

          .base-img {
            transform: scale(1.5) translateY(6px);
          }
        }

        .info-data {
          font-size: 12px;
          padding: 10px 4px;
          background: #100807;
          .nft-name {
            width: 100%;
            margin-bottom: 6px;
            font-size: 12px;
            cursor: pointer;
          }

          .to-view {
            width: 100%;
            margin-bottom: 6px;
            img {
              height: 14px;
              cursor: pointer;
            }
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

      .on {
        border-color: #f2682a;
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

    .choose {
      width: 200px;
      line-height: 46px;
      margin: 20px auto 0;
      background: #f2682a;
      text-align: center;
      border-radius: 4px;
      font-size: 20px;
      cursor: pointer;
    }

    .choosed {
      background: #35312f;
      cursor: not-allowed;
    }

    .footer {
      width: 100%;
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
        line-height: 32px;
        padding: 0 14px;
        background: #f2682a;
        border-radius: 4px;
        text-align: center;
        cursor: pointer;
        font-size: 14px;
      }

      .no-val {
        background: #35312f;
        cursor: not-allowed;
      }
    }
  }
}
</style>
