// .vuepress/stores/author.ts
import { defineStore } from 'pinia'

export const useAuthorStore = defineStore('authors', {
  state: () => ({
    authors: {}
  }),
  actions: {
    setAuthors(data) {
      this.authors = data
    },
    getAuthor(slug) {
      return this.authors[slug]
    },
    getAuthors() {
      return this.authors
    }
  }
})