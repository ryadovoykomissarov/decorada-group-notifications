import { fork } from "child_process";

const wildberriesLayer = fork('wildberries.js',{
    cwd: process.cwd(),
    detached: false,
    stdio: 'inherit'
});

wildberriesLayer.on('error', function (err) {
    console.log('WBLAYER ERROR: ' + err.message);
});

wildberriesLayer.on('close', function (err) {
    console.log('WBLAYER CLOSED: ' + err);
});

wildberriesLayer.on('disconnect', function (err) {
    console.log('WBLAYER DISCONNECTED: ' + err);
});

wildberriesLayer.on('exit', function (err) {
    console.log('WBLAYER EXITED: ' + err);
});