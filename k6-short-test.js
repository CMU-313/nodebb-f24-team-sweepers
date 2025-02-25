import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 300 }, // ramp-up to 300 users
        { duration: '5m', target: 300 }, // hold at 300 users
        { duration: '2m', target: 0 }, // ramp-down to 0
    ],
};

export default function () {
    http.get('http://localhost:4567/recent');
    sleep(1);
}
