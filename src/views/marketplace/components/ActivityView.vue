<script setup lang="ts">
import { market } from "@/api";
import type { Activity } from "../type";
import { useEthersUnit } from "@/hooks/utils";
import { useCopy } from "@/hooks/useCopy";
import { dynamic } from "../data";

const copy = useCopy();

onMounted(() => {
  getList();
});

const props = defineProps({
  slug: {
    default: "",
  },
});

watch(
  () => props.slug,
  () => {
    getList();
  }
);

const listDynamic = ref({
  label: "Sale",
  value: "sale",
});
const gridColm = computed(() =>
  listDynamic.value.value === "sale"
    ? "1.3fr 0.7fr 0.7fr 1fr 1fr 1fr"
    : "1.3fr 0.7fr 0.7fr 1fr 1fr"
);
const chooseListType = (dynamic: any) => {
  listDynamic.value = dynamic;
  getList();
};

const updateList = () => {
  pageData.maxpage = 0;
  getList();
};

const activityList = ref<Activity[]>([]);
const pageData = reactive({
  loading: false,
  page: 1,
  maxpage: 0,
});
const isEndPage = computed(() => pageData.page > pageData.maxpage);
const getList = async (isNext: boolean = false) => {
  if (!isNext) {
    pageData.page = 1;
    activityList.value = [];
  }

  try {
    pageData.loading = true;
    const res = await market.getActivity({
      collection: props.slug,
      page: pageData.page,
      type: listDynamic.value.value,
    });

    if (res.data) {
      const { list, maxpage } = res.data;
      activityList.value.push(...list);
      pageData.maxpage = maxpage;
    }

    pageData.loading = false;
  } catch (error) {
    pageData.loading = false;
    console.log(error);
  }
};

// 触底
const nextPage = () => {
  if (isEndPage.value || pageData.loading) {
    return;
  }

  if (pageData.maxpage > pageData.page) {
    pageData.page += 1;
    getList(false);
  }
};
</script>

<template>
  <div class="activity">
    <LoadingView
      v-if="pageData.loading && !activityList.length"
      :style="{ size: 30, showBg: true }"
    />
    <div class="filter flex-between">
      <div class="left flex-align">
        <div class="select flex-align">
          <div class="value singe-line">{{ listDynamic.label }}</div>
          <img class="ic" src="/imgs/ic4.png" alt="" />
          <div class="option-list">
            <div
              v-for="item in dynamic"
              :key="item.value"
              class="option singe-line"
              @click="chooseListType(item)"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="update flex-center" @click="updateList">
          <img src="/imgs/market/update.png" alt="" />
        </div>
      </div>
    </div>
    <div class="content-list">
      <div class="list-title">
        <div>Name</div>
        <div>Type</div>
        <div>Price</div>
        <div>Seller</div>
        <div v-if="listDynamic.value === 'sale'">Buyer</div>
        <div>Time</div>
      </div>

      <div
        v-infinite-scroll="nextPage"
        :infinite-scroll-distance="100"
        :disabled="isEndPage || pageData.loading"
        class="box"
      >
        <div
          v-for="(item, index) of activityList"
          :key="index"
          class="item-list"
        >
          <div class="column1 flex-align">
            <div class="flex-align">
              <img class="avatar" :src="item.pic" alt="" />
              <div>
                <!-- <div class="color1">{{ item.number }}</div> -->
                <div class="name">{{ item.name }}</div>
              </div>
            </div>
          </div>
          <div class="column2 flex-align">
            <div :class="item.type === 'Sale' ? 'sale' : 'list'" class="offer">
              {{ item.type }}
            </div>
          </div>
          <div class="flex-align">
            <img width="14" src="/imgs/Bitcoin.png" alt="" />
            <span style="margin-left: 4px" class="color2">{{
              useEthersUnit(item.price).formatVal
            }}</span>
          </div>
          <div class="copy" @click="copy(item.seller)">
            {{ item.seller.slice(0, 6) + "..." + item.seller.slice(-6) }}
          </div>
          <div
            v-if="listDynamic.value === 'sale'"
            class="copy"
            @click="copy(item.buyer)"
          >
            {{ item.buyer.slice(0, 6) + "..." + item.buyer.slice(-6) }}
          </div>
          <div style="color: #685c56">
            {{ listDynamic.value === "sale" ? item.buy_time : item.list_time }}
          </div>
        </div>
        <div style="height: 42px; text-align: center; position: relative">
          <p v-if="activityList.length && pageData.loading">
            <LoadingView :style="{ size: 16, showBg: false }" />
          </p>
        </div>

        <template v-if="!activityList.length">
          <NotData />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.activity {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;

  .filter {
    flex: none;
    height: 32px;
    .left {
      gap: 10px;
      height: 100%;
      .select {
        width: 220px;
        height: 100%;
        padding: 0 14px;
        border-radius: 4px;
        border: 1px solid #f2682a;
        font-size: 12px;
        cursor: pointer;
        position: relative;

        .value {
          flex: 1;
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
          z-index: 1;
          padding: 0 14px;
          border-radius: 4px;
          border: 1px solid #542916;
          background: #0f0f12;

          .option {
            line-height: 30px;
            border-bottom: 1px solid #542916;
          }
        }

        &:hover .option-list {
          display: block;
        }

        &:hover .ic {
          transform: rotate(180deg);
        }
      }
    }

    .right {
      height: 100%;
      gap: 10px;

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

  .content-list {
    flex: 1;
    margin: 14px 0;
    background: #181517;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .list-title {
      width: 100%;
      display: grid;
      grid-template-columns: v-bind(gridColm);
      align-items: center;
      padding: 10px 20px;
      background: #2e2623;
      font-size: 12px;
      border-radius: 4px;
    }

    .box {
      flex: 1;
      overflow: auto;
      padding: 0 20px;
      position: relative;

      &::-webkit-scrollbar {
        width: 0px;
      }
    }

    .item-list {
      width: 100%;
      padding: 8px 0;
      display: grid;
      grid-template-columns: v-bind(gridColm);
      align-items: center;
      font-size: 12px;
      line-height: 1.5;
      border-bottom: 1px solid #1f1f1f;

      .column1 {
        .avatar {
          width: 32px;
          margin-right: 10px;
        }
      }

      .column2 {
        .offer {
          width: 72px;
          line-height: 24px;
          text-align: center;
          border-radius: 4px;
        }

        .sale {
          background: #2a67f2;
        }
        .list {
          background: #f2682a;
        }
      }

      .copy {
        cursor: pointer;
      }
    }
  }

  .footer {
    .buy {
      width: 200px;
      margin-left: auto;
      line-height: 32px;
      background: #f2682a;
      border-radius: 4px;
      text-align: center;
      cursor: pointer;
    }
  }
}
</style>
