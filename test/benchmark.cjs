// import { IdleQueue } from "../dist/min/index.cjs";
const { IdleQueue } = require("../dist/min/index.cjs");
// const { OptimizedIdleQueue } = require("../out/min/index.cjs");

const { performance } = require("perf_hooks");

// const idleQueue = new IdleQueue({ ensureTasksRun: true });

// Benchmark function
function benchmark(idleQueueClass, numTasks) {
  const idleQueue = new idleQueueClass();

  // Generate tasks
  for (let i = 0; i < numTasks; i++) {
    idleQueue.pushTask((state) => {
      // Simulate some work
      for (let j = 0; j < 1000; j++) {
        Math.random();
      }
    });
  }

  // Start the benchmark
  const startTime = performance.now();

  // Run the tasks
  idleQueue.runTasksImmediately();

  // End the benchmark
  const endTime = performance.now();

  // Calculate the elapsed time
  const elapsedTime = endTime - startTime;

  return elapsedTime;
}

// Benchmark configuration
const numIterations = 10;
const numTasks = 10000;

// Run the benchmark for the original implementation
// console.log("Benchmarking original implementation...");
// let totalTimeOriginal = 0;
// for (let i = 0; i < numIterations; i++) {
//   const elapsedTime = benchmark(IdleQueue, numTasks);
//   totalTimeOriginal += elapsedTime;
//   console.log(`Iteration ${i + 1}: ${elapsedTime.toFixed(2)} ms`);
// }
// const avgTimeOriginal = totalTimeOriginal / numIterations;
// console.log(`Average time (original): ${avgTimeOriginal.toFixed(2)} ms`);

// Run the benchmark for the optimized implementation
console.log('Benchmarking optimized implementation...')
let totalTimeOptimized = 0
for (let i = 0; i < numIterations; i++) {
  const elapsedTime = benchmark(IdleQueue, numTasks)
  totalTimeOptimized += elapsedTime
  console.log(`Iteration ${i + 1}: ${elapsedTime.toFixed(2)} ms`)
}
const avgTimeOptimized = totalTimeOptimized / numIterations
console.log(`Average time (optimized): ${avgTimeOptimized.toFixed(2)} ms`)

// Calculate the performance improvement
// const improvementPercentage = ((avgTimeOriginal - avgTimeOptimized) / avgTimeOriginal) * 100
// console.log(`Performance improvement: ${improvementPercentage.toFixed(2)}%`)
