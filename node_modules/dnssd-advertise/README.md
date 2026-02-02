# dnssd-advertise

A well-behaved Bonjour/DNS-SD service advertiser for Node.js, designed for long-running processes.

- Aims to be compliant with [RFC 6762](https://datatracker.ietf.org/doc/html/rfc6762) and [RFC 6763](https://datatracker.ietf.org/doc/html/rfc6763#section-6)
- Handles network interface changes, socket recovery, and re-announcements for long-running processes
- Supports dual-stack IPv4 and IPv6 service announcement with NIC-scoped responses
- Single dependency ([dns-message](https://github.com/kitten/dns-message) is bundled)

## Quick Reference

```javascript
import { advertise } from 'dnssd-advertise';

const stop = advertise({
  name: 'My Service',
  type: 'http',
  protocol: 'tcp',
  port: 3000,
});

process.on('exit', () => {
  stop();
});
```

### Conflict Resolution

When a conflict is detected during probing, as per the specification, the name or hostname of your service may be altered:

- When the `name` conflicts a 4-character hex ID is appended (e.g. `My Service (B0A1)`
- When the `hostname` conflicts a number is appended to it (e.g. `my-hostname-2`)

When a conflict is detected during announcing, the probing phase restarts with the same conflict resolution.

## API Reference

### `advertise(options): () => Promise<void>`

Starts advertising a DNS-SD service on all available network interfaces.

Returns a function that, when called, stops advertising and sends goodbye packets to remove the service from the network.
Stopping the advertiser is, while preferred, optional as per the mDNS specification.

#### Options

| Option     | Type                       | Description                                                        |
| ---------- | -------------------------- | ------------------------------------------------------------------ |
| `name`     | `string`                   | Instance/display name of the service (e.g., "Living Room Speaker") |
| `type`     | `string`                   | Service type without protocol (e.g., "http", "ssh", "airplay")     |
| `protocol` | `'tcp' \| 'udp'`           | Protocol used by the service                                       |
| `port`     | `number`                   | Port the service is listening on                                   |
| `hostname` | `string`                   | Hostname to advertise (defaults to system hostname)                |
| `subtypes` | `string[]`                 | Optional list of subtypes                                          |
| `txt`      | `Record<string, TxtValue>` | Optional service metadata as key-value pairs                       |
| `ttl`      | `number`                   | TTL for DNS records in seconds (defaults to 250s)                  |
