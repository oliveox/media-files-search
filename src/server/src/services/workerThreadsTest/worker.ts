// import { parentPort, workerData } from 'worker_threads';
import {expose} from "threads/worker";
import logger from '../../config/winston';
import fs from 'fs';

console.log("Worker thread file!");

const doingMaTing = (workerData: any): string => {
    console.log("Worker thread here. WUSUP!?");
    console.log(`Got some worker data here: ${workerData}`);

    return "check diz out!";
}

expose(() => {
    console.log("I'm a worker!");
    return "aaaa";
});

