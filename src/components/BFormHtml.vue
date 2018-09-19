<template>
  <b-form-html-editor :content="value" @change="$emit('input', arguments[0])"></b-form-html-editor>
</template>

<script>
import VueHtml5Editor from 'vue-html5-editor'
const BFormHtmlEditor = new VueHtml5Editor({})

export default {
  components: {
    BFormHtmlEditor
  },
  props: {
    value: String,
  }
}
</script>

