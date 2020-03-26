<template>
  <div class="main">
    <router-link to="/">Home</router-link>
    <router-link to="/b">About</router-link>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  mounted() {
    window.addEventListener('click', (e) => console.log(e));
  }
}
</script>

<style scoped>
.main {
  color: mediumseagreen;
}
</style>