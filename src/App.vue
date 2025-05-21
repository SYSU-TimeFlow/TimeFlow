<!-- 
 @component: App.vue 应用的根组件
 @description: 该组件是 Vue 应用的入口点，包含了路由视图和其他全局组件。 
-->
<script setup>
import CalendarApp from "./components/CalendarApp.vue";
</script>

<template>
  <div>
    <router-view></router-view>

    <!-- <CalendarApp></CalendarApp> -->
  </div>
</template>

<style lang="css"></style>
