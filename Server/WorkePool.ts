
import { Worker } from "worker_threads"
import { cpus } from "os"

interface IntWorker {
    worker: Worker,
    is_busy: boolean
}

export type WorkerOptions = {
    no_of_workers: number,
}




