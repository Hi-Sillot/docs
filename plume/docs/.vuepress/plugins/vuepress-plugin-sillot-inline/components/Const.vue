<template>
  <component :is="tag" v-if="isValidId" class="const-value">
    {{ constValue }}
  </component>
  <component :is="tag" v-else class="const-error" :class="`const-error--${errorMode}`" :title="errorTooltip"
    @click="handleErrorClick">
    <span class="const-error__icon">⚠️</span>
    <span v-if="errorMode === 'verbose'" class="const-error__text">INVALID</span>
  </component>
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
      validator: (value) => {
        const isValid = Object.prototype.hasOwnProperty.call(CONST_MAP, value)
        if (!isValid && process.env.NODE_ENV !== 'production') {
          console.warn(`[C组件] 无效的常量ID: "${value}"`)
        }
        return true
      }
    },
    tag: {
      type: String,
      default: 'span'
    },
    errorMode: {
      type: String,
      default: 'verbose',
      validator: (value) => ['icon', 'verbose'].includes(value)
    }
  },
  emits: ['error-click'],
  computed: {
    isValidId() {
      return Object.prototype.hasOwnProperty.call(CONST_MAP, this.id)
    },
    constValue() {
      return CONST_MAP[this.id]
    },
    errorTooltip() {
      return `无效的常量ID: ${this.id}\n点击可复制ID`
    }
  },
  methods: {
    async handleErrorClick() {
      try {
        await navigator.clipboard.writeText(this.id)
        this.$emit('error-click', this.id)
      } catch (err) {
        console.error('复制失败:', err)
      }
    }
  }
}
</script>

<style scoped>
.const-value {
  /* 正常文本样式 */
}

/* 错误状态基础样式 */
.const-error {
  display: inline-flex;
  align-items: center;
  border-radius: 11px;
  cursor: help;
  transition: all 0.2s ease !important;
  animation: breathe 2s ease-in-out infinite !important;
}

/* 呼吸灯动画 */
@keyframes breathe {

  0%,
  100%,
  60% {
    opacity: 0.8;
  }

  10% {
    opacity: 0.7;
    transform: scale(0.98);
  }

  30% {
    opacity: 0.9;
    transform: scale(0.96);
  }
}

/* 图标模式 - 紧凑闪烁 */
.const-error--icon {
  color: #e53e3e;
  padding: 0 2px;
  transform-origin: center;
}

.const-error--icon:hover {
  animation-duration: 4s;
  border-radius: 3px;
}

.const-error--icon .const-error__icon {
  filter: drop-shadow(0 0 2px #e53e3e);
  font-size: 0.95em;
}

/* 详细模式 - 发光呼吸 */
.const-error--verbose {
  color: #f38028;
  margin: 1px 4px;
  padding: 1px 9px;
  font-size: 0.85em;
  font-weight: 500;
}

.const-error--verbose:hover {
  animation-duration: 4s;
  border: 1.5px dashed #e53e3e;
  box-shadow: 0 0 12px rgba(229, 62, 62, 0.5);
}

.const-error--verbose .const-error__icon {
  margin-right: 4px;
}

.const-error__text {
  line-height: 1.4;
}

/* 点击反馈 */
.const-error:active {
  transform: scale(0.95);
  animation: none;
}

/* 元素样式 */
.const-error__icon {
  line-height: 1;
}
</style>