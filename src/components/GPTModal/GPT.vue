<script setup lang="ts">
import { debounce } from "lodash";

const props = defineProps({
  width: Number,
  height: Number || String,
  title: String,
  show: Boolean,
  bitmanId: String,
  number: Number,
});

const emit = defineEmits(["update:show", "onClose"]);

const show = ref(false);
watch(
  () => props.show,
  () => {
    show.value = props.show;
  }
);
watch(
  () => show.value,
  () => {
    emit("update:show", show.value);
  }
);

const [greeting1, greeting2] = [ref(null), ref(null)];
const userMessage = ref(null);
const yourselfMessage = ref(null);
const roleAlias = ref<any>({
  user: "You",
  assistant: computed(() => `X-Bitman#${props.number}`),
});
const chatListDom = ref<HTMLDivElement>();

let socket: WebSocket;

const messageList = ref([
  {
    role: "assistant",
    content: "",
  },
]);

watch(
  () => show.value,
  (nv) => {
    if (nv) {
      // nextTick(() => {
      //     typed1 = new Typed(greeting1.value, {
      //         strings: [""],
      //         typeSpeed: 50,
      //         loop: false,
      //         onComplete: () => {
      //             typed1.stop();
      //             typed2.start();
      //             typed2.destroy();
      //             typed2 = new Typed(greeting2.value, {
      //                 strings: [""],
      //                 typeSpeed: 50,
      //                 loop: false,
      //                 startDelay: 300,
      //                 onComplete() {
      //                     typed2.stop();
      //                     typed1.start();
      //                 }
      //             })
      //         },
      //     })
      //     typed2 = new Typed(greeting2.value, {
      //         strings: ["Hey, I'm X-Bitman! I'm ready to rock the BitWorld with you! "],
      //         typeSpeed: 50,
      //         loop: true,
      //         startDelay: 4000,
      //         onComplete() {
      //             typed2.stop();
      //             typed1.start();
      //         }
      //     })
      // })
      return;
    }
    // typed1.destroy();
    // typed2.destroy();
    emit("onClose");
  }
);

watch(
  () => props.bitmanId,
  (id) => {
    if (id) {
      socket = new WebSocket(`wss://gpt.bitworld.ai/xbitman?id=${id}`);

      socket.addEventListener("open", () => {
        console.log("WebSocket has already connected");
        socket.send("init");
      });

      socket.addEventListener("end", () => {
        console.log("end");
      });

      socket.addEventListener("close", () => {
        console.log("WebSocket has disconnected");
        messageList.value = [
          {
            role: "assistant",
            content: "",
          },
        ];
      });

      socket.addEventListener("message", (event) => {
        appendLastMessageContent(event.data);
      });
    }
  }
);

// watch(
//   () => props.number,
//   (number) => {
//     roleAlias.value.assistant = `X-Bitman#${number}`;
//   }
// );

onUpdated(() => {
  scrollToBottom();
});
const scrollToBottom = () => {
  if (chatListDom.value) {
    chatListDom.value.scrollTop = chatListDom.value.scrollHeight;
  }
};

const appendLastMessageContent = (content: string) => {
  messageList.value[messageList.value.length - 1].content += ` ${content}`;
};

const clearMessageContent = () => (userMessage.value = null);

const sendMessage = debounce(() => {
  if (userMessage.value) {
    messageList.value.push({ role: "user", content: userMessage.value });
    messageList.value.push({ role: "assistant", content: "" });
    socket && socket.send(userMessage.value);
    clearMessageContent();
  }
}, 350);

const close = () => {
  socket && socket.close();
  show.value = false;
};

const showMask = () => {
  show.value = true;
};

defineExpose({
  showMask,
  close,
});
</script>

<template>
  <div class="mask-container" v-if="show">
    <div
      class="mask-content"
      :style="{
        width: `${width}px`,
        height: `${typeof height === 'string' ? height : height + 'px'}`,
      }"
    >
      <div class="header">
        <div class="greeting">
          <div :style="{ display: 'flex', height: '14px' }">
            <div class="greeting-top" ref="greeting1">
              Greetings, future collaborator!
            </div>
          </div>
          <div :style="{ display: 'flex', height: '14px' }">
            <div ref="greeting2">
              Hey, I'm X-Bitman! I'm ready to rock the BitWorld with you!
            </div>
          </div>
        </div>
        <div class="bot">
          <div></div>
          <div></div>
        </div>
      </div>
      <div class="mask-title">
        <div class="title">{{ props.title }}</div>
        <div class="close" @click="close"></div>
      </div>
      <div class="message-content">
        <div class="chatList" ref="chatListDom">
          <template v-for="item of messageList">
            <template v-if="item.role == 'assistant'">
              <div class="bitman-side">
                <div class="info">
                  <div class="bitman-avatar"></div>
                  <div class="bitman-name">{{ roleAlias[item.role] }}</div>
                </div>
                <div class="bitman-message" v-html="item.content"></div>
              </div>
            </template>
            <template v-else>
              <div class="yourself-side" ref="yourselfMessage">
                <div class="info">
                  <div class="yourself-avatar"></div>
                  <div class="yourself-name">{{ roleAlias[item.role] }}</div>
                </div>
                <div class="yourself-message" v-html="item.content"></div>
              </div>
            </template>
          </template>
        </div>
        <div class="input-box">
          <div>
            <input
              class="input"
              @keyup.enter="sendMessage"
              v-model="userMessage"
              :placeholder="`Message X-Bitman#${props.number}`"
            />
          </div>
          <div class="send" @click="sendMessage"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.mask-container {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  left: 0;
  top: 0;
  z-index: 1000;

  .mask-content {
    z-index: 9999;
    width: 507px;
    height: 528px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #181822;
    box-sizing: border-box;
    border: 1px solid #2e2e2e;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
  }

  .header {
    height: 50px;
    padding: 20px 8px 0px;
    box-sizing: border-box;

    .greeting {
      font-family: FZHei, PingFangSC-Regular, Roboto, Helvetica Neue, Helvetica,
        Tahoma, Arial, PingFang SC-Light, Microsoft YaHei;
      color: #00d8ff;
      font-size: 12px;
      min-height: 36px;

      .greeting-top {
        margin-bottom: 6px;
      }
    }
  }

  .bot {
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    cursor: pointer;

    & > :first-child {
      width: 23px;
      height: 18px;
      background: url("../../assets/x-bitman/message.png") no-repeat 100%/100%;
    }

    & > :last-child {
      width: 41px;
      height: 41px;
      background: url("../../assets/x-bitman/small_bot.png") no-repeat 100%/100%;
    }
  }

  .mask-title {
    width: 100%;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #0c0c18;
    margin-top: 8px;
    padding: 0 20px;

    .title {
      width: 96%;
      text-align: center;
    }

    .close {
      width: 15px;
      height: 15px;
      background: url("./images/close.png") no-repeat 100% / 100%;
      cursor: pointer;
      z-index: 1000;
    }
  }

  .message-content {
    background-color: #070517;
    padding: 12px;
    box-sizing: border-box;
    flex: 1;

    height: 300px;

    .chatList {
      height: 83%;
      overflow: hidden auto;
    }

    .bitman-side,
    .yourself-side {
      margin: 16px 0;

      .info {
        display: flex;
        height: 32px;
        align-items: center;

        .bitman-avatar {
          width: 32px;
          height: 32px;
          background: url("./images/bitman_avatar.png") no-repeat 100%/100%;
        }

        .bitman-name {
          color: #f2682a;
          margin-left: 10px;
        }

        .yourself-avatar {
          width: 32px;
          height: 32px;
          background: url("./images/your_avatar.png") no-repeat 100%/100%;
        }

        .yourself-name {
          margin-left: 10px;
        }
      }

      .bitman-message,
      .yourself-message {
        margin-top: 7px;
        font-size: 11px;
        padding: 0 25px 0 54px;
        box-sizing: border-box;
      }
    }
  }

  .input-box {
    display: flex;
    align-items: center;
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);

    .input {
      width: 426px;
      height: 33px;
      background-color: #252531;
      border: none;
      outline: none;
      border-radius: 6px;
      padding-left: 10px;
      color: #fff;
    }

    .send {
      width: 33px;
      height: 33px;
      background: url("./images/send.png") no-repeat 100%/100%;
      margin-left: 10px;
      cursor: pointer;
    }
  }
}

&::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 5px;
  height: 1px;
}

&::-webkit-scrollbar-thumb {
  /*滚动条里面的滑块*/
  border-radius: 5px;
  background: #cccccc;
}

&::-webkit-scrollbar-track {
  /*滚动条里面轨道背景*/
  border-radius: 5px;
  background: #fff;
}
</style>

<style>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
}
</style>
