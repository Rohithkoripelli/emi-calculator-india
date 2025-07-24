import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { generateTestReport, runPerformanceBenchmarks, TestResult } from '../../utils/testSuite';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export const TestResults: React.FC = () => {
  const [testReport, setTestReport] = useState<{
    summary: { total: number; passed: number; failed: number; };
    details: TestResult[];
  } | null>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    
    // Simulate some loading time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const report = generateTestReport();
    const performanceResults = runPerformanceBenchmarks();
    
    setTestReport(report);
    setBenchmarks(performanceResults);
    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runTests();
  }, []);

  if (!testReport) {
    return (
      <Card title="Calculator Accuracy Tests">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Running tests...</span>
        </div>
      </Card>
    );
  }

  const successRate = (testReport.summary.passed / testReport.summary.total * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Test Summary */}
      <Card title="Calculator Accuracy Tests">
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{testReport.summary.total}</div>
              <div className="text-sm text-blue-700">Total Tests</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{testReport.summary.passed}</div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{testReport.summary.failed}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{successRate}%</div>
              <div className="text-sm text-gray-700">Success Rate</div>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`p-4 rounded-lg border ${
            testReport.summary.failed === 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {testReport.summary.failed === 0 ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <h3 className={`font-medium ${
                  testReport.summary.failed === 0 ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {testReport.summary.failed === 0 ? 'All Tests Passed!' : 'Some Tests Failed'}
                </h3>
                <p className={`text-sm ${
                  testReport.summary.failed === 0 ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {testReport.summary.failed === 0 
                    ? 'All calculations are working correctly and producing accurate results.'
                    : `${testReport.summary.failed} test(s) failed. Check the details below.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Re-run Tests Button */}
          <div className="flex justify-center">
            <Button
              onClick={runTests}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Running Tests...
                </>
              ) : (
                'Re-run Tests'
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Detailed Test Results */}
      <Card title="Detailed Test Results">
        <div className="space-y-3">
          {testReport.details.map((test, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${
                test.passed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {test.passed ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    test.passed ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {test.testName}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    test.passed ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {test.description}
                  </p>
                  <div className="mt-2 text-xs space-y-1">
                    <div>Expected: {test.expected.toLocaleString()}</div>
                    <div>Actual: {test.actual.toLocaleString()}</div>
                    {!test.passed && (
                      <div>Difference: {Math.abs(test.actual - test.expected).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Benchmarks */}
      {benchmarks.length > 0 && (
        <Card title="Performance Benchmarks">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <ChartBarIcon className="w-5 h-5" />
              <span className="text-sm">Performance metrics for calculation functions</span>
            </div>
            
            {benchmarks.map((benchmark, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{benchmark.test}</div>
                  <div className="text-sm text-gray-600">{benchmark.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-mono text-sm">{benchmark.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Test Information */}
      <Card title="About These Tests">
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            These automated tests verify the accuracy of all calculator functions by comparing 
            results against manually calculated expected values.
          </p>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">What we test:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>EMI calculations for various loan scenarios</li>
              <li>Interest calculations and total payment amounts</li>
              <li>Sukanya Samridhi Yojana maturity calculations</li>
              <li>SIP future value projections</li>
              <li>Gratuity calculations as per Indian labor laws</li>
              <li>Credit card EMI with GST computations</li>
              <li>Edge cases like zero interest rates</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-medium text-blue-900 mb-1">Quality Assurance:</h5>
            <p className="text-blue-700 text-sm">
              All calculations follow standard financial formulas used by Indian banks and 
              financial institutions. Test tolerances account for floating-point precision 
              while ensuring results are accurate to the nearest rupee.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};