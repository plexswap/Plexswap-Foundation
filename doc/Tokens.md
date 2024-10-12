# Tokens management

All the tokens are in `/config/constants/tokens.ts`. They are instances of the `Token` class defined in the SDK.
Before adding a new **farm** or **pool** you need to make sure the Tokens are in this file.
To add a Token to the exchange lists:

- For the default list: `@plexswap/metalists/baseList/plex-default.tokenlist.json`
- To blacklist a token: `@plexswap/metalists/baseList/plex-unsupported.tokenlist.json`
