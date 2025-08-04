import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { PaymentScheduleItem, EMICalculation, EMIInput } from '../../types';
import { exportToPDF, exportToExcel, generateShareableURL, copyToClipboard } from '../../utils/exportUtils';
import { CheckIcon, DocumentArrowDownIcon, ShareIcon, LinkIcon } from '@heroicons/react/24/outline';

interface ExportOptionsProps {
  calculation: EMICalculation;
  inputs: EMIInput;
  schedule: PaymentScheduleItem[];
  calculatorType?: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  calculation,
  inputs,
  schedule,
  calculatorType = 'EMI'
}) => {
  const [copied, setCopied] = useState(false);
  const [shareURL, setShareURL] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);

  const handlePDFExport = () => {
    exportToPDF(calculation, inputs, schedule, calculatorType);
  };

  const handleExcelExport = () => {
    exportToExcel(calculation, inputs, schedule, calculatorType);
  };

  const handleGenerateShareURL = () => {
    const url = generateShareableURL(inputs, calculatorType.toLowerCase());
    setShareURL(url);
    setShowShareModal(true);
  };

  const handleCopyURL = async () => {
    const success = await copyToClipboard(shareURL);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card title="Export & Share Options" className="mt-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Download your calculation results or share a custom link with all your numbers pre-filled.
          </p>
          
          {/* Export Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handlePDFExport}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download PDF
            </Button>
            
            <Button
              onClick={handleExcelExport}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download Excel
            </Button>
            
            <Button
              onClick={handleGenerateShareURL}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <ShareIcon className="w-5 h-5" />
              Share Link
            </Button>
          </div>

        </div>
      </Card>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Your Calculation</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Copy this link to share your {calculatorType} calculation with all values pre-filled:
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareURL}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <Button
                onClick={handleCopyURL}
                size="sm"
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            
            {copied && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <CheckIcon className="w-4 h-4" />
                  Link copied to clipboard! You can now share it with others.
                </p>
              </div>
            )}
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> This link contains your input values. Anyone with this link can see your financial calculation details.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};