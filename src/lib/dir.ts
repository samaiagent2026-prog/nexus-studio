import type { Dir, Lang } from './types'

export const RTL_LANGS: Lang[] = ['ar']
export const dirFor = (lang: Lang): Dir => (RTL_LANGS.includes(lang) ? 'rtl' : 'ltr')
