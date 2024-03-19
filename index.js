import { fork } from "child_process";

const wildberriesLayer = fork('wildberries.js',{
    cwd: process.cwd(),
    detached: false,
    stdio: 'inherit'
});

wildberriesLayer.on('error', function (err) {
    console.log('WBLAYER ERROR: ' + err.message);
});