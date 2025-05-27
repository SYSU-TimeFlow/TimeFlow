import { computed } from "vue";
import { useEventStore } from "../../event";

export const createCategoryModule = (storeContext: any) => {
  const eventStore = useEventStore();

  // 获取所有分类
  const categories = computed(() => {
    return eventStore.categories;
  });

  // 获取激活的分类
  const activeCategories = computed(() => {
    return eventStore.categories.filter(category => category.active);
  });

  function toggleCategory(categoryId: number) {
    eventStore.toggleCategory(categoryId);
  }

  function addNewCategory() {
    eventStore.openNewCategoryModal();
  }

  function editCategory(category: any) {
    eventStore.openCategoryDetails(category);
  }

  function deleteCategory(categoryId: number) {
    eventStore.deleteCategory();
  }

  function getCategoryColor(categoryId: number): string {
    const category = eventStore.categories.find(c => c.id === categoryId);
    return category ? category.color : '#43aa8b';
  }

  function isCategoryActive(categoryId: number): boolean {
    const category = eventStore.categories.find(c => c.id === categoryId);
    return category ? category.active : false;
  }

  return {
    categories,
    activeCategories,
    toggleCategory,
    addNewCategory,
    editCategory,
    deleteCategory,
    getCategoryColor,
    isCategoryActive,
  };
};