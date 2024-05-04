<script setup lang="ts">
// import { PropType, onMounted, onUnmounted, watch } from "vue";
import SetFee from "./SetFee.vue";
import SuccessMode from "./SuccessMode.vue";
import { useSendBtc } from "@/hooks/useSendBtc";
import { useStore } from "@/pinia/store";
import type { Model, Order } from "../type";
import { ethers } from "ethers";
import {
  getVoxelStatus,
  getRandBitman,
  checkBitman,
  checkOrderStatus,
  createImg,
} from "@/api/api";
import { craeteThree } from "@/hooks/use3D";

const props = defineProps({
  data: {
    type: Object as PropType<Model>,
  },
});
const emit = defineEmits(["chooseNft", "againCreate"]);

const store = useStore();

onMounted(() => {
  getBitman();
});

onUnmounted(() => {
  clearInterval(orderStatusTimer);
  clearInterval(timer);
  clearInterval(timerprogress);
});

const bitman = ref(0);
const getBitman = async () => {
  const res = await getRandBitman();

  if (res.code === 200) {
    bitman.value = res.data;
    isHasBitman.value = 1;
  }
};
const isHasBitman = ref(1);
const changeBitman = async () => {
  if (!bitman.value) {
    isHasBitman.value = 0;
    return;
  }
  const res = await checkBitman({ block_height: Number(bitman.value) });
  if (res.code === 200) {
    isHasBitman.value = res.data;
  }
};
const randBitman = () => {
  getBitman();
};

watch(
  () => props.data,
  () => {
    if (props.data?.task_id) {
      timerprogress = setInterval(() => {
        progressTime();
      }, 500);
      const dom = document.getElementById("canvas-container");
      dom ? (dom.innerHTML = "") : "";
      loading.value = true;
      timer = setInterval(() => {
        getStatus();
      }, 2000);
    }
  }
);
let timer: any = null;
const loading = ref(false);
const loadingText =
  "3D enhancement ongoing with BRC-720 AI. Expected wait for 30s.";
const loadingTextLen = loadingText.length + "ch";
const modelInfo = ref({
  status: 0,
  vxc: "",
  fee_base: 0,
  fee_sats: 0,
});

const pic_base64 = ref("");
const getStatus = async () => {
  const res = await getVoxelStatus({ task_id: props.data?.task_id || "" });
  if (res.code) {
    modelInfo.value = res.data;
    if (res.data.status === 200 || res.data.status === 400) {
      clearInterval(timer);
      clearInterval(timerprogress);
      progressWidth.value === 0;
      loading.value = false;
      if (res.data.status === 200) {
        pic_base64.value = craeteThree(res.data.vxc);
        createBaseImg();
      }
    }
  }
};

const createBaseImg = async () => {
  await createImg({
    task_id: props.data?.task_id || "",
    pic_base64: pic_base64.value,
  });
};

// 重试
const again = () => {
  modelInfo.value.status = 0;
  emit("againCreate");
};

// 进度条
const progressWidth = ref(0);
let timerprogress: any = null;
const progressTime = () => {
  if (progressWidth.value >= 99) {
    clearInterval(timerprogress);
    progressWidth.value = 99;
    return;
  }
  progressWidth.value += 1;
};

// 选择网络
const network = ref("Bitcoin");
const showNetworkList = ref(false);
// const selectNetwork = (val: string) => {
//   network.value = val;
//   showNetworkList.value = false;
// };

const isLogin = () => {
  if (!store.userToken) {
    localStorage.clear();
    store.setUserToken("");
    store.setShowWallet(true);
    return false;
  }

  return true;
};

// 选择nft
const chooseNft = () => {
  if (!isLogin()) return;
  emit("chooseNft", true);
};

// 铭刻
const brcInscribe = () => {
  if (
    loading.value ||
    modelInfo.value.status !== 200 ||
    isHasBitman.value === 0
  )
    return;
  if (!isLogin()) return;
  showBrc.value = true;
};

// 弹框
const showBrc = ref(false);
const orderInfo = ref({
  order_id: "",
  network_address: "",
  sats: 0,
});
const chooseFee = ref(0);
const createOrderOk = (order: Order, fee: number) => {
  orderInfo.value = order;
  chooseFee.value = fee;
  send();
};

const sendLoading = ref(false);
const txidData = ref("");
const send = async () => {
  sendLoading.value = true;
  try {
    const txid = await useSendBtc(
      orderInfo.value.network_address,
      orderInfo.value.sats,
      {
        confim: () => {
          showBrc.value = false;
          showSuc.value = true;
        },
        reject: (e: any) => {
          console.log("reject:", e);

          closeSuccessMode();
          showSuc.value = false;
          sendLoading.value = false;
        },
      }
    );

    if (txid) {
      txidData.value = txid;
      orderStatusTimer = setInterval(() => {
        getOrderStatus();
      }, 2000);
    } else {
      sendLoading.value = false;
    }
  } catch (e) {
    console.log(e);
    closeSuccessMode();
    sendLoading.value = false;
  }
};

let orderStatusTimer: any = null;
const orderStatus = ref({
  status: 0,
  name: "",
  inscription_id: "",
  owner: "",
});
const getOrderStatus = async () => {
  const res = await checkOrderStatus({
    order_id: orderInfo.value.order_id,
    txid: txidData.value,
  });

  if (res.code === 200) {
    orderStatus.value = res.data;
    if (orderStatus.value.status === 3 || orderStatus.value.status === 2) {
      clearInterval(orderStatusTimer);
      sendLoading.value = false;
    }
  }
};

// 成功
const showSuc = ref(false);
const closeSuccessMode = () => {
  sendLoading.value = false;
  clearInterval(orderStatusTimer);
};
</script>

<template>
  <div class="choose-nft">
    <div class="desc">
      <div>
        Elevate your image NFT to 3D with the transformative BRC-720 AI
        protocol.
      </div>
      <div class="desc-on tm-color">
        <div class="ic tm-bg"></div>
        Make your NFTs Really Great!
        <div class="ic tm-bg"></div>
      </div>
    </div>

    <div class="nft">
      <div>
        <div class="img-box">
          <div v-if="loading">
            <div style="" class="typing">
              {{ loadingText }}
            </div>
            <div>
              <div class="gif flex-center">
                <img src="/imgs/schedule.gif" alt="" />
              </div>
              <div class="progress">
                <div
                  :style="{ width: progressWidth + '%' }"
                  class="progress-on"
                ></div>
                <div style="text-align: center; margin-top: 10px">
                  {{ progressWidth }} %
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="modelInfo.status === 0" class="introduce">
            <video
              style="width: 100%"
              controls
              loop
              muted
              autoplay
              src="/video/introduce.mp4"
            ></video>
          </div>

          <div v-show="modelInfo.status === 200">
            <div style="font-size: 12px; text-align: center; color: #976046">
              Preview your NFT's 3D transformation. If you like it, inscribe it
              now!
            </div>
            <div id="canvas-container" style="position: relative"></div>
          </div>

          <div v-if="modelInfo.status === 400" class="again">
            <div
              style="
                font-size: 12px;
                text-align: center;
                line-height: 1.8;
                color: #2a67f2;
              "
            >
              "Oops! It seems like the 3D transformation didn't quite go as
              planned. Don't worry, glitches happen.
            </div>

            <div class="tip">
              Let's try again, and we'll make sure your NFT gets the
              transformation it deserves!"

              <div class="btn" @click="again">Again</div>
            </div>
          </div>
        </div>
        <div>
          <a
            style="
              display: block;
              font-size: 12px;
              text-align: center;
              color: #fff;
              margin: 10px auto 0;
            "
            href="https://whitepaper.bitworld.ai/bitworld/overview/brc-720-ai-protocol/image-to-3d/generate-rules"
            target="_blank"
          >
            Generate rules？
          </a>
        </div>
      </div>
      <div class="nft-info">
        <div class="step1">
          <div class="label tm-color">Network</div>
          <div style="flex: 1; display: flex; justify-content: space-between">
            <div style="position: relative" class="">
              <div
                class="sel-netwk"
                @click.="showNetworkList = !showNetworkList"
              >
                <div style="display: flex; align-items: center">
                  <img class="icon" :src="`/imgs/${network}.png`" alt="" />
                  <div>{{ network }}</div>
                </div>
                <!-- <img
                  :class="showNetworkList ? 'tfm-rotate' : ''"
                  class="ic-right"
                  src="/imgs/ic4.png"
                  alt=""
                /> -->
              </div>
              <!-- <div v-if="showNetworkList" class="network-list">
                <div class="list-option" @click="selectNetwork('Bitcoin')">
                  <img src="/imgs/Bitcoin.png" alt="" />
                  <span>Bitcoin</span>
                </div>
              </div> -->
            </div>

            <!-- 切换网络 -->
            <div v-if="false" class="connect" @click="network = 'network'">
              Connect Wallect
            </div>
            <div v-if="false" class="connected">
              bc1pp9...wf5u
              <img class="left-ic" src="/imgs/ic4.png" alt="" />

              <div class="logout">
                <img src="/imgs/logout.png" alt="" />
                Disconnect
              </div>
            </div>
          </div>
        </div>

        <div class="step2">
          <div class="label tm-color">Choose NFT</div>
          <div class="content">
            <div class="nft-img" @click="chooseNft">
              <img
                v-if="props.data?.task_id"
                :src="props.data?.pic"
                class="avatar"
              />
              <div v-else class="avatar-uploader-icon">
                <img src="/imgs/ic2.png" />
              </div>
            </div>

            <div v-if="props.data?.task_id" class="nft-desc">
              <div class="item">
                <div class="left tm-color"></div>
                <div style="color: #ff7c01; font-size: 14px">Original (2D)</div>
                <div style="color: #ff7c01; font-size: 14px">New (3D)</div>
              </div>
              <div class="item">
                <div class="left">Collection:</div>
                <div class="right singe-line">
                  {{ props.data?.collection }}
                </div>
                <div class="singe-line" style="color: #2a67f2">
                  {{ props.data?.collection }}(3D)
                </div>
              </div>
              <div class="item">
                <div class="left">Total supply:</div>
                <div class="right singe-line">
                  {{ props.data?.supply }}
                </div>
                <div style="color: #2a67f2">720</div>
              </div>
              <div class="item">
                <div class="left">Name:</div>
                <div class="right singe-line">{{ props.data?.name }}</div>
                <div style="color: #2a67f2" class="singe-line">
                  {{ props.data?.new_name }}
                </div>
              </div>
              <!-- <div v-if="network === 'Bitcoin'" class="item">
                <div class="left">Inscription_number:</div>
                <div class="right singe-line">
                  {{ props.data?.inscription_number }}
                </div>
              </div> -->
            </div>
          </div>
        </div>

        <div class="step3">
          <div class="label tm-color">Choose a Bitman</div>
          <div class="content">
            <div class="icon" @click="randBitman">
              <img src="/imgs/ic3.png" alt="" />
            </div>
            <div class="bitman">
              <input v-model="bitman" type="text" @change="changeBitman" />
              <div style="">. Bitman</div>
            </div>
          </div>
          <p v-if="isHasBitman === 0" style="color: red">
            Input a valid Bitman ID
          </p>
        </div>

        <div class="step4">
          <button
            :class="
              loading || modelInfo.status !== 200 || isHasBitman === 0
                ? 'loading'
                : ''
            "
            class="inscribe"
            @click="brcInscribe"
          >
            Inscribe
          </button>
          <div v-if="props.data?.service_fee" class="fee">
            <div>Service Fee</div>
            <div>
              {{
                ethers.formatUnits(props.data?.service_fee.toString() || "0", 8)
              }}
              BTC
            </div>
          </div>
        </div>
      </div>
    </div>

    <SetFee
      v-model:show="showBrc"
      :data="{ task_id: props.data?.task_id, bitman_id: bitman, ...modelInfo }"
      @ok="createOrderOk"
    />
    <SuccessMode
      v-model:show="showSuc"
      :sendLoading="sendLoading"
      :data="orderStatus"
      @close="closeSuccessMode"
    />
  </div>
</template>

<style lang="less" scoped>
.choose-nft {
  .desc {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin: 20px 0 40px;

    .desc-on {
      display: flex;
      align-items: center;
      .ic {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin: 0 20px;
      }
    }
  }

  .nft {
    display: flex;
    justify-content: space-between;
    .img-box {
      width: 500px;
      height: 500px;
      padding-top: 12px;
      border: 1px solid #434348;
      border-radius: 4px;
      background: #000;

      .typing {
        width: 0;
        font-size: 12px;
        text-align: center;
        color: #2a67f2;
        margin: auto;
        overflow: hidden;
        white-space: nowrap;
        border-right: 0.15em solid orange;
        animation: 10s typing-text forwards;
      }

      @keyframes typing-text {
        from {
          width: 1ch;
        }
        to {
          width: v-bind(loadingTextLen);
        }
      }

      .gif {
        width: 400px;
        height: 370px;
        margin: auto;
        img {
          width: 100%;
        }
      }

      .progress {
        width: 80%;
        margin: 20px auto 0;
        height: 8px;
        border-radius: 8px;
        background: #2e2623;
        .progress-on {
          border-radius: 8px;
          height: 100%;
          background: #f2682a;
        }
      }

      .again {
        .tip {
          padding: 140px 20px 0;
          text-align: center;
          font-size: 12px;

          .btn {
            width: 237px;
            margin: auto;
            line-height: 44px;
            margin-top: 20px;
            background: #0064ed;
            border-radius: 4px;
            font-size: 18px;
            cursor: pointer;
          }
        }
      }

      .introduce {
        width: 498px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .nft-info {
      width: 650px;

      .step1 {
        height: 80px;
        display: flex;
        .label {
          line-height: 36px;
          margin-right: 70px;
        }
        .sel-netwk {
          width: 180px;
          height: 36px;
          padding: 0 14px;
          border-radius: 4px;
          font-size: 14px;
          background: #54291669;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          position: relative;
          border: 1px solid #542916;
          .icon {
            width: 20px;
            margin-right: 6px;
          }
        }

        .network-list {
          width: 100%;
          padding: 0 14px;
          border-radius: 4px;
          border: 1px solid #542916;
          position: absolute;
          top: 36px;
          left: 0;

          .list-option {
            height: 36px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #542916;
            cursor: pointer;
            img {
              width: 20px;
              margin-right: 6px;
            }
          }
        }

        .connect {
          height: 36px;
          line-height: 36px;
          padding: 0 12px;
          border-radius: 4px;
          font-size: 12px;
          background: #f2682a;
          cursor: pointer;
        }

        .connected {
          height: 36px;
          line-height: 36px;
          padding: 0 12px;
          border: 1px solid #f2682a;
          border-radius: 4px;

          &:hover .left-ic {
            transform: rotate(180deg);
            animation: 0.3s;
          }

          .logout {
            display: none;
            align-items: center;
            border-top: 1px solid #f2682a;
            cursor: pointer;
            img {
              width: 16px;
              margin-right: 6px;
            }
          }
          &:hover {
            height: 72px;
          }
          &:hover .logout {
            display: flex;
          }
        }
      }

      .step2 {
        margin-bottom: 40px;

        .content {
          height: 148px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;

          .nft-img {
            color: #8c939d;
            width: 148px;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid #303031;
            border-radius: 4px;
            background: #1a191e;

            .avatar {
              width: 100%;
              height: 100%;
            }
          }
        }
        .label {
          margin-bottom: 16px;
        }

        .nft-desc {
          display: grid;
          flex: 1;
          height: 100%;
          padding: 6px 18px;
          border: 1px solid #303031;
          border-radius: 4px;
          background: #1a191e;

          .item {
            display: grid;
            grid-template-columns: 118px 1fr 1fr;
            align-items: center;
            gap: 12px;
            font-size: 12px;

            .right {
              color: #685c56;
            }
          }
        }
      }

      .step3 {
        margin-bottom: 40px;
        .label {
          margin-bottom: 16px;
        }

        .content {
          display: flex;
          align-items: center;
          border: 1px solid #542916;
          border-radius: 4px;

          .icon {
            padding: 4px 12px;
            border-right: 1px solid #542916;
            cursor: pointer;
            img {
              width: 20px;
            }
          }

          .bitman {
            flex: 1;
            padding: 0 10px;
            color: #5e3f31;
            font-size: 12px;
            display: flex;
            align-items: center;
            input {
              width: 100%;
              height: 100%;
              color: #5e3f31;
              background: #0f0f12;
              outline: none;
              border: none;
            }

            div {
              flex: none;
              color: #5e3f31;
            }
          }
        }
      }

      .step4 {
        width: 100%;
        .inscribe {
          display: block;
          width: 100%;
          height: 38px;
          background: #f2682a;
          margin-bottom: 6px;
          border-radius: 4px;
          cursor: pointer;
          border: 0;
        }
        .loading {
          background: #35312f;
          cursor: not-allowed;
        }
        .fee {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          div {
            color: #976046;
          }
        }
      }
    }
  }
}
</style>
