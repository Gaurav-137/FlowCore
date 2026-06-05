import create from 'zustand'

const useUiStore = create((set) => ({
  selectedNodeId: null,
  isConfigPanelOpen: false,
  activePanelTab: 'parameters', // 'parameters' | 'input' | 'output'
  themeMode: 'light', // 'light' | 'dark'

  setSelectedNodeId: (id) => set({ 
    selectedNodeId: id, 
    isConfigPanelOpen: !!id,
    activePanelTab: 'parameters' // Reset tab when node changes
  }),
  
  setConfigPanelOpen: (isOpen) => set({ isConfigPanelOpen: isOpen }),
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),
  toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' }))
}))

export default useUiStore
