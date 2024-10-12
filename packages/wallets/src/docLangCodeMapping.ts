const docLangCodeMapping: Record<string, string> = {
  it: 'italian',
  ja: 'japanese',
  fr: 'french',
  'zh-cn': 'chinese',
  'pt-br': 'portuguese-brazilian',
}

export const getDocLink = (code: string) =>
  docLangCodeMapping[code]
    ? `https://docs.plexfinance.us/v/${docLangCodeMapping[code]}/get-started/connection-guide`
    : `https://docs.plexfinance.us/get-started/connection-guide`
