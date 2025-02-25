import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    stages: [
        { duration: '3m', target: 5000 }, // ramp-up to 5000 users
        { duration: '10m', target: 5000 }, // hold at 5000 users
        { duration: '3m', target: 0 }, // ramp-down to 0 users
    ],
};

export default function () {
    http.get('http://localhost:4567/recent');
    sleep(1);
}
