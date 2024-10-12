import { Language } from './../types'

export const EN: Language = { locale: 'en-US', language: 'English', code: 'en' }
export const DE: Language = { locale: 'de-DE', language: 'Deutsch', code: 'de' }
export const ESES: Language = { locale: 'es-ES', language: 'Español', code: 'es-ES' }
export const FR: Language = { locale: 'fr-FR', language: 'Français', code: 'fr' }
export const IT: Language = { locale: 'it-IT', language: 'Italiano', code: 'it' }
export const NL: Language = { locale: 'nl-NL', language: 'Nederlands', code: 'nl' }
export const PL: Language = { locale: 'pl-PL', language: 'Polski', code: 'pl' }
export const PTBR: Language = { locale: 'pt-BR', language: 'Português (Brazil)', code: 'pt-br' }
export const PTPT: Language = { locale: 'pt-PT', language: 'Português', code: 'pt-pt' }


export const languages: Record<string, Language> = {
  'en-US': EN,
  'de-DE': DE,
  'es-ES': ESES,
  'fr-FR': FR,
  'it-IT': IT,
  'nl-NL': NL,
  'pl-PL': PL,
  'pt-BR': PTBR,
  'pt-PT': PTPT,
}

const languageList = Object.values(languages)

export default languageList
