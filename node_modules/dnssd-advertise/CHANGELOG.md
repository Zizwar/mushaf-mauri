# dns-message

## 1.1.2

### Patch Changes

- Update rollup config for reduced output and exclude sources from sourcemaps
  Submitted by [@kitten](https://github.com/kitten) (See [#21](https://github.com/kitten/dnssd-advertise/pull/21))

## 1.1.1

### Patch Changes

- Sort IPv6 addresses to put link-local address last
  Submitted by [@kitten](https://github.com/kitten) (See [#19](https://github.com/kitten/dnssd-advertise/pull/19))

## 1.1.0

### Minor Changes

- Add `stack` option to allow IPv4/IPv6-only single stack use
  Submitted by [@kitten](https://github.com/kitten) (See [#17](https://github.com/kitten/dnssd-advertise/pull/17))

## 1.0.8

### Patch Changes

- Filter incoming messages by remote address manually to check for IPv6 zone match or subnet address on Linux. `SO_BINDTODEVICE` isn't accessible to us for Linux, which means that we have to manually filter incoming messages per socket
  Submitted by [@kitten](https://github.com/kitten) (See [#15](https://github.com/kitten/dnssd-advertise/pull/15))

## 1.0.7

### Patch Changes

- Set default TTL to 120s
  Submitted by [@kitten](https://github.com/kitten) (See [#13](https://github.com/kitten/dnssd-advertise/pull/13))

## 1.0.6

### Patch Changes

- Apply loops limit of 15 to probing
  Submitted by [@kitten](https://github.com/kitten) (See [#11](https://github.com/kitten/dnssd-advertise/pull/11))

## 1.0.5

### Patch Changes

- ⚠️ Fix goodbye message being cancelled by scheduler cancellation
  Submitted by [@kitten](https://github.com/kitten) (See [#9](https://github.com/kitten/dnssd-advertise/pull/9))
- ⚠️ Fix uncaught errors in main advertiser
  Submitted by [@kitten](https://github.com/kitten) (See [#9](https://github.com/kitten/dnssd-advertise/pull/9))

## 1.0.4

### Patch Changes

- Tweak default behaviour and constants
  Submitted by [@kitten](https://github.com/kitten) (See [#7](https://github.com/kitten/dnssd-advertise/pull/7))

## 1.0.3

### Patch Changes

- Implement tiebreaker loss cases properly and extend probes for expected length
  Submitted by [@kitten](https://github.com/kitten) (See [#5](https://github.com/kitten/dnssd-advertise/pull/5))

## 1.0.2

### Patch Changes

- Compare all A/AAAA addresses when checking for conflicts
  Submitted by [@kitten](https://github.com/kitten) (See [#3](https://github.com/kitten/dnssd-advertise/pull/3))

## 1.0.1

### Patch Changes

- Remove sourcemaps' `sourcesContent` from published package
  Submitted by [@kitten](https://github.com/kitten) (See [#1](https://github.com/kitten/dnssd-advertise/pull/1))

## 1.0.0

Initial Release.
