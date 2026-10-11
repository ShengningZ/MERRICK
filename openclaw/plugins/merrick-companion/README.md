# MERRICK Companion for OpenClaw

An OpenClaw-native companion for the MERRICK macOS desktop assistant.

## Install from ClawHub

```bash
openclaw plugins install clawhub:@simoncheungai/merrick-companion
```

The package is maintained from the public
[MERRICK repository](https://github.com/ShengningZ/MERRICK). Every registry
release records the exact source commit and repository subdirectory used to
build it.

## Current beta surface

`merrick_desktop_status` checks whether a local MERRICK host is ready. It is
read-only: it does not access files, capture the screen, start applications or
send data off the Mac.

The companion bridge that will support native actions is deliberately not in
this first public-package slice. It will require explicit local pairing with an
installed MERRICK app and will be released only with separate capability and
audit tests.

## Local development

```bash
pnpm install
pnpm run plugin:build
pnpm run plugin:validate
pnpm test
openclaw plugins install --link ./openclaw/plugins/merrick-companion
openclaw plugins inspect merrick-companion --runtime
```

The default bridge is `http://127.0.0.1:8765`. A future configuration option
may select another **loopback-only** MERRICK bridge origin.

## Publication status

MERRICK Companion is a community OpenClaw code plugin published by the MERRICK
maintainers. It is not an OpenClaw Foundation first-party plugin. Any future
official designation depends on separate review and acceptance by the OpenClaw
maintainers.
