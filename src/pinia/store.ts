import { defineStore } from 'pinia'

export const useStore = defineStore('storeId', {
  state: () => {
    return {
      userToken: '',
      walletAddress: '',
      showWallet: false,
      isWhitelist: false
    }
  },

  actions: {
    setUserToken(token: string) {
      this.$state.userToken = token
    },

    setWalletAddress(addr: string) {
      this.$state.walletAddress = addr
    },

    setShowWallet(show: boolean) {
      this.$state.showWallet = show
    },

    clearInfo() {
      this.$state.userToken = ''
      localStorage.clear()
    }
  }
})
