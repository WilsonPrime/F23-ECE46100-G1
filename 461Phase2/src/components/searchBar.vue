<template>
  <input type="text" v-model="searchBarVal" placeholder="Search Package via regex"/>
  <button :onclick="search"> Search </button>
</template>

<script>
    export default {
        name: 'SearchBar',
        data() {
            return {
              searchBarVal: "",
            }
        },
        methods: {
            search() {
              console.log(this.searchBarVal)
            }
        },
        props: {
        },
        computed: {
        },
        mounted: function () {
        }
    }
</script>