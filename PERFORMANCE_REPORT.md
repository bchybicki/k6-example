# Performance Report - reqres.in API

**Date:** 2026-03-23 15:48  
**Tool:** Grafana k6  
**Target:** `GET https://reqres.in/api/users?page=1`

## 1. Test Setup & Assumptions

| Parameter | Value |
|---|---|
| Virtual Users (VUs) | 100 (concurrent) |
| Request rate | ~1 req/s per VU (`sleep(1)`) |
| Duration | 5 minutes |
| Expected throughput | ~100 req/s |
| Authentication | `x-api-key` header (via `API_KEY` env variable) |

**Assumptions:**
- reqres.in is a free, shared public API - the results reflect its infrastructure limits (250 request/day for a free user).
- Each VU executes a single GET request per second - no think-time variation or complex user flows.
- The test was run from a local machine - network latency to reqres.in servers is included in all timing metrics.
- As the scenario is supposed to simulate 100 concurrent users, and each user makes 1 request per second with no ramp-up, I'm assuming this is supposed to be a Spike Test. 
- 5 minutes of testing can be sufficient to detect obvious issues such as connection pool exhaustion or rapid memory leaks. However, longer test durations and analysis of system and connection-level metrics are recommended to reliably identify slower-developing problems. Depending on our goal the duration would be different.

## 2. Captured Metrics

### Response Time (ms)

| Percentile | Value |
|---|---|
| **P50** | 8.19 ms |
| **P95** | 57.33 ms |
| **P99** | 95.58 ms |

### Error Rate

| Metric | Value |
|---|---|
| Total requests | 29 596 |
| Failed requests | 29 596 |
| **Error rate** | **100 %** |
| `status is 200` check | 0 % pass |
| `data[0].id exists` check | 0 % pass |

> All 29 596 requests returned **HTTP 429 Too Many Requests** with body `{"error":"rate_limit_exceeded"}`. The reqres.in free tier allows only **250 requests per day** - the daily quota was exhausted when exploring the API and k6 functionalities earlier.

### Throughput

| Metric | Value |
|---|---|
| Requests/sec (actual) | **98.38 req/s** |
| Iterations | 29 596 |
| Data received | 15.88 MB (0.05 MB/s) |
| Data sent | 1.30 MB (0.00 MB/s) |

---

## 3. Interpretation of Results

1. **100 % error rate caused by rate limiting.** Every request received `429 Too Many Requests` with `{"error":"rate_limit_exceeded"}`. The reqres.in free tier has a hard limit of **250 requests/day**. The measured response times and throughput reflect the server's rate-limiter response, not the actual endpoint performance.

2. **Response times are low despite errors.** P50 of ~8 ms and P95 of ~57 ms show the server responds quickly, but these numbers only reflect the cost of generating a short error response - not the performance of the actual endpoint logic (database queries, serialization, etc.). Successful responses would likely have higher latencies.

3. **Throughput is close to the target.** Actual throughput of 98.38 req/s is near the theoretical 100 req/s. The small gap is due to the initial VU ramp-up and per-request processing overhead.

---

## 4. Optimization Suggestions

### 4.1 Endpoint / API Side

| # | Suggestion | Rationale |
|---|---|---|
| 1 | **Add server-side caching** | Based on the response headers, data is not cached - neither locally nor on the server. Caching would reduce backend load and allow higher concurrency. |

### 4.2 Test Improvements

| # | Suggestion | Rationale |
|---|---|---|
| 1 | **Add ramp-up** | Use k6 `stages` to gradually increase load if we were to perform a Load Test. This avoids slamming the server with 100 concurrent connections at once, gives time to observe how response times change under growing load, and produces a more realistic traffic pattern. |
| 2 | **Parameterize the request** | Randomize the `page` parameter to avoid server-side caching that could artificially improve response times (if caching were implemented). |
| 3 | **Add think-time variation** | The current script uses a fixed `sleep(1)` between requests. Randomizing think time (e.g. `sleep(Math.random() * 2 + 0.5)`) better simulates real user behavior, where requests are not perfectly evenly spaced, and helps uncover potential issues that a constant rate might miss. |
| 4 | **Run from CI/CD** | Automate the test in GitHub Actions to track regressions over time and run it on a dedicated machine to avoid local machine performance issues. |
