import { defineHopeConfig } from 'vuepress-theme-hope'

export default defineHopeConfig({
  // site config
  lang: 'zh-CN',
  title: "Mean Space",
  description: '平均数空间，记录一些日常、非日常的思考',
  base: '/',

  // theme config
  theme: 'hope',
  themeConfig: {
    navbar: [
      { text: 'Home', link: '/'},
      { text: 'Math', link: '/math/'},
      { text: 'Science', link: '/science/'},
      { text: 'Reading', link: '/reading/'},
      { text: 'Coding', link: '/coding/'},
      { text: 'Stuff', link: '/stuff/'},
      { text: 'About', link: '/about/'},
    ],
    sidebar: {
      "/reading/": "structure"
    }
  }
})