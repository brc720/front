<template>
  <div class="create">
    <div class="top">
      <span class="txt1">Create NFTs on Bitcoin with</span>
      <span class="txt2"> BRC720 AI Protocol</span>
    </div>

    <div class="main">
      <div class="nav">
        <div
          v-for="item of navList"
          :key="item.value"
          :class="valueType === item.value ? 'item-on' : ''"
          class="item"
          @click="changeNav(item)"
        >
          {{ item.name }}
        </div>
      </div>

      <InscribeView
        v-show="!showNft"
        :data="modelInfo"
        @chooseNft="chooseNft"
        @againCreate="againCreate"
      />
      <NftList v-if="showNft" @chooseNft="chooseNft" />
    </div>

    <div v-show="!showNft" class="footer">
      <div class="header">
        <div class="tm-color">Address</div>
        <div class="tm-color">BRC-720</div>
        <div class="tm-color">Status</div>
        <div class="tm-color">Inscription ID</div>
        <div class="tm-color">Date</div>
      </div>
      <div class="content">
        <div
          v-for="item of orderHistoryList"
          :key="item.inscription_id"
          class="item"
        >
          <div>
            {{ item.owner.slice(0, 5) + "..." + item.owner.slice(-5) }}
          </div>
          <div style="color: #f3c50d">{{ item.name }}</div>
          <div style="color: #42f22a">{{ item.status }}</div>
          <div
            class="singe-line"
            style="color: #685c56; cursor: pointer"
            @click="open3d(item.inscription_id)"
          >
            {{ item.inscription_id }}
          </div>
          <div style="color: #685c56">{{ item.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import NftList from "./compontens/NftList.vue";
import InscribeView from "./compontens/InscribeView.vue";
import type { Inscription, Model, OrderHis } from "./type";
import { createVoxel, getOrderHistory } from "@/api/api";
import { useStore } from "@/pinia/store";

const store = useStore();

onMounted(() => {
  if (store.userToken) {
    getHistory();
  }
});

interface Nav {
  value: number;
  name: string;
}
const navList: Array<Nav> = [
  { value: 1, name: "Image to 3D" },
  { value: 2, name: "Text to 3D (X)" },
];
const valueType = ref(1);
const changeNav = (nav: Nav) => {
  if (nav.value !== 1) {
    ElMessage.warning("Coming Soon");
    return;
  }
  valueType.value = nav.value;
};

const orderHistoryList = ref<OrderHis[]>([]);
const getHistory = async () => {
  const res = await getOrderHistory();
  console.log(res);
  orderHistoryList.value = res.data;
};

// 选择nft
const showNft = ref(false);
const modelInfo = ref<Model>({
  network: "",
  slug: "",
  name: "",
  pic: "",
  inscription_number: 0,
  service_fee: 0,
  task_id: "",
  collection: "",
  new_name: "",
  supply: 0,
});

const inscriptionId = ref("");
const chooseNft = (val: boolean, data: Inscription | undefined = undefined) => {
  showNft.value = val;

  if (data) {
    inscriptionId.value = data.inscription_id;
    createModel(data.inscription_id);
  }
};

const againCreate = () => {
  createModel(inscriptionId.value);
};

const createModel = async (id: string) => {
  const res = await createVoxel({
    network: "BTC",
    source: id,
  });

  if (res.code === 200) {
    console.log(res);
    modelInfo.value = res.data;
  }
};

const open3d = (id: string) => {
  window.open("https://geniidata.com/ordinals/inscription/" + id, "_blank");
};
</script>

<style lang="less" scoped>
.create {
  width: 1240px;
  margin: auto;
  padding-bottom: 70px;

  .top {
    text-align: center;
    font-size: 28px;
    margin: 54px 0 42px;

    .txt2 {
      color: #ff7c01;
    }
  }

  .main {
    .nav {
      border-bottom: 1px solid #434348;
      display: flex;
      align-items: center;
      cursor: pointer;

      .item {
        width: 202px;
        line-height: 43px;
        text-align: center;
      }

      .item-on {
        background: url("/imgs/bg1.png");
      }
    }
  }
  .footer {
    margin: 70px 0 0;
    padding: 16px 0;
    border: 1px solid #542916;
    border-radius: 4px;
    font-size: 14px;
    background: #1a1a1e;

    .header,
    .item {
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
    }

    .header {
      border-bottom: 1px solid #312623;
    }
  }
}
</style>
