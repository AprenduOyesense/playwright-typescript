import { Reporter, TestCase, TestResult } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

function escapeXml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return char;
    }
  });
}
function escapeControlCharacters(value: string): string {
  return value.replace(/[\n\r\t]/g, (char) => {
    switch (char) {
      case '\n': return '&#10;';
      case '\r': return '&#13;';
      case '\t': return '&#9;';
      default: return char;
    }
  });
}

function sanitizeString(value: string): string {
  return value.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, ''); // Removes ESC and other non-printable characters
}
class CustomJUnitReporter implements Reporter {
  private testResults: Array<{
    title: string;
    status: string;
    duration: number;
    subid?: string;
    error?: { message: string; stack: string };
  }> = [];

  // Capture metadata during test execution
  onTestBegin(test: TestCase) {

    this.testResults.push({
      title: test.title,
      status: 'running',
      duration: 0,
      
    });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log("Annotations on test end:", test.annotations); // Log annotations at the end of the test

    const subid = test.annotations?.find((annotation) => annotation.type === 'subid')?.description || 'N/A';

    const testEntry = this.testResults.find(entry => entry.title === test.title);
    if (testEntry) {
      testEntry.status = result.status;
      testEntry.duration = result.duration;
      testEntry.subid = subid; // Update the subid for the test result

      if (result.status === 'failed' && result.error) {
        testEntry.error = {
          message: result.error.message,
          stack: result.error.stack || '',
        };
      }
    }

    // After all tests are complete, we will generate the final XML report
    this.onEnd();
  }

  onEnd() {
    const xmlBuffer: string[] = [];
    xmlBuffer.push('<testsuites>');

    this.testResults.forEach(test => {
      const { title, status, duration, subid, error } = test;

      xmlBuffer.push(`<testsuite name="${title}" tests="1" failures="${status === 'failed' ? 1 : 0}" skipped="${status === 'skipped' ? 1 : 0}" time="${(duration / 1000).toFixed(2)}">`);
      xmlBuffer.push(`<testcase classname="${title}" name="${title}" subid="${subid}" time="${(duration / 1000).toFixed(2)}">`);
      xmlBuffer.push('<properties>');  // Opening "properties" tag
      xmlBuffer.push('<property name="subid" value="' + (subid != null ? subid : 'default-subid') + '" />');  // Add "subid" property
      xmlBuffer.push('</properties>'); 
      if (status === 'failed' && error) {
        const escapedMessage = escapeXml(escapeControlCharacters(sanitizeString(error.message)));
        xmlBuffer.push(`<failure message="${escapedMessage}" type="Error">`);
        xmlBuffer.push(`<![CDATA[${error.stack}]]>`); // Encapsulate the stack trace in CDATA
        xmlBuffer.push('</failure>');
      }

      xmlBuffer.push('</testcase>');
      xmlBuffer.push('</testsuite>');
    });

    xmlBuffer.push('</testsuites>');

    const reportDir = './test-results/results/';
    mkdirSync(reportDir, { recursive: true }); // Ensure the directory exists
    const reportPath = join(reportDir, 'custom-junit.xml');
    writeFileSync(reportPath, xmlBuffer.join('\n'));
  }
}

export default CustomJUnitReporter;
