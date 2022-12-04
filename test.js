const lodash = require('lodash');
var arr = [{
        city: 'Amsterdam',
        title: 'This is Amsterdam!'
    },
    {
        city: 'Berlin',
        title: 'This is Berlin!'
    },
    {
        city: 'Budapest',
        title: 'This is Budapest!'
    }
];
var picked = lodash.filter(arr, { 'city': 'Amsterdam' });

const time = require('time-stamp');

const end = new Date(Date.now());
end.setDate(end.getDate() + 1);

console.log(end);
// console.log(end);
const price = 100;
// console.log(price.toString());
// end.setFullYear(end.getFullYear() + 1);