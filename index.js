import { fork } from "child_process";

const wildberriesLayer = fork('wildberries.js',{
    cwd: process.cwd(),
    detached: false,
    stdio: 'inherit'
});