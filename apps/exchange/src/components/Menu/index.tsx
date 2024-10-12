import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { Menu as UikitMenu  } from '@plexswap/ui-plex'
import { NextLinkFromReactRouter } from '@plexswap/widgets-internal'
import { useTranslation, languageList } from '@plexswap/localization'
import { NetworkSwitcher } from 'components/NetworkSwitcher'
import { useTheme } from '@plexswap/hooks'
import UserMenu from './UserMenu'
import { useMenuItems } from './hooks/useMenuItems'
import { getActiveMenuItem, getActiveSubMenuItem } from './utils'



const Menu = (props) => {
  const { isDark, setTheme } = useTheme()
  const { currentLanguage, setLanguage } = useTranslation()
  const { pathname } = useRouter()
  const menuItems = useMenuItems()
  const activeMenuItem = getActiveMenuItem({ menuConfig: menuItems, pathname })
  const activeSubMenuItem = getActiveSubMenuItem({ menuItem: activeMenuItem, pathname })

  const toggleTheme = useMemo(() => {
    return () => setTheme(isDark ? 'light' : 'dark')
  }, [setTheme, isDark])



  return (
    <>
      <UikitMenu
        linkComponent={(linkProps) => {
          return <NextLinkFromReactRouter to={linkProps.href} {...linkProps} prefetch={false} />
        }}
        rightSide={
          <>
            <NetworkSwitcher />
            <UserMenu />
          </>
        }
        isDark={isDark}
        toggleTheme={toggleTheme}
        currentLang={currentLanguage.code}
        langs={languageList}
        setLang={setLanguage}

        links={menuItems}
        subLinks={activeMenuItem?.hideSubNav || activeSubMenuItem?.hideSubNav ? [] : activeMenuItem?.items}

        activeItem={activeMenuItem?.href}
        activeSubItem={activeSubMenuItem?.href}

        {...props}
      />
    </>
  )
}

export default Menu
