import express from "express";
import { simpleGit } from "simple-git";
import * as tmp from "tmp";
import * as fs from "fs-extra";
import * as path from "path";
import { analyzeRepository } from "archrisk-engine";

const app = express();
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// Set tmp to delete files on exit
tmp.setGracefulCleanup();

// --- Rate Limiting & Job Queue Logic ---
const IP_LIMITS = new Map<string, { count: number, date: string }>();
const MAX_SCANS_PER_DAY = 3;

interface Job {
    id: string;
    repoUrl: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
    queuePosition: number;
}

const queue: Job[] = [];
const jobs = new Map<string, Job>();
let isProcessing = false;

async function processQueue() {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    const job = queue.shift();
    if (!job) { isProcessing = false; return; }

    job.status = 'processing';
    console.log(`[Worker] Processing Job ${job.id}: ${job.repoUrl}`);

    const tmpDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'arch_scan_' });
    const git = simpleGit();

    try {
        await git.clone(job.repoUrl, tmpDir.name, ["--depth", "1"]);
        const resultsDir = path.join(process.cwd(), "public", "results");
        const result = await analyzeRepository(tmpDir.name, { resultsDir });

        job.status = 'completed';
        job.result = { ...result, repoUrl: job.repoUrl, timestamp: new Date().toISOString() };
    } catch (error: any) {
        console.error(`[Worker] Job ${job.id} failed: ${error.message}`);
        job.status = 'failed';
        job.error = error.message;
    } finally {
        await fs.remove(tmpDir.name);
        isProcessing = false;
        // Update queue positions for remaining jobs
        queue.forEach((j, index) => j.queuePosition = index + 1);
        processQueue(); // Process next job
    }
}

app.post("/scan", async (req, res) => {
    const { repoUrl } = req.body;
    const ip = req.ip || 'unknown';

    // 1. Rate Limiting Check
    const today = new Date().toISOString().split('T')[0];
    const userLimit = IP_LIMITS.get(ip) || { count: 0, date: today };

    if (userLimit.date !== today) {
        userLimit.count = 0;
        userLimit.date = today;
    }

    if (userLimit.count >= MAX_SCANS_PER_DAY) {
        return res.status(429).json({
            error: "Rate limit exceeded",
            message: "오늘 무료 분석 횟수를 모두 사용했습니다. GitHub App 설치 시 무제한 분석이 가능합니다."
        });
    }

    if (!repoUrl) return res.status(400).json({ error: "repoUrl is required" });

    // 2. Create Job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newJob: Job = {
        id: jobId,
        repoUrl,
        status: 'pending',
        queuePosition: queue.length + 1
    };

    jobs.set(jobId, newJob);
    queue.push(newJob);

    // Increment limit
    userLimit.count++;
    IP_LIMITS.set(ip, userLimit);

    res.json({ jobId, status: 'pending', queuePosition: newJob.queuePosition });

    // Start worker
    processQueue();
});

app.get("/status/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ status: job.status, queuePosition: job.queuePosition, error: job.error });
});

app.get("/result/:jobId", (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status !== 'completed') return res.status(400).json({ error: "Job not completed" });
    res.json(job.result);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[ScannerAPI] Running on http://localhost:${PORT}`);
});
