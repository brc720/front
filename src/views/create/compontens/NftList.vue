<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useWallet } from "@/hooks/useWallet";
import { getBtcGather, getSelectCollects } from "@/api/api";
import { Collect, Inscription } from "../type";
import { ElMessage } from "element-plus";
import { isLogin } from "@/hooks/utils";

const emit = defineEmits(["chooseNft"]);
const { wallet } = useWallet();

onMounted(async () => {
  if (isLogin()) {
    getCollectList();
  }
});

const inscriptionList = ref<string[]>([]);
const getInscriptions = async () => {
  const walletName = localStorage.getItem("wallet_name");
  console.log(walletName);

  let data: any = {};
  let inspTotal = 0;
  switch (walletName) {
    case "unisat":
      inspTotal = await wallet?.getInscriptions(0, 10)?.total;
      data = await wallet?.getInscriptions(0, inspTotal);
      break;
    case "okxwallet":
      inspTotal = await wallet.bitcoin?.getInscriptions()?.total;
      data = await wallet.bitcoin?.getInscriptions(0, inspTotal);
      break;
    case "bitkeep":
      inspTotal = await wallet?.unisat.getInscriptions(0, 10);
      data = await wallet?.unisat.getInscriptions(0, inspTotal);
      break;
    default:
      data = { list: [] };
      break;
  }

  console.log("10:", inspTotal);
  console.log("all:", data);

  let imgList: string[] = [];
  data.list.forEach((item: any) => {
    if (
      item.contentType.includes("png") ||
      item.contentType.includes("jpg") ||
      item.contentType.includes("webp") ||
      item.contentType.includes("html")
    ) {
      imgList.push(item.inscriptionId);
    }
  });
  inscriptionList.value = imgList;

  getBtcList();
};

const collectList = ref<Collect[]>([]);
const getCollectList = async () => {
  const res = await getSelectCollects();
  if (res.code === 200) {
    collectList.value = res.data.map((item: Collect) => {
      item.btc = [];
      return item;
    });
    getInscriptions();
  }
};

const onType = ref("all");
const changeOnType = (val: string) => {
  onType.value = val;

  if (val === "all") {
    btcListByType.value = btcList.value;
  } else {
    btcListByType.value = collectList.value.filter(
      (item) => item.slug === val
    )[0]?.btc;
  }
};

const btcList = ref<Inscription[]>([]);
const btcListByType = ref<Inscription[]>([]);
const onInsip = ref();
const getBtcList = async () => {
  const res = await getBtcGather({ inscription_ids: inscriptionList.value });

  if (res.code === 200) {
    btcList.value = res.data;
    btcListByType.value = btcList.value;

    collectList.value.forEach((item, index) => {
      btcList.value.forEach((e) => {
        if (item.slug === e.slug) {
          collectList.value[index].btc.push(e);
        }
      });
    });
  }
};
const chooseOnInsip = (val: Inscription) => {
  if (val.status !== 1) return;
  onInsip.value = val.inscription_id;
};

const back = () => {
  emit("chooseNft", false);
};

const confirmChoose = () => {
  if (!isLogin()) {
    ElMessage.warning("Please connect wallet before inscribe!");
    emit("chooseNft", false);
    return;
  }

  if (!onInsip.value) {
    return;
  }

  const data = btcListByType.value.filter(
    (item) => item.inscription_id === onInsip.value
  )[0];
  emit("chooseNft", false, data);
};
</script>

<template>
  <div class="nft-list">
    <div class="back flex">
      <div @click="back">
        <img src="/imgs/back.png" alt="" />
      </div>
      <div class="text">
        Choose an NFT, generate a new 3D version limited to
        <span class="tm-color"> 720 </span>per collection.
      </div>
    </div>
    <div class="content">
      <div class="data">
        <div class="data-left">
          <div class="title flex-align">
            <div class="icon"></div>
            Support Collections
          </div>
          <div class="l-list">
            <div
              :class="onType === 'all' ? 'on-type' : ''"
              class="type flex-align"
              @click="changeOnType('all')"
            >
              <div class="flex-align name">
                <div class="all-icon">A</div>
                <div class="nft-name">
                  All collections
                  <span class="color1" style="font-size: 12px"
                    >({{ btcList.length }})</span
                  >
                </div>
              </div>
              <div class="checked flex-center">
                <div v-show="onType === 'all'" class="icon"></div>
              </div>
            </div>
            <div
              v-for="item in collectList"
              :key="item.slug"
              :class="onType === item.slug ? 'on-type' : ''"
              class="type flex-align"
              @click="changeOnType(item.slug)"
            >
              <div class="flex-align name">
                <img :src="item.icon" alt="" />
                <div class="nft-name">
                  {{ item.name }}
                  <span class="color1" style="font-size: 12px"
                    >({{ item.btc.length }})</span
                  >
                </div>
              </div>
              <div class="checked flex-center">
                <div v-show="onType === item.slug" class="icon"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="data-right">
          <div v-if="btcListByType.length" class="r-list">
            <div
              v-for="item in btcListByType"
              :key="item.inscription_id"
              :class="item.inscription_id === onInsip ? 'on' : ''"
              class="insip-info"
              @click="chooseOnInsip(item)"
            >
              <div v-if="item.inscription_id === onInsip" class="selected">
                <img src="/imgs/selected.png" alt="" />
              </div>

              <div v-if="item.status === 2" class="no flex-center">
                <div>Already inscribed</div>
              </div>

              <div v-if="item.status === 3" class="no flex-center">
                <div>Maximum reached</div>
              </div>

              <div class="info-data">
                <!-- <div>“Birthdate”: “2024-01-01 14:39</div>
                <div>“Species”: “0x3c000000”,</div>
                <div>“Size”: 1539624,</div>
                <div>“Wealth”: 132496368,</div>
                <div>“Wisdom”: 72006146478567</div> -->
                <img :src="item.url" alt="" />
              </div>

              <div class="link flex-align">
                <!-- <div class="color1">#54356147</div>
                <div class="link-img">
                  <img src="/imgs/Megiceden.png" alt="" />
                  <img src="/imgs/OKX_logo.png" alt="" />
                  <img src="/imgs/Ordyssey_logo.png" alt="" />
                </div> -->
              </div>

              <div class="brc-name">{{ item.name }}</div>
            </div>
          </div>

          <div v-else class="not-data flex-center">
            <img src="/imgs/not.png" alt="" />
            <div>No items found</div>
          </div>

          <div
            v-if="btcList.length"
            :class="onInsip ? '' : 'choosed'"
            class="choose"
            @click="confirmChoose"
          >
            Choose
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.nft-list {
  .icon {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f2682a;
    flex: none;
  }

  .back {
    padding: 20px 0;
    justify-content: space-between;

    img {
      width: 24px;
    }

    .text {
      width: calc(100% - 200px);
    }
  }

  .content {
    width: 1240px;
    margin: auto;
    .data {
      display: flex;
      justify-content: space-between;
      gap: 36px;
      .data-left {
        width: 300px;
        height: 650px;
        overflow: hidden;
        border: 1px solid #303031;
        border-radius: 4px;

        .title {
          margin-bottom: 16px;
          padding: 10px;
          color: #f2682a;
          border-bottom: 1px solid #303031;

          .icon {
            margin-right: 10px;
          }
        }

        .l-list {
          height: calc(100% - 56px);
          padding: 0 6px 10px;
          overflow: auto;
          .type {
            padding: 6px;
            margin-bottom: 10px;
            justify-content: space-between;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            border: 1px solid #f2692a00;

            .name {
              img {
                width: 30px;
                margin-right: 10px;
                border-radius: 50%;
              }

              .all-icon {
                width: 24px;
                line-height: 24px;
                margin-right: 6px;
                background: #f2682a;
                text-align: center;
                border-radius: 50%;
              }

              .nft-name {
                width: 180px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
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
          }
        }
      }

      .data-right {
        min-height: 650px;
        flex: 1;

        .r-list {
          height: 100%;
          overflow: auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-content: start;
          gap: 10px;
          ::-webkit-scrollbar {
            height: 10px;
            width: 10px;
          }
          .insip-info {
            padding: 14px 10px;
            border: 1px solid #303031;
            border-radius: 4px;
            position: relative;
            cursor: pointer;

            .selected {
              position: absolute;
              top: 4px;
              right: 4px;
              img {
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

            .info-data {
              font-size: 12px;
              line-height: 1.8;

              * {
                color: #b6b6b6;
              }

              img {
                width: 100%;
              }
            }

            .link {
              margin: 10px 0 10px;
              padding-top: 4px;
              justify-content: space-between;
              border-top: 1px solid #303031;
              font-size: 12px;

              .link-img {
                img {
                  margin: 0 6px;
                }
              }
            }
          }

          .on {
            border-color: #f2682a;
          }
        }

        .not-data {
          width: 100%;
          height: calc(100% - 66px);
          flex-direction: column;
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
      }
    }
  }
}
</style>
