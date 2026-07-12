# lan-network

## 0.2.1

### Patch Changes

- Add missing `socket.close` for DHCP discover on timeout
  Submitted by [@kitten](https://github.com/kitten) (See [`ee60e14`](https://github.com/kitten/lan-network/commit/ee60e1415dc323843c07e3a0d0acda998ed2d9ae))

## 0.2.0

### Minor Changes

- Add `noProbe` and `noDhcp` options
  Submitted by [@kitten](https://github.com/kitten) (See [#18](https://github.com/kitten/lan-network/pull/18))

## 0.1.8

### Patch Changes

- Deprioritize `bridge*` interfaces as internal networks
  Submitted by [@kitten](https://github.com/kitten) (See [#15](https://github.com/kitten/lan-network/pull/15))
- Update rollup config for reduced output and exclude sources from sourcemaps
  Submitted by [@kitten](https://github.com/kitten) (See [#17](https://github.com/kitten/lan-network/pull/17))

## 0.1.7

### Patch Changes

- Compare subnet-masked addresses before accepting DHCP discover message
  Submitted by [@hyoban](https://github.com/hyoban) (See [#12](https://github.com/kitten/lan-network/pull/12))

## 0.1.6

### Patch Changes

- ⚠️ Fix probing and fallback methods for Windows
  Submitted by [@kitten](https://github.com/kitten) (See [#9](https://github.com/kitten/lan-network/pull/9))

## 0.1.5

### Patch Changes

- When matching a probed route, ignore internal interfaces. The probed route will match a VPN (virtual) interface when using it to tunnel all traffic, but is unlikely to be considered the local network by users
  Submitted by [@kitten](https://github.com/kitten) (See [#7](https://github.com/kitten/lan-network/pull/7))

## 0.1.3

### Patch Changes

- Move vitest to devDependencies
  Submitted by [@kitten](https://github.com/kitten) (See [#5](https://github.com/kitten/lan-network/pull/5))

## 0.1.2

### Patch Changes

- Add CLI for testing
  Submitted by [@kitten](https://github.com/kitten) (See [#3](https://github.com/kitten/lan-network/pull/3))

## 0.1.1

### Patch Changes

- Bind to assignment IP for DHCP discovery
  Submitted by [@kitten](https://github.com/kitten) (See [#1](https://github.com/kitten/lan-network/pull/1))

## 0.1.0

Initial Release.
