<template>
  <component :is="tag">{{ constValue }}</component>
</template>

<script>
// 常量映射表
const CONST_MAP = {
  'sillotNoteName_yobeCe': '汐洛绞架',
  'sillotNoteName_doCe': 'Sillot-Gibbet',
  'syNoteName_CN': '思源笔记',
  'syNoteName_EN': 'siyuan-note',
  'sillotMatrixName_yobeCe': '汐洛彖夲肜矩阵',
  'sillotMatrixName_doCe': 'Sillot T☳Converbenk Matrix',
  'sillot_yobeCe': '汐洛',
  'sillot_doCe': 'Sillot',
  'siow_yobeCe': '司华',
  'siow_doCe': 'Siow',
  'hellise_yobeCe': '赫礼斯',
  'hellise_doCe': 'Hellise',
  'potter_yobeCe': '叵特',
  'potter_doCe': 'Potter',
  'sofill_yobeCe': '沁棘',
  'sofill_doCe': 'Sofill',
  'sili_yobeCe': '司丽',
  'sili_doCe': 'Sili',
  'winsay_yobeCe': '风颂',
  'winsay_doCo': 'Winsay',
  'lnco_yobeCe': '兰可',
  'lnco_doCe': 'Lnco'
}

export default {
  name: 'C',
  props: {
    id: {
      type: String,
      required: true,
      validator: (value) => Object.keys(CONST_MAP).includes(value)
    },
    tag: {
      type: String,
      default: 'span'
    }
  },
  computed: {
    constValue() {
      return CONST_MAP[this.id] || this.id
    }
  }
}
</script>

<style scoped>
/* 无样式，只显示纯文本 */
</style>