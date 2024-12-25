import { Reporter, TestCase, TestResult, Suite } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

class CustomJUnitReporter implements Reporter {
  private filePath: string;
  private suiteName: string = 'Playwright Suite';

  constructor(options: any) {
    this.filePath = options.outputFile || './test-results/results/custom-junit.xml';
  }

  onBegin(config, suite: Suite) {
    // Initialize or set any global properties if needed
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // You can modify the test result object here to add your custom fields like subid
  }

  onEnd(result: any) {
    const report = this.generateJUnitReport(result);
    fs.writeFileSync(this.filePath, report);
  }

  private generateJUnitReport(result: any) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuite name="${this.suiteName}" tests="${result.testCount}" failures="${result.failureCount}" errors="${result.errorCount}" skipped="${result.skippedCount}" timestamp="${new Date().toISOString()}">\n`;

    result.suites.forEach((suite: Suite) => {
      suite.tests.forEach((test: TestCase) => {
        xml += this.generateTestCaseXml(test);
      });
    });

    xml += `</testsuite>\n`;
    return xml;
  }

  private generateTestCaseXml(test: TestCase) {
    let xml = `<testcase classname="${test.title}" name="${test.title}" time="${test.duration / 1000}">`;

    // Add custom properties
    const subid = test.metadata?.subid || 'default-subid';  // Use metadata to get subid or default
    xml += `<properties><property name="subid" value="${subid}" /></properties>`;

    // If the test failed, include failure information
    if (test.status === 'failed') {
      xml += `<failure message="${test.error?.message}">${test.error?.stack}</failure>`;
    }

    xml += `</testcase>\n`;
    return xml;
  }
}

export default CustomJUnitReporter;
