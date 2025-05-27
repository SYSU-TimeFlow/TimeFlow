export const createViewModule = (storeContext: any) => {
  const { currentView } = storeContext;

  function isActiveView(viewId: string): boolean {
    return currentView.value === viewId;
  }

  return {
    isActiveView,
  };
};