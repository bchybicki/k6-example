# k6 Load Test - reqres.in API

A simple [k6](https://grafana.com/docs/k6/latest/) load test that hits the **reqres.in** users endpoint with 100 concurrent virtual users.

## Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installed
- A valid reqres.in API key ([get one here](https://reqres.in/signup))

## Running the test

```bash
k6 run -e API_KEY=<your-api-key> test.js
```

This will run **100 VUs** for **10 minutes** (~1 request/s per VU), print a summary to the terminal and generate an HTML report.

## HTML Report

After the test finishes, a `report.html` file is generated automatically in the project root. Open it in your browser to view:

- Response time percentiles (P50 / P95 / P99)
- Error rate
- Throughput (requests/sec)

## Thresholds

Basic thresholds were added to the test script to demonstrate how to use them. The thresholds are set to fail the test if the P95 response time is above 500ms or if the error rate is above 1%. 

| Metric | Condition |
|---|---|
| `http_req_duration` | P95 < 500 ms |
| `http_req_failed` | rate < 1 % |
