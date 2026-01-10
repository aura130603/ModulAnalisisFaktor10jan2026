import { test, expect } from "@playwright/test";
import { Page } from "@playwright/test";

// Performance and Resource Monitoring Interface (copied from existing standards)
interface PerformanceMetrics {
    renderTime: number;
    updateTime: number;
    memoryUsage: number;
    errorRate: number;
    cpuUsage?: number;
    networkRequests: number;
    networkLatency: number;
    domNodes: number;
    jsHeapSize: number;
    loadTime: number;
    interactionTime: number;
    browserName: string;
    browserVersion: string;
    userAgent: string;
    viewport: { width: number; height: number };
    devicePixelRatio: number;
}

// Resource monitoring helper functions (copied from existing standards)
class ResourceMonitor {
    private startTime: number = 0;
    private metrics: PerformanceMetrics = {
        renderTime: 0,
        updateTime: 0,
        memoryUsage: 0,
        errorRate: 0,
        networkRequests: 0,
        networkLatency: 0,
        domNodes: 0,
        jsHeapSize: 0,
        loadTime: 0,
        interactionTime: 0,
        browserName: "unknown",
        browserVersion: "unknown",
        userAgent: "unknown",
        viewport: { width: 0, height: 0 },
        devicePixelRatio: 1,
    };

    startMonitoring() {
        this.startTime = Date.now();
    }

    async collectMetrics(page: Page): Promise<PerformanceMetrics> {
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType(
                "navigation"
            )[0] as PerformanceNavigationTiming;
            const memory = (performance as any).memory;
            return {
                loadTime: navigation
                    ? navigation.loadEventEnd - navigation.loadEventStart
                    : 0,
                jsHeapSize: memory ? memory.usedJSHeapSize : 0,
                domNodes: document.querySelectorAll("*").length,
                resourceCount: performance.getEntriesByType("resource").length,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                devicePixelRatio: window.devicePixelRatio || 1,
                firstContentfulPaint:
                    performance.getEntriesByName("first-contentful-paint")[0]
                        ?.startTime || 0,
            };
        });
        const browserContext = page.context();
        const browser = browserContext.browser();
        const browserName = browser?.browserType()?.name() || "unknown";
        const browserVersion = browser?.version() || "unknown";
        const networkMetrics = await this.collectNetworkMetrics(page);
        this.metrics = {
            ...this.metrics,
            loadTime: performanceMetrics.loadTime,
            jsHeapSize: performanceMetrics.jsHeapSize,
            domNodes: performanceMetrics.domNodes,
            networkRequests: networkMetrics.networkRequests,
            networkLatency: networkMetrics.averageLatency,
            renderTime: performanceMetrics.firstContentfulPaint,
            interactionTime: Date.now() - this.startTime,
            browserName,
            browserVersion,
            userAgent: performanceMetrics.userAgent,
            viewport: performanceMetrics.viewport,
            devicePixelRatio: performanceMetrics.devicePixelRatio,
        };
        return this.metrics;
    }

    private async collectNetworkMetrics(page: Page) {
        const resources = await page.evaluate(() =>
            JSON.stringify(performance.getEntriesByType("resource"))
        );
        const resourceTimings = JSON.parse(resources);
        const totalLatency = resourceTimings.reduce(
            (sum: number, resource: any) =>
                sum + (resource.responseStart - resource.requestStart),
            0
        );
        return {
            networkRequests: resourceTimings.length,
            averageLatency:
                resourceTimings.length > 0
                    ? totalLatency / resourceTimings.length
                    : 0,
        };
    }

    logMetrics(testName: string) {
        console.log(`\n=== Performance Metrics for: ${testName} ===`);
        console.log(
            `Browser: ${this.metrics.browserName} v${this.metrics.browserVersion}`
        );
        console.log(`Load Time: ${this.metrics.loadTime.toFixed(2)}ms`);
        console.log(`Interaction Time: ${this.metrics.interactionTime}ms`);
        console.log(
            `JS Heap Size: ${(this.metrics.jsHeapSize / 1024 / 1024).toFixed(
                2
            )}MB`
        );
        console.log(`DOM Nodes: ${this.metrics.domNodes}`);
        console.log(`Network Requests: ${this.metrics.networkRequests}`);
    }

    validatePerformance(): { passed: boolean; issues: string[] } {
        const issues: string[] = [];
        const thresholds = this.getBrowserSpecificThresholds();
        if (this.metrics.loadTime > thresholds.loadTime)
            issues.push(`Load time too high: ${this.metrics.loadTime}ms`);
        if (this.metrics.jsHeapSize > thresholds.jsHeapSize)
            issues.push(
                `JS Heap size too high: ${(
                    this.metrics.jsHeapSize /
                    1024 /
                    1024
                ).toFixed(2)}MB`
            );
        if (this.metrics.domNodes > thresholds.domNodes)
            issues.push(`DOM nodes too many: ${this.metrics.domNodes}`);
        return { passed: issues.length === 0, issues };
    }

    private getBrowserSpecificThresholds() {
        const base = {
            loadTime: 3000,
            jsHeapSize: 50 * 1024 * 1024,
            domNodes: 1500,
        };
        switch (this.metrics.browserName) {
            case "firefox":
                return { ...base, jsHeapSize: 60 * 1024 * 1024 };
            case "webkit":
                return {
                    ...base,
                    loadTime: 3500,
                    jsHeapSize: 40 * 1024 * 1024,
                };
            default:
                return base;
        }
    }
}

test.describe("K-Means Cluster Analysis - Accidents Dataset", () => {
    let resourceMonitor: ResourceMonitor;
    let jsErrors: string[] = [];
    let networkErrors: string[] = [];

    test.beforeEach(async ({ page, browserName }) => {
        resourceMonitor = new ResourceMonitor();
        (resourceMonitor as any).metrics.browserName = browserName;
        jsErrors = [];
        networkErrors = [];

        page.on("pageerror", (error) => {
            if (
                !error.message.includes("ResizeObserver") &&
                !error.message.includes("Non-Error promise rejection")
            ) {
                jsErrors.push(error.message);
            }
        });
        page.on("requestfailed", (request) =>
            networkErrors.push(
                `Failed request: ${request.url()} - ${
                    request.failure()?.errorText
                }`
            )
        );

        await page.goto("/dashboard/data");
        await page.waitForLoadState("networkidle");

        await page.click('button:has-text("File")');
        await page.waitForTimeout(1000);
        await page.click("text=Example Data");
        await page.waitForTimeout(2000);
        await page.waitForSelector('button:has-text("accidents.sav")', {
            timeout: 10000,
        });
        await page.click('button:has-text("accidents.sav")');
        await page.waitForTimeout(5000);

        await page.click("text=Analyze");
        await page.waitForTimeout(1000);
        await page.click("text=Classify");
        await page.waitForTimeout(1000);
        await page.click("text=K-Means Cluster...");
        await page.waitForTimeout(2000);
    });

    test.afterEach(async ({ page }, testInfo) => {
        const finalMetrics = await resourceMonitor.collectMetrics(page);
        resourceMonitor.logMetrics(testInfo.title);
        if (jsErrors.length > 0 || networkErrors.length > 0) {
            await testInfo.attach("error-logs", {
                body: JSON.stringify({ jsErrors, networkErrors }, null, 2),
                contentType: "application/json",
            });
        }
        await testInfo.attach("performance-metrics", {
            body: JSON.stringify(finalMetrics, null, 2),
            contentType: "application/json",
        });
    });

    test("should complete basic k-means analysis workflow", async ({
        page,
    }) => {
        resourceMonitor.startMonitoring();

        await page
            .locator("div")
            .filter({ hasText: /^Variables:$/ })
            .getByRole("list")
            .locator("div")
            .filter({ hasText: "accid" })
            .first()
            .dblclick();
        await page
            .locator("div")
            .filter({ hasText: /^Variables:$/ })
            .getByRole("list")
            .locator("div")
            .filter({ hasText: "pop" })
            .first()
            .dblclick();

        await page.locator("#Cluster").fill("3");
        await page.getByRole("button", { name: "OK" }).click();

        await page.waitForTimeout(8000); // Wait for analysis
        await expect(page.locator('text="Final Cluster Centers"')).toBeVisible({
            timeout: 10000,
        });

        expect(jsErrors.length).toBe(0);
        expect(networkErrors.length).toBe(0);
    });

    test("should handle comprehensive options for k-means analysis", async ({
        page,
    }) => {
        resourceMonitor.startMonitoring();

        // Configure Iterate
        await page.getByRole("button", { name: "Iterate" }).click();
        await page.locator("#MaximumIterations").fill("20");
        await page.locator("#ConvergenceCriterion").fill("0.01");
        await page.getByRole("button", { name: "Continue" }).click();

        // Configure Save
        await page.getByRole("button", { name: "Save" }).click();
        await page.locator("#ClusterMembership").check();
        await page.locator("#DistanceClusterCenter").check();
        await page.getByRole("button", { name: "Continue" }).click();

        // Configure Options
        await page.getByRole("button", { name: "Options" }).click();
        await page.locator("#InitialCluster").check();
        await page.locator("#ANOVA").check();
        await page.getByRole("button", { name: "Continue" }).click();

        // Select variables and run
        await page
            .locator("div")
            .filter({ hasText: /^Variables:$/ })
            .getByRole("list")
            .locator("div")
            .filter({ hasText: "accid" })
            .first()
            .dblclick();
        await page.locator("#Cluster").fill("4");
        await page.getByRole("button", { name: "OK" }).click();

        await page.waitForTimeout(8000);
        await expect(page.locator('text="Iteration History"')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.locator('text="ANOVA"')).toBeVisible();

        expect(jsErrors.length).toBe(0);
        expect(networkErrors.length).toBe(0);
    });

    test("should validate performance thresholds", async ({ page }) => {
        resourceMonitor.startMonitoring();
        await page
            .locator("div")
            .filter({ hasText: /^Variables:$/ })
            .getByRole("list")
            .locator("div")
            .filter({ hasText: "gender" })
            .first()
            .dblclick();
        await page.locator("#Cluster").fill("2");
        await page.getByRole("button", { name: "OK" }).click();
        await page.waitForTimeout(8000);

        const metrics = await resourceMonitor.collectMetrics(page);
        const validation = resourceMonitor.validatePerformance();
        console.log("Performance validation issues:", validation.issues);
        expect(validation.passed).toBe(true);
    });

    test("should handle reset and cancel functionality", async ({ page }) => {
        await page
            .locator("div")
            .filter({ hasText: /^Variables:$/ })
            .getByRole("list")
            .locator("div")
            .filter({ hasText: "agecat" })
            .first()
            .dblclick();
        await page.locator("#Cluster").fill("5");

        await page.getByRole("button", { name: "Reset" }).click();
        await page.waitForTimeout(500);

        await expect(
            page.locator('[data-list-id="TargetVar"] > div')
        ).toHaveCount(0);
        await expect(page.locator("#Cluster")).toHaveValue("2"); // Assuming 2 is default

        await page.getByRole("button", { name: "Cancel" }).click();
        await expect(
            page.locator("text=K-Means Cluster").first()
        ).not.toBeVisible();
    });
});
