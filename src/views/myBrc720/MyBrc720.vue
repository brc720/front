<script setup lang="ts">
import { useCopy } from "@/hooks/useCopy";
import { mybrc } from "@/api";
import { MyCollection, MyNft } from "./type";
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
const copy = useCopy();
const address = computed(() => localStorage.getItem("walletAddress") || "");

const nav = ref(1);
const changeNav = (val: number) => {
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

    if (isNext) {
      collectList.value = list;
    } else {
      collectList.value.push(...list);
    }

    collectionData.maxpage = maxpage;
    onType.value = collectList.value[0]?.slug;
    if (onType.value) {
      onCollection.value = collectList.value[0];
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

  if (isNext) {
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
  <div class="my">
    <div class="top flex-justify">
      <img src="/imgs/logo.png" alt="" />
      <div class="address">
        <div id="copy-val">{{ address }}</div>
        <div class="color1 flex-align">
          {{ address.substring(0, 5) + "..." + address.slice(-5) }}
          &nbsp;<img src="/imgs/ic5.png" alt="" @click="copy(address)" />
        </div>
      </div>
    </div>

    <div class="content">
      <div class="nav flex-align">
        <div
          :class="nav === 1 ? 'on' : ''"
          class="nav-item"
          @click="changeNav(1)"
        >
          Collections
        </div>
        <div
          :class="nav === 2 ? 'on' : ''"
          class="nav-item"
          @click="changeNav(2)"
        >
          Activity
        </div>
      </div>

      <div class="data">
        <MyCollectionsView v-if="nav === 1" />
        <MyActivityView v-if="nav === 2" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.my {
  padding: 20px;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  .icon {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f2682a;
  }

  .top {
    margin: 20px 0 40px;
    font-size: 14px;
    img {
      width: 40px;
      margin-right: 10px;
    }

    .color1 {
      img {
        width: 17px;
        cursor: pointer;
      }
    }
  }

  .content {
    width: 100%;
    min-width: 1240px;
    flex: 1;
    overflow: hidden;
    margin: auto;
    display: flex;
    flex-direction: column;

    .nav {
      margin-bottom: 20px;
      border-bottom: 1px solid #434348;

      .nav-item {
        padding: 10px 0;
        width: 200px;
        text-align: center;
        cursor: pointer;
      }

      .on {
        background: url(/imgs/bg1.png) no-repeat center/100% 100%;
      }
    }

    .data {
      flex: 1;
    }
  }
}
</style>
