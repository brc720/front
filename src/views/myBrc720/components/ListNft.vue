<script setup lang="ts">
import { mybrc } from "@/api";
import { MyNft, MyCollection } from "../type";
import { ElMessage } from "element-plus";
import { useEthersUnit, useEthersUnitParse } from "@/hooks/utils";
import { signPsbt } from "@/hooks/usePsbt";

const props = defineProps({
  show: {
    default: false,
  },
  collection: {
    type: Object as PropType<MyCollection>,
    default: {
      floor_price: 0,
    },
  },
  nft_list: {
    type: Array as PropType<MyNft[]>,
  },
});
const emit = defineEmits(["update:show", "ok"]);

const showDialog = ref(false);
watch(
  () => props.show,
  () => {
    showDialog.value = props.show;
    if (props.nft_list) {
      const list: MyNft[] = [];
      props.nft_list.map((item) => {
        let Obj = JSON.parse(JSON.stringify(item));
        if (!Obj.price) {
          Obj.price = "";
        } else {
          Obj.price = useEthersUnit(Obj.price).formatVal;
        }
        list.push(Obj);
      });

      nfts.value = list;
      computedTotalPrice();
    }
  }
);
watch(
  () => showDialog.value,
  () => {
    if (!showDialog.value) {
      closeNfts.value = [];
      allPrice.value = null;
    }
    emit("update:show", showDialog.value);
  }
);

const collectionFloor = computed(() =>
  props.collection.floor_price
    ? useEthersUnit(props.collection.floor_price).formatVal
    : 0
);

const nfts = ref<MyNft[]>([]);
const closeNfts = ref<MyNft[]>([]);
const removeNft = (nft: MyNft) => {
  nfts.value = nfts.value.filter((item) => {
    return item.inscription_id !== nft.inscription_id;
  });

  if (nft.market_id) closeNfts.value.push(nft);
};

const chooseFloor = () => {
  let list: MyNft[] = [];
  list = nfts.value.map((item) => {
    let Obj = JSON.parse(JSON.stringify(item));
    Obj.price = collectionFloor.value;
    return Obj;
  });

  nfts.value = list;
  computedTotalPrice();
};

const priceMinMax = (price: number) => {
  if (price === 0) return price;

  if (price > 0 && price < 0.000001) {
    return 0.000001;
  } else if (price > 10000) {
    return 10000;
  } else {
    return price;
  }
};

const allPrice = ref();
const changeAllPrice = () => {
  if (
    allPrice.value &&
    allPrice.value.toString().indexOf(".") < 0 &&
    allPrice.value !== ""
  ) {
    allPrice.value = parseFloat(allPrice.value) + "";
  }

  allPrice.value = priceMinMax(allPrice.value);
  nfts.value.map((item) => {
    item.price = +allPrice.value;
    item.belowFloor = cmpBlowFloor(+allPrice.value);
  });
  computedTotalPrice();
};

const totalReceive = ref(0);
const computedTotalPrice = () => {
  let total = 0;
  nfts.value.forEach((item) => {
    total += Number(item.price);
  });

  totalReceive.value = total;
};

const changeNftPrice = (item: MyNft) => {
  allPrice.value = null;
  item.price = priceMinMax(item.price);
  item.belowFloor = cmpBlowFloor(priceMinMax(item.price));
  computedTotalPrice();
};

const cmpBlowFloor = (price: number) => {
  return parseInt(
    (((collectionFloor.value - price) / collectionFloor.value) * 100).toString()
  );
};

const noPriceList = computed(() => nfts.value.filter((item) => !item.price));
interface Sell {
  inscription_id: string;
  price: number;
}
const confirmCreate = async () => {
  if (!nfts.value.length) return;

  if (noPriceList.value.length) {
    return;
  }

  let sellData: Sell[] = [];
  nfts.value.map((item) => {
    sellData.push({
      inscription_id: item.inscription_id,
      price: Number(useEthersUnitParse(item.price).parse),
    });
  });

  const kill: string[] = [];
  closeNfts.value.map((item) => {
    kill.push(item.inscription_id);
  });

  Promise.all([sell(sellData), killAnOrder(kill)]);
};

const killAnOrder = async (kill: string[]) => {
  if (!kill.length) return;
  await mybrc.lowerOrder({ inscription_ids: kill });
};

interface Psbt {
  inscription_id: string;
  price: number;
  psbt: string;
  sign: string;
}
const params = ref<Psbt[]>([]);
const sell = async (data: Sell[]) => {
  listLoading.value = true;
  try {
    const psbtHex: any = await mybrc.getPsbt({ inscriptions: data });
    params.value = psbtHex.data;
    mapSign();
  } catch (error) {
    ElMessage.error("Failed, user rejected the request");
    listLoading.value = false;
  }
};

const mapSign = async () => {
  let isErr = false;
  for (const item of params.value) {
    if (isErr) return;
    try {
      const signed = await signPsbt(item.psbt);
      item.sign = signed;
    } catch (error) {
      console.log("signPsbt: ", error);

      isErr = true;
      listLoading.value = false;
      ElMessage.error("Failed, user rejected the request");
    }
  }

  await upList(params.value);
};

const listLoading = ref(false);
interface Inscriptions {
  inscription_id: string;
  price: number | BigInt;
  sign: string;
  psbt: string;
}
const upList = async (upListData: Inscriptions[]) => {
  try {
    const res = await mybrc
      .upperOrder({ inscriptions: upListData })
      .finally(() => (listLoading.value = false));
    if (res.data.success > 0) {
      ElMessage.success("Successfully listed " + res.data.success + " items");
    }

    listLoading.value = false;
    emit("ok", res.data);
  } catch (error) {
    listLoading.value = false;
  }
};
</script>

<template>
  <div v-if="showDialog" class="list-nft">
    <LoadingView v-if="listLoading" :style="{ size: 24, showBg: true }" />
    <div class="main">
      <div class="header">
        <div class="title">
          List <span class="tm-color">{{ nfts.length }}</span> items
        </div>
        <div class="close" @click="showDialog = false">
          <img src="/imgs/ic1.png" alt="" />
        </div>
      </div>
      <div class="content">
        <div class="floor-price flex">
          <div class="label val flex-between flex-align" @click="chooseFloor">
            <div>Floor price</div>
            <div class="flex-align">
              {{ useEthersUnit(collection?.floor_price).formatVal }}
              <img width="14" src="/imgs/Bitcoin.png" alt="" />
            </div>
          </div>
          <div class="inp val flex-align">
            <input
              v-model="allPrice"
              type="number"
              pattern="[0-9]*"
              placeholder="Custom same price"
              @input="changeAllPrice"
            />
            <img width="14" src="/imgs/Bitcoin.png" alt="" />
          </div>
        </div>

        <div class="items-list">
          <div
            v-for="item of nfts"
            :key="item.inscription_id"
            class="items flex-between flex-align"
          >
            <div class="flex-align left">
              <img
                class="icon"
                src="/imgs/market/close_sel.png"
                alt=""
                @click="removeNft(item)"
              />
              <img class="avatar" :src="item.pic" alt="" />
              <div class="name">{{ item.name }}</div>
            </div>

            <div>
              <div class="inp flex-align">
                <input
                  v-model="item.price"
                  :style="
                    item.price === 0 ||
                    (item.price && item.price < +collectionFloor)
                      ? 'color: #F3C50D'
                      : ''
                  "
                  type="number"
                  pattern="[0-9]*"
                  placeholder="Price"
                  @input="changeNftPrice(item)"
                />
                <img width="14" src="/imgs/Bitcoin.png" alt="" />
              </div>

              <div
                v-if="
                  item.price === 0 ||
                  (item.price && item.price < +collectionFloor)
                "
                style="text-align: right; margin-top: 6px"
                class="color2"
              >
                {{ item.belowFloor }}% below floor
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="btn-box">
        <div class="flex-between">
          <div>You receive</div>
          <div class="flex-align">
            <img width="18" src="/imgs/Bitcoin.png" alt="" />
            <div style="margin-left: 6px">
              {{ totalReceive }}
            </div>
          </div>
        </div>

        <div
          :style="
            nfts.length && !noPriceList.length
              ? 'background: #f2682a;'
              : 'background: #35312f; cursor: not-allowed;'
          "
          class="confirm"
          @click="confirmCreate"
        >
          List
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.list-nft {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  background: #000000b5;
  .main {
    width: 624px;
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
      border-bottom: 1px solid #3a312f;
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

    .floor-price {
      gap: 20px;
      margin-bottom: 20px;
      .val {
        padding: 0 12px;
        width: 50%;
        height: 32px;
        border-radius: 4px;
      }

      .label {
        background: #2e2623;
        cursor: pointer;
        img {
          margin-left: 6px;
        }
      }

      .inp {
        border: 1px solid #f2682a;
        input {
          text-align: right;
          flex: 1;
          background: #0f0f12;
        }
        img {
          margin-left: 6px;
        }
      }
    }

    .items-list {
      max-height: 300px;
      overflow: auto;
      .items {
        margin-bottom: 10px;
        .left {
          .icon {
            width: 24px;
            cursor: pointer;
          }

          .avatar {
            width: 40px;
            height: 40px;
            margin: 0 20px;
          }
        }

        .inp {
          height: 32px;
          padding: 0 12px;
          border: 1px solid #3a312f;
          border-radius: 4px;
          background: #0c0c18;

          input {
            width: 150px;
            text-align: right;
            background: #0f0f12;
          }
          img {
            flex: none;
            margin-left: 6px;
          }
        }
      }
    }
  }

  .btn-box {
    margin-top: 20px;
    .confirm {
      width: 40%;
      margin: 40px auto 0;
      padding: 8px 0;
      text-align: center;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}
</style>
