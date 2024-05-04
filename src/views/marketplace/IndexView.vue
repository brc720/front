<script setup lang="ts">
import ItemsView from "./components/ItemsView.vue";
import ActivityView from "./components/ActivityView.vue";
import { timer, rightNav } from "./data";
import type { CollectMk, SearchCollect } from "./type";
import { api, market } from "@/api";
import { useEthersUnit } from "@/hooks/utils";

const route = useRoute();
const routeQuery = ref<any>({
  slug: "",
  name: "",
  nftName: "",
});

onMounted(() => {
  routeQuery.value = route.query;
  if (routeQuery.value.slug) {
    searchCltVal.value = routeQuery.value.name || "";
    selectSearchSlug.value = routeQuery.value.slug || "";
  }

  getCollectList();
});

// left
// 合集搜索
const searchCltVal = ref("");
const showSearchOptions = ref(false);
const getCollectBySearch = () => {
  if (searchCltVal.value) {
    showSearchOptions.value = true;
    getFilterCollect();
  } else {
    showSearchOptions.value = false;
    optionData.value = [];

    selectSearchSlug.value = "";
    getCollectList();
  }
};

const optionData = ref<SearchCollect[]>([]);
const optionLoading = ref(false);
const getFilterCollect = async () => {
  try {
    optionLoading.value = true;
    const res = await market.searchCollect({ query: searchCltVal.value });
    optionData.value = res.data;
    optionLoading.value = false;
  } catch (error) {
    optionLoading.value = false;
  }
};

const selectSearchSlug = ref("");
const chooseSearchCol = (item: SearchCollect) => {
  selectSearchSlug.value = item.slug;
  showSearchOptions.value = false;
  optionData.value = [];

  getCollectList();
};

// 左侧时间
const onTime = ref("24h");
const changeTime = (val: string) => {
  searchCltVal.value = "";
  onTime.value = val;
  collectionData.page = 1;
  getCollectList();
};

// 左侧选择
const onCollection = ref("");
const collectList = ref<CollectMk[]>([]);
const collectionData = reactive({
  maxpage: 0,
  page: 1,
  loading: false,
  noMore: false,
});
const isEndPage = computed(() => collectionData.page > collectionData.maxpage);

// 获取集合列表
const getCollectList = async (isNext: boolean = true) => {
  if (collectionData.loading) return;

  if (isNext) {
    collectList.value = [];
    collectionData.page = 1;
  }

  collectionData.loading = true;
  try {
    const res: any = await market
      .getMarketCollect({
        time: onTime.value,
        slug: selectSearchSlug.value ? selectSearchSlug.value : "",
        query: searchCltVal.value,
        floor_price:
          onFallData.value === 0 ? (fallData[0] ? "asc" : "desc") : undefined,
        page: collectionData.page,
        volume:
          onFallData.value === 1 ? (fallData[1] ? "asc" : "desc") : undefined,
        sales:
          onFallData.value === 2 ? (fallData[2] ? "asc" : "desc") : undefined,
      })
      .finally(() => (collectionData.loading = false));
    if (res.data) {
      const { list, maxpage } = res.data;
      if (isNext) {
        collectList.value = list;
      } else {
        collectList.value.push(...list);
      }

      onCollection.value = onCollection.value
        ? onCollection.value
        : collectList.value[0]?.slug;
      collectionData.maxpage = maxpage;
    }
  } catch (error) {
    collectionData.loading = false;
  }
};

// 选择合集
const chooseCollection = (val: string) => {
  searchCltVal.value = "";
  onCollection.value = val;
};

// 触底
const loadCollection = () => {
  if (isEndPage || collectionData.loading) {
    return;
  }

  if (collectionData.maxpage > collectionData.page) {
    collectionData.page += 1;
    getCollectList(false);
  }
};

// 倒序 // price, volume, sales
const fallData = reactive([true, false, true]);
const onFallData = ref(1);
const fallVolume = (index: number) => {
  searchCltVal.value = "";
  fallData.forEach((_item, i) => {
    if (i === index) {
      fallData[i] = !fallData[i];
    } else {
      fallData[i] = true;
    }
  });

  onFallData.value = index;
  getCollectList();
};

// right
// 获取集合信息
watch(
  () => onCollection.value,
  () => {
    if (onCollection.value) getInfo();
  }
);
const collectionInfo = ref({
  name: "",
  new_name: "",
  slug: "",
  icon: "",
  description: "",
  supply: 0,
  sell_fee: 0,
  copyright_fee: 0,
  service_fee: 0,
  inscribed: 0,
  floor_price: 0,
  total_vol: 0,
  owners: 0,
  listed: 0,
  inscribe_num: 0,
  twitter: "",
  website: "",
});
const getInfo = async () => {
  const res = await api.getCollectInfo({
    collection: onCollection.value,
  });

  collectionInfo.value = res.data;
};

const updateData = () => {
  getCollectList();
  getInfo();
};

// 头部类型
const onNav = ref(1);
const changeOnNav = (val: number) => {
  onNav.value = val;
  // getCollectList();
};
</script>

<template>
  <div class="marketplace">
    <div class="left">
      <div class="top flex-center">
        <input
          v-model="searchCltVal"
          type="text"
          placeholder="Collections"
          @change="getCollectBySearch"
        />
        <div class="inp-ic flex-center">
          <img src="/imgs/market/inp_ic.png" alt="" />
        </div>
        <!-- v-if="showSearchOptions"  -->
        <div class="clt-val">
          <div
            v-for="item of optionData"
            :key="item.slug"
            class="ic-name-num flex-align singe-line"
            @click="chooseSearchCol(item)"
          >
            <img :src="item.icon" alt="" />
            <div>{{ item.name }}</div>
          </div>

          <div
            style="
              width: 100%;
              height: 42px;
              text-align: center;
              position: relative;
            "
          >
            <LoadingView
              v-if="optionLoading"
              :style="{ size: 16, showBg: false }"
            />
          </div>
        </div>
      </div>

      <div class="filter">
        <div
          v-for="item of timer"
          :key="item.value"
          :class="onTime === item.value ? 'on-time' : ''"
          class="filter-time"
          @click="changeTime(item.value)"
        >
          {{ item.label }}
        </div>
      </div>

      <div class="title flex-between">
        <div class="t-l flex-center" @click="fallVolume(0)">
          Floor Price
          <div :class="fallData[0] ? 'ic-tfm' : ''" class="r-ic">
            <div><img src="/imgs/market/ic1.png" alt="" /></div>
            <div><img src="/imgs/market/ic2.png" alt="" /></div>
          </div>
        </div>
        <div class="t-c" @click="fallVolume(1)">
          Volume<img
            :class="fallData[1] ? 'fall' : ''"
            class="ic-tfm"
            src="/imgs/market/ic1.png"
            alt=""
          />
        </div>
        <div class="t-r" @click="fallVolume(2)">
          Sales<img
            :class="fallData[2] ? 'fall' : ''"
            class="ic-tfm"
            src="/imgs/market/ic1.png"
            alt=""
          />
        </div>
      </div>

      <div class="main">
        <div
          v-infinite-scroll="loadCollection"
          :infinite-scroll-distance="100"
          :disabled="isEndPage || collectionData.loading"
          class="collection-box"
        >
          <div
            v-for="item of collectList"
            :key="item.slug"
            :class="onCollection === item.slug ? 'on-collection' : ''"
            class="collection flex-center"
            @click="chooseCollection(item.slug)"
          >
            <div class="avatar"><img :src="item.icon" alt="" /></div>
            <div class="info">
              <div class="name">{{ item.name }}</div>
              <div class="floor">
                <div class="color1">FLOOR</div>
                <div class="num">
                  <div class="flex-align">
                    <img src="/imgs/Bitcoin.png" alt="" />
                    <div>{{ useEthersUnit(item.floor_price).formatVal }}</div>
                  </div>
                  <div class="flex-align">
                    <img src="/imgs/Bitcoin.png" alt="" />
                    <div>{{ useEthersUnit(item.volume).formatVal }}</div>
                  </div>
                  <div>
                    <div>{{ item.sales }}</div>
                  </div>
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
    </div>
    <div class="right" style="position: relative">
      <div class="r-top flex-align">
        <div class="u-desc flex-align">
          <div class="r-avatar"><img :src="collectionInfo.icon" alt="" /></div>
          <div class="">
            <div class="name">{{ collectionInfo.name }}</div>
            <div class="info flex-between">
              <div class="link flex-between flex-align">
                <a
                  v-if="collectionInfo.twitter"
                  :href="collectionInfo.twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/imgs/market/x.png" alt="" />
                </a>
                <a
                  v-if="collectionInfo.website"
                  :href="collectionInfo.website"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/imgs/market/w.png" alt="" />
                </a>
                <!-- <img src="/imgs/market/On-Chain.png" alt="" /> -->
              </div>
              <!-- <div class="choose">
                Info
                <img src="/imgs/market/ic3.png" alt="" />
              </div> -->
            </div>
          </div>
        </div>
        <div class="data flex-align">
          <div class="setp">
            <div class="bor"></div>
            <div class="color1">TOTAL VOL</div>
            <div class="flex-center">
              <img width="14" src="/imgs/Bitcoin.png" alt="" />
              <span style="margin-left: 4px">{{
                useEthersUnit(collectionInfo.total_vol).formatVal
              }}</span>
            </div>
          </div>
          <div class="setp">
            <div class="bor"></div>
            <div class="color1">FLOOR PRICE</div>
            <data class="flex-center">
              <img width="14" src="/imgs/Bitcoin.png" alt="" />
              <span style="margin-left: 4px">{{
                useEthersUnit(collectionInfo.floor_price).formatVal
              }}</span>
            </data>
          </div>
          <div class="setp">
            <div class="bor"></div>
            <div class="color1">OWNERS</div>
            <div class="flex-center">{{ collectionInfo.owners }}</div>
          </div>
          <div class="setp">
            <div class="bor"></div>
            <div class="color1">LISTED</div>
            <div class="flex-center">{{ collectionInfo.listed }}</div>
          </div>
          <div>
            <div class="color1">ITEMS</div>
            <div class="flex-center">
              {{ collectionInfo.inscribe_num }}
            </div>
          </div>
        </div>
      </div>
      <div class="nav-box flex-align">
        <nav
          v-for="item of rightNav"
          :key="item.value"
          :class="item.value === onNav ? 'on-nav' : ''"
          class="nav"
          @click="changeOnNav(item.value)"
        >
          {{ item.label }}
        </nav>
      </div>

      <div class="list-page">
        <ItemsView
          v-if="onNav === 1"
          :slug="onCollection"
          :nftName="routeQuery.nftName"
          @update="updateData"
        />
        <ActivityView v-else-if="onNav === 2" :slug="onCollection" />
        <HoldersView v-else-if="onNav === 4" :slug="onCollection" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.marketplace {
  min-width: 1240px;
  height: 100%;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  .left {
    width: 370px;
    height: 100%;
    flex: none;
    border: 1px solid #3a312f;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    background: #0f0f12;
    .top {
      flex: none;
      height: 42px;
      background: #090808;
      border-bottom: 1px solid #3a312f;
      border-radius: 4px;
      position: relative;

      input {
        height: 100%;
        padding-left: 20px;
        flex: 1;
        background: #090808;
      }
      .inp-ic {
        width: 46px;
        height: 100%;
        border-left: 1px solid #3a312f;
        cursor: pointer;

        img {
          width: 22px;
        }
      }

      .clt-val {
        display: none;
        position: absolute;
        z-index: 1;
        top: 42px;
        left: 0;
        width: 100%;
        height: max-content;
        max-height: 200px;
        overflow-y: auto;
        padding: 0 20px;
        background: #090808;
        font-size: 12px;
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

    .filter {
      flex: none;
      width: 168px;
      line-height: 32px;
      margin: 10px 18px 0 auto;
      border-radius: 4px;
      text-align: center;
      background: #2e2623;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      font-size: 12px;
      cursor: pointer;

      .on-time {
        color: #000;
        background: #e4e3e3;
        border-radius: 4px;
      }
    }

    .title {
      margin: 18px 18px 0;
      font-size: 12px;
      align-items: center;
      border-bottom: 1px solid #3a312f;

      .t-l {
        cursor: pointer;
        .r-ic {
          margin-left: 6px;

          img {
            width: 6px;
          }
        }
      }

      .t-c,
      .t-r {
        cursor: pointer;
        img {
          width: 6px;
          margin-left: 6px;
        }
      }

      .ic-tfm {
        transform: rotate(180deg);
      }

      .fall {
        transform: rotate(0deg);
      }
    }

    .main {
      flex: 1;
      overflow: auto;
      padding: 10px 18px;

      .collection-box {
        margin-top: 6px;
        .collection {
          padding: 16px 10px;
          border: 1px solid #00000000;
          border-bottom-color: #1f1f1f;
          cursor: pointer;
          .avatar {
            width: 52px;
            margin-right: 10px;
            img {
              width: 100%;
              border-radius: 50%;
            }
          }

          .info {
            flex: 1;
            font-size: 12px;
            .name {
              margin-bottom: 10px;
            }

            .floor {
              .num {
                display: grid;
                grid-template-columns: 2fr 1.8fr 0.8fr;
                align-items: center;
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
        }
        .on-collection {
          border: 1px solid #f2682a;
          border-radius: 4px;
          background: #0f0f12;
        }
      }
    }
  }

  .right {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    .r-top {
      margin-bottom: 30px;
      flex-wrap: wrap;
      .u-desc {
        margin-right: 10%;
        .r-avatar {
          margin-right: 16px;
          img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
          }
        }
        .name {
          margin-bottom: 16px;
          font-size: 18px;
        }

        .info {
          .link {
            height: 14px;
            img {
              height: 100%;
              margin-right: 16px;
              cursor: pointer;
            }
          }

          .choose {
            border: 1px solid #542916;
            background: #2e2522;
            border-radius: 4px;
            font-size: 12px;
            padding: 2px 12px;
            cursor: pointer;
          }
        }
      }

      .data {
        flex: 1;
        flex-wrap: wrap;
        font-size: 12px;
        line-height: 1.8;
        gap: 20px;

        .setp {
          position: relative;
          padding-right: 20px;
          .bor {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translate(0, -50%);
            width: 1px;
            height: 60%;
            background: #646466;
          }
        }
      }
    }

    .nav-box {
      border-bottom: 1px solid #434348;
      .nav {
        width: 180px;
        line-height: 36px;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        text-align: center;
        cursor: pointer;
      }
      .on-nav {
        background: #2e2623;
      }
    }

    .list-page {
      flex: 1;
      overflow: hidden;
      margin-top: 14px;
    }
  }
}
</style>
