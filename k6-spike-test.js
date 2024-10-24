import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 15000 }, // spike to 15,000 users
        { duration: '1m', target: 0 }, // quick ramp-down to 0
        { duration: '2m', target: 15000 }, // another spike to 15,000 users
        { duration: '1m', target: 0 }, // ramp-down again
    ],
};

export default function () {
    http.get('http://localhost:4567/recent');
    sleep(1);
}
