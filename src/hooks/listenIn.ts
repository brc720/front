import { onMounted, onUnmounted } from "vue";
import { useStore } from "@/pinia/store";

export const useListenIn = () => {
  const store = useStore()

  const clear = () => {
    localStorage.clear()

    if (store.userToken) {
      store.setUserToken('')
      location.reload();
    }
  }

  onMounted(() => {
    window?.okxwallet?.bitcoin?.on('accountChanged', clear);
    window?.unisat?.on('accountsChanged', clear);

    const provider = window?.bitkeep?.ton;
    provider?.on('accountsChanged', clear);
  })

  onUnmounted(() => {
    window?.unisat?.removeListener('accountsChanged', clear);
  })
}
