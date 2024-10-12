# ![image](https://user-images.githubusercontent.com/106164850/170876020-b49e8805-ea77-4fdc-9ef4-f6f8891e796e.png) Plexswap UIkit

[![Version](https://img.shields.io/npm/v/@plexswap/ui-plex)](https://www.npmjs.com/package/@plexswap/ui-plex) [![Size](https://img.shields.io/bundlephobia/min/@plexswap/ui-plex)](https://www.npmjs.com/package/@plexswap/ui-plex)

Adapted from the [Plex Toolkit](https://github.com/plexswap/plex-toolkit).

Plexswap UIkit is a set of React components and hooks used to build pages on Plexswap's apps. It also contains a theme file for dark and light mode.

## Install

`yarn add @plexswwap/ui-plex`

## Setup

### Theme

Before using Plex UIkit, you need to provide the theme file to styled-component.

```
import { ThemeProvider } from 'styled-components'
import { light, dark } from '@plexswap/ui-plex'
...
<ThemeProvider theme={isDark}>...</ThemeProvider>
```

### Reset

A reset CSS is available as a global styled component.

```
import { ResetCSS } from '@plexswap/ui-plex'
...
<ResetCSS />
```

### Types

This project is built with Typescript and export all the relevant types.
