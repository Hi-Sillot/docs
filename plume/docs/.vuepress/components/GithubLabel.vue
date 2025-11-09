<template>
  <span 
    :id="`label-${labelId}`"
    class="IssueLabel hx_IssueLabel IssueLabel--big lh-condensed js-label-link d-inline-block v-align-middle"
    :data-name="fullName"
    :style="labelStyle"
  >
    {{ fullName }}
  </span>
</template>

<script>
// 标签映射表 - 使用简写作为键
const LABEL_MAP = {
  // 海文东标准
  'Abolishment': { 
    fullName: '- - - Abolishment ❌', 
    color: { r: 217, g: 88, b: 11, h: 22, s: 90, l: 44 }
  },
  'Assess': { 
    fullName: '- - - Assess 🛸', 
    color: { r: 43, g: 64, b: 95, h: 215, s: 37, l: 27 }
  },
  'Bug': { 
    fullName: '- - - Bug 🩸', 
    color: { r: 255, g: 26, b: 42, h: 355, s: 100, l: 55 }
  },
  'Enhancement': { 
    fullName: '- - - Enhancement 🎢', 
    color: { r: 29, g: 27, b: 10, h: 53, s: 48, l: 7 }
  },
  'Ext': { 
    fullName: '- - - Ext 🧩', 
    color: { r: 83, g: 25, b: 231, h: 256, s: 81, l: 50 }
  },
  'Feature': { 
    fullName: '- - - Feature 🧮', 
    color: { r: 0, g: 107, b: 117, h: 185, s: 100, l: 22 }
  },
  'Refactor': { 
    fullName: '- - - Refactor ♻️', 
    color: { r: 128, g: 93, b: 91, h: 3, s: 16, l: 42 }
  },
  'Security': { 
    fullName: '- - - Security ☢️', 
    color: { r: 45, g: 114, b: 7, h: 98, s: 88, l: 23 }
  },
  'Shinning': { 
    fullName: '- - - Shinning 🍭', 
    color: { r: 250, g: 250, b: 175, h: 60, s: 88, l: 83 }
  },
  // 绛亽标准
  'DevEnv': { 
    fullName: '- DevEnv 🧊', 
    color: { r: 19, g: 19, b: 19, h: 0, s: 0, l: 7 }
  },
  'Document': { 
    fullName: '- Document 🔊', 
    color: { r: 19, g: 19, b: 19, h: 0, s: 0, l: 7 }
  },
  'Feedback': { 
    fullName: '- Feedback 🚨', 
    color: { r: 19, g: 19, b: 19, h: 0, s: 0, l: 7 }
  },
  'HWD': { 
    fullName: '- HWD 🐲', 
    color: { r: 19, g: 19, b: 19, h: 0, s: 0, l: 7 }
  },
  'Proxy': { 
    fullName: '- Proxy 🟢', 
    color: { r: 19, g: 19, b: 19, h: 0, s: 0, l: 7 }
  },
  'T': { 
    fullName: '- T☳ 🪷', 
    color: { r: 19, g: 19, b: 19, h: 0, s: 0, l: 7 }
  }
}

// 生成随机的6位十六进制ID
function generateLabelId() {
  return Math.random().toString(16).slice(2, 8)
}

export default {
  name: 'GithubLabel',
  props: {
    name: {
      type: String,
      required: true,
      validator: (value) => Object.keys(LABEL_MAP).includes(value)
    }
  },
  data() {
    return {
      labelId: generateLabelId()
    }
  },
  computed: {
    fullName() {
      return LABEL_MAP[this.name]?.fullName || this.name
    },
    labelStyle() {
      const color = LABEL_MAP[this.name]?.color
      if (!color) return {}

      return {
        '--label-r': color.r,
        '--label-g': color.g,
        '--label-b': color.b,
        '--label-h': color.h,
        '--label-s': color.s,
        '--label-l': color.l
      }
    }
  }
}
</script>

<style scoped>
@import "../styles/github_labels.css";

.IssueLabel {
  margin: 0px 3px 0px 3px;
}
</style>