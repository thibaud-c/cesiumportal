<template>
  <router-view />
</template>

<script>
export default {
  name: 'App',
  computed: {
    currentRoute(){
      return this.$route.path;
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  height: 100%;
  width: 100%;
}
#vue-icon{
  height: 5em;
}
</style>