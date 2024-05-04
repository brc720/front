<script setup lang="ts">
import { market } from "@/api";
import type { Ranking } from "../type";

onMounted(() => {
  props.slug ? getRankings() : "";
});

const props = defineProps({
  slug: {
    default: "",
  },
});

watch(
  () => props.slug,
  () => {
    getRankings();
  }
);

// 获取
const loading = ref(false);
const rankList = ref<Ranking[]>([]);
const params = reactive({
  page: 1,
  maxpage: 0,
});
const isNextPage = computed(() => params.page > params.maxpage);
const getRankings = async (isNext: boolean = true) => {
  if (isNext) {
    params.page = 1;
    rankList.value = [];
  }

  try {
    loading.value = true;
    const res: any = await market.getCollectRank({
      collection: props.slug,
      page: params.page,
    });

    const { list, maxpage } = res.data;

    if (isNext) {
      rankList.value = list;
    } else {
      rankList.value.push(...list);
    }

    params.maxpage = maxpage;
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

// 触底
const nextFun = () => {
  if (isNextPage.value || loading.value) {
    return;
  }

  if (params.maxpage > params.page) {
    params.page += 1;
    getRankings(false);
  }
};
</script>

<template>
  <div class="holders">
    <LoadingView
      v-if="loading && params.maxpage === 0"
      :style="{ size: 30, showBg: true }"
    />
    <div class="content-list">
      <div class="list-title">
        <div>Rank</div>
        <div>Owner</div>
        <div>Percentage</div>
        <div>Held</div>
      </div>

      <div
        v-infinite-scroll="nextFun"
        :infinite-scroll-distance="100"
        :disabled="isNextPage || loading"
        class="box"
      >
        <div v-for="item of rankList" :key="item.index" class="item-list">
          <div>
            <div style="width: 32px; text-align: center">{{ item.index }}</div>
          </div>
          <div class="column1 singe-line">
            {{ item.address }}
          </div>
          <div class="">
            <div>{{ item.rate }}%</div>
            <div class="percentage">
              <div :style="{ width: item.rate + '%' }" class="schedule"></div>
            </div>
          </div>
          <div>{{ item.count }}</div>
        </div>
        <div style="position: relative" class="item">
          <p v-if="rankList.length && loading && params.maxpage !== 0">
            <LoadingView :style="{ size: 16, showBg: false }" />
          </p>
        </div>

        <div v-if="!rankList.length" class="not-data">
          <img src="/imgs/not.png" alt="" />
          <div>No items found</div>
        </div>
        <p v-if="!rankList.length && params.maxpage !== 0">
          <LoadingView :style="{ size: 32, showBg: true }" />
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.holders {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

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
      grid-template-columns: 80px 2fr 1fr 0.5fr;
      gap: 10px;
      align-items: center;
      padding: 13px 40px;
      background: #2e2623;
      font-size: 12px;
      border-radius: 4px;
    }

    .box {
      flex: 1;
      overflow: auto;
      position: relative;
      &::-webkit-scrollbar {
        width: 0px;
      }
    }

    .item-list {
      width: 100%;
      padding: 8px 40px;
      display: grid;
      grid-template-columns: 80px 2fr 1fr 0.5fr;
      gap: 10px;
      align-items: center;
      font-size: 12px;
      line-height: 1.5;
      border-bottom: 1px solid #1f1f1f;
      position: relative;

      .column1 {
        .avatar {
          width: 32px;
          margin-right: 10px;
        }
      }

      .percentage {
        width: 80%;
        height: 10px;
        background: #3e3e3e;
        border-radius: 2px;

        .schedule {
          height: 100%;
          border-radius: 2px;
          background: #fff;
        }
      }

      .ic {
        width: 16px;
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
  }
}
</style>
