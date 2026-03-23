import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

export const options = {
  vus: 100,
  duration: "5m",

  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)',],
  thresholds: {
    http_req_duration: ["p(95)<500"],   // 95 % of requests under 500 ms
    http_req_failed: ["rate<0.01"],     // error rate below 1 %
  },
};

const URL = "https://reqres.in/api/users?page=1";

export default function () {
  const params = {
    headers: {
      "x-api-key": __ENV.API_KEY,
    },
  };

  const res = http.get(URL, params);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "data[0].id exists": (r) => {
      try {
        return JSON.parse(r.body).data[0].id !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}