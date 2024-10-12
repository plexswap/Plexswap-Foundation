export const getDisplayApr = (wayaRewardsApr?: number, lpRewardsApr?: number) => {
  if ((wayaRewardsApr || wayaRewardsApr === 0) && (lpRewardsApr || lpRewardsApr === 0)) {
    return (wayaRewardsApr + lpRewardsApr).toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
  if (wayaRewardsApr) {
    return wayaRewardsApr.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
  return null
}
