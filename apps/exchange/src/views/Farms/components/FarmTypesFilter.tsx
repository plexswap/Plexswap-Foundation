import { useTranslation } from '@plexswap/localization'
import {
    Box,
    Button,
    CurrencyIcon,
    FarmIcon,
    Flex,
    InlineMenu,
    RocketIcon,
    Text,
    Toggle,
    TradeIcon,
} from '@plexswap/ui-plex'
import { useEffect, useRef, useState } from 'react'
import { styled } from 'styled-components'

interface FarmTypesFilterProps {
  boostedOnly: boolean
  handleSetBoostedOnly: (value: boolean) => void
  stableSwapOnly: boolean
  handleSetStableSwapOnly: (value: boolean) => void
  extendedFarmOnly?: boolean
  handleSetExtendedFarmOnly?: (value: boolean) => void
  coreFarmOnly?: boolean
  handleSetCoreFarmOnly?: (value: boolean) => void
  farmTypesEnableCount: number
  handleSetFarmTypesEnableCount: (value: number) => void
}

export const FarmTypesWrapper = styled(Flex)`
  background: ${({ theme }) => theme.colors.dropdown};
  border-radius: 24px 24px 0 0;
`

export const StyledItemRow = styled(Flex)`
  cursor: pointer;
  user-select: none;
`

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 10px;

  ${Text} {
    margin-left: 8px;
  }
`

export const FarmTypesFilter: React.FC<FarmTypesFilterProps> = ({
  boostedOnly,
  handleSetBoostedOnly,
  stableSwapOnly,
  handleSetStableSwapOnly,
  extendedFarmOnly,
  handleSetExtendedFarmOnly,
  coreFarmOnly,
  handleSetCoreFarmOnly,
  farmTypesEnableCount,
  handleSetFarmTypesEnableCount,
}) => {
  const { t } = useTranslation()

  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const handleMenuClick = () => setIsOpen(!isOpen)

  useEffect(() => {
    const handleClickOutside = ({ target }: Event) => {
      if (
        wrapperRef.current &&
        menuRef.current &&
        !menuRef.current.contains(target as HTMLElement) &&
        !wrapperRef.current.contains(target as HTMLElement)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [setIsOpen, wrapperRef, menuRef])

  return (
    <>
      <Flex alignItems="center" mr="4px" mb="4px">
        <Box ref={wrapperRef}>
          <InlineMenu
            component={
              <Button onClick={handleMenuClick} variant="light" scale="sm">
                {t('Farm Types')}
                {farmTypesEnableCount > 0 && `(${farmTypesEnableCount})`}
              </Button>
            }
            isOpen={isOpen}
            options={{ placement: 'top' }}
          >
            <Box width={['100%', '345px']} ref={menuRef}>
              <FarmTypesWrapper alignItems="center" p="16px">
                <Text fontSize={20} bold color="text" display="inline-block" ml="8px">
                  {t('Farm Types')}
                </Text>
              </FarmTypesWrapper>
              <Box height="240px" overflowY="auto">
                <StyledItemRow alignItems="center" px="16px" py="8px" ml="8px" mt="8px">
                  <TradeIcon />
                  <Text fontSize={16} ml="10px" style={{ flex: 1 }} bold>
                    {t('Extended Farms')}
                  </Text>
                  <ToggleWrapper>
                    <Toggle
                      id="extended-only-farms"
                      checked={extendedFarmOnly}
                      onChange={() => {
                        const totalFarmsEnableCount = farmTypesEnableCount + (!extendedFarmOnly ? 1 : -1)
                        handleSetFarmTypesEnableCount(totalFarmsEnableCount)

                        handleSetExtendedFarmOnly?.(!extendedFarmOnly)
                      }}
                      scale="sm"
                    />
                  </ToggleWrapper>
                </StyledItemRow>
                <StyledItemRow alignItems="center" px="16px" py="8px" ml="8px" mt="8px">
                  <FarmIcon />
                  <Text fontSize={16} ml="10px" style={{ flex: 1 }} bold>
                    {t('CORE Farms')}
                  </Text>
                  <ToggleWrapper>
                    <Toggle
                      id="core-only-farms"
                      checked={coreFarmOnly}
                      onChange={() => {
                        const totalFarmsEnableCount = farmTypesEnableCount + (!coreFarmOnly ? 1 : -1)
                        handleSetFarmTypesEnableCount(totalFarmsEnableCount)

                        handleSetCoreFarmOnly?.(!coreFarmOnly)
                      }}
                      scale="sm"
                    />
                  </ToggleWrapper>
                </StyledItemRow>
                <StyledItemRow alignItems="center" px="16px" py="8px" ml="8px" mt="8px">
                  <RocketIcon />
                  <Text fontSize={16} ml="10px" style={{ flex: 1 }} bold>
                    {t('Booster Available')}
                  </Text>
                  <ToggleWrapper>
                    <Toggle
                      id="boosted-only-farms"
                      checked={boostedOnly}
                      onChange={() => {
                        const totalFarmsEnableCount = farmTypesEnableCount + (!boostedOnly ? 1 : -1)
                        handleSetFarmTypesEnableCount(totalFarmsEnableCount)
                        handleSetBoostedOnly(!boostedOnly)
                      }}
                      scale="sm"
                    />
                  </ToggleWrapper>
                </StyledItemRow>
                <StyledItemRow alignItems="center" px="16px" py="8px" ml="8px" mt="8px">
                  <CurrencyIcon />
                  <Text fontSize={16} ml="10px" style={{ flex: 1 }} bold>
                    {t('StableSwap')}
                  </Text>
                  <ToggleWrapper>
                    <Toggle
                      id="stableSwap-only-farms"
                      checked={stableSwapOnly}
                      onChange={() => {
                        const totalFarmsEnableCount = farmTypesEnableCount + (!stableSwapOnly ? 1 : -1)
                        handleSetFarmTypesEnableCount(totalFarmsEnableCount)

                        handleSetStableSwapOnly(!stableSwapOnly)
                      }}
                      scale="sm"
                    />
                  </ToggleWrapper>
                </StyledItemRow>
              </Box>
            </Box>
          </InlineMenu>
        </Box>
      </Flex>
    </>
  )
}