import HTMLReport from "jasmine-xml2html-converter";
import dotenv from 'dotenv';
import CommonConstants from "../constants/CommonConstants";

dotenv.config();

export default class HTMLReporter {
    public static generate() {
        const testConfig = {
            reportTitle: CommonConstants.REPORT_TITLE,
            outputPath: CommonConstants.RESULTS_PATH,
            BASE_URL: process.env.BASE_URL || 'N/A',  // Provide fallback value
            SOAP_API_BASE_URL: process.env.SOAP_API_BASE_URL || 'N/A',  // Provide fallback value
            REST_API_BASE_URL: process.env.REST_API_BASE_URL || 'N/A',  // Provide fallback value
            DB_CONFIG: process.env.DB_CONFIG || 'N/A',  // Provide fallback value
            BROWSER: process.env.BROWSER || 'Unknown',  // Provide fallback value
        };
        new HTMLReport().from(CommonConstants.JUNIT_RESULTS_PATH, testConfig);
        console.log("Completed creating HTML Report");
    }
}

HTMLReporter.generate();
